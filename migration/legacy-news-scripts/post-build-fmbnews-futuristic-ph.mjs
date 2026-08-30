import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const newsLandingPath = path.join(newsRoot, 'index.html');
const fmbNewsRoot = path.join(distRoot, 'fmbnews');
const fmbNewsLandingPath = path.join(fmbNewsRoot, 'index.html');
const sitemapPath = path.join(distRoot, 'sitemap.xml');
const cssSourcePath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-futuristic-ph.css');
const readabilityCssSourcePath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-final-readability.css');
const shellCssSourcePath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-single-publication-shell.css');
const canonicalUrl = 'https://www.francinemariebautista.com/news/';

const tickerStart = '<!-- FMB_NEWS_TICKER_START -->';
const tickerEnd = '<!-- FMB_NEWS_TICKER_END -->';
const tickerScriptStart = '<!-- FMB_NEWS_TIME_START -->';
const tickerScriptEnd = '<!-- FMB_NEWS_TIME_END -->';

function addBodyClass(html, className) {
  const bodyWithClass = /<body\b([^>]*?)\bclass=(['"])([^'"]*)\2([^>]*)>/i;
  if (bodyWithClass.test(html)) {
    return html.replace(bodyWithClass, (match, before, quote, classes, after) => {
      const nextClasses = new Set(classes.split(/\s+/).filter(Boolean));
      nextClasses.add(className);
      return `<body${before}class=${quote}${[...nextClasses].join(' ')}${quote}${after}>`;
    });
  }
  return html.replace(/<body\b([^>]*)>/i, `<body$1 class="${className}">`);
}

function stripTags(value = '') {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function extractHeadlineItems(html) {
  const items = [];
  const seen = new Set();

  const add = (href, title) => {
    const cleanTitle = stripTags(title);
    const cleanHref = href?.trim();
    if (!cleanTitle || !cleanHref || seen.has(cleanTitle)) return;
    seen.add(cleanTitle);
    items.push({ href: cleanHref, title: cleanTitle });
  };

  const lead = html.match(/<article\b[^>]*class=(['"])[^'"]*\bnc-lead-broadcast\b[^'"]*\1[^>]*>[\s\S]*?<a\b[^>]*href=(['"])([^'"]+)\2[^>]*>[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (lead) add(lead[3], lead[4]);

  for (const article of html.matchAll(/<article\b[^>]*class=(['"])[^'"]*\bnc-rundown-story\b[^'"]*\1[^>]*>([\s\S]*?)<\/article>/gi)) {
    const href = article[2].match(/<a\b[^>]*href=(['"])([^'"]+)\1/i)?.[2];
    const title = article[2].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1];
    add(href, title);
  }

  for (const entry of html.matchAll(/<li[^>]*>[\s\S]*?<a\b[^>]*href=(['"])([^'"]+)\1[^>]*>[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>[\s\S]*?<\/a>[\s\S]*?<\/li>/gi)) {
    add(entry[2], entry[3]);
  }

  if (!items.length) {
    add('/news/', 'FMB News Center: Filipino ang Mismong Balita.');
    add('/news/#stories', 'Latest reports, context and public-interest updates');
  }

  return items.slice(0, 10);
}

function createTicker(items) {
  const links = items
    .map(item => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.title)}</a>`)
    .join('');

  return `${tickerStart}
<div class="fmb-news-ticker" data-fmb-news-ticker role="region" aria-label="Live FMB News headlines and Philippine time">
  <span class="fmb-news-ticker-label">Headlines</span>
  <div class="fmb-news-ticker-window">
    <div class="fmb-news-ticker-track">
      <div class="fmb-news-ticker-group">${links}</div>
      <div class="fmb-news-ticker-group" aria-hidden="true">${links}</div>
    </div>
  </div>
  <span class="fmb-news-time"><strong>PHT</strong><time data-philippine-time datetime="">Loading Philippine time</time></span>
</div>
${tickerEnd}`;
}

const timeScript = `${tickerScriptStart}
<script data-fmb-news-time>
(() => {
  const clocks = document.querySelectorAll('[data-philippine-time]');
  if (!clocks.length) return;
  const formatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const update = () => {
    const now = new Date();
    const display = formatter.format(now);
    const machineDate = dateFormatter.format(now).replaceAll('/', '-');
    clocks.forEach(clock => {
      clock.textContent = display + ' · Philippine Standard Time';
      clock.setAttribute('datetime', machineDate + 'T' + display);
    });
  };
  update();
  window.setInterval(update, 1000);
})();
</script>
${tickerScriptEnd}`;

function applyEditorialSystem(html, combinedCss, tickerMarkup) {
  let next = html
    .replace(new RegExp(`${tickerStart}[\\s\\S]*?${tickerEnd}\\s*`, 'g'), '')
    .replace(new RegExp(`${tickerScriptStart}[\\s\\S]*?${tickerScriptEnd}\\s*`, 'g'), '')
    .replace(/<style\b[^>]*data-fmbnews-futuristic-ph[^>]*>[\s\S]*?<\/style>\s*/gi, '');

  next = addBodyClass(next, 'news-futuristic-ph');
  next = addBodyClass(next, 'news-channel-v4');

  if (!next.includes('data-fmbnews-futuristic-ph')) {
    next = next.replace('</head>', `<style data-fmbnews-futuristic-ph>\n${combinedCss}\n</style>\n</head>`);
  }

  next = next.replace(/<body\b([^>]*)>/i, `<body$1>\n${tickerMarkup}`);
  next = next.replace('</body>', `${timeScript}\n</body>`);
  return next;
}

function makeCanonicalLanding(html, combinedCss, tickerMarkup) {
  let next = html
    .replace(/<meta name="theme-color" content="[^"]*">/i, '<meta name="theme-color" content="#211032">')
    .replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${canonicalUrl}">`)
    .replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${canonicalUrl}">`)
    .replaceAll('https://www.francinemariebautista.com/fmbnews/#page', 'https://www.francinemariebautista.com/news/#page')
    .replaceAll('https://www.francinemariebautista.com/fmbnews/#stories', 'https://www.francinemariebautista.com/news/#stories')
    .replace('"url":"https://www.francinemariebautista.com/fmbnews/"', '"url":"https://www.francinemariebautista.com/news/"')
    .replaceAll('href="/fmbnews/"', 'href="/news/"')
    .replaceAll("href='/fmbnews/'", "href='/news/'");

  return applyEditorialSystem(next, combinedCss, tickerMarkup);
}

async function walkHtml(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

async function walkPublicHtml(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ['_sites', 'app', 'admin', 'assets', 'node_modules'].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkPublicHtml(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

const [fmbEditorialCss, readabilityCss, shellCss] = await Promise.all([
  readFile(cssSourcePath, 'utf8'),
  readFile(readabilityCssSourcePath, 'utf8'),
  readFile(shellCssSourcePath, 'utf8'),
]);

/* The publication shell is deliberately last so no legacy or universal layer can reappear. */
const combinedNewsroomCss = `${readabilityCss}\n\n${fmbEditorialCss}\n\n${shellCss}`;
const sourceLanding = await readFile(newsLandingPath, 'utf8');
const tickerMarkup = createTicker(extractHeadlineItems(sourceLanding));
const landingHtml = makeCanonicalLanding(sourceLanding, combinedNewsroomCss, tickerMarkup);

await mkdir(fmbNewsRoot, { recursive: true });
await writeFile(newsLandingPath, landingHtml, 'utf8');
await writeFile(fmbNewsLandingPath, landingHtml, 'utf8');

let articleCount = 0;
for (const filePath of await walkHtml(newsRoot)) {
  if (filePath === newsLandingPath) continue;
  const html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(html)) continue;
  const updated = applyEditorialSystem(
    html
      .replaceAll('href="/fmbnews/"', 'href="/news/"')
      .replaceAll("href='/fmbnews/'", "href='/news/'"),
    combinedNewsroomCss,
    tickerMarkup,
  );
  await writeFile(filePath, updated, 'utf8');
  articleCount += 1;
}

let linkedPages = 0;
for (const filePath of await walkPublicHtml(distRoot)) {
  const html = await readFile(filePath, 'utf8');
  const updated = html
    .replaceAll('href="/fmbnews/"', 'href="/news/"')
    .replaceAll("href='/fmbnews/'", "href='/news/'");
  if (updated !== html) {
    await writeFile(filePath, updated, 'utf8');
    linkedPages += 1;
  }
}

let sitemap = await readFile(sitemapPath, 'utf8');
const canonicalLandingLoc = '<loc>https://www.francinemariebautista.com/news/</loc>';
const legacyLandingLoc = '<loc>https://www.francinemariebautista.com/fmbnews/</loc>';
if (sitemap.includes(legacyLandingLoc)) sitemap = sitemap.replaceAll(legacyLandingLoc, canonicalLandingLoc);
if (!sitemap.includes(canonicalLandingLoc)) {
  const entry = `  <url><loc>https://www.francinemariebautista.com/news/</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
  if (!sitemap.includes('</urlset>')) throw new Error('FMB News editorial layer found an invalid sitemap.xml without a closing urlset.');
  sitemap = sitemap.replace('</urlset>', `${entry}</urlset>`);
}
await writeFile(sitemapPath, sitemap, 'utf8');

console.log(`Published the FMB News editorial layer on canonical /news/, kept /fmbnews/ as a compatibility output, and normalized ${linkedPages} public navigation page(s).`);