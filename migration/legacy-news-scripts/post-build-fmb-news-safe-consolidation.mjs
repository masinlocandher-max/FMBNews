import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const contentRoot = path.join(root, 'apps', 'withlovefmb', 'content', 'news', 'articles');
const newsRoot = path.join(dist, 'news');
const homepageFile = path.join(newsRoot, 'index.html');
const logoColor = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';
const logoWhite = '/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp';
const fallbackImage = '/assets/images/news/fmb-news-editorial-fallback.svg';

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

async function walk(directory) {
  const files = [];
  let entries = [];
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error?.code === 'ENOENT') return files; throw error; }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(target);
  }
  return files;
}

function safeImage(raw) {
  const value = String(raw?.image?.url || '').trim();
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  return fallbackImage;
}

async function latestPublished(limit = 12) {
  const stories = [];
  for (const file of await walk(contentRoot)) {
    try {
      const raw = JSON.parse(await readFile(file, 'utf8'));
      if (raw.status !== 'published' || !raw.slug || !raw.headline || !raw.publishedAt) continue;
      stories.push({
        slug: raw.slug,
        headline: raw.headline,
        deck: raw.deck || raw.seoDescription || '',
        category: raw.category || 'Latest',
        publishedAt: raw.publishedAt,
        image: safeImage(raw),
        alt: raw.image?.alt || raw.headline,
      });
    } catch (error) {
      console.warn(`Skipping invalid FMB News article JSON ${path.relative(root, file)}: ${error.message}`);
    }
  }
  return stories.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, limit);
}

function cards(stories) {
  return stories.slice(0, 4).map((story) => `<a class="story-card" href="/news/${esc(story.slug)}/"><img src="${esc(story.image)}" alt="${esc(story.alt)}" loading="lazy" decoding="async" onerror="if(!this.dataset.fmbFallback){this.dataset.fmbFallback='1';this.src='${fallbackImage}'}"><div><em>${esc(story.category)}</em><h3>${esc(story.headline)}</h3><p>${esc(story.deck)}</p></div></a>`).join('');
}

function tickerItems(stories, count) {
  const source = stories.slice(0, count);
  const run = source.map((story) => `<span>${esc(story.headline)}</span>`).join('');
  return run + run;
}

function linkedTickerItems(stories, count) {
  const source = stories.slice(0, count);
  const run = source.map((story) => `<a href="/news/${esc(story.slug)}/">${esc(story.headline)}</a>`).join('');
  return run + run;
}

