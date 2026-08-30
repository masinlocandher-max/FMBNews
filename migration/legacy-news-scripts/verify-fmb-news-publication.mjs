import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const articleRoot = path.join(root, 'apps', 'withlovefmb', 'content', 'news', 'articles');
const fallback = '/assets/images/news/fmb-news-editorial-fallback.svg';
const utilityRoutes = new Set(['', 'archive', 'about', 'fmb-brief']);

function isWorldwideRoute(route) {
  return route === 'world' || route.startsWith('world/');
}

async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}

async function walk(dir, predicate) {
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

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function hasNav(html, href, label) {
  const hrefEsc = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const labelEsc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<a[^>]+href=["']${hrefEsc}["'][^>]*>\\s*${labelEsc}\\s*<\\/a>`, 'i').test(html);
}

function firstFigureSrc(html) {
  return html.match(/<figure class=["']article-figure["'][\s\S]*?<img[^>]+src=["']([^"']+)["']/i)?.[1] || '';
}

function routeFromFile(file) {
  const rel = path.relative(newsRoot, path.dirname(file)).replaceAll(path.sep, '/');
  return rel === '.' ? '' : rel;
}

function newsroomLinks(html) {
  const links = new Set();
  for (const match of html.matchAll(/href=["']\/news\/([^"'#?]*)/gi)) {
    const route = String(match[1] || '').replace(/^\/+|\/+$/g, '');
    links.add(route);
  }
  return links;
}

const jsonFiles = await walk(articleRoot, file => file.endsWith('.json'));
const published = [];
for (const file of jsonFiles) {
  try {
    const story = JSON.parse(await readFile(file, 'utf8'));
    if (story.status === 'published' && story.slug && story.headline && story.publishedAt) published.push(story);
  } catch {}
}
published.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
const publishedSlugs = new Set(published.map(story => story.slug));
const canonicalRoutes = new Set([...utilityRoutes, ...publishedSlugs]);

const allHtmlFiles = await walk(newsRoot, file => path.basename(file) === 'index.html');
if (!allHtmlFiles.length) throw new Error('FMB News publication QA: no /dist/news/**/index.html files found.');

const fileByRoute = new Map(allHtmlFiles.map(file => [routeFromFile(file), file]));
const failures = [];
const warnings = [];
let articlePages = 0;

function verifyCanonicalPage(file, { article = false } = {}) {
  return readFile(file, 'utf8').then(html => {
    const rel = path.relative(dist, file).replaceAll(path.sep, '/');
    const fail = message => failures.push(`${rel}: ${message}`);

    if (!/<body[^>]*class=["'][^"']*fmb-ref/i.test(html)) fail('missing canonical fmb-ref publication body');
    if (count(html, 'class="brand-wordmark') < 2) fail('header/footer do not both use the canonical typographic FMB News wordmark');
    if (!html.includes('<span class="brand-fmb">FMB</span><span class="brand-news">News</span>')) fail('wordmark is not FMB bold + News regular markup');
    if (/fmb-news-official-transparent\.webp|fmb-news-logo-white-supplied\.webp|class=["']footer-logo["']/i.test(html)) fail('legacy image-logo dependency remains');

    if (count(html, 'class="headline-ticker"') !== 1) fail('must contain exactly one moving-headline rail');
    if (!html.includes('class="ticker-clock"')) fail('missing fixed PHT clock beside ticker');
    if (!html.includes('class="ticker-window"')) fail('missing independent moving-headline window');
    const tickerStart = html.indexOf('class="headline-ticker"');
    const tickerEnd = tickerStart >= 0 ? html.indexOf('class="utility"', tickerStart) : -1;
    const tickerBlock = tickerStart >= 0 ? html.slice(tickerStart, tickerEnd > tickerStart ? tickerEnd : tickerStart + 8000) : '';
    if (/<time\b/i.test(tickerBlock)) fail('headline rail contains per-story time; only the fixed live PHT clock is allowed');

    for (const [href, label] of [['/news/', 'Latest'], ['/news/fmb-brief/', 'FMB Brief'], ['/news/archive/', 'Archive'], ['/news/about/', 'About']]) {
      if (!hasNav(html, href, label)) fail(`canonical navigation missing ${label}`);
    }
    if (!/Submit a Story/i.test(html)) fail('canonical navigation missing Submit a Story');
    if (!html.includes('data-fmb-newsletter-form')) fail('newsletter signup missing');
    if (!html.includes('class="footer-socials"')) fail('verified newsroom social/contact icons missing');
    if (!html.includes('/assets/css/fmb-news-reference-final.css')) fail('final corporate broadcast stylesheet missing');

    if (article) {
      articlePages += 1;
      if (!/<main\b[^>]*class=["'][^"']*\barticle-shell\b[^"']*["']/i.test(html)) fail('canonical article shell missing');
      if (!html.includes('class="article-grid"')) fail('article layout grid missing');
      if (!html.includes('class="article-figure"')) fail('article hero/figure missing');
      if (!html.includes('class="related"')) fail('related reports rail missing');
      if (!/Why this matters/i.test(html)) fail('Why this matters editorial lens missing');
      if (!/What to watch next/i.test(html)) fail('What to watch next editorial lens missing');
      if (!/class=["']sources["']/i.test(html)) fail('sources section missing');
    }

    return html;
  });
}

for (const route of utilityRoutes) {
  const file = fileByRoute.get(route);
  if (!file) {
    failures.push(`canonical newsroom route /news/${route ? `${route}/` : ''} is missing`);
    continue;
  }
  await verifyCanonicalPage(file);
}

for (const story of published) {
  const file = fileByRoute.get(story.slug);
  if (!file) {
    failures.push(`published structured story "${story.headline}" has no rendered /news/${story.slug}/ route`);
    continue;
  }
  await verifyCanonicalPage(file, { article: true });
}

const worldPath = fileByRoute.get('world');
if (!worldPath) failures.push('FMB Worldwide: canonical /news/world/ desk is missing');
else {
  const world = await readFile(worldPath, 'utf8');
  if (!/FMB Worldwide/i.test(world)) failures.push('news/world/index.html: FMB Worldwide identity missing');
  if (!world.includes('fmb-worldwide')) failures.push('news/world/index.html: Worldwide visual-system hook missing');
}

const homePath = fileByRoute.get('');
const archivePath = fileByRoute.get('archive');
if (homePath) {
  const home = await readFile(homePath, 'utf8');
  if (!/<section\b[^>]*class=["'][^"']*\bhome-hero\b[^"']*["']/i.test(home)) failures.push('news/index.html: homepage hero missing');
  if (!home.includes('class="brief-promo"')) failures.push('news/index.html: FMB Brief promotion missing');
  if (home.includes(fallback)) failures.push('news/index.html: generic editorial fallback is visible on the current homepage');
  if (!/Philippine flag at Rizal Park in Manila/i.test(home)) failures.push('news/index.html: approved civic Philippine hero image treatment is missing');
}

// Active discovery surfaces may never send readers back into the old compatibility newsroom.
// FMB Worldwide is a first-class desk with its own landing and dated editions, so its nested
// routes are explicitly canonical even though they are not structured-article JSON slugs.
for (const [label, file] of [['homepage', homePath], ['archive', archivePath]]) {
  if (!file) continue;
  const html = await readFile(file, 'utf8');
  for (const route of newsroomLinks(html)) {
    if (!route || utilityRoutes.has(route) || publishedSlugs.has(route) || isWorldwideRoute(route) || /^fmb-brief-[a-z]+-\d{1,2}-\d{4}$/i.test(route)) continue;
    failures.push(`${label} links to noncanonical legacy newsroom route /news/${route}/`);
  }
}

// Current visible stories must render a story-specific image. Validate output after all image overrides.
for (const story of published.slice(0, 9)) {
  const articleFile = fileByRoute.get(story.slug);
  if (!articleFile) continue;
  const html = await readFile(articleFile, 'utf8');
  const renderedImage = firstFigureSrc(html);
  if (!renderedImage || renderedImage === fallback) failures.push(`current story "${story.headline}" renders without story-specific imagery`);
  if (renderedImage.startsWith('/') && !renderedImage.startsWith('//') && !(await exists(path.join(dist, renderedImage.slice(1))))) {
    failures.push(`current story "${story.headline}" renders missing local image ${renderedImage}`);
  }
  if (!String(story?.image?.alt || '').trim()) warnings.push(`current story "${story.headline}" has no source alt text; rendered fallback alt may be generic`);
  if (!String(story?.image?.credit || story?.image?.creator || '').trim()) warnings.push(`current story "${story.headline}" has no explicit source image credit/creator`);
}

const briefDirs = (await readdir(newsRoot, { withFileTypes: true }))
  .filter(entry => entry.isDirectory() && /^fmb-brief-[a-z]+-\d{1,2}-\d{4}$/i.test(entry.name));
if (!briefDirs.length) failures.push('FMB Brief: no dated editions found');

// Historical compatibility routes remain accessible, but they are no longer allowed to define the active publication UI.
const compatibilityRoutes = [...fileByRoute.keys()]
  .filter(route => !canonicalRoutes.has(route) && !isWorldwideRoute(route) && !/^fmb-brief-[a-z]+-\d{1,2}-\d{4}$/i.test(route))
  .sort();
if (compatibilityRoutes.length) {
  warnings.push(`${compatibilityRoutes.length} historical compatibility route(s) remain outside the canonical renderer; active homepage/archive links are verified not to depend on them.`);
}

if (warnings.length) {
  console.warn(`FMB News publication QA warnings (${warnings.length}):`);
  for (const warning of warnings.slice(0, 20)) console.warn(`- ${warning}`);
  if (warnings.length > 20) console.warn(`- ... ${warnings.length - 20} additional warning(s) suppressed`);
}

if (failures.length) {
  throw new Error(`FMB News publication QA failed (${failures.length}):\n${failures.slice(0, 120).map(item => `- ${item}`).join('\n')}${failures.length > 120 ? `\n- ... ${failures.length - 120} additional failure(s) suppressed` : ''}`);
}

console.log(`FMB News publication QA passed: ${published.length} structured article routes + ${utilityRoutes.size} active newsroom surfaces + FMB Worldwide verified; ${Math.min(9, published.length)} current rendered-story image checks passed; typographic identity, fixed PHT clock + independent moving headlines, canonical navigation/footer, newsletter, and active-route isolation are enforced. ${compatibilityRoutes.length} historical compatibility route(s) remain isolated from active discovery surfaces.`);
