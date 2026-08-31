import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolve = (...parts) => path.join(root, ...parts);

for (const rel of [
  'scripts/hardfix-ticker.mjs',
  'public/assets/css/fmb-news-ticker-hardfix.css',
  'dist/news/assets/css/fmb-news-ticker-hardfix.css'
]) await access(resolve(rel));

const css = await readFile(resolve('dist/news/assets/css/fmb-news-ticker-hardfix.css'), 'utf8');
for (const signal of [
  'One fixed PHT clock',
  '.fmb-ref .ticker-clock',
  '.fmb-ref .ticker-headline',
  '"Bodoni 72"',
  'animation:fmbNewsTicker 64s',
  '.fmb-ref .utility'
]) {
  if (!css.includes(signal)) throw new Error(`Ticker hard-fix CSS regression: missing ${signal}`);
}

let pagesChecked = 0;

async function scan(target) {
  const info = await stat(target);
  if (info.isDirectory()) {
    for (const entry of await readdir(target)) await scan(path.join(target, entry));
    return;
  }
  if (!target.endsWith('.html')) return;

  pagesChecked += 1;
  const html = await readFile(target, 'utf8');
  if (!html.includes('/news/assets/css/fmb-news-ticker-hardfix.css')) {
    throw new Error(`Ticker hard-fix stylesheet missing from ${path.relative(root, target)}`);
  }

  const tickerStart = html.indexOf('<div class="headline-ticker"');
  const utilityStart = html.indexOf('<div class="utility">', tickerStart);
  // Mast may carry additional route-specific classes such as publication-mast.
  const mastStart = html.indexOf('<header class="mast', utilityStart);
  if (tickerStart < 0 || utilityStart < 0 || mastStart < 0) {
    throw new Error(`Normalized ticker structure missing from ${path.relative(root, target)}`);
  }

  const ticker = html.slice(tickerStart, utilityStart);
  const utility = html.slice(utilityStart, mastStart);

  if (!ticker.includes('class="ticker-clock"') || !ticker.includes('data-pht-clock')) {
    throw new Error(`Fixed PHT clock missing from ${path.relative(root, target)}`);
  }
  if (ticker.includes('<time') || ticker.includes('datetime=')) {
    throw new Error(`Moving headline still contains redundant story time in ${path.relative(root, target)}`);
  }
  if (!ticker.includes('class="ticker-headline"')) {
    throw new Error(`Moving headline text missing from ${path.relative(root, target)}`);
  }
  if (utility.includes('data-pht-clock')) {
    throw new Error(`Utility row still duplicates the live clock in ${path.relative(root, target)}`);
  }

  const liveClockElements = (html.match(/<span data-pht-clock/g) || []).length;
  if (liveClockElements !== 1) {
    throw new Error(`Expected exactly one visible live clock in ${path.relative(root, target)}, found ${liveClockElements}`);
  }
  const clockProcesses = (html.match(/<script data-fmb-network-clock>/g) || []).length;
  if (clockProcesses !== 1) {
    throw new Error(`Expected exactly one PHT clock process in ${path.relative(root, target)}, found ${clockProcesses}`);
  }
  const dateClockSelectors = (html.match(/document\.querySelector\('\[data-pht-date\]'\)/g) || []).length;
  if (dateClockSelectors !== 1) {
    throw new Error(`Duplicate legacy clock process remains in ${path.relative(root, target)}`);
  }
}

await scan(resolve('dist/news'));
if (pagesChecked === 0) throw new Error('Ticker verification did not inspect any built HTML pages');

console.log(`FMB ticker verification passed across ${pagesChecked} built HTML pages: one PHT clock, one clock process, no moving-story timestamps, premium editorial ticker typography.`);
