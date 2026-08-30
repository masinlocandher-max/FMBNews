import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const fmbNewsRoot = path.join(distRoot, 'fmbnews');
const artworkRoot = path.join(distRoot, 'assets', 'images', 'news', 'editorial-v5');
const siteOrigin = 'https://www.francinemariebautista.com';

const palettes = {
  Philippines: ['#1d0d2a', '#5f2876', '#b58b35'],
  World: ['#101927', '#284567', '#8ca9ca'],
  Sports: ['#24112c', '#7b306c', '#d5a7cb'],
  Culture: ['#2e1326', '#7d405f', '#d8ae80'],
  Business: ['#111d2d', '#2c587a', '#b58b35'],
  Technology: ['#15162c', '#443d80', '#aaa4e8'],
  Weather: ['#0f2334', '#2d627c', '#a6cfdf'],
  default: ['#1d0d2a', '#4d2161', '#b58b35'],
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function textOnly(value = '') {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTagText(block, tag) {
  const match = block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? textOnly(match[1]) : '';
}

function extractSection(html) {
  const kicker = html.match(/<(?:p|span)\b[^>]*class=(['"])[^'"]*(?:nc-kicker|nc-lead-meta)[^'"]*\1[^>]*>([\s\S]*?)<\/(?:p|span)>/i);
  const value = textOnly(kicker?.[2] || '');
  return value.split(/[·|]/)[0].trim() || 'FMB News';
}

function wrapTitle(title) {
  const words = title.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > 30 && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
    if (lines.length === 2) break;
  }
  if (line && lines.length < 3) lines.push(line);
  const consumed = lines.join(' ').split(/\s+/).length;
  if (consumed < words.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:]?$/, '')}…`;
  }
  return lines.slice(0, 3);
}

function artworkSvg(title, section) {
  const palette = palettes[section] || palettes.default;
  const lines = wrapTitle(title || 'FMB News report');
  const lineMarkup = lines.map((line, index) => `<text x="110" y="${360 + index * 92}" fill="#fff" font-family="Georgia,Times New Roman,serif" font-size="72" font-weight="700">${escapeHtml(line)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-label="Editorial visual for ${escapeHtml(title)}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette[0]}"/><stop offset=".68" stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[0]}"/></linearGradient><radialGradient id="r" cx="82%" cy="18%" r="68%"><stop stop-color="${palette[2]}" stop-opacity=".42"/><stop offset="1" stop-color="${palette[2]}" stop-opacity="0"/></radialGradient></defs><rect width="1600" height="900" fill="url(#g)"/><rect width="1600" height="900" fill="url(#r)"/><path d="M1050 -120L1660 490M1190 -160L1660 310M980 900L1600 280" stroke="#fff" stroke-opacity=".08" stroke-width="2"/><circle cx="1390" cy="150" r="180" fill="none" stroke="#fff" stroke-opacity=".09" stroke-width="2"/><text x="110" y="120" fill="#fff" fill-opacity=".78" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" letter-spacing="7">FMB NEWS</text><text x="110" y="190" fill="${palette[2]}" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" letter-spacing="4">${escapeHtml(section.toUpperCase())}</text><rect x="110" y="240" width="104" height="7" rx="3.5" fill="${palette[2]}"/>${lineMarkup}<text x="110" y="790" fill="#fff" fill-opacity=".72" font-family="Arial,Helvetica,sans-serif" font-size="21" letter-spacing="3">CONTEXT · SOURCES · PUBLIC VALUE</text><rect x="110" y="825" width="1380" height="1" fill="#fff" fill-opacity=".18"/></svg>`;
}

async function createArtwork(slug, title, section) {
  const fileName = `${slug}.svg`;
  await writeFile(path.join(artworkRoot, fileName), artworkSvg(title, section), 'utf8');
  return {
    image: `/assets/images/news/editorial-v5/${fileName}`,
    alt: `FMB News editorial visual for ${title}`,
    credit: 'Original FMB News editorial visual.',
    width: 1600,
    height: 900,
  };
}

function imageTag(media, eager = false) {
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<img src="${escapeHtml(media.image)}" width="${media.width}" height="${media.height}" ${loading} decoding="async" alt="${escapeHtml(media.alt)}">`;
}

function replaceFigure(block, media, eager = false) {
  let next = block.replace(/<img\b[^>]*>/i, imageTag(media, eager));
  if (/<figcaption\b/i.test(next)) {
    next = next.replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/i, `<figcaption>${escapeHtml(media.credit)}</figcaption>`);
  } else {
    next = next.replace(/<\/figure>/i, `<figcaption>${escapeHtml(media.credit)}</figcaption></figure>`);
  }
  next = next.replace(/<figure\b([^>]*)>/i, (match, attrs) => /data-media-kind=/i.test(attrs)
    ? match.replace(/data-media-kind=(['"])[^'"]*\1/i, 'data-media-kind="editorial-art"')
    : `<figure${attrs} data-media-kind="editorial-art">`);
  return next;
}

function normalizeSource(src) {
  return src.startsWith(siteOrigin) ? src.slice(siteOrigin.length) : src;
}

function isRepeatedEditorialCandidate(src) {
  const normalized = normalizeSource(src);
  return normalized.startsWith('/assets/images/news/')
    && normalized.endsWith('.svg')
    && !normalized.includes('/editorial-v5/');
}

function storyMediaBounds(html) {
  const start = html.search(/<section\b[^>]*class=(['"])[^'"]*nc-story-media[^'"]*\1/i);
  if (start < 0) return null;
  const endStart = html.indexOf('</section>', start);
  return endStart < 0 ? null : [start, endStart + 10];
}

function replaceReferences(html, oldSrc, media) {
  const normalizedOld = normalizeSource(oldSrc);
  const absoluteOld = oldSrc.startsWith('http') ? oldSrc : `${siteOrigin}${oldSrc}`;
  const absoluteNew = media.image.startsWith('http') ? media.image : `${siteOrigin}${media.image}`;
  return html
    .replaceAll(absoluteOld, absoluteNew)
    .replaceAll(normalizedOld, media.image);
}

function findArticleBounds(html, slug) {
  let slugIndex = html.indexOf(`/news/${slug}/`);
  while (slugIndex >= 0) {
    const start = html.lastIndexOf('<article', slugIndex);
    const endStart = html.indexOf('</article>', slugIndex);
    const previousEnd = html.lastIndexOf('</article>', slugIndex);
    if (start >= 0 && endStart >= 0 && previousEnd < start) return [start, endStart + 10];
    slugIndex = html.indexOf(`/news/${slug}/`, slugIndex + slug.length + 8);
  }
  return null;
}

function attributeValue(tag, name) {
  const match = tag.match(new RegExp(`${name}=(['"])(.*?)\\1`, 'i'));
  return match?.[2] || '';
}

function updateLandingShareImage(html) {
  const lead = html.match(/<article\b[^>]*class=(['"])[^'"]*nc-lead-broadcast[^'"]*\1[\s\S]*?<\/article>/i)?.[0];
  const imageTagMatch = lead?.match(/<img\b[^>]*>/i)?.[0];
  if (!imageTagMatch) return html;
  const src = attributeValue(imageTagMatch, 'src');
  const width = attributeValue(imageTagMatch, 'width');
  const height = attributeValue(imageTagMatch, 'height');
  const alt = attributeValue(imageTagMatch, 'alt');
  if (!src) return html;
  const absolute = src.startsWith('http') ? src : `${siteOrigin}${src}`;
  return html
    .replace(/<meta\b[^>]*property=(['"])og:image\1[^>]*>/i, `<meta property="og:image" content="${escapeHtml(absolute)}">`)
    .replace(/<meta\b[^>]*property=(['"])og:image:width\1[^>]*>/i, `<meta property="og:image:width" content="${escapeHtml(width || '1600')}">`)
    .replace(/<meta\b[^>]*property=(['"])og:image:height\1[^>]*>/i, `<meta property="og:image:height" content="${escapeHtml(height || '900')}">`)
    .replace(/<meta\b[^>]*property=(['"])og:image:alt\1[^>]*>/i, `<meta property="og:image:alt" content="${escapeHtml(alt || 'The current lead report from FMB News Center')}">`)
    .replace(/<meta\b[^>]*name=(['"])twitter:image\1[^>]*>/i, `<meta name="twitter:image" content="${escapeHtml(absolute)}">`);
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

await mkdir(artworkRoot, { recursive: true });

const records = [];
const usage = new Map();
for (const filePath of await walkHtml(newsRoot)) {
  if (filePath === path.join(newsRoot, 'index.html')) continue;
  const html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(html)) continue;
  const bounds = storyMediaBounds(html);
  if (!bounds) continue;
  const block = html.slice(bounds[0], bounds[1]);
  const src = block.match(/<img\b[^>]*src=(['"])([^'"]+)\1[^>]*>/i)?.[2];
  if (!src) continue;
  const normalized = normalizeSource(src);
  records.push({
    filePath,
    slug: path.basename(path.dirname(filePath)),
    html,
    bounds,
    src,
    normalized,
    title: extractTagText(html, 'h1') || 'FMB News report',
    section: extractSection(html),
  });
  if (isRepeatedEditorialCandidate(src)) usage.set(normalized, (usage.get(normalized) || 0) + 1);
}

const repeated = new Set([...usage.entries()].filter(([, count]) => count > 1).map(([src]) => src));
const mediaBySlug = new Map();
let articleCount = 0;

for (const record of records) {
  if (!repeated.has(record.normalized)) continue;
  const media = await createArtwork(record.slug, record.title, record.section);
  const block = record.html.slice(record.bounds[0], record.bounds[1]);
  let next = `${record.html.slice(0, record.bounds[0])}${replaceFigure(block, media, true)}${record.html.slice(record.bounds[1])}`;
  next = replaceReferences(next, record.src, media);
  await writeFile(record.filePath, next, 'utf8');
  mediaBySlug.set(record.slug, media);
  articleCount += 1;
}

let landingCount = 0;
for (const landingPath of [path.join(newsRoot, 'index.html'), path.join(fmbNewsRoot, 'index.html')]) {
  try {
    let html = await readFile(landingPath, 'utf8');
    for (const [slug, media] of mediaBySlug) {
      const bounds = findArticleBounds(html, slug);
      if (!bounds) continue;
      const block = html.slice(bounds[0], bounds[1]);
      if (!/<img\b/i.test(block)) continue;
      html = `${html.slice(0, bounds[0])}${replaceFigure(block, media, false)}${html.slice(bounds[1])}`;
      landingCount += 1;
    }
    html = updateLandingShareImage(html);
    await writeFile(landingPath, html, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

console.log(`FMB News Editorial V5 polish replaced ${articleCount} repeated branch graphic(s), refreshed ${landingCount} landing card(s), and aligned the landing share image with the lead report.`);
