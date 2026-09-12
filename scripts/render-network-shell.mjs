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
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
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
      // Editorial validation owns malformed records. The shell consumes valid published stories only.
    }
  }
  return stories.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 8);
}

function routeIdentity(relativePath) {
  const rel = relativePath.replaceAll('\\', '/').toLowerCase();
  if (rel === 'index.html') return { title: 'FMB News', cls: 'fmb-news-route', active: 'Home' };
  if (rel.startsWith('world/')) return { title: 'FMB Worldwide', cls: 'fmb-worldwide-route', active: 'World' };
  if (rel.startsWith('sports/')) return { title: 'FMB Sports', cls: 'fmb-news-route', active: 'Sports' };
  if (rel.startsWith('explainer/')) return { title: 'FMB Explainer', cls: 'fmb-explainer-route', active: 'Explainers' };
  if (rel.startsWith('fact-check/')) return { title: 'FMB Fact Check', cls: 'fmb-fact-check-route', active: 'Fact Check' };
  if (rel.startsWith('fmb-brief/') || /^fmb-brief-[^/]+\//.test(rel)) return { title: 'FMB Daily Brief', cls: 'fmb-daily-brief-route', active: 'Daily Briefing' };
  if (rel.startsWith('horoscope/') || rel.startsWith('crossword/')) return { title: 'FMB Entertainment', cls: 'fmb-news-route', active: 'Entertainment' };
  if (rel.startsWith('about/')) return { title: 'FMB News', cls: 'fmb-news-route', active: 'About' };
  if (rel.startsWith('archive/')) return { title: 'FMB News', cls: 'fmb-news-route', active: 'Home' };
  return { title: 'FMB News', cls: 'fmb-news-route', active: 'Home' };
}

function ticker(stories) {
  const run = stories.map((story, index) => {
    const separator = index < stories.length - 1 ? '<span class="ticker-dot" aria-hidden="true">·</span>' : '';
    return `<a href="/news/${esc(story.slug)}/"><span class="ticker-headline">${esc(story.headline)}</span></a>${separator}`;
  }).join('');
  return `<div class="headline-ticker" role="region" aria-label="Latest FMB News headlines"><div class="ticker-clock" aria-label="Philippine Standard Time"><span data-pht-clock>--:--</span><small>PHT</small></div><div class="ticker-label"><span class="ticker-pulse" aria-hidden="true"></span>LATEST</div><div class="ticker-window"><div class="ticker-track"><div class="ticker-run">${run}</div><div class="ticker-run" aria-hidden="true">${run}</div></div></div></div>`;
}

function utility() {
  return '<div class="utility"><div class="shell"><span><span data-pht-date></span></span><span class="utility-context">Philippine Standard Time · Information with Purpose.</span></div></div>';
}

function semanticProductMarkup(identity) {
  return `<a class="product-wordmark" href="/news/" aria-label="FMB News home"><span class="fmb-lux-wordmark">FMB NEWS<span class="fmb-brand-period">.</span></span><span class="fmb-brand-descriptor">FILIPINO MEDIA BULLETIN</span></a><span class="sr-only">${esc(identity.title)}</span>`;
}

function mast(identity) {
  return `<header class="mast"><div class="shell">${semanticProductMarkup(identity)}</div></header>`;
}

function navigation(active) {
  const current = (label) => active === label ? ' aria-current="page"' : '';
  return `<nav class="nav" aria-label="FMB News primary navigation"><div class="shell">
    <a href="/news/"${current('Home')}>Home</a>
    <a href="/news/world/"${current('World')}>World</a>
    <a href="/news/sports/"${current('Sports')}>Sports</a>
    <a href="/news/fmb-brief/"${current('Daily Briefing')}>Daily Briefing</a>
    <a href="/news/fact-check/"${current('Fact Check')}>Fact Check</a>
    <a href="/news/explainer/"${current('Explainers')}>Explainers</a>
    <details class="publication-menu"${active === 'Entertainment' ? ' open' : ''}><summary${active === 'Entertainment' ? ' aria-current="page"' : ''}>Entertainment</summary><div class="publication-menu-panel"><a href="/news/horoscope/">Horoscope</a><a href="/news/crossword/">Crossword</a></div></details>
    <a href="/news/about/"${current('About')}>About</a>
    <a class="search" href="/news/search/" aria-label="Search FMB News"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg><span>Search</span></a>
  </div></nav>`;
}

function footer() {
  return '<footer class="footer"><div class="shell footer-grid"><div><div class="footer-publication-title">FMB NEWS<span class="fmb-brand-period">.</span></div><div class="footer-publication-kicker">Filipino Media Bulletin · Information with Purpose.</div><p>Verified reporting, useful context, and clear explanations for Filipino readers.</p><a href="/news/about/"><strong>About FMB →</strong></a></div><div><h3>Sections</h3><a href="/news/">Home</a><a href="/news/world/">World</a><a href="/news/sports/">Sports</a><a href="/news/fmb-brief/">Daily Briefing</a><a href="/news/fact-check/">Fact Check</a><a href="/news/explainer/">Explainers</a></div><div><h3>Entertainment & Trust</h3><a href="/news/horoscope/">Horoscope</a><a href="/news/crossword/">Crossword</a><a href="/news/about/">About FMB</a><a href="/news/editorial-standards/">Editorial Standards</a><a href="/news/corrections/">Corrections</a><a href="mailto:withlovefmb@gmail.com">Contact</a></div></div><div class="shell footer-bottom">© 2026 Filipino Media Bulletin. All rights reserved.</div></footer>';
}

function clockRuntime() {
  return `<script data-fmb-network-clock>(()=>{const d=document.querySelector('[data-pht-date]'),t=document.querySelector('[data-pht-clock]');const tick=()=>{const n=new Date();if(d)d.textContent=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(n);if(t)t.textContent=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true}).format(n)};tick();setInterval(tick,30000)})();</script>`;
}

function normalizeClockRuntime(html) {
  let out = html;
  out = out.replace(/<script data-fmb-network-clock>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\(\(\)=>\{const d=document\.querySelector\('\[data-pht-date\]'\),t=document\.querySelector\('\[data-pht-clock\]'\);[\s\S]*?<\/script>/gi, '');
  return out.replace('</body>', `${clockRuntime()}</body>`);
}

function ensureThemeColor(html) {
  if (/<meta name="theme-color"/i.test(html)) return html.replace(/<meta name="theme-color" content="[^"]*">/i, '<meta name="theme-color" content="#F4F0E8">');
  return html.replace('</head>', '<meta name="theme-color" content="#F4F0E8"></head>');
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
  if (!out.includes('/assets/js/fmb-news-newsletter.js')) out = out.replace('</head>', '<script src="/assets/js/fmb-news-newsletter.js?v=20260831-metallic" defer></script></head>');
  return out;
}

function normalizeBodyClass(html, identity, relativePath) {
  const known = ['fmb-news-route', 'fmb-daily-brief-route', 'fmb-worldwide-route', 'fmb-explainer-route', 'fmb-fact-check-route', 'fmb-network-landing'];
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

function insertBeforeFirstMainOrBodyEnd(html, fragment) {
  if (/<main\b/i.test(html)) return html.replace(/<main\b/i, `${fragment}<main`);
  return html.replace('</body>', `${fragment}</body>`);
}

function replaceChrome(html, stories, identity, relativePath) {
  const isLanding = relativePath.replaceAll('\\', '/') === 'index.html' && html.includes('publication-mast');
  if (isLanding) return html;

  const chrome = `${ticker(stories)}${utility()}`;
  const approvedMast = mast(identity);
  const approvedNav = navigation(identity.active);
  const shell = `${chrome}${approvedMast}${approvedNav}`;
  let out = html;

  out = out.replace(/<div class="headline-ticker"[\s\S]*?<nav class="nav"[\s\S]*?<\/nav>/i, shell);
  out = out.replace(/<div class="fnc-livebar"[\s\S]*?<header class="fnc-header"[\s\S]*?<\/header>/i, shell);
  out = out.replace(/<header class="brief-network"[\s\S]*?<\/header>/i, shell);
  out = out.replace(/<header class="masthead"[\s\S]*?<\/header>/i, shell);

  const hasTicker = /<div class="headline-ticker"/i.test(out);
  const hasUtility = /<div class="utility">/i.test(out);
  const hasMast = /<header class="mast\b/i.test(out);
  const hasNav = /<nav class="nav\b/i.test(out);

  if (!hasMast) {
    if (hasTicker) out = insertBeforeFirstMainOrBodyEnd(out, `${hasUtility ? '' : utility()}${approvedMast}${hasNav ? '' : approvedNav}`);
    else out = insertBeforeFirstMainOrBodyEnd(out, shell);
  } else {
    if (!hasTicker) out = out.replace(/<header class="mast\b/i, `${chrome}<header class="mast`);
    else if (!hasUtility) out = out.replace(/<header class="mast\b/i, `${utility()}<header class="mast`);
    if (!hasNav) out = out.replace(/(<header class="mast\b[^>]*>[\s\S]*?<\/header>)/i, `$1${approvedNav}`);
  }

  out = out.replace(/<header class="mast\b[^>]*>[\s\S]*?<\/header>/i, approvedMast);
  out = out.replace(/<nav class="nav\b[^>]*>[\s\S]*?<\/nav>/i, approvedNav);
  return out;
}

function replaceFooter(html, relativePath) {
  const isLanding = relativePath.replaceAll('\\', '/') === 'index.html' && html.includes('publication-footer');
  if (isLanding) return html;
  const approved = footer();
  if (/<footer class="(?:footer|brief-footer|fnc-footer)"/i.test(html)) return html.replace(/<footer class="(?:footer|brief-footer|fnc-footer)"[\s\S]*?<\/footer>/i, approved);
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
  console.log(`Rendered canonical FMB News shell across ${changed}/${pages.length} HTML pages with ivory/ink/crimson masthead identity, Home/World/Sports editorial navigation, Daily Briefing, Fact Check, Explainers, Entertainment, one PHT clock, latest-headline rail, and production-safe footer.`);
}