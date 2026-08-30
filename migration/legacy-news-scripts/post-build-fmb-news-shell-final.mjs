import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const cssHref = '/assets/css/fmb-unified-system.css?v=20260724-total-makeover-v1';
const jsSrc = '/assets/js/fmb-unified-system.js?v=20260724-total-makeover-v1';
const logoSrc = '/assets/images/fmbandco/fmbandco-primary-reversed.png';

const publicNavigation = [
  ['/', 'Home'],
  ['/aboutfmb/', 'About FMB'],
  ['/news/', 'Bulletin'],
  ['/projects/', 'Projects'],
  ['/get-involved/', 'Get Involved'],
  ['/gethelp/', 'Get Help'],
  ['/fmbandco/', 'FMB&CO.'],
  ['/work-with-fmb/', 'Work with FMB'],
];

const shellHeader = `
<div class="fmb-shell-rail" data-fmb-unified-shell>
  <strong>FMB&amp;CO.</strong>
  <span>The official digital headquarters of Francine Marie Bautista</span>
  <a href="/news/">Open the bulletin</a>
</div>
<header class="fmb-shell-header" data-fmb-unified-shell>
  <a class="fmb-shell-brand" href="/" aria-label="Francine Marie Bautista and FMB&CO. home">
    <img src="${logoSrc}" width="1414" height="405" alt="FMB&CO. Francine Marie Bautista">
  </a>
  <nav class="fmb-shell-nav" id="fmbUnifiedNav" aria-label="Primary navigation">
    ${publicNavigation.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n    ')}
  </nav>
  <a class="fmb-shell-cta" href="/work-with-fmb/">Work with FMB</a>
  <a class="fmb-shell-yoni" href="https://yoni.francinemariebautista.com/">Open Yoni</a>
  <button class="fmb-shell-menu" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="fmbUnifiedNav"><span></span></button>
</header>`;

const shellFooter = `
<footer class="fmb-shell-footer" data-fmb-unified-shell>
  <div class="fmb-shell-footer-grid">
    <div class="fmb-shell-footer-brand">
      <img src="${logoSrc}" width="1414" height="405" loading="lazy" decoding="async" alt="FMB&CO. Francine Marie Bautista">
      <p>The official digital home, bulletin, authority platform, and ecosystem gateway of Francine Marie Bautista.</p>
    </div>
    <nav aria-label="Official site links">
      <strong>Official Site</strong>
      <a href="/">Home</a>
      <a href="/aboutfmb/">About FMB</a>
      <a href="/news/">Bulletin</a>
      <a href="/projects/">Projects</a>
      <a href="/work-with-fmb/">Work with FMB</a>
    </nav>
    <nav aria-label="Public resources">
      <strong>Public Resources</strong>
      <a href="/withlovefmb/">With Love, FMB</a>
      <a href="/get-involved/">Get Involved</a>
      <a href="/gethelp/">Get Help</a>
    </nav>
    <nav aria-label="FMB ecosystem links">
      <strong>Ecosystem</strong>
      <a href="/fmbandco/">FMB&amp;CO.</a>
      <a href="https://senzpr.com/">SENZ</a>
      <a href="https://thecognitainstitute.com/">Cognita</a>
      <a href="https://yoni.francinemariebautista.com/">Yoni</a>
      <a href="/mabayani/">Mabayani</a>
    </nav>
  </div>
  <div class="fmb-shell-footer-bottom">
    <span>© 2026 Francine Marie Bautista. All rights reserved.</span>
    <div class="fmb-shell-footer-socials">
      <a href="https://www.instagram.com/bb.fmb/" target="_blank" rel="noopener">Instagram @bb.fmb</a>
      <a href="https://www.facebook.com/BinibiningFrancineMarie" target="_blank" rel="noopener">Facebook</a>
      <a href="mailto:withlovefmb@gmail.com">withlovefmb@gmail.com</a>
    </div>
  </div>
</footer>`;

async function walk(dir) {
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch (error) {
    if (error?.code === 'ENOENT') return out;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

function isRedirect(html) {
  return /http-equiv=(['"])refresh\1/i.test(html)
    || /<meta\b[^>]*(?:name|property)=(['"])robots\1[^>]*content=(['"])[^'"]*noindex/i.test(html);
}

function stripShell(html) {
  return html
    .replace(/<div\b[^>]*class=(['"])[^'"]*\bfmb-shell-rail\b[^'"]*\1[^>]*>[\s\S]*?<\/div>\s*/gi, '')
    .replace(/<header\b[^>]*class=(['"])[^'"]*\bfmb-shell-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>\s*/gi, '')
    .replace(/<footer\b[^>]*class=(['"])[^'"]*\bfmb-shell-footer\b[^'"]*\1[^>]*>[\s\S]*?<\/footer>\s*/gi, '');
}

function ensureHeadAsset(html, needle, tag) {
  if (html.includes(needle)) return html;
  return html.replace('</head>', `${tag}</head>`);
}

function setBodyIdentity(html, relative) {
  const landing = relative === 'news/index.html' || relative === 'fmbnews/index.html';
  const routeClass = landing ? 'fmb-unified-news' : 'fmb-unified-news-article';
  return html.replace(/<body\b([^>]*)>/i, (full, attrs = '') => {
    let next = full;
    if (/\bclass=(['"])/i.test(next)) {
      next = next.replace(/\bclass=(['"])(.*?)\1/i, (_m, q, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add('fmb-unified-public');
        classes.add(routeClass);
        return `class=${q}${[...classes].join(' ')}${q}`;
      });
    } else {
      next = `<body class="fmb-unified-public ${routeClass}"${attrs}>`;
    }
    if (!/\bdata-fmb-page=/.test(next)) next = next.replace(/>$/, ' data-fmb-page="news">');
    return next;
  });
}

let processed = 0;
for (const root of [path.join(dist, 'news'), path.join(dist, 'fmbnews')]) {
  for (const file of await walk(root)) {
    let html = await readFile(file, 'utf8');
    if (isRedirect(html) || !/<body\b/i.test(html)) continue;
    const relative = path.relative(dist, file).replaceAll(path.sep, '/');

    html = stripShell(html);
    html = setBodyIdentity(html, relative);
    html = ensureHeadAsset(html, '/assets/css/fmb-unified-system.css', `<link rel="stylesheet" href="${cssHref}">`);
    html = ensureHeadAsset(html, '/assets/js/fmb-unified-system.js', `<script src="${jsSrc}" defer></script>`);
    html = html.replace(/<body\b[^>]*>/i, match => `${match}${shellHeader}`);
    html = html.replace('</body>', `${shellFooter}</body>`);

    await writeFile(file, html, 'utf8');
    processed += 1;
  }
}

console.log(`Restored the approved unified ecosystem shell to ${processed} active FMB News page(s) after late newsroom rendering.`);
