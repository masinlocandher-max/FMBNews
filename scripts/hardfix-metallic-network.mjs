import { access, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const contentRoot = path.join(root, 'content', 'news', 'articles');

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const fmtTime = (iso) => {
  try {
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true
    }).format(new Date(iso)) + ' PHT';
  } catch {
    return '';
  }
};

async function walk(dir, predicate = () => true) {
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(target, predicate));
    else if (entry.isFile() && predicate(target)) out.push(target);
  }
  return out;
}

async function latestStories() {
  const files = await walk(contentRoot, (target) => target.endsWith('.json'));
  const stories = [];
  for (const file of files) {
    try {
      const story = JSON.parse(await readFile(file, 'utf8'));
      if (story.status === 'published' && story.slug && story.headline && story.publishedAt) stories.push(story);
    } catch {}
  }
  return stories.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 7);
}

function ticker(stories) {
  const run = stories.map((story, index) => {
    const dot = index < stories.length - 1 ? '<span class="ticker-dot" aria-hidden="true">◆</span>' : '';
    return `<a href="/news/${esc(story.slug)}/"><time datetime="${esc(story.publishedAt)}">${esc(fmtTime(story.publishedAt))}</time><span class="ticker-headline">${esc(story.headline)}</span></a>${dot}`;
  }).join('');
  return `<div class="headline-ticker" role="region" aria-label="Latest FMB News headlines"><div class="ticker-label"><span class="ticker-pulse" aria-hidden="true"></span>LATEST</div><div class="ticker-window"><div class="ticker-track"><div class="ticker-run">${run}</div><div class="ticker-run" aria-hidden="true">${run}</div></div></div></div>`;
}

function activeFor(relativePath) {
  const rel = relativePath.replaceAll('\\', '/').toLowerCase();
  if (rel === 'index.html') return 'Latest';
  if (rel.startsWith('world/')) return 'FMB Worldwide';
  if (rel.startsWith('fmb-brief/') || /^fmb-brief-[^/]+\//.test(rel)) return 'FMB Brief';
  if (rel.startsWith('archive/')) return 'Archive';
  if (rel.startsWith('about/')) return 'About';
  return '';
}

function wordmark(footer = false) {
  return `<a class="brand-wordmark${footer ? ' brand-wordmark-footer' : ''}" href="/news/" aria-label="FMB News home"><span class="brand-fmb">FMB</span><span class="brand-news">News</span></a><div class="brand-subtitle${footer ? ' brand-subtitle-footer' : ''}">FILIPINO MEDIA BULLETIN</div>`;
}

function utility() {
  return `<div class="utility"><div class="shell"><span><span data-pht-date></span> &nbsp; | &nbsp; Philippine Standard Time <span data-pht-clock></span></span><span>Stay informed. Stay independent.</span></div></div>`;
}

function nav(active) {
  const items = [
    ['Latest', '/news/'],
    ['FMB Brief', '/news/fmb-brief/'],
    ['FMB Worldwide', '/news/world/'],
    ['Archive', '/news/archive/'],
    ['About', '/news/about/']
  ];
  return `<nav class="nav" aria-label="FMB News"><div class="shell">${items.map(([label, href]) => `<a href="${href}"${active === label ? ' aria-current="page"' : ''}>${label}</a>`).join('')}<a class="submit" href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit a Story</a><a class="search" href="/news/archive/" aria-label="Search FMB News"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg><span>Search</span></a></div></nav>`;
}

function mast(stories, active) {
  return `${ticker(stories)}${utility()}<header class="mast"><div class="shell">${wordmark()}</div></header>${nav(active)}`;
}

function signup() {
  return `<div class="newsletter"><h3>GET THE FMB NEWS DAILY BRIEF</h3><p>One newsletter. One minute a day.<br>Everything you need to know.</p><form data-fmb-newsletter-form novalidate><label class="sr-only" for="fmb-newsletter-email">Email address</label><input id="fmb-newsletter-email" type="email" name="email" placeholder="Enter your email address" autocomplete="email" required><button type="submit">Subscribe</button><input data-fmb-newsletter-honeypot name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><label class="consent"><input type="checkbox" data-fmb-newsletter-consent required><span>I agree to receive the FMB News Daily Brief and understand I can unsubscribe at any time. Read our <a href="/privacy/">Privacy Policy</a>.</span></label><p class="status" data-fmb-newsletter-status role="status" aria-live="polite"></p></form></div>`;
}

function footer() {
  return `<footer class="footer"><div class="shell footer-grid"><div>${wordmark(true)}<p>We report with independence, verify with care, and explain with clarity, so Filipinos can make informed decisions.</p><a href="/news/about/"><strong>About FMB News →</strong></a><div class="footer-socials" aria-label="FMB News social links"><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a><a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X">×</a><a href="mailto:withlovefmb@gmail.com" aria-label="Email FMB News">✉</a></div></div><div><h3>Sections</h3><a href="/news/">Latest</a><a href="/news/fmb-brief/">FMB Brief</a><a href="/news/world/">FMB Worldwide</a><a href="/news/archive/">Archive</a></div><div><h3>Resources</h3><a href="/news/about/">About</a><a href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit a Story</a><a href="/news/about/#standards">Corrections Policy</a><a href="/privacy/">Privacy Policy</a></div>${signup()}</div><div class="shell footer-bottom">© 2026 FMB News. All rights reserved.</div></footer>`;
}

function clockScript() {
  return `<script data-fmb-network-clock>(()=>{const d=document.querySelector('[data-pht-date]'),t=document.querySelector('[data-pht-clock]');const tick=()=>{const n=new Date();if(d)d.textContent=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(n);if(t)t.textContent=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true}).format(n)};tick();setInterval(tick,1000)})();</script>`;
}

function ensureBodyClass(html, relativePath) {
  const worldClass = relativePath.replaceAll('\\', '/').startsWith('world/') ? ' fmb-worldwide-route' : '';
  if (/<body\s+class="[^"]*"/i.test(html)) {
    return html.replace(/<body\s+class="([^"]*)"/i, (_m, classes) => {
      const set = new Set(classes.split(/\s+/).filter(Boolean));
      set.add('fmb-ref');
      if (worldClass) set.add('fmb-worldwide-route');
      return `<body class="${[...set].join(' ')}"`;
    });
  }
  return html.replace(/<body(\s*>)/i, `<body class="fmb-ref${worldClass}"$1`);
}

