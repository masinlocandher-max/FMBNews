import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolve = (...parts) => path.join(root, ...parts);
const must = (value, message) => { if (!value) throw new Error(message); };

await access(resolve('scripts', 'render-network-shell.mjs'));

const build = await readFile(resolve('scripts', 'build.mjs'), 'utf8');
const renderer = await readFile(resolve('scripts', 'render-network-shell.mjs'), 'utf8');
const mobileHomeRuntime = await readFile(resolve('public/assets/js/fmb-news-mobile-home.js'), 'utf8');

must(build.includes("render-network-shell.mjs"), 'Build no longer imports the canonical network shell renderer');
must(build.includes('await renderNetworkShell();'), 'Build no longer executes the canonical network shell renderer');
must(!build.includes('hardfix-metallic-network.mjs'), 'Superseded metallic-network hardfix returned to the build path');
must(!build.includes('hardfix-product-identity.mjs'), 'Superseded product-identity hardfix returned to the build path');
must(!build.includes('hardfix-ticker.mjs'), 'Superseded ticker hardfix returned to the build path');
must(!build.includes('hardfix-newsroom-compat.mjs'), 'Superseded newsroom compatibility shim returned to the build path');

for (const signal of [
  'FMB NEWS',
  'FMB Worldwide',
  'FMB Explainer',
  'FMB Fact Check',
  'FMB Daily Brief',
  'Filipino Media Bulletin',
  'headline-ticker',
  'ticker-clock',
  'data-pht-clock',
  'normalizeClockRuntime',
  'footer-publication-title',
]) {
  must(renderer.includes(signal), `Canonical network renderer is missing ${signal}`);
}

for (const signal of [
  "timeZone:'Asia/Manila'",
  "new Intl.DateTimeFormat('en-PH'",
  'Hello, night owl.',
  'Good morning.',
  'Good afternoon.',
  'Good evening.',
  'Still up?',
  'The world is still moving. Here’s what changed.',
]) {
  must(mobileHomeRuntime.includes(signal), `Authored mobile-home runtime lost required behavior: ${signal}`);
}
must(!mobileHomeRuntime.includes('legacyGreetingCopy'), 'Authored mobile-home runtime must not carry the removed compatibility mutation');

for (const rel of [
  'dist/news/archive/index.html',
  'dist/news/world/index.html',
  'dist/news/explainer/index.html',
  'dist/news/fact-check/index.html',
  'dist/news/fmb-brief/index.html',
  'dist/news/about/index.html',
  'dist/news/search/index.html',
  'dist/news/submit/index.html',
]) {
  const html = await readFile(resolve(rel), 'utf8');
  const wordmarks = (html.match(/class="fmb-lux-wordmark"/g) || []).length;
  must(wordmarks === 1, `${rel}: expected exactly one canonical shared FMB NEWS wordmark, found ${wordmarks}`);
  must(html.includes('class="headline-ticker"'), `${rel}: canonical headline ticker missing`);
  must((html.match(/<span data-pht-clock/g) || []).length === 1, `${rel}: expected exactly one canonical PHT clock`);
  must((html.match(/<script data-fmb-network-clock>/g) || []).length === 1, `${rel}: expected exactly one canonical PHT clock process`);
  must(html.includes('<div class="footer-publication-title">Filipino Media Bulletin</div>'), `${rel}: canonical publication footer missing`);
  for (const href of ['/news/archive/', '/news/world/', '/news/explainer/', '/news/fact-check/', '/news/fmb-brief/']) {
    must(html.includes(`href="${href}"`), `${rel}: canonical product navigation missing ${href}`);
  }
}

const home = await readFile(resolve('dist/news/index.html'), 'utf8');
must(home.includes('fmb-network-landing'), 'Homepage lost the publication landing body contract');
must(home.includes('publication-mast'), 'Homepage lost its purpose-built publication mast');
must((home.match(/class="fmb-editorial-wordmark"/g) || []).length === 1, 'Homepage must expose exactly one FMB NEWS. editorial wordmark');
must((home.match(/class="fmb-lux-wordmark"/g) || []).length === 0, 'Homepage must not be overwritten by the shared internal-route wordmark');
must(home.includes('FMB NEWS<span class="dot">.</span>'), 'Homepage editorial masthead lost the red-period FMB NEWS. lockup');
must(home.includes('fmb-editorial-subtitle">Filipino Media Bulletin'), 'Homepage editorial masthead lost the Filipino Media Bulletin subtitle');
must((home.match(/<span data-pht-clock/g) || []).length === 1, 'Homepage must expose exactly one PHT ticker clock');

// The retired "approved" loader must not come back.
//
// fmb-news-approved.js reached 38 pages, including the landing page, and every
// element it targeted had been gone for some time: 0 [data-fmb-asset], 0
// #phtClock, 0 [data-mobile-nav], 0 matches for the image its inline hardfix
// rewrote. What it still did was fetch nine base64 .txt blobs -- 196 KiB
// encoding ~147 KiB of PNG, declared as image/webp -- to set .src on nothing,
// and then append fmb-news-cms.css, fmb-news-apple-texture.css and
// fmb-news-cms.js to <head> at runtime with hand-maintained ?v= strings, which
// is the stale-cache failure mode content hashing exists to end. It also
// carried a runtime hotlink to a Wikimedia URL, invisible to the build pass that
// exists to localize exactly that.
//
// Those three assets are ordinary content-hashed tags in the source pages now.
// Removing the loader moved first contentful paint on the landing page from
// 848ms to 220ms with zero computed-style change across 2,399 element
// fingerprints on four routes at two widths.
//
// Both halves are asserted: the loader itself, and the base64 blob directory it
// existed to fetch, because leaving that shipping would be 196 KiB of dead
// weight in the bucket with nothing pointing at it.
const distNews = resolve('dist', 'news');
const approvedLoader = [];
const walkHtml = async (dir) => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(full);
    else if (entry.name.endsWith('.html')) {
      if ((await readFile(full, 'utf8')).includes('fmb-news-approved.js')) approvedLoader.push(path.relative(root, full));
    }
  }
};
await walkHtml(distNews);
must(approvedLoader.length === 0,
  `${approvedLoader.length} page(s) restored the retired fmb-news-approved.js loader, e.g. ${approvedLoader[0]}. Its targets no longer exist; the CMS assets it injected are content-hashed tags in the source pages.`);
let blobsShipped = false;
try { await access(resolve('dist', 'news', 'assets', 'data', 'fmb-news-approved')); blobsShipped = true; } catch {}
must(!blobsShipped, 'The retired base64 asset blobs under assets/data/fmb-news-approved/ are shipping again; nothing references them.');

console.log('Canonical FMB News network shell verification passed: shared internal routes retain one canonical shell, the homepage preserves its dedicated FMB NEWS. editorial masthead, one PHT ticker/clock process remains authoritative, and superseded shell/ticker/compatibility hardfixes and the retired approved-asset loader are absent from the build path.');