import { access, readFile } from 'node:fs/promises';
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

// The authored mobile-home runtime, not a late dist mutation, owns local hero
// greeting/date/time behavior. Keep Philippine Standard Time explicit in source.
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
  must(wordmarks === 1, `${rel}: expected exactly one canonical FMB NEWS wordmark, found ${wordmarks}`);
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
must((home.match(/class="fmb-lux-wordmark"/g) || []).length === 1, 'Homepage must expose exactly one visible FMB NEWS wordmark after the brand pass');
must((home.match(/<span data-pht-clock/g) || []).length === 1, 'Homepage must expose exactly one PHT ticker clock');

console.log('Canonical FMB News network shell verification passed: one renderer owns shared publication chrome and the final PHT ticker/clock, Search/Submit recover through the same source, authored mobile-home PHT behavior is preserved, and superseded shell/ticker/compatibility hardfixes are absent from the build path.');
