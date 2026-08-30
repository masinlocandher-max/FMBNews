import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const landingPaths = [
  path.join(distRoot, 'news', 'index.html'),
  path.join(distRoot, 'fmbnews', 'index.html'),
];
const siteOrigin = 'https://www.francinemariebautista.com';

async function walkHtml(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walkHtml(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

function readAttribute(tag, attribute) {
  const pattern = new RegExp(`\\b${attribute}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i');
  return tag.match(pattern)?.[2] ?? '';
}

function decodeEntities(value = '') {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function stripTags(value = '') {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getMeta(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const name = readAttribute(tag, 'property') || readAttribute(tag, 'name');
    if (name.toLowerCase() === key.toLowerCase()) return decodeEntities(readAttribute(tag, 'content'));
  }
  return '';
}

function getCanonical(html, filePath) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (readAttribute(tag, 'rel').toLowerCase() === 'canonical') {
      const href = readAttribute(tag, 'href');
      if (href) return href;
    }
  }
  const relative = path.relative(distRoot, path.dirname(filePath)).split(path.sep).join('/');
  return `${siteOrigin}/${relative}/`;
}

function normalizeNewsPath(value) {
  try {
    const pathname = new URL(value, siteOrigin).pathname.replace(/\/{2,}/g, '/');
    if (!pathname.startsWith('/news/') || pathname === '/news/') return '';
    return pathname.endsWith('/') ? pathname : `${pathname}/`;
  } catch {
    return '';
  }
}

function extractFirstImage(html) {
  const mediaBlock = html.match(/<(?:figure|picture)\b[^>]*(?:nc-story-media|news-visual)[^>]*>[\s\S]*?<\/\s*(?:figure|picture)>/i)?.[0] ?? html;
  const tag = mediaBlock.match(/<img\b[^>]*>/i)?.[0] ?? '';
  return {
    src: readAttribute(tag, 'src'),
    alt: decodeEntities(readAttribute(tag, 'alt')),
    width: readAttribute(tag, 'width'),
    height: readAttribute(tag, 'height'),
  };
}

function extractTextByClass(html, className) {
  const pattern = new RegExp(`<([a-z0-9]+)\\b[^>]*class=(["'])[^"']*\\b${className}\\b[^"']*\\2[^>]*>([\\s\\S]*?)<\\/\\1>`, 'i');
  return stripTags(html.match(pattern)?.[3] ?? '');
}

function categorySlug(label = '') {
  const value = label.toLowerCase();
  if (/money|market|business|econom|finance|tax|energy/.test(value)) return 'money';
  if (/tech|digital|artificial intelligence|ai\b|innovation/.test(value)) return 'tech';
  if (/health|wellness|medicine|medical/.test(value)) return 'health';
  if (/environment|climate|weather|wildfire|storm|habagat/.test(value)) return 'environment';
  if (/politic|government|governance|policy|senate|congress|west philippine sea/.test(value)) return 'politics';
  if (/culture|pageant|identity|faith|tourism|arts|entertainment/.test(value)) return 'culture';
  return 'lifestyle';
}

function extractArticle(html, filePath) {
  if (!/\bnews-story-route\b/i.test(html)) return null;

  const canonical = getCanonical(html, filePath);
  const route = normalizeNewsPath(canonical);
  if (!route) return null;

  const firstImage = extractFirstImage(html);
  const title = getMeta(html, 'og:title')
    || stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '')
    || stripTags(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const description = getMeta(html, 'og:description')
    || extractTextByClass(html, 'nc-article-deck')
    || 'Read the complete FMB News report.';
  const image = getMeta(html, 'og:image') || firstImage.src;
  const imageAlt = getMeta(html, 'og:image:alt') || firstImage.alt || `Editorial image for ${title}`;
  const imageWidth = getMeta(html, 'og:image:width') || firstImage.width;
  const imageHeight = getMeta(html, 'og:image:height') || firstImage.height;
  const label = extractTextByClass(html, 'nc-kicker')
    || extractTextByClass(html, 'nc-signal-tag')
    || 'FMB News report';
  const pageText = stripTags(html);
  const readTime = pageText.match(/\b\d+\s*min(?:ute)?s?\s*read\b/i)?.[0] ?? 'Read report';
  const published = getMeta(html, 'article:published_time') || getMeta(html, 'datePublished');

  if (!title || !image) {
    throw new Error(`Published FMB News article is missing required title or image: ${filePath}`);
  }

  return {
    canonical: `${siteOrigin}${route}`,
    route,
    title: title.replace(/\s*[|·-]\s*FMB News.*$/i, '').trim(),
    description,
    image,
    imageAlt,
    imageWidth,
    imageHeight,
    label,
    readTime,
    published,
    category: categorySlug(`${label} ${title}`),
  };
}

function imageDimensions(article) {
  const width = /^\d+$/.test(article.imageWidth) ? ` width="${article.imageWidth}"` : '';
  const height = /^\d+$/.test(article.imageHeight) ? ` height="${article.imageHeight}"` : '';
  return `${width}${height}`;
}

function archiveCard(article) {
  return `<article class="nc-rundown-story fn9-report-card fn11-preserved-report" data-category="${article.category}" data-fn9-searchable data-preserved-news-route="${escapeHtml(article.route)}"><a href="${escapeHtml(article.route)}"><span class="nc-rundown-number">ARCHIVE</span><figure class="news-visual" data-media-kind="photo"><img src="${escapeHtml(article.image)}"${imageDimensions(article)} loading="lazy" decoding="async" alt="${escapeHtml(article.imageAlt)}"><figcaption>Photo and source details appear in the complete report.</figcaption></figure><div><p>${escapeHtml(article.label)}</p><h3>${escapeHtml(article.title)}</h3><span>${escapeHtml(article.readTime)}</span></div></a></article>`;
}

function collectNewsLinks(html) {
  const routes = new Set();
  for (const match of html.matchAll(/<a\b[^>]*href=(["'])([^"']+)\1[^>]*>/gi)) {
    const route = normalizeNewsPath(match[2]);
    if (route) routes.add(route);
  }
  return routes;
}

function findMatchingDivClose(html, openIndex) {
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = openIndex;
  let depth = 0;
  let match;
  while ((match = tags.exec(html))) {
    if (/^<\/div/i.test(match[0])) depth -= 1;
    else depth += 1;
    if (depth === 0) return match.index;
  }
  return -1;
}

function injectMissingCards(html, cards) {
  if (!cards.length) return html;
  const markerIndex = html.search(/<div\b[^>]*class=(["'])[^"']*\bfn9-more-reports\b[^"']*\1[^>]*>/i);
  if (markerIndex < 0) throw new Error('FMB News complete archive container is missing.');
  const closingIndex = findMatchingDivClose(html, markerIndex);
  if (closingIndex < 0) throw new Error('FMB News complete archive container is malformed.');
  return `${html.slice(0, closingIndex)}${cards.join('')}${html.slice(closingIndex)}`;
}

function completeIndexSchema(articles) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${siteOrigin}/fmbnews/#complete-published-archive`,
    name: 'Complete FMB News published archive',
    numberOfItems: articles.length,
    itemListElement: articles.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: article.canonical,
      name: article.title,
    })),
  };
  return `<script type="application/ld+json" data-fmb-news-complete-archive>${JSON.stringify(payload).replace(/</g, '\\u003c')}</script>`;
}

