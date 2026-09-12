import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const stylesheetHref = '/assets/css/fmb-news-matte-system.css?v=20260912';
const stylesheetTag = `<link rel="stylesheet" href="${stylesheetHref}">`;
const themeStylesheetHref = '/assets/css/fmb-news-theme.css?v=20260912-v3';
const themeStylesheetTag = `<link rel="stylesheet" href="${themeStylesheetHref}">`;
const refreshStylesheetHref = '/assets/css/fmb-news-editorial-refresh.css?v=20260912-v3';
const refreshStylesheetTag = `<link rel="stylesheet" href="${refreshStylesheetHref}">`;
const themeRuntimeTag = '<script src="/assets/js/fmb-news-theme.js?v=20260912-v3" defer></script>';
const themeBootTag = `<script data-fmb-theme-boot>(()=>{try{let m=localStorage.getItem('fmbThemeModeV1')||'system';if(!['system','light','dark'].includes(m))m='system';const r=m==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;document.documentElement.setAttribute('data-fmb-theme-mode',m);document.documentElement.setAttribute('data-fmb-theme',r)}catch{}})();</script>`;
const aboutReadabilityHref = '/assets/css/fmb-about-readability-lock.css?v=20260911';
const aboutReadabilityTag = `<link rel="stylesheet" href="${aboutReadabilityHref}">`;
const wordmark = '<span class="fmb-lux-wordmark">FMB NEWS<span class="fmb-brand-period">.</span></span><span class="fmb-brand-descriptor">FILIPINO MEDIA BULLETIN</span>';

const homepageFounder = `<section class="about-fmb-home" aria-labelledby="about-fmb-home-title">
  <div class="about-fmb-home-inner">
    <div class="about-fmb-portrait" role="img" aria-label="Founder portrait placeholder for Francine Marie Bautista">
      <div class="about-fmb-portrait-mark"><strong>FMB<span class="fmb-brand-period">.</span></strong><span>Founder Portrait</span></div>
    </div>
    <div class="about-fmb-copy">
      <div class="about-fmb-kicker">About FMB</div>
      <h2 id="about-fmb-home-title">Francine Marie Bautista</h2>
      <p class="about-fmb-role">Founder, FMB News</p>
      <p>FMB News was founded by Francine Marie Bautista, a creative director, strategist, communications practitioner and storyteller whose work focuses on clarity, visibility, culture and public understanding.</p>
      <p>FMB News was built around a simple editorial purpose: present verified information, meaningful context and clear explanations that help people understand not only what happened, but why it matters.</p>
      <div class="about-fmb-framework" aria-label="FMB editorial framework"><span>What happened?</span><span>What is the context?</span><span>Why does it matter?</span><span>What should we watch next?</span></div>
      <a class="about-fmb-link" href="/news/about/">Read About FMB <span aria-hidden="true">→</span></a>
    </div>
  </div>
</section>`;

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
  else html = html.replace(/\/assets\/css\/fmb-news-theme\.css\?v=[^"']+/i, themeStylesheetHref);
  if (!html.includes('fmb-news-editorial-refresh.css')) html = html.replace(/<\/head>/i, `${refreshStylesheetTag}</head>`);
  else html = html.replace(/\/assets\/css\/fmb-news-editorial-refresh\.css\?v=[^"']+/i, refreshStylesheetHref);
  if (!html.includes('fmb-news-theme.js')) html = html.replace(/<\/head>/i, `${themeRuntimeTag}</head>`);
  else html = html.replace(/\/assets\/js\/fmb-news-theme\.js\?v=[^"']+/i, '/assets/js/fmb-news-theme.js?v=20260912-v3');
  return html;
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
      || /THE NEWSROOM|FMB NEWS|FILIPINO MEDIA BULLETIN/i.test(inner);
    if (!brandish) return match;

    replaced = true;
    let safeOpen = open;
    if (!/\baria-label=/i.test(safeOpen)) safeOpen = safeOpen.replace(/>$/, ' aria-label="FMB News home">');
    if (inner.includes('fmb-brand-period') && inner.includes('fmb-brand-descriptor')) return match;
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

function normalizeHomepage(html, relativePath) {
  if (relativePath !== 'index.html') return html;
  let out = html;
  out = out.replace(/(<strong>)HEADLINES(<\/strong>)/gi, '$1LATEST$2');
  out = out.replace(/(<div class="ticker-label">[\s\S]*?)(HEADLINES)([\s\S]*?<\/div>)/i, '$1LATEST$3');
  if (!out.includes('about-fmb-home')) {
    if (/<footer\b/i.test(out)) out = out.replace(/<footer\b/i, `${homepageFounder}<footer`);
    else out = out.replace('</body>', `${homepageFounder}</body>`);
  }
  return out;
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

  const beforeHeaders = html;
  html = normalizeHeaders(html);
  if (html !== beforeHeaders) headersNormalized += 1;

  html = removeLandingHeroImage(html, relativePath);
  html = normalizeHomepage(html, relativePath);

  if (html !== source) {
    await writeFile(file, html, 'utf8');
    changed += 1;
  }
}

console.log(`Applied FMB News ivory/ink/crimson editorial brand system to ${changed}/${files.length} HTML pages; normalized mastheads on ${headersNormalized} pages; preserved System/Light/Dark appearance; added homepage founder provenance without fabricating a portrait.`);