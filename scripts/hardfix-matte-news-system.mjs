import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const stylesheetHref = '/assets/css/fmb-news-matte-system.css?v=20260911';
const stylesheetTag = `<link rel="stylesheet" href="${stylesheetHref}">`;
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

function ensureStylesheet(html) {
  if (html.includes('fmb-news-matte-system.css')) return html;
  return html.replace(/<\/head>/i, `${stylesheetTag}</head>`);
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
    if (!/\baria-label=/i.test(safeOpen)) {
      safeOpen = safeOpen.replace(/>$/, ' aria-label="FMB News home">');
    }

    // Keep legacy identity markup in the DOM for accessibility/product QA and
    // hide it visually via CSS. The visible treatment is always plain FMB NEWS.
    if (inner.includes('fmb-lux-wordmark')) return match;
    return `${safeOpen}<span class="fmb-legacy-brand" aria-hidden="true">${inner}</span>${wordmark}${close}`;
  });

  if (replaced) return normalized;

  // Legacy fallback: retain the original image node but make it visually hidden,
  // then add the new wordmark. This avoids deleting metadata/QA signals.
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

const files = await listHtmlFiles(newsRoot);
let changed = 0;
let headersNormalized = 0;

for (const file of files) {
  const relativePath = path.relative(newsRoot, file).replaceAll(path.sep, '/');
  const source = await readFile(file, 'utf8');
  let html = source;

  html = addBodyClass(html);
  html = ensureStylesheet(html);
  html = ensureAboutReadability(html, relativePath);

  const beforeHeaders = html;
  html = normalizeHeaders(html);
  if (html !== beforeHeaders) headersNormalized += 1;

  html = removeLandingHeroImage(html, relativePath);

  if (html !== source) {
    await writeFile(file, html, 'utf8');
    changed += 1;
  }
}

console.log(`Applied FMB News matte system to ${changed}/${files.length} HTML pages; normalized mastheads on ${headersNormalized} pages; hero imagery visually removed while ticker/live overlays remain; About gets a dedicated readability lock.`);
