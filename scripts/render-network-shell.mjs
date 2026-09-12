import { readFile, readdir, writeFile } from 'node:fs/promises';
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

async function walk(dir, predicate = () => true) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(target, predicate));
    else if (entry.isFile() && predicate(target)) out.push(target);
  }
  return out;
}

async function latestStories() {
  const stories = [];
  const files = await walk(contentRoot, (target) => target.endsWith('.json'));

  for (const file of files) {
    try {
      const story = JSON.parse(await readFile(file, 'utf8'));
      if (story.status === 'published' && story.slug && story.headline && story.publishedAt) stories.push(story);
    } catch {
      // Editorial validation owns malformed records. The shell only consumes valid published stories.
    }
  }

  return stories
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 8);
}

function routeIdentity(relativePath) {
  const rel = relativePath.replaceAll('\\', '/').toLowerCase();

  if (rel === 'index.html') return { title: 'FMB News', cls: 'fmb-news-route', descriptor: '', active: '' };
  if (rel.startsWith('world/')) return { title: 'FMB Worldwide', cls: 'fmb-worldwide-route', descriptor: '', active: 'FMB Worldwide' };
  if (rel.startsWith('explainer/')) return { title: 'FMB Explainer', cls: 'fmb-explainer-route', descriptor: '', active: 'FMB Explainer' };
  if (rel.startsWith('fact-check/')) return { title: 'FMB Fact Check', cls: 'fmb-fact-check-route', descriptor: '', active: 'FMB Fact Check' };
  if (rel.startsWith('fmb-brief/') || /^fmb-brief-[^/]+\//.test(rel)) {
    return { title: 'FMB Daily Brief', cls: 'fmb-daily-brief-route', descriptor: 'Daily Newsletter', active: 'FMB Daily Brief' };
  }
  if (rel.startsWith('about/')) return { title: 'FMB News', cls: 'fmb-news-route', descriptor: '', active: 'About' };
  if (rel.startsWith('archive/')) return { title: 'FMB News', cls: 'fmb-news-route', descriptor: '', active: 'FMB News' };
  return { title: 'FMB News', cls: 'fmb-news-route', descriptor: '', active: 'FMB News' };
}

function ticker(stories) {
  const run = stories.map((story, index) => {
    const separator = index < stories.length - 1 ? '<span class="ticker-dot" aria-hidden="true">◆</span>' : '';
    return `<a href="/news/${esc(story.slug)}/"><span class="ticker-headline">${esc(story.headline)}</span></a>${separator}`;
  }).join('');

  return `<div class="headline-ticker" role="region" aria-label="Latest FMB News headlines"><div class="ticker-clock" aria-label="Philippine Standard Time"><span data-pht-clock>--:--</span><small>PHT</small></div><div class="ticker-label"><span class="ticker-pulse" aria-hidden="true"></span>LATEST</div><div class="ticker-window"><div class="ticker-track"><div class="ticker-run">${run}</div><div class="ticker-run" aria-hidden="true">${run}</div></div></div></div>`;
}

function utility() {
  return '<div class="utility"><div class="shell"><span><span data-pht-date></span></span><span class="utility-context">Philippine Standard Time · Information with Purpose.</span></div></div>';
}

function semanticProductMarkup(identity) {
  const productName = identity.title.replace(/^FMB\s+/, '');
  const descriptor = identity.descriptor ? `<div class="product-descriptor">${identity.descriptor}</div>` : '';
  return `<a class="product-wordmark" href="/news/" aria-label="${identity.title}"><span class="fmb-legacy-brand" aria-hidden="true"><span class="product-fmb">FMB</span><span class="product-name">${productName}</span></span><span class="fmb-lux-wordmark">FMB NEWS</span></a>${descriptor}`;
}

function mast(identity) {
  return `<header class="mast"><div class="shell">${semanticProductMarkup(identity)}</div></header>`;
}

