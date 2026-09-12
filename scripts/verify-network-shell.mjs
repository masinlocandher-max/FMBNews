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

must(build.includes('render-network-shell.mjs'), 'Build no longer imports the canonical network shell renderer');
must(build.includes('await renderNetworkShell();'), 'Build no longer executes the canonical network shell renderer');
for(const legacy of ['hardfix-metallic-network.mjs','hardfix-product-identity.mjs','hardfix-ticker.mjs','hardfix-newsroom-compat.mjs'])must(!build.includes(legacy),`Superseded shell hardfix returned to build path: ${legacy}`);

for (const signal of [
  'FMB NEWS',
  'fmb-brand-period',
  'FILIPINO MEDIA BULLETIN',
  'FMB Worldwide',
  'FMB Explainer',
  'FMB Fact Check',
  'FMB Daily Brief',
  'headline-ticker',
  'LATEST',
  'ticker-clock',
  'data-pht-clock',
  'normalizeClockRuntime',
  'Home',
  'World',
  'Sports',
  'Daily Briefing',
  'Explainers',
  'Entertainment',
  '/news/horoscope/',
  '/news/crossword/',
  'footer-publication-title',
])must(renderer.includes(signal),`Canonical network renderer is missing ${signal}`);

// Philippine Standard Time remains explicitly source-owned; the refreshed shared
// clock no longer wastes work rendering seconds and updates on a 30-second timer.
for (const signal of ["timeZone:'Asia/Manila'","new Intl.DateTimeFormat('en-PH'",'setInterval(tick,30000)'])must(renderer.includes(signal),`Shared PHT clock lost required behavior: ${signal}`);

// Home's authored local utility runtime remains one source for Home greeting/date/time/weather behavior.
for (const signal of [
  "timeZone:'Asia/Manila'",
  "new Intl.DateTimeFormat('en-PH'",
  'Hello, night owl.',
  'Good morning.',
  'Good afternoon.',
  'Good evening.',
  'Still up?',
])must(mobileHomeRuntime.includes(signal),`Authored mobile-home runtime lost required behavior: ${signal}`);
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
  must(html.includes('fmb-brand-period'), `${rel}: crimson period markup missing`);
  must(html.includes('fmb-brand-descriptor'), `${rel}: FILIPINO MEDIA BULLETIN descriptor missing`);
  must(html.includes('class="headline-ticker"'), `${rel}: canonical Latest headline rail missing`);
  must(html.includes('>LATEST</div>'), `${rel}: Latest rail label is not canonical`);
  must((html.match(/<span data-pht-clock/g) || []).length === 1, `${rel}: expected exactly one canonical PHT clock`);
  must((html.match(/<script data-fmb-network-clock>/g) || []).length === 1, `${rel}: expected exactly one canonical PHT clock process`);
  must(html.includes('class="footer-publication-title">FMB NEWS'), `${rel}: canonical FMB NEWS footer identity missing`);
  for (const href of ['/news/', '/news/world/', '/news/sports/', '/news/fmb-brief/', '/news/fact-check/', '/news/explainer/', '/news/horoscope/', '/news/crossword/', '/news/about/', '/news/search/']) {
    must(html.includes(`href="${href}"`), `${rel}: canonical navigation missing ${href}`);
  }
}

const home = await readFile(resolve('dist/news/index.html'), 'utf8');
must(home.includes('fmb-network-landing'), 'Homepage lost the publication landing body contract');
must(home.includes('publication-mast'), 'Homepage lost its purpose-built publication mast');
must((home.match(/class="fmb-lux-wordmark"/g) || []).length === 1, 'Homepage must expose exactly one visible FMB NEWS wordmark after the brand pass');
must(home.includes('FMB NEWS<span class="fmb-brand-period">.</span>'), 'Homepage masthead must render FMB NEWS with the crimson-period hook');
must(home.includes('FILIPINO MEDIA BULLETIN'), 'Homepage must expose the approved descriptor');
must((home.match(/<span data-pht-clock/g) || []).length === 1, 'Homepage must expose exactly one PHT ticker clock');
must(home.includes('about-fmb-home'), 'Homepage founder provenance module is missing');
must(home.includes('Founder, FMB News'), 'Homepage founder role is missing');
must(home.includes('Founder portrait placeholder for Francine Marie Bautista'), 'Homepage founder placeholder must remain explicit and image-free');

console.log('Canonical FMB News network shell verification passed: one shared FMB NEWS. identity, approved Home/World/Sports/Daily Briefing/Fact Check/Explainers/Entertainment IA, one PHT clock, one Latest rail, institutional About founder provenance, and preserved authored Home utility runtime.');