import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const contentRoot = path.join(root, 'content', 'news', 'articles');

async function read(relative) {
  return readFile(path.join(newsRoot, relative), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(`AI discovery verification failed: ${message}`);
}

async function walkJson(dir) {
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walkJson(target));
    else if (entry.isFile() && entry.name.endsWith('.json')) out.push(target);
  }
  return out;
}

const home = await read('index.html');
assert(home.includes('data-fmb-discovery-schema'), 'home is missing the discovery JSON-LD graph');
assert(home.includes('NewsMediaOrganization'), 'home does not identify FMB News as a NewsMediaOrganization');
assert(home.includes('/news/editorial-standards/'), 'home does not expose editorial standards');
assert(home.includes('/news/corrections/'), 'home does not expose the corrections policy');
assert(/max-snippet:-1/i.test(home), 'home does not permit full search snippets');
assert(/max-image-preview:large/i.test(home), 'home does not permit large image previews');

const standards = await read('editorial-standards/index.html');
assert(standards.includes('https://www.francinemariebautista.com/news/editorial-standards/'), 'editorial standards canonical URL is missing');
assert(/Evidence before conclusion/i.test(standards), 'editorial standards content is incomplete');

const corrections = await read('corrections/index.html');
assert(corrections.includes('https://www.francinemariebautista.com/news/corrections/'), 'corrections canonical URL is missing');
assert(/Material errors are corrected clearly/i.test(corrections), 'corrections policy content is incomplete');

const sitemap = await read('sitemap.xml');
assert(sitemap.includes('/news/editorial-standards/'), 'canonical sitemap omits editorial standards');
assert(sitemap.includes('/news/corrections/'), 'canonical sitemap omits corrections policy');

let articleChecked = false;
for (const file of await walkJson(contentRoot)) {
  let story;
  try { story = JSON.parse(await readFile(file, 'utf8')); } catch { continue; }
  if (story.status !== 'published' || !story.slug) continue;
  try {
    const article = await read(`${story.slug}/index.html`);
    assert(article.includes('https://www.francinemariebautista.com/news/#organization'), `article ${story.slug} does not reference the canonical publisher entity`);
    assert(/"isAccessibleForFree":true/.test(article), `article ${story.slug} does not expose free-access status`);
    articleChecked = true;
    break;
  } catch {}
}
assert(articleChecked, 'no published article was available for structured-data verification');

console.log('AI/search discovery verification passed: canonical publisher identity, trust policies, snippet/image permissions, sitemap inclusion, and article publisher schema are present.');
