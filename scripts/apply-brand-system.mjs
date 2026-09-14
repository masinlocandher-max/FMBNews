import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');

const assetVersion = async relative => {
  const bytes = await readFile(path.join(newsRoot, 'assets', relative));
  return createHash('sha256').update(bytes).digest('hex').slice(0, 10);
};
const iaVersion = await assetVersion('css/fmb-news-editorial-ia.css');
const chromeVersion = await assetVersion('css/fmb-news-publication-landing.css');
const matteVersion = await assetVersion('css/fmb-news-matte-system.css');
const homeV2Version = await assetVersion('css/fmb-news-home-v2.css');
const editorialReferenceVersion = await assetVersion('css/fmb-news-editorial-reference-v2.css');
const themeCssVersion = await assetVersion('css/fmb-news-theme.css');
const themeJsVersion = await assetVersion('js/fmb-news-theme.js');
const stylesheetHref = `/assets/css/fmb-news-matte-system.css?v=${matteVersion}`;
const stylesheetTag = `<link rel="stylesheet" href="${stylesheetHref}">`;
const themeStylesheetHref = `/assets/css/fmb-news-theme.css?v=${themeCssVersion}`;
const themeStylesheetTag = `<link rel="stylesheet" href="${themeStylesheetHref}">`;
const themeRuntimeHref = `/assets/js/fmb-news-theme.js?v=${themeJsVersion}`;
const themeRuntimeTag = `<script src="${themeRuntimeHref}" defer></script>`;
const themeBootTag = `<script data-fmb-theme-boot>(()=>{try{let m=localStorage.getItem('fmbThemeModeV1')||'system';if(!['system','light','dark'].includes(m))m='system';const r=m==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;document.documentElement.setAttribute('data-fmb-theme-mode',m);document.documentElement.setAttribute('data-fmb-theme',r)}catch{}})();</script>`;
const homeV2Href = `/assets/css/fmb-news-home-v2.css?v=${homeV2Version}`;
const homeV2Tag = `<link rel="stylesheet" href="${homeV2Href}">`;
const editorialReferenceHref = `/assets/css/fmb-news-editorial-reference-v2.css?v=${editorialReferenceVersion}`;
const editorialReferenceTag = `<link rel="stylesheet" href="${editorialReferenceHref}">`;
const aboutReadabilityHref = '/assets/css/fmb-about-readability-lock.css?v=20260911';
const aboutReadabilityTag = `<link rel="stylesheet" href="${aboutReadabilityHref}">`;
const wordmark = '<span class="fmb-lux-wordmark">FMB NEWS</span>';

async function listHtmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listHtmlFiles(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) out.push(full);
  }
  return out;
}

