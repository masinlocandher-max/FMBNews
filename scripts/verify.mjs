import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolve = (...parts) => path.join(root, ...parts);

const required = [
  'site/index.html',
  'site/fmb-brief/index.html',
  'site/fmb-brief/live/index.html',
  'site/world/index.html',
  'site/world/live/index.html',
  'site/read/index.html',
  'public/assets/css/fmb-news-final.css',
  'public/assets/css/fmb-news-cms.css',
  'public/assets/js/fmb-news-approved.js',
  'public/assets/js/fmb-news-cms.js',
  'content/news/articles',
  'src/worker.js',
  'wrangler.jsonc',
  'dist/news/index.html',
  'dist/news/assets/js/fmb-news-cms.js'
];

for (const rel of required) await access(resolve(rel));

try {
  await access(resolve('vercel.json'));
  throw new Error('FMBNews must not contain a Vercel deployment configuration');
} catch (error) {
  if (error?.code !== 'ENOENT' && /must not contain/.test(error?.message || '')) throw error;
}

const home = await readFile(resolve('site/index.html'), 'utf8');
const brief = await readFile(resolve('site/fmb-brief/index.html'), 'utf8');
const world = await readFile(resolve('site/world/index.html'), 'utf8');
const reader = await readFile(resolve('site/read/index.html'), 'utf8');
const liveWorld = await readFile(resolve('site/world/live/index.html'), 'utf8');
const liveBrief = await readFile(resolve('site/fmb-brief/live/index.html'), 'utf8');
const cms = await readFile(resolve('public/assets/js/fmb-news-cms.js'), 'utf8');
const worker = await readFile(resolve('src/worker.js'), 'utf8');
const wrangler = await readFile(resolve('wrangler.jsonc'), 'utf8');

if (!home.includes('FMB Brief') || !home.includes('FMB Worldwide')) {
  throw new Error('Homepage is missing the FMB Brief or FMB Worldwide product surface');
}
if (!brief.includes('FMB Brief')) throw new Error('FMB Brief index is invalid');
if (!world.includes('FMB Worldwide')) throw new Error('FMB Worldwide index is invalid');
if (!reader.includes('data-cms-article')) throw new Error('CMS article reader mount is missing');
if (!liveWorld.includes('data-cms-edition="worldwide"')) throw new Error('Live FMB Worldwide mount is missing');
if (!liveBrief.includes('data-cms-edition="brief"')) throw new Error('Live FMB Brief mount is missing');
if (!cms.includes('news_articles') || !cms.includes('news_editions') || !cms.includes('news_edition_entries')) {
  throw new Error('CMS client is not wired to the expected Supabase newsroom tables');
}
if (!worker.includes("url.pathname === '/news'") || !worker.includes("url.pathname.startsWith('/news/')")) {
  throw new Error('Cloudflare Worker is not enforcing the /news path boundary');
}
if (!wrangler.includes('www.francinemariebautista.com/news*') || !wrangler.includes('francinemariebautista.com/news*')) {
  throw new Error('Cloudflare route configuration is missing the canonical /news routes');
}

const worldEntries = await readdir(resolve('site/world'), { withFileTypes: true });
const worldEditions = worldEntries
  .filter((entry) => entry.isDirectory() && /^[a-z]+-\d{1,2}-\d{4}$/i.test(entry.name))
  .map((entry) => entry.name);
if (worldEditions.length === 0) throw new Error('No dated FMB Worldwide edition found');
for (const edition of worldEditions) await access(resolve('site/world', edition, 'index.html'));

const siteEntries = await readdir(resolve('site'), { withFileTypes: true });
const briefEditions = siteEntries
  .filter((entry) => entry.isDirectory() && /^fmb-brief-.+/i.test(entry.name))
  .map((entry) => entry.name);
if (briefEditions.length === 0) throw new Error('No dated FMB Brief edition found');
for (const edition of briefEditions) await access(resolve('site', edition, 'index.html'));

const articleDays = (await readdir(resolve('content/news/articles'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
if (articleDays.length === 0) throw new Error('Structured FMB News article archive is empty');

const forbidden = ['FMB' + '-Ecosystem', 'apps/' + 'withlovefmb/'];
const scanRoots = ['README.md', '.github', 'docs', 'scripts', 'public', 'site', 'src', 'wrangler.jsonc', 'package.json'];

async function scan(target) {
  let info;
  try { info = await stat(target); } catch { return; }
  if (info.isDirectory()) {
    for (const entry of await readdir(target)) await scan(path.join(target, entry));
    return;
  }
  if (!/\.(?:md|mjs|js|jsonc?|html|css|yml|yaml|txt)$/i.test(target)) return;
  const text = await readFile(target, 'utf8');
  for (const needle of forbidden) {
    if (text.includes(needle)) {
      throw new Error(`Standalone dependency violation: ${needle} found in ${path.relative(root, target)}`);
    }
  }
}

async function scanBuiltAssets(target) {
  const info = await stat(target);
  if (info.isDirectory()) {
    for (const entry of await readdir(target)) await scanBuiltAssets(path.join(target, entry));
    return;
  }
  if (!/\.(?:html|css|js|mjs|json|xml|txt|svg)$/i.test(target)) return;
  const text = await readFile(target, 'utf8');
  if (/(?<!\/news)\/assets\//.test(text)) {
    throw new Error(`Built newsroom still contains an unscoped root asset reference in ${path.relative(root, target)}`);
  }
}

for (const rel of scanRoots) await scan(resolve(rel));
await scanBuiltAssets(resolve('dist/news'));

console.log(
  `FMBNews standalone verification passed: ${articleDays.length} article date folders, ${briefEditions.length} archived FMB Brief editions, ${worldEditions.length} archived FMB Worldwide editions, live CMS surfaces, Cloudflare /news routing, scoped assets, and no retired-repo dependency.`
);