function ensureStyles(html) {
  const assets = [
    '/assets/css/fmb-news-reference.css?v=20260831-metallic',
    '/assets/css/fmb-news-reference-polish.css?v=20260831-metallic',
    '/assets/css/fmb-news-reference-hardfix.css?v=20260831-metallic',
    '/assets/css/fmb-news-reference-final.css?v=20260831-metallic',
    '/assets/css/fmb-news-network-hardfix.css?v=20260831-network-hardfix'
  ];
  let out = html;
  for (const href of assets) {
    const base = href.split('?')[0];
    if (!out.includes(base)) out = out.replace('</head>', `<link rel="stylesheet" href="${href}"></head>`);
  }
  if (!out.includes('/assets/js/fmb-news-newsletter.js')) {
    out = out.replace('</head>', '<script src="/assets/js/fmb-news-newsletter.js?v=20260831-metallic" defer></script></head>');
  }
  return out;
}

function replaceLegacyChrome(html, stories, active) {
  if (html.includes('<header class="mast">') && html.includes('brand-wordmark')) return html;
  const approved = mast(stories, active);
  let out = html;

  // About used a separate livebar + header pair. Replace them as one unit.
  out = out.replace(/<div class="fnc-livebar"[\s\S]*?<header class="fnc-header"[\s\S]*?<\/header>/i, approved);
  out = out.replace(/<header class="brief-network"[\s\S]*?<\/header>/i, approved);
  out = out.replace(/<header class="masthead"[\s\S]*?<\/header>/i, approved);

  // If a future legacy page has no recognized header, put the network mast at body start.
  if (!out.includes('<header class="mast">')) out = out.replace(/<body([^>]*)>/i, `<body$1>${approved}`);
  return out;
}

function replaceLegacyFooter(html) {
  if (html.includes('brand-wordmark-footer')) return html;
  const approved = footer();
  let out = html.replace(/<footer class="(?:footer|brief-footer|fnc-footer)"[\s\S]*?<\/footer>/i, approved);
  if (!out.includes('brand-wordmark-footer')) out = out.replace('</body>', `${approved}</body>`);
  return out;
}

function normalizeTheme(html) {
  if (/<meta name="theme-color"/i.test(html)) {
    return html.replace(/<meta name="theme-color" content="[^"]*">/i, '<meta name="theme-color" content="#ffffff">');
  }
  return html.replace('</head>', '<meta name="theme-color" content="#ffffff"></head>');
}

async function hardFixPage(file, stories) {
  const relative = path.relative(newsRoot, file);
  let html = await readFile(file, 'utf8');
  html = normalizeTheme(html);
  html = ensureStyles(html);
  html = ensureBodyClass(html, relative);
  html = replaceLegacyChrome(html, stories, activeFor(relative));
  html = replaceLegacyFooter(html);
  if (!html.includes('data-fmb-network-clock')) html = html.replace('</body>', `${clockScript()}</body>`);
  await writeFile(file, html, 'utf8');
}

await access(newsRoot);
const stories = await latestStories();
const pages = await walk(newsRoot, (target) => target.endsWith('.html'));
for (const page of pages) await hardFixPage(page, stories);

console.log(`Hard-fixed metallic FMB News network shell across ${pages.length} built HTML pages, including FMB Worldwide and FMB Brief.`);
