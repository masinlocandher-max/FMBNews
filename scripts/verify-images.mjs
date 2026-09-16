import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDITORIAL_FALLBACK_POOL, FALLBACK_FILES } from './lib/editorial-fallback-pool.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolve = (...parts) => path.join(root, ...parts);

const required = [
  'public/assets/images/news/fmb-news-editorial-fallback.svg',
  'public/assets/js/fmb-news-image-hardfix.js',
  'public/assets/js/fmb-news-newsletter.js',
  'scripts/hardfix-all-article-images.mjs',
  'scripts/hardfix-designated-fallbacks.mjs',
  'dist/news/assets/images/news/fmb-news-editorial-fallback.svg',
  'dist/news/assets/images/mobile/fmb-explainer-fallback.jpg',
  'dist/news/assets/images/mobile/fmb-daily-brief-mug.jpg',
  'dist/news/assets/js/fmb-news-image-hardfix.js',
  'dist/news/assets/js/fmb-news-newsletter.js'
];
for (const rel of required) await access(resolve(rel));

const sourceGuard = await readFile(resolve('public/assets/js/fmb-news-image-hardfix.js'), 'utf8');
const sourceNewsletter = await readFile(resolve('public/assets/js/fmb-news-newsletter.js'), 'utf8');
const articleImageHardfix = await readFile(resolve('scripts/hardfix-all-article-images.mjs'), 'utf8');
const designatedFallbackHardfix = await readFile(resolve('scripts/hardfix-designated-fallbacks.mjs'), 'utf8');
const builtGuard = await readFile(resolve('dist/news/assets/js/fmb-news-image-hardfix.js'), 'utf8');
const builtNewsletter = await readFile(resolve('dist/news/assets/js/fmb-news-newsletter.js'), 'utf8');
const fallback = await readFile(resolve('public/assets/images/news/fmb-news-editorial-fallback.svg'), 'utf8');

for (const signal of [
  'MutationObserver',
  "addEventListener('error'",
  '.cms-article',
  '.cms-edition-entry',
  '.country-card',
  '.country-entry',
  '.brief-issue',
  '.story-card',
  '.support-item',
  '.more-item',
  '.related-item'
]) {
  if (!sourceGuard.includes(signal)) throw new Error(`Image hard-fix regression: source guard is missing ${signal}`);
}
for(const signal of ['isArticle','article-grid','hasContentImage','injectFigure','og:image','twitter:image','fmb-guaranteed-article-figure','fmb-explainer-fallback.jpg','fmb-daily-brief-mug.jpg']){
  if(!articleImageHardfix.includes(signal))throw new Error(`Article image build hard rule is missing ${signal}`);
}
for(const signal of ['fmb-explainer-fallback.jpg','generatedExplainerArt','Real supplied photos were left untouched']){
  if(!designatedFallbackHardfix.includes(signal))throw new Error(`Designated Explainer fallback rule is missing ${signal}`);
}
if (!sourceNewsletter.includes('/assets/js/fmb-news-image-hardfix.js')) {
  throw new Error('Image hard-fix regression: source loader is not wired through the shared newsletter script');
}
// The plate URL is assembled at runtime from the pool list, so the filename
// never appears literally in the built file -- only the scoped directory does.
// This checks the part the build is actually responsible for: that the asset
// path was rescoped to /news/assets/ and the plate names survived the rewrite.
if (!builtGuard.includes('/news/assets/images/news/')) {
  throw new Error('Image hard-fix regression: built guard does not point to the scoped fallback asset directory');
}
if (!FALLBACK_FILES.every((file) => builtGuard.includes(file))) {
  throw new Error('Image hard-fix regression: the built guard is missing one or more editorial fallback plates');
}
if (!builtNewsletter.includes('/news/assets/js/fmb-news-image-hardfix.js')) {
  throw new Error('Image hard-fix regression: built loader does not point to the scoped image guard');
}
if (builtGuard.includes('/news/news/assets/') || builtNewsletter.includes('/news/news/assets/')) {
  throw new Error('Image hard-fix regression: double-scoped /news/news/assets/ path detected');
}
if (!fallback.includes('<svg') || !fallback.includes('FMB News editorial visual')) {
  throw new Error('Image hard-fix regression: fallback visual is invalid');
}