function addBodyClass(html) {
  return html.replace(/<body\b([^>]*)>/i, (match, attrs) => {
    const classMatch = attrs.match(/\bclass=(['"])([^'"]*)\1/i);
    if (classMatch) {
      const classes = classMatch[2].split(/\s+/).filter(Boolean);
      if (!classes.includes('fmb-matte-system')) classes.push('fmb-matte-system');
      const replacement = `class=${classMatch[1]}${classes.join(' ')}${classMatch[1]}`;
      return `<body${attrs.replace(classMatch[0], replacement)}>`;
    }
    return `<body${attrs} class="fmb-matte-system">`;
  });
}

function ensureBrandAssets(html) {
  if (!html.includes('data-fmb-theme-boot')) html = html.replace(/<head>/i, `<head>${themeBootTag}`);
  if (!html.includes('fmb-news-matte-system.css')) html = html.replace(/<\/head>/i, `${stylesheetTag}</head>`);
  else html = html.replace(/\/assets\/css\/fmb-news-matte-system\.css\?v=[^"']+/i, stylesheetHref);
  if (!html.includes('fmb-news-theme.css')) html = html.replace(/<\/head>/i, `${themeStylesheetTag}</head>`);
  else html = html.replace(/\/assets\/css\/fmb-news-theme\.css\?v=[^"']+/gi, themeStylesheetHref);
  if (!html.includes('fmb-news-theme.js')) html = html.replace(/<\/head>/i, `${themeRuntimeTag}</head>`);
  else html = html.replace(/\/assets\/js\/fmb-news-theme\.js\?v=[^"']+/gi, themeRuntimeHref);
  for (const [name, version] of [['editorial-ia', iaVersion], ['publication-landing', chromeVersion]]) {
    const asset = `/assets/css/fmb-news-${name}.css`;
    html = html.replace(new RegExp(asset.replaceAll('.', '\\.') + '(?:\\?v=[^\"\']+)?', 'g'), `${asset}?v=${version}`);
  }
  return html;
}

function ensureHomeV2(html, relativePath) {
  if (relativePath !== 'index.html') return html;
  if (!html.includes('fmb-news-home-v2.css')) return html.replace(/<\/head>/i, `${homeV2Tag}</head>`);
  return html.replace(/\/assets\/css\/fmb-news-home-v2\.css\?v=[^"']+/gi, homeV2Href);
}

function ensureEditorialReference(html, relativePath) {
  if (relativePath !== 'index.html') return html;
  html = html.replace(/<link\b[^>]*href=["'][^"']*fmb-news-editorial-reference-v2\.css(?:\?[^"']*)?["'][^>]*>/gi, '');
  return html.replace(/<\/head>/i, `${editorialReferenceTag}</head>`);
}

function ensureAboutReadability(html, relativePath) {
  if (relativePath !== 'about/index.html' || html.includes('fmb-about-readability-lock.css')) return html;
  return html.replace(/<\/head>/i, `${aboutReadabilityTag}</head>`);
}

function normalizeHeaderWordmark(header) {
  let replaced = false;
  const normalized = header.replace(/(<a\b[^>]*href=(['"])\/news\/?\2[^>]*>)([\s\S]*?)(<\/a>)/gi, (match, open, quote, inner, close) => {
    if (replaced) return match;
    const brandish = /\bclass=['"][^'"]*(?:brand|logo|masthead|publication|product-wordmark)[^'"]*['"]/i.test(open)
      || /data-fmb-asset=['"]logo['"]/i.test(inner)
      || /<img\b/i.test(inner)
      || /THE NEWSROOM|FMB NEWS/i.test(inner);
    if (!brandish) return match;

    replaced = true;
    let safeOpen = open;
    if (!/\baria-label=/i.test(safeOpen)) safeOpen = safeOpen.replace(/>$/, ' aria-label="FMB News home">');
    if (inner.includes('fmb-editorial-wordmark') || inner.includes('fmb-lux-wordmark')) return match;
    return `${safeOpen}<span class="fmb-legacy-brand" aria-hidden="true">${inner}</span>${wordmark}${close}`;
  });

  if (replaced) return normalized;
  return normalized.replace(/(<img\b[^>]*(?:data-fmb-asset=(['"])logo\2|fmb-news-official-transparent|fmb-master-purple|shell)[^>]*>)/i, '<span class="fmb-legacy-brand" aria-hidden="true">$1</span>' + wordmark);
}

function normalizeHeaders(html) {
  return html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, normalizeHeaderWordmark);
}

function removeLandingHeroImage(html, relativePath) {
  if (relativePath !== 'index.html') return html;
  return html
    .replace(/<img\b[^>]*class=(['"])[^'"]*\bhero-image\b[^'"]*\1[^>]*>/gi, '')
    .replace(/<picture\b[^>]*>[\s\S]*?data-fmb-asset=(['"])hero\1[\s\S]*?<\/picture>/gi, '');
}

function normalizeLandingClock(html, relativePath) {
  if (relativePath !== 'index.html') return html;
  return html.replace(
    /<div class="publication-date-block"><span data-pht-date>Philippine Standard Time<\/span><br><span data-pht-clock>--:--<\/span><\/div>/i,
    '<div class="publication-date-block"><span>Philippine Standard Time</span><br><span class="publication-time-label">Live newsroom clock above</span></div>',
  );
}

const files = await listHtmlFiles(newsRoot);
let changed = 0;
let headersNormalized = 0;

for (const file of files) {
  const relativePath = path.relative(newsRoot, file).replaceAll(path.sep, '/');
  const source = await readFile(file, 'utf8');
  let html = source;

  html = addBodyClass(html);
  html = ensureBrandAssets(html);
  html = ensureAboutReadability(html, relativePath);
  html = ensureHomeV2(html, relativePath);
  html = ensureEditorialReference(html, relativePath);

  const beforeHeaders = html;
  html = normalizeHeaders(html);
  if (html !== beforeHeaders) headersNormalized += 1;

  html = removeLandingHeroImage(html, relativePath);
  html = normalizeLandingClock(html, relativePath);

  if (html !== source) {
    await writeFile(file, html, 'utf8');
    changed += 1;
  }
}

console.log(`Applied canonical FMB News brand system to ${changed}/${files.length} HTML pages; preserved the approved FMB NEWS. editorial landing masthead; kept content-hashed appearance assets; installed the approved editorial reference last on Home; normalized shared mastheads on ${headersNormalized} pages; kept one authoritative PHT clock/process; About readability preserved.`);