function navigation(active) {
  const items = [
    ['FMB News', '/news/archive/'],
    ['FMB Worldwide', '/news/world/'],
    ['FMB Explainer', '/news/explainer/'],
    ['FMB Fact Check', '/news/fact-check/'],
    ['FMB Daily Brief', '/news/fmb-brief/'],
    ['About', '/news/about/'],
  ];

  const links = items
    .map(([label, href]) => `<a href="${href}"${active === label ? ' aria-current="page"' : ''}>${label}</a>`)
    .join('');

  return `<nav class="nav" aria-label="Filipino Media Bulletin"><div class="shell">${links}<a class="submit" href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit a Story</a><a class="search" href="/news/archive/" aria-label="Search FMB News"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg><span>Search</span></a></div></nav>`;
}

function footer() {
  return '<footer class="footer"><div class="shell footer-grid"><div><div class="footer-publication-title">Filipino Media Bulletin</div><div class="footer-publication-kicker">Information with Purpose</div><p>Verified reporting, useful context, and clear explanations for Filipino readers.</p><a href="/news/about/"><strong>About Filipino Media Bulletin →</strong></a><div class="footer-socials" aria-label="Filipino Media Bulletin social links"><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a><a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X">×</a><a href="mailto:withlovefmb@gmail.com" aria-label="Email Filipino Media Bulletin">✉</a></div></div><div><h3>Publications</h3><a href="/news/archive/">FMB News</a><a href="/news/world/">FMB Worldwide</a><a href="/news/explainer/">FMB Explainer</a><a href="/news/fact-check/">FMB Fact Check</a><a href="/news/fmb-brief/">FMB Daily Brief</a></div><div><h3>Resources</h3><a href="/news/about/">About</a><a href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit a Story</a><a href="/news/about/#standards">Corrections Policy</a><a href="/privacy/">Privacy Policy</a></div></div><div class="shell footer-bottom">© 2026 Filipino Media Bulletin. All rights reserved.</div></footer>';
}

function clockRuntime() {
  return `<script data-fmb-network-clock>(()=>{const d=document.querySelector('[data-pht-date]'),t=document.querySelector('[data-pht-clock]');const tick=()=>{const n=new Date();if(d)d.textContent=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(n);if(t)t.textContent=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true}).format(n)};tick();setInterval(tick,1000)})();</script>`;
}