// The masthead is the newsroom's supplied lockup, drawn as a CSS background on
// a span whose text is clipped to 1x1 for assistive tech. That is the right
// shape for accessibility and the wrong shape for failure: if either artwork
// file goes missing, the background simply does not paint and the masthead
// renders EMPTY -- no broken-image icon, no fallback text, nothing. Every page
// on the site would ship without a masthead and no existing check would notice,
// because the HTML and the CSS would both still be perfectly valid.
//
// Both polarities are required: the ink lockup for Light and the white one for
// Dark. Shipping only one means the masthead disappears in the other
// appearance, which is the same silent failure in half the cases.
for (const [polarity, file] of [
  ['Light', 'fmb-news-masthead-light.webp'], ['Dark', 'fmb-news-masthead-dark.webp'],
  ['Light app-bar', 'fmb-news-wordmark-light.webp'], ['Dark app-bar', 'fmb-news-wordmark-dark.webp'],
]) {
  const asset = resolve('dist', 'news', 'assets', 'images', file);
  let info;
  try {
    info = await stat(asset);
  } catch {
    throw new Error(`Masthead regression: the ${polarity} masthead lockup is missing from the build (${file}). The masthead renders empty without it.`);
  }
  if (info.size < 6_000) {
    throw new Error(`Masthead regression: the ${polarity} masthead lockup is ${info.size} bytes, which is not the artwork (${file}).`);
  }
}

// ---------------------------------------------------------------------------
// The editorial fallback plate pool
// ---------------------------------------------------------------------------
// A story with no photograph of its own gets one of the publication's branded
// plates, picked by a hash of its slug. Two things can silently break that.
//
// 1. A plate file goes missing. The build would still emit <img src> pointing
//    at it, so every affected story would show a broken image instead of a
//    placeholder -- the failure the placeholder exists to prevent. Each plate is
//    therefore required in the build and required to be real artwork, not a
//    0-byte file or a stub, the same check the masthead lockups get above.
//
// 2. The runtime copies of the list drift from the module's. The build picks
//    plates from scripts/lib/editorial-fallback-pool.mjs; three client scripts
//    carry their own copy so a failed image can be replaced without another
//    request. If a plate were renamed in the module alone, those scripts would
//    keep swapping in a URL that no longer exists, and only readers whose images
//    failed would ever see it. So the lists are compared, exactly, in order.
if (EDITORIAL_FALLBACK_POOL.length < 2) {
  throw new Error('The editorial fallback pool holds fewer than two plates; there is nothing to rotate and every imageless story would look identical.');
}
for (const plate of EDITORIAL_FALLBACK_POOL) {
  if (!plate.alt || plate.alt.length < 20) {
    throw new Error(`Editorial fallback plate ${plate.file} has no usable alt text. A reader on a screen reader gets this instead of the picture.`);
  }
  const asset = resolve('dist', 'news', 'assets', 'images', 'news', plate.file);
  let info;
  try {
    info = await stat(asset);
  } catch {
    throw new Error(`Editorial fallback plate ${plate.file} is missing from the build. Stories seeded to it would ship a broken image where the placeholder should be.`);
  }
  if (info.size < 20_000) {
    throw new Error(`Editorial fallback plate ${plate.file} is ${info.size} bytes, which is not the artwork.`);
  }
}
for (const [label, rel] of [
  ['image recovery', 'public/assets/js/fmb-news-image-hardfix.js'],
  ['CMS reader', 'public/assets/js/fmb-news-cms.js'],
  ['mobile live feed', 'public/assets/js/fmb-news-mobile-live-feed.js'],
]) {
  const source = await readFile(resolve(rel), 'utf8');
  const listed = [...source.matchAll(/'(fmb-news-fallback-[a-z0-9-]+\.jpg)'/g)].map((m) => m[1]);
  if (listed.join('|') !== FALLBACK_FILES.join('|')) {
    throw new Error(
      `The ${label} runtime's fallback plate list has drifted from scripts/lib/editorial-fallback-pool.mjs.\n`
      + `  ${rel} lists: ${listed.join(', ') || '(none)'}\n`
      + `  the module lists: ${FALLBACK_FILES.join(', ')}\n`
      + '  Update both, in the same order.'
    );
  }
  if (!/Math\.imul\(\s*hash\s*,\s*0x01000193\s*\)/.test(source)) {
    throw new Error(`The ${label} runtime no longer uses the module's FNV-1a seed, so it would pick a different plate than the build did for the same story.`);
  }
}

