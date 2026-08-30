import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const sourceNewsRoot = path.join(root, 'apps', 'withlovefmb', 'news');
const socialRoot = path.join(dist, 'assets', 'images', 'news', 'social');
const heroRoot = path.join(dist, 'assets', 'images', 'news', 'brief');
const origin = 'https://www.francinemariebautista.com';
const fallbackImage = '/assets/images/news/fmb-news-editorial-fallback.svg';
const identityCss = '<link rel="stylesheet" href="/assets/css/fmb-news-identity-lockup.css?v=20260820">';

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}=(['"])(.*?)\\1`, 'i'))?.[2] || '';

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

function metaValue(html, key, value) {
  const tag = html.match(new RegExp(`<meta\\b(?=[^>]*\\b${key}=(['"])${value}\\1)[^>]*>`, 'i'))?.[0] || '';
  return attr(tag, 'content');
}

function replaceMeta(html, key, value, content) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${key}=(['"])${value}\\1)[^>]*>`, 'i');
  const tag = html.match(pattern)?.[0];
  if (!tag) return html.replace('</head>', `<meta ${key}="${value}" content="${content}"></head>`);
  const updated = /\bcontent=(['"])/i.test(tag)
    ? tag.replace(/\bcontent=(['"])[\s\S]*?\1/i, `content="${content}"`)
    : tag.replace(/>$/, ` content="${content}">`);
  return html.replace(tag, updated);
}

async function sourceBuffer(src) {
  if (!src) return null;
  try {
    if (src.startsWith('/')) return await readFile(path.join(dist, src.slice(1)));
    if (src.startsWith(origin)) return await readFile(path.join(dist, new URL(src).pathname.slice(1)));
    const response = await fetch(src, { redirect:'follow', headers:{ 'user-agent':'FMBNewsBuild/1.0 (+https://www.francinemariebautista.com/news/about/)' } });
    if (!response.ok) {
      console.warn(`FMB Brief social source unavailable: ${src} (HTTP ${response.status}); trying a local recovery source.`);
      return null;
    }
    const type = response.headers.get('content-type') || '';
    if (!type.startsWith('image/')) {
      console.warn(`FMB Brief social source did not resolve to an image: ${src} (${type || 'unknown type'}); trying a local recovery source.`);
      return null;
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.warn(`FMB Brief social source could not be read: ${src} (${error.message}); trying a local recovery source.`);
    return null;
  }
}

async function recoverSourceBuffer(candidates) {
  const seen = new Set();
  for (const src of candidates) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const buffer = await sourceBuffer(src);
    if (buffer?.length) return { buffer, src };
  }
  throw new Error(`FMB Brief social image could not be recovered from any approved source: ${[...seen].join(', ')}`);
}

async function cropSocial(buffer, output) {
  const image = sharp(buffer).rotate();
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error(`Cannot read FMB Brief hero dimensions for ${output}`);
  await sharp(buffer)
    .rotate()
    .resize(1200, 630, { fit:'cover', position:'centre' })
    .webp({ quality:88, effort:5 })
    .toFile(output);
  return { sourceWidth:meta.width, sourceHeight:meta.height };
}

async function localHero(buffer, output) {
  await mkdir(path.dirname(output), { recursive:true });
  await sharp(buffer).rotate().resize({ width:1600, withoutEnlargement:true }).webp({ quality:90, effort:5 }).toFile(output);
}

function sourceHeroData(html) {
  const figure = html.match(/<figure\b[^>]*class=(['"])[^'"]*\bbrief-hero\b[^'"]*\1[^>]*>[\s\S]*?<\/figure>/i)?.[0] || '';
  const image = figure.match(/<img\b[^>]*>/i)?.[0] || html.match(/<img\b[^>]*>/i)?.[0] || '';
  return {
    src: attr(image, 'src') || metaValue(html, 'property', 'og:image'),
    alt: attr(image, 'alt') || metaValue(html, 'property', 'og:image:alt') || 'FMB Brief editorial image',
  };
}

function restoreHero(html, heroUrl, alt) {
  const figureOpen = html.match(/<figure\b[^>]*class=(['"])[^'"]*\bbrief-hero\b[^'"]*\1[^>]*>/i)?.[0] || '';
  if (!figureOpen) throw new Error('FMB Brief hero figure is missing from rendered edition');
  const figureStart = html.indexOf(figureOpen);
  const figureEnd = html.indexOf('</figure>', figureStart);
  if (figureEnd < 0) throw new Error('FMB Brief hero figure is malformed');
  const figure = html.slice(figureStart, figureEnd + 9);
  const imageTag = `<img src="${heroUrl}" alt="${String(alt).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}" fetchpriority="high">`;
  const restored = /<img\b/i.test(figure)
    ? figure.replace(/<img\b[^>]*>/i, imageTag)
    : figure.replace(figureOpen, `${figureOpen}${imageTag}`);
  return html.slice(0, figureStart) + restored + html.slice(figureEnd + 9);
}

await mkdir(socialRoot, { recursive:true });
await mkdir(heroRoot, { recursive:true });
const entries = await readdir(newsRoot, { withFileTypes:true });
const generated = [];
const restored = [];
for (const entry of entries) {
  if (!entry.isDirectory() || !/^fmb-brief-(?:august|september|october|november|december|january|february|march|april|may|june|july)-\d{1,2}-\d{4}$/i.test(entry.name)) continue;
  const file = path.join(newsRoot, entry.name, 'index.html');
  const sourceFile = path.join(sourceNewsRoot, entry.name, 'index.html');
  let sourceHtml = '';
  if (await exists(sourceFile)) sourceHtml = await readFile(sourceFile, 'utf8');

  let html = await readFile(file, 'utf8');
  const renderedPublished = metaValue(html, 'property', 'article:published_time');
  const renderedUnavailable = /http-equiv=(['"])refresh\1/i.test(html) || /\bnoindex\b/i.test(metaValue(html, 'name', 'robots')) || !renderedPublished;
  if (renderedUnavailable && sourceHtml) {
    html = sourceHtml;
    restored.push(entry.name);
  }
  if (!html.includes('fmb-news-identity-lockup.css')) html = html.replace('</head>', `${identityCss}</head>`);

  const published = metaValue(html, 'property', 'article:published_time');
  if (!published || Number.isNaN(new Date(published).getTime())) continue;
  const date = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(published));
  const currentOg = metaValue(html, 'property', 'og:image');
  const socialUrl = `/assets/images/news/social/fmb-brief-${date}-1200x630.webp`;
  const localHeroUrl = `/assets/images/news/brief/fmb-brief-${date}-hero.webp`;
  if (currentOg.endsWith(socialUrl) && /<figure\b[^>]*class=(['"])[^'"]*\bbrief-hero\b[^'"]*\1[^>]*>[\s\S]*?<img\b/i.test(html)) {
    await writeFile(file, html, 'utf8');
    continue;
  }

  const renderedHero = sourceHeroData(html);
  const sourceHero = sourceHtml ? sourceHeroData(sourceHtml) : { src:'', alt:'' };
  const heroSrc = renderedHero.src || currentOg || sourceHero.src;
  const heroAlt = renderedHero.alt || sourceHero.alt || 'FMB Brief editorial image';
  if (!heroSrc) throw new Error(`${entry.name}: FMB Brief has no recoverable hero image`);

  // The safe finalizer normally creates this local 1200×630 crop first. Prefer
  // it when available so transient publisher/CDN rate limits cannot abort the
  // entire release. The original hero remains the first remote recovery source
  // when no local crop exists, and the newsroom-owned fallback is last resort.
  const candidates = [];
  if (await exists(path.join(dist, socialUrl.slice(1)))) candidates.push(socialUrl);
  candidates.push(heroSrc, currentOg, sourceHero.src, fallbackImage);
  const recovered = await recoverSourceBuffer(candidates);
  const buffer = recovered.buffer;
  const output = path.join(dist, socialUrl.slice(1));
  const dimensions = await cropSocial(buffer, output);
  await localHero(buffer, path.join(dist, localHeroUrl.slice(1)));
  html = restoreHero(html, localHeroUrl, heroAlt);

  const absolute = `${origin}${socialUrl}`;
  html = replaceMeta(html, 'property', 'og:image', absolute);
  html = replaceMeta(html, 'property', 'og:image:width', '1200');
  html = replaceMeta(html, 'property', 'og:image:height', '630');
  html = replaceMeta(html, 'property', 'og:image:alt', heroAlt);
  html = replaceMeta(html, 'name', 'twitter:image', absolute);
  html = replaceMeta(html, 'name', 'twitter:card', 'summary_large_image');
  await writeFile(file, html, 'utf8');
  generated.push({ date, route:`/news/${entry.name}/`, sourceImage:heroSrc, recoveredFrom:recovered.src, localHeroUrl, socialUrl, ...dimensions });
}

const archiveFile = path.join(newsRoot, 'fmb-brief', 'index.html');
let archive = await readFile(archiveFile, 'utf8');
for (const item of generated) {
  const route = item.route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const rowPattern = new RegExp(`(<a\\b[^>]*href=["']${route}["'][^>]*>[\\s\\S]*?<img\\b[^>]*src=)(['"])[^'"]*\\2`, 'i');
  archive = archive.replace(rowPattern, `$1"${item.socialUrl}"`);
}
await writeFile(archiveFile, archive, 'utf8');

const manifestFile = path.join(newsRoot, 'social-image-manifest.json');
let manifest = {};
try { manifest = JSON.parse(await readFile(manifestFile,'utf8')); } catch {}
manifest.existingBriefs = generated;
manifest.restoredAuthoredBriefs = restored;
await writeFile(manifestFile, JSON.stringify(manifest,null,2), 'utf8');
console.log(`Restored ${restored.length} authored FMB Brief route(s) and generated ${generated.length} dedicated 1200×630 social crop(s).`);
