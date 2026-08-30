import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve(new URL('../dist/', import.meta.url).pathname);
const newsRoot = path.join(dist, 'news');
const morningRoot = path.join(newsRoot, 'morning-special');
const origin = 'https://www.francinemariebautista.com';
const fatal = (message) => { throw new Error(`FMB News clean publication audit: ${message}`); };
const count = (html, token) => (html.match(new RegExp(token, 'g')) || []).length;
const genericVisual = /(?:newsroom-editorial-fallback|fmb-news-(?:primary-logo|white-transparent|official)|(?:^|[-_/])(?:logo|wordmark|masthead)(?:[-_.?/]|$))/i;

function imageSources(html) {
  const out = [];
  for (const match of String(html || '').matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    const tag = match[0];
    for (const name of ['src', 'srcset']) {
      const value = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))?.[2] || '';
      for (const candidate of value.split(',').map((part) => part.trim().split(/\s+/)[0]).filter(Boolean)) out.push(candidate);
    }
  }
  return out;
}

function localEditorialImage(value) {
  try {
    const parsed = new URL(value, origin);
    return parsed.origin === origin && parsed.pathname.startsWith('/assets/') && !genericVisual.test(parsed.pathname);
  } catch { return false; }
}

function genuineAttachedImage(html) {
  return imageSources(html).some(localEditorialImage);
}

async function assertLocalImagesExist(html, name) {
  for (const value of imageSources(html)) {
    let parsed;
    try { parsed = new URL(value, origin); } catch { continue; }
    if (parsed.origin !== origin || !parsed.pathname.startsWith('/assets/')) continue;
    if (genericVisual.test(parsed.pathname)) fatal(`${name} exposes generic editorial artwork: ${parsed.pathname}`);
    try { await access(path.join(dist, parsed.pathname.replace(/^\/+/, ''))); }
    catch { fatal(`${name} references a missing image file: ${parsed.pathname}`); }
  }
}

const canonicalLanding = await readFile(path.join(newsRoot, 'index.html'), 'utf8');
const aliasLanding = await readFile(path.join(dist, 'fmbnews', 'index.html'), 'utf8');
const archive = await readFile(path.join(morningRoot, 'index.html'), 'utf8');

for (const [html, name] of [[canonicalLanding, 'news/index.html'], [aliasLanding, 'fmbnews/index.html']]) {
  if (!html.includes('fmb-news-clean') || !html.includes('fmb-news-landing')) fatal(`${name} is not using the clean newsroom system`);
  if (!html.includes('/news/morning-special/') || !html.includes('/news/archive/') || !html.includes('/news/about/')) fatal(`${name} is missing newsroom navigation`);
  if (!genuineAttachedImage(html)) fatal(`${name} exposes no genuine image-backed report`);
  await assertLocalImagesExist(html, name);
}

if (!archive.includes('Today &amp; Archive') || !archive.includes('one continuous magazine-style article')) fatal('Morning Special archive is missing its complete-edition explanation');

const editionDates = (await readdir(morningRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name))
  .map((entry) => entry.name)
  .sort()
  .reverse();

if (!editionDates.length) fatal('no dated Morning Special editions were generated');
const newest = editionDates[0];
if (!canonicalLanding.includes(`href="/news/morning-special/${newest}/"`)) fatal(`news/index.html is missing newest Morning Special ${newest}`);

let totalChapters = 0;
for (const date of editionDates) {
  const route = `/news/morning-special/${date}/`;
  if (!archive.includes(`href="${route}"`)) fatal(`Morning Special archive is missing ${date}`);
  const file = path.join(morningRoot, date, 'index.html');
  const html = await readFile(file, 'utf8');
  const name = `news/morning-special/${date}/index.html`;
  const chapters = count(html, 'class="chapter"');
  const sourceBoxes = count(html, 'class="sources"');
  const chapterFigures = count(html, 'class="chapter-figure"');
  const captions = count(html, 'class="figcaption"');

  if (count(html, 'class="morning-edition"') !== 1) fatal(`${name} must contain exactly one complete magazine article`);
  if (!html.includes(`data-edition-date="${date}"`)) fatal(`${name} has the wrong edition date`);
  if (chapters < 1) fatal(`${name} has no magazine chapters`);
  if (sourceBoxes !== chapters) fatal(`${name} must expose sources for every chapter`);
  if (count(html, 'class="edition-hero"') !== 1) fatal(`${name} must expose exactly one edition hero`);
  if (captions !== 1 + chapterFigures) fatal(`${name} is missing a visible caption or credit for an attached image`);
  if (!html.includes('<nav class="toc"')) fatal(`${name} is missing magazine navigation`);
  const chapterLabel = `${chapters} chapter${chapters === 1 ? '' : 's'} · One complete edition`;
  if (!html.includes(chapterLabel)) fatal(`${name} has an inaccurate chapter-count label`);
  if (!html.includes(`rel="canonical" href="${origin}${route}"`)) fatal(`${name} has the wrong canonical URL`);
  if (!genuineAttachedImage(html)) fatal(`${name} has no genuine attached local image`);
  if (!/loading="eager"[^>]*fetchpriority="high"/i.test(html)) fatal(`${name} does not prioritize its hero image`);
  if (!/<main\b[^>]*>[\s\S]{2500,}<\/main>/i.test(html)) fatal(`${name} is not a substantial readable edition`);
  await assertLocalImagesExist(html, name);
  totalChapters += chapters;
}

const about = await readFile(path.join(dist, 'fmbnews', 'about', 'index.html'), 'utf8');
for (const marker of ['Our mission', 'Our vision', 'Evidence first', 'Context always']) if (!about.includes(marker)) fatal(`fmbnews/about/index.html is missing ${marker}`);

console.log(`FMB News audit passed ${editionDates.length} complete Morning Special editions from ${editionDates.at(-1)} through ${newest}, covering ${totalChapters} sourced chapters with local credited imagery.`);