// ---------------------------------------------------------------------------
// No asset may exceed what the platform will deploy
// ---------------------------------------------------------------------------
// Cloudflare Workers refuses any single static asset over 25 MiB. It refuses
// the WHOLE deploy, not the file -- so an oversized asset does not degrade the
// site, it stops the newsroom publishing at all.
//
// That is exactly what happened: a build pass fetched a 28.9 MiB Wikimedia
// original, every verifier passed, all eight browser suites passed, and then
// wrangler rejected the upload. The gates said the build was good and the
// build could not ship. A check that green-lights an undeployable artifact is
// the gap worth closing, so the platform ceiling is asserted here.
//
// The warning threshold is far below the hard limit because a multi-megabyte
// photograph is a performance defect long before it is a deploy blocker.
const DEPLOY_LIMIT = 25 * 1024 * 1024;
const HEAVY = 3 * 1024 * 1024;
const oversized = [];
const heavy = [];
async function weigh(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { await weigh(full); continue; }
    const info = await stat(full);
    const rel = path.relative(resolve('dist'), full);
    if (info.size >= DEPLOY_LIMIT) oversized.push(`${rel} is ${(info.size / 1048576).toFixed(1)} MiB`);
    else if (info.size >= HEAVY) heavy.push(`${rel} is ${(info.size / 1048576).toFixed(1)} MiB`);
  }
}
await weigh(resolve('dist'));
if (oversized.length) {
  throw new Error(
    `${oversized.length} asset(s) are at or above Cloudflare's 25 MiB per-asset limit and would fail the deploy:\n  `
    + oversized.join('\n  ')
    + '\n  Serve a web-sized rendition instead of a camera original.'
  );
}
if (heavy.length) {
  console.warn(`  Note: ${heavy.length} asset(s) over 3 MiB — slow for phone readers:`);
  for (const line of heavy.slice(0, 5)) console.warn(`    ${line}`);
}

const isArticle=html=>html.includes('class="article-grid"')||/property=["']og:type["'][^>]*content=["']article["']/i.test(html)||/content=["']article["'][^>]*property=["']og:type["']/i.test(html)||/["']@type["']\s*:\s*["'](?:NewsArticle|Article)["']/i.test(html);
const hasArticleImage=html=>/class=["'][^"']*(?:article-figure|cms-article-image|explainer-article-image|article-hero-image|brief-hero)[^"']*["'][\s\S]*?<img\s+[^>]*src=["'][^"']+/i.test(html)||/<article\b[\s\S]*?<img\s+[^>]*src=["'][^"']+/i.test(html);

let htmlPages = 0;
let articlePages = 0;
let generatedArticles = 0;
const remoteImages = new Map();   // url -> first page that cites it

async function scan(target) {
  const info = await stat(target);
  if (info.isDirectory()) {
    for (const entry of await readdir(target)) await scan(path.join(target, entry));
    return;
  }
  if (!target.endsWith('.html')) return;

  htmlPages += 1;
  const html = await readFile(target, 'utf8');
  if (!html.includes('/news/assets/js/fmb-news-newsletter.js')) {
    throw new Error(`Image hard-fix loader missing from ${path.relative(root, target)}`);
  }
  if (html.includes('/news/news/assets/')) {
    throw new Error(`Double-scoped image asset path found in ${path.relative(root, target)}`);
  }

  for (const match of html.matchAll(/(?:src|content)="(https:\/\/(?:commons|upload)\.wikimedia\.org\/[^"]+)"/g)) {
    if (!remoteImages.has(match[1])) remoteImages.set(match[1], path.relative(root, target));
  }

  if (html.includes('class="article-grid"') && html.includes('class="article-figure"')) {
    generatedArticles += 1;
    if (!/class="article-figure"[\s\S]*?<img\s+[^>]*src="[^"]+"/i.test(html)) {
      throw new Error(`Generated FMB News article has no usable figure image in ${path.relative(root, target)}`);
    }
  }

  if(isArticle(html)){
    articlePages += 1;
    if(!hasArticleImage(html))throw new Error(`Article route has no visible content image in ${path.relative(root,target)}`);
    if(!/<meta\b[^>]*property=["']og:image["'][^>]*content=["'][^"']+["']/i.test(html)&&!/<meta\b[^>]*content=["'][^"']+["'][^>]*property=["']og:image["']/i.test(html)){
      throw new Error(`Article route has no og:image in ${path.relative(root,target)}`);
    }
  }
}