function normalizeClockRuntime(html) {
  let out = html;
  out = out.replace(/<script data-fmb-network-clock>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\(\(\)=>\{const d=document\.querySelector\('\[data-pht-date\]'\),t=document\.querySelector\('\[data-pht-clock\]'\);[\s\S]*?<\/script>/gi, '');
  return out.replace('</body>', `${clockRuntime()}</body>`);
}

function ensureThemeColor(html) {
  if (/<meta name="theme-color"/i.test(html)) {
    return html.replace(/<meta name="theme-color" content="[^"]*">/i, '<meta name="theme-color" content="#ffffff">');
  }
  return html.replace('</head>', '<meta name="theme-color" content="#ffffff"></head>');
}

function ensureBaseAssets(html) {
  const stylesheets = [
    '/assets/css/fmb-news-reference.css?v=20260831-metallic',
    '/assets/css/fmb-news-reference-polish.css?v=20260831-metallic',
    '/assets/css/fmb-news-reference-hardfix.css?v=20260831-metallic',
    '/assets/css/fmb-news-reference-final.css?v=20260831-metallic',
    '/assets/css/fmb-news-network-hardfix.css?v=20260831-network-hardfix',
    '/assets/css/fmb-news-product-identity.css?v=20260831-product-lock',
    '/assets/css/fmb-news-ticker-hardfix.css?v=20260902-ticker-hardfix',
  ];

  let out = html;
  for (const href of stylesheets) {
    const base = href.split('?')[0];
    if (!out.includes(base)) out = out.replace('</head>', `<link rel="stylesheet" href="${href}"></head>`);
  }

  if (!out.includes('/assets/js/fmb-news-newsletter.js')) {
    out = out.replace('</head>', '<script src="/assets/js/fmb-news-newsletter.js?v=20260831-metallic" defer></script></head>');
  }
  return out;
}

function normalizeBodyClass(html, identity, relativePath) {
  const known = [
    'fmb-news-route', 'fmb-daily-brief-route', 'fmb-worldwide-route', 'fmb-explainer-route',
    'fmb-fact-check-route', 'fmb-network-landing',
  ];
  const isLanding = relativePath.replaceAll('\\', '/') === 'index.html' && html.includes('publication-mast');
  const routeClass = isLanding ? 'fmb-network-landing' : identity.cls;

  return html.replace(/<body\b([^>]*)>/i, (_match, attrs) => {
    const classMatch = attrs.match(/\bclass=(['"])([^'"]*)\1/i);
    const classes = new Set(classMatch ? classMatch[2].split(/\s+/).filter(Boolean) : []);
    classes.add('fmb-ref');
    for (const cls of known) classes.delete(cls);
    classes.add(routeClass);

    if (classMatch) {
      const replacement = `class=${classMatch[1]}${[...classes].join(' ')}${classMatch[1]}`;
      return `<body${attrs.replace(classMatch[0], replacement)}>`;
    }
    return `<body${attrs} class="${[...classes].join(' ')}">`;
  });
}

function replaceChrome(html, stories, identity, relativePath) {
  const isLanding = relativePath.replaceAll('\\', '/') === 'index.html' && html.includes('publication-mast');
  if (isLanding) return html;

  const shell = `${ticker(stories)}${utility()}${mast(identity)}${navigation(identity.active)}`;
  let out = html;

  // Replace current canonical/legacy shells as one unit when possible.
  out = out.replace(/<div class="headline-ticker"[\s\S]*?<nav class="nav"[\s\S]*?<\/nav>/i, shell);
  out = out.replace(/<div class="fnc-livebar"[\s\S]*?<header class="fnc-header"[\s\S]*?<\/header>/i, shell);
  out = out.replace(/<header class="brief-network"[\s\S]*?<\/header>/i, shell);
  out = out.replace(/<header class="masthead"[\s\S]*?<\/header>/i, shell);

  if (!out.includes('<header class="mast">')) out = out.replace(/<body([^>]*)>/i, `<body$1>${shell}`);

  // Product identity may have left a canonical mast with a separate nav. Make the final output exact.
  out = out.replace(/<header class="mast"><div class="shell">[\s\S]*?<\/div><\/header>/i, mast(identity));
  out = out.replace(/<nav class="nav"[\s\S]*?<\/nav>/i, navigation(identity.active));
  return out;
}

function replaceFooter(html, relativePath) {
  const isLanding = relativePath.replaceAll('\\', '/') === 'index.html' && html.includes('publication-footer');
  if (isLanding) return html;

  const approved = footer();
  if (/<footer class="(?:footer|brief-footer|fnc-footer)"/i.test(html)) {
    return html.replace(/<footer class="(?:footer|brief-footer|fnc-footer)"[\s\S]*?<\/footer>/i, approved);
  }
  return html.replace('</body>', `${approved}</body>`);
}

function normalizeLegacyNames(html) {
  return html.replaceAll('FMB Brief', 'FMB Daily Brief').replaceAll('FMB Explained', 'FMB Explainer');
}

export async function renderNetworkShell() {
  const stories = await latestStories();
  const pages = await walk(newsRoot, (target) => target.endsWith('.html'));
  let changed = 0;

  for (const file of pages) {
    const relativePath = path.relative(newsRoot, file);
    const identity = routeIdentity(relativePath);
    const source = await readFile(file, 'utf8');
    let html = source;

    html = ensureThemeColor(html);
    html = ensureBaseAssets(html);
    html = normalizeLegacyNames(html);
    html = normalizeBodyClass(html, identity, relativePath);
    html = replaceChrome(html, stories, identity, relativePath);
    html = replaceFooter(html, relativePath);
    html = normalizeClockRuntime(html);

    if (html !== source) {
      await writeFile(file, html, 'utf8');
      changed += 1;
    }
  }

  console.log(`Rendered canonical FMB News network shell across ${changed}/${pages.length} HTML pages with one product-aware masthead, five editorial products, one normalized PHT ticker/clock, utility chrome, and non-redundant footer.`);
}