function installStablePublicationLogos(html) {
  html = html.replace(/<img\b([^>]*?)data-fmb-asset=["']logo["']([^>]*?)>/gi, (tag, before, after) => {
    const isFooter = /footer-logo/i.test(tag);
    const src = isFooter ? logoWhite : logoColor;
    let out = `<img${before}${after}>`;
    out = out.replace(/\sdata-fmb-asset=["']logo["']/i, '');
    if (/\ssrc=["'][^"']*["']/i.test(out)) out = out.replace(/\ssrc=["'][^"']*["']/i, ` src="${src}"`);
    else out = out.replace('<img', `<img src="${src}"`);
    return out;
  });

  html = html.replace(/<a\b([^>]*class=["'][^"']*fmb-consistent-brand[^"']*["'][^>]*)>[\s\S]*?<\/a>/i,
    `<a $1><img class="fmb-news-stable-logo" src="${logoColor}" width="909" height="210" alt="FMB News"><small>Filipino Media Bulletin</small></a>`);

  html = html.replace(/<a\s+class=["']brand["']\s+href=["']\/news\/["'][^>]*>[\s\S]*?<\/a>/i,
    `<a class="brand" href="/news/"><img class="fmb-news-stable-logo" src="${logoColor}" width="909" height="210" alt="FMB News"><small>Filipino Media Bulletin</small></a>`);

  if (!html.includes(logoColor)) {
    html = html.replace(/<a\b([^>]*href=["']\/news\/["'][^>]*)>\s*FMB News(?:\s*<small>[\s\S]*?<\/small>)?\s*<\/a>/i,
      `<a $1><img class="fmb-news-stable-logo" src="${logoColor}" width="909" height="210" alt="FMB News"><small>Filipino Media Bulletin</small></a>`);
  }

  html = html.replace(/<div\b([^>]*class=["'][^"']*fmb-consistent-footer-inner[^"']*["'][^>]*)>\s*<strong>FMB News<\/strong>/i,
    `<div $1><img class="fmb-news-stable-footer-logo" src="${logoWhite}" width="909" height="210" alt="FMB News">`);

  if (!html.includes(logoWhite)) {
    if (/<footer\b[^>]*class=["'][^"']*fmb-consistent-footer[^"']*["'][^>]*>/i.test(html)) {
      html = html.replace(/(<footer\b[^>]*class=["'][^"']*fmb-consistent-footer[^"']*["'][^>]*>)/i,
        `$1<div class="fmb-news-stable-footer-lockup"><img class="fmb-news-stable-footer-logo" src="${logoWhite}" width="909" height="210" alt="FMB News"></div>`);
    } else if (/<footer\b[^>]*class=["'][^"']*footer[^"']*["'][^>]*>/i.test(html)) {
      html = html.replace(/(<footer\b[^>]*class=["'][^"']*footer[^"']*["'][^>]*>)/i,
        `$1<div class="shell fmb-news-stable-footer-lockup"><img class="fmb-news-stable-footer-logo" src="${logoWhite}" width="909" height="210" alt="FMB News"></div>`);
    }
  }

  return html;
}

function normalizeHomepage(html, stories) {
  if (!stories.length) throw new Error('No published structured FMB News stories found for homepage consolidation.');

  html = installStablePublicationLogos(html);

  html = html.replace(/<nav class="desktop-nav">[\s\S]*?<\/nav>/i,
    '<nav class="desktop-nav"><a href="/news/">Latest</a><a href="/news/fmb-brief/">FMB Brief</a><a href="/news/archive/">Archive</a><a href="/news/about/">About</a></nav>');
  html = html.replace(/<nav class="mobile-nav"[^>]*>[\s\S]*?<\/nav>/i,
    '<nav class="mobile-nav" data-mobile-nav><a href="/news/">Latest</a><a href="/news/fmb-brief/">FMB Brief</a><a href="/news/archive/">Archive</a><a href="/news/about/">About FMB News</a><a href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit a story</a></nav>');
  html = html.replace(/<div class="section-rail">[\s\S]*?<\/div>\s*<\/div>/i,
    '<div class="section-rail"><div class="shell section-links"><a href="/news/">Latest</a><a href="/news/fmb-brief/">FMB Brief</a><a href="/news/archive/">Archive</a><a href="/news/about/">About</a></div></div>');
  html = html.replace(/<button class="icon-button"[^>]*aria-label=["']Search["'][^>]*>[\s\S]*?<\/button>/i,
    '<a class="icon-button" href="/news/archive/" aria-label="Browse the FMB News archive">⌕</a>');

  html = html.replace(/<div class="wire-track">[\s\S]*?<\/div>/i, `<div class="wire-track">${tickerItems(stories, 6)}</div>`);
  html = html.replace(/<div class="hero-ticker-track">[\s\S]*?<\/div>/i, `<div class="hero-ticker-track">${tickerItems(stories, 3)}</div>`);
  html = html.replace(/<div class="fmb-wire-track">[\s\S]*?<\/div>/i, `<div class="fmb-wire-track">${linkedTickerItems(stories, 8)}</div>`);
  html = html.replace(/<div class="story-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/i,
    `<div class="story-grid">${cards(stories)}</div></div></section>`);

  html = html.replace(/<div class="section-heading">[\s\S]*?<\/div>\s*<div class="story-grid">/i,
    '<div class="section-heading"><div><h2>Latest FMB News</h2><p>Current reports, explainers and analysis from the FMB News Desk.</p></div><a href="/news/archive/">All reports →</a></div><div class="story-grid">');

  const newsletterForm = `<form data-fmb-newsletter-form novalidate><label class="sr-only" for="fmb-newsletter-email">Email address</label><input id="fmb-newsletter-email" name="email" type="email" autocomplete="email" inputmode="email" aria-label="Email address" placeholder="Your email address" required><input data-fmb-newsletter-honeypot name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button type="submit">Subscribe</button><p data-fmb-newsletter-status role="status" aria-live="polite"></p></form>`;
  html = html.replace(/<form>\s*<input type="email"[\s\S]*?<\/form>/i, newsletterForm);
  if (!html.includes('data-fmb-newsletter-form')) {
    const signup = `<section class="fmb-news-newsletter" aria-labelledby="fmb-newsletter-title"><div class="fmb-news-newsletter-inner"><div><p class="fmb-news-newsletter-kicker">FMB News Daily Brief</p><h2 id="fmb-newsletter-title">Stay informed without chasing the news.</h2><p>Receive the FMB News Daily Brief and important newsroom updates by email.</p></div>${newsletterForm}</div></section>`;
    if (/<\/footer>/i.test(html)) html = html.replace(/<\/footer>/i, `${signup}</footer>`);
    else html = html.replace(/<\/body>/i, `${signup}</body>`);
  }

  if (!html.includes('/assets/js/config.js')) html = html.replace('</head>', '<script src="/assets/js/config.js" defer></script></head>');
  if (!html.includes('/assets/js/fmb-news-newsletter.js')) html = html.replace('</body>', '<script src="/assets/js/fmb-news-newsletter.js" defer></script></body>');
  if (!html.includes('id="fmb-news-consolidation-style"')) html = html.replace('</head>', '<style id="fmb-news-consolidation-style">.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.fmb-news-stable-logo{display:block;width:min(360px,72vw)!important;height:auto!important;margin:0 auto}.fmb-news-stable-footer-lockup{width:min(1380px,calc(100% - 48px));margin:0 auto 18px}.fmb-news-stable-footer-logo{display:block;width:min(275px,70vw);height:auto;margin:0}.fmb-news-newsletter{width:min(1380px,calc(100% - 48px));margin:36px auto 0;padding:28px 0 0;border-top:1px solid rgba(255,255,255,.16)}.fmb-news-newsletter-inner{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,520px);gap:32px;align-items:end}.fmb-news-newsletter-kicker{margin:0 0 8px!important;font:800 10px/1.2 Arial,Helvetica,sans-serif!important;letter-spacing:.14em;text-transform:uppercase}.fmb-news-newsletter h2{margin:0;color:#fff;font:600 clamp(1.7rem,3vw,2.7rem)/1.02 Georgia,\"Times New Roman\",serif}.fmb-news-newsletter p{max-width:650px}.fmb-news-newsletter form{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto}.fmb-news-newsletter input[type="email"]{min-width:0;height:46px;border:1px solid rgba(255,255,255,.28);border-radius:9px 0 0 9px;padding:0 13px;background:#fff;color:#24172b}.fmb-news-newsletter button{height:46px;border:0;border-radius:0 9px 9px 0;padding:0 18px;background:#6a35a0;color:#fff;font-weight:750}[data-fmb-newsletter-status]{grid-column:1/-1;margin:8px 0 0!important;color:#ded4e2;font-size:11px!important;min-height:1.3em}[data-fmb-newsletter-status][data-state="error"]{color:#ffd7d7}[data-fmb-newsletter-status][data-state="success"]{color:#e6d5f4}.fmb-news-newsletter form[aria-busy="true"] button{opacity:.65;cursor:wait}@media(max-width:700px){.fmb-news-stable-footer-lockup,.fmb-news-newsletter{width:calc(100% - 28px)}.fmb-news-newsletter-inner{grid-template-columns:1fr}.fmb-news-newsletter form{grid-template-columns:1fr}.fmb-news-newsletter input[type="email"],.fmb-news-newsletter button{border-radius:9px}.fmb-news-newsletter button{margin-top:8px}}</style></head>');

  return html;
}

await access(homepageFile);
await access(path.join(dist, logoColor.replace(/^\//, '')));
await access(path.join(dist, logoWhite.replace(/^\//, '')));
await access(path.join(dist, fallbackImage.replace(/^\//, '')));

const stories = await latestPublished();
let homepage = await readFile(homepageFile, 'utf8');
homepage = normalizeHomepage(homepage, stories);
await writeFile(homepageFile, homepage, 'utf8');

const required = [
  logoColor,
  logoWhite,
  'data-fmb-newsletter-form',
  '/assets/js/fmb-news-newsletter.js',
  `/news/${stories[0].slug}/`,
  '/news/archive/',
];
for (const marker of required) {
  if (!homepage.includes(marker)) throw new Error(`FMB News safe consolidation missing ${marker}`);
}
if (homepage.includes('data-fmb-asset="logo"')) throw new Error('FMB News homepage still depends on fragmented runtime logo assembly.');
if (/button\s+type=["']button["'][^>]*>Subscribe/i.test(homepage)) throw new Error('FMB News newsletter button is still inert.');
if (/aria-label=["']Search["']/i.test(homepage)) throw new Error('FMB News homepage still exposes an inert Search control.');

console.log(`FMB News safe consolidation passed: homepage reflects ${stories.length} newest structured stories, stable logo assets, canonical navigation, and functional Daily Brief signup.`);