function injectCompleteSchema(html, articles) {
  const script = completeIndexSchema(articles);
  return html
    .replace(/<script\b[^>]*data-fmb-news-complete-archive[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<\/head>/i, `${script}</head>`);
}

function updateArchiveButton(html, count) {
  return html.replace(/(<button\b[^>]*data-fn9-view-all[^>]*>)[\s\S]*?(<\/button>)/i, `$1View all ${count} published reports →$2`);
}

const articleFiles = (await walkHtml(newsRoot)).filter((filePath) => filePath !== path.join(newsRoot, 'index.html'));
const articles = [];
for (const filePath of articleFiles) {
  const html = await readFile(filePath, 'utf8');
  const article = extractArticle(html, filePath);
  if (article) articles.push(article);
}

const uniqueByRoute = new Map();
for (const article of articles) uniqueByRoute.set(article.route, article);
const publishedArticles = [...uniqueByRoute.values()].sort((left, right) => {
  const leftTime = Date.parse(left.published || '') || 0;
  const rightTime = Date.parse(right.published || '') || 0;
  return rightTime - leftTime || left.route.localeCompare(right.route);
});

if (!publishedArticles.length) throw new Error('No published FMB News article routes were found.');

for (const landingPath of landingPaths) {
  let html = await readFile(landingPath, 'utf8');
  const existingRoutes = collectNewsLinks(html);
  const missing = publishedArticles.filter((article) => !existingRoutes.has(article.route));
  html = injectMissingCards(html, missing.map(archiveCard));
  html = injectCompleteSchema(html, publishedArticles);
  html = updateArchiveButton(html, publishedArticles.length);

  const restoredRoutes = collectNewsLinks(html);
  const stillMissing = publishedArticles.filter((article) => !restoredRoutes.has(article.route));
  if (stillMissing.length) {
    throw new Error(`FMB News archive is missing ${stillMissing.length} published route(s): ${stillMissing.map(({ route }) => route).join(', ')}`);
  }
  if ((html.match(/data-preserved-news-route=/g) ?? []).length !== missing.length) {
    throw new Error(`FMB News archive restoration count mismatch in ${landingPath}.`);
  }

  await writeFile(landingPath, html, 'utf8');
}

console.log(`Preserved ${publishedArticles.length} published FMB News article route(s) in both landing archives; restored any previously omitted stories and installed a no-deletion build gate.`);
