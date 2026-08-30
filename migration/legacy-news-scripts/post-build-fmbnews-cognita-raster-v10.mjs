import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const sourceSvgPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'images', 'news', 'cognita-filipino-centered-education.svg');
const portraitPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'images', 'fmb-approved', 'francine-portrait-front.webp');
const outputDirectory = path.join(distRoot, 'assets', 'images', 'news');
const outputPath = path.join(outputDirectory, 'cognita-filipino-centered-education.png');
const publicPath = '/assets/images/news/cognita-filipino-centered-education.png';
const absolutePath = `https://www.francinemariebautista.com${publicPath}`;
const slug = 'filipino-centered-training-institution-cognita-vision';
const width = 1536;
const height = 864;
const alt = 'Cognita Institute of AI Filipino-centered education with Francine Marie Bautista';
const caption = 'Official Cognita Institute of AI feature artwork using the approved FMB portrait.';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function upsertMeta(html, key, value, attr = 'property') {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(value)}">`;
  const first = new RegExp(`<meta\\b[^>]*${attr}=(['"])${escaped}\\1[^>]*>`, 'i');
  const second = new RegExp(`<meta\\b[^>]*content=(['"])[^'"]*\\1[^>]*${attr}=(['"])${escaped}\\2[^>]*>`, 'i');
  if (first.test(html)) return html.replace(first, tag);
  if (second.test(html)) return html.replace(second, tag);
  return html.replace(/<\/head>/i, `${tag}</head>`);
}

function officialFigure(className = 'nc-story-media') {
  return `<section class="${className}" aria-label="Article image"><div class="wrap"><figure class="news-visual"><img src="${publicPath}" width="${width}" height="${height}" fetchpriority="high" decoding="async" sizes="(max-width: 660px) calc(100vw - 32px), 1200px" alt="${escapeHtml(alt)}"><figcaption>${escapeHtml(caption)}</figcaption></figure></div></section>`;
}

function replaceArticleMedia(html) {
  const mediaPattern = /<section\b[^>]*class=(['"])[^'"]*\bnc-story-media\b[^'"]*\1[^>]*>[\s\S]*?<\/section>/i;
  const fallbackPattern = /<section\b[^>]*class=(['"])[^'"]*\bfn10-article-media\b[^'"]*\1[^>]*>[\s\S]*?<\/section>/i;
  if (mediaPattern.test(html)) return html.replace(mediaPattern, officialFigure('nc-story-media'));
  if (fallbackPattern.test(html)) return html.replace(fallbackPattern, officialFigure('fn10-article-media'));
  return html.replace(/<main\b[^>]*>/i, (main) => `${main}${officialFigure('fn10-article-media')}`);
}

function alignMetadata(html) {
  const entries = [
    ['og:image', absolutePath, 'property'],
    ['og:image:secure_url', absolutePath, 'property'],
    ['og:image:type', 'image/png', 'property'],
    ['og:image:width', String(width), 'property'],
    ['og:image:height', String(height), 'property'],
    ['og:image:alt', alt, 'property'],
    ['twitter:card', 'summary_large_image', 'name'],
    ['twitter:image', absolutePath, 'name'],
    ['twitter:image:alt', alt, 'name'],
  ];
  let next = html;
  for (const [key, value, attr] of entries) next = upsertMeta(next, key, value, attr);
  return next;
}

function replaceLandingCard(html) {
  const articlePattern = /<article\b[^>]*>[\s\S]*?<\/article>/gi;
  const image = `<img src="${publicPath}" width="${width}" height="${height}" loading="lazy" decoding="async" sizes="(max-width: 660px) 50vw, 33vw" alt="${escapeHtml(alt)}">`;
  let changed = false;
  const next = html.replace(articlePattern, (article) => {
    if (!new RegExp(`(?:https://www\\.francinemariebautista\\.com)?/(?:news|fmbnews)/${slug}/`, 'i').test(article)) return article;
    let updated = article;
    if (/<img\b[^>]*>/i.test(updated)) updated = updated.replace(/<img\b[^>]*>/i, image);
    else updated = updated.replace(/<figure\b([^>]*)>/i, `<figure$1>${image}`);
    updated = updated.replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/i, `<figcaption>${escapeHtml(caption)}</figcaption>`);
    changed ||= updated !== article;
    return updated;
  });
  return { html: next, changed };
}

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

const [svgSource, portrait] = await Promise.all([
  readFile(sourceSvgPath, 'utf8'),
  readFile(portraitPath),
]);
const embeddedPortrait = `data:image/webp;base64,${portrait.toString('base64')}`;
const embeddedSvg = svgSource.replace('/assets/images/fmb-approved/francine-portrait-front.webp', embeddedPortrait);
if (embeddedSvg === svgSource) throw new Error('Official Cognita SVG portrait reference could not be embedded.');

await mkdir(outputDirectory, { recursive: true });
const result = await sharp(Buffer.from(embeddedSvg))
  .resize(width, height, { fit: 'fill' })
  .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
  .toFile(outputPath);

if (result.width !== width || result.height !== height || result.format !== 'png') {
  throw new Error(`Official Cognita social image rendered incorrectly: ${result.width}x${result.height} ${result.format}`);
}

const files = [...new Set((await Promise.all([
  walkHtml(path.join(distRoot, 'news')),
  walkHtml(path.join(distRoot, 'fmbnews')),
])).flat())];
let articleCount = 0;
let landingCount = 0;

for (const filePath of files) {
  let html = await readFile(filePath, 'utf8');
  const relative = path.relative(distRoot, filePath).replaceAll('\\', '/');
  const isArticle = relative === `news/${slug}/index.html` || relative === `fmbnews/${slug}/index.html`;
  const isLanding = relative === 'news/index.html' || relative === 'fmbnews/index.html';
  if (!isArticle && !isLanding) continue;

  if (isArticle) {
    html = replaceArticleMedia(html);
    html = alignMetadata(html);
    const required = [publicPath, `width="${width}"`, `height="${height}"`, 'og:image:width" content="1536"', 'og:image:height" content="864"', 'twitter:image'];
    for (const marker of required) {
      if (!html.includes(marker)) throw new Error(`Official Cognita raster marker ${marker} missing: ${filePath}`);
    }
    articleCount += 1;
  }

  if (isLanding) {
    const updated = replaceLandingCard(html);
    html = updated.html;
    if (updated.changed) landingCount += 1;
  }

  await writeFile(filePath, html, 'utf8');
}

if (articleCount < 1) {
  throw new Error(`Official Cognita raster pass did not find the generated article route.`);
}

console.log(`Rendered the exact official Cognita artwork and approved portrait as a ${width}×${height} social-ready PNG, synchronized ${articleCount} generated article route(s), and updated ${landingCount} visible landing card(s).`);