await scan(resolve('dist/news'));

// ---------------------------------------------------------------------------
// Remote photographs must be bounded, and cited once.
// ---------------------------------------------------------------------------
//
// Localization is deliberately fail-soft: a photograph that cannot be fetched
// keeps its third-party URL rather than blocking the newsroom from publishing.
// That is the right trade, but it leaves a hole this closes, because the two
// ways a surviving remote reference goes wrong are both invisible to every
// other gate in the build.
//
// A camera original costs the READER, not our bucket, so the 25 MiB deploy
// ceiling above never sees it. Wikimedia originals run to 4608x3456 and tens of
// megabytes, and the worst offender here was the lead figure on 69 pages.
//
// And the same photograph spelled two ways -- a bare URL beside its ?width=
// form, or a comma written once as "," and once as "%2C" -- is fetched and
// cached twice by every reader who meets both pages.
//
// Written against the built output rather than by calling the localization
// pass's own helpers, so it measures the result instead of agreeing with the
// implementation.
const unbounded = [];
const byFile = new Map();
for (const [url, page] of remoteImages) {
  const redirect = url.match(/\/Special:Redirect\/file\/([^?#]+)/);
  const thumb = url.match(/\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)\/(\d+)px-/);
  const original = url.match(/\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)$/);
  const width = Number(url.match(/[?&]width=(\d+)/)?.[1] ?? thumb?.[2] ?? 0);
  if (!width || width > 1600) unbounded.push(`${page}  ${url}`);
  const name = redirect?.[1] || thumb?.[1] || original?.[1];
  if (!name) continue;
  let decoded = name; try { decoded = decodeURIComponent(name); } catch { /* its own identity */ }
  if (!byFile.has(decoded)) byFile.set(decoded, new Set());
  byFile.get(decoded).add(url);
}
if (unbounded.length) {
  throw new Error(
    `${unbounded.length} remote photograph(s) ship without a width limit, so readers download the camera original:\n  `
    + unbounded.slice(0, 6).join('\n  ')
    + '\n  Bound them in scripts/localize-article-photography.mjs; never by raising this ceiling.'
  );
}
const duplicated = [...byFile].filter(([, set]) => set.size > 1);
if (duplicated.length) {
  throw new Error(
    `${duplicated.length} photograph(s) are cited under more than one URL, so each is fetched and cached twice:\n  `
    + duplicated.slice(0, 4).map(([name, set]) => `${name}\n    ${[...set].join('\n    ')}`).join('\n  ')
  );
}

if (generatedArticles === 0) throw new Error('Image hard-fix regression: no generated article pages were inspected');
if (articlePages === 0) throw new Error('Article image regression: no article routes were inspected');
if (articlePages < generatedArticles) throw new Error(`Article image regression: only ${articlePages} article routes inspected vs ${generatedArticles} generated articles`);

console.log(`FMB News image verification passed: all ${articlePages} article routes have visible content images and og:image metadata; ${generatedArticles} generated articles have figure images; designated Explainer and Daily Brief fallback assets are present; ${htmlPages} built HTML pages load broken/missing-image recovery; ${remoteImages.size} surviving remote photograph(s) are width-bounded and each cited under exactly one URL.`);
