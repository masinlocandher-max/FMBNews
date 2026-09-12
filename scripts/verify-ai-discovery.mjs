import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const contentRoot = path.join(root, 'content', 'news', 'articles');
const FOUNDER_ID = 'https://francinemariebautista.com/#person';
const FOUNDER_PROFILE = 'https://francinemariebautista.com/profile/';

async function read(relative) {
  return readFile(path.join(newsRoot, relative), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(`AI discovery verification failed: ${message}`);
}

function discoveryGraph(html, label) {
  const match = html.match(/<script\s+type=["']application\/ld\+json["']\s+data-fmb-discovery-schema>([\s\S]*?)<\/script>/i);
  assert(match, `${label} is missing the canonical discovery JSON-LD graph`);
  try {
    const parsed = JSON.parse(match[1]);
    assert(Array.isArray(parsed?.['@graph']), `${label} discovery schema does not contain @graph`);
    return parsed['@graph'];
  } catch (error) {
    throw new Error(`AI discovery verification failed: ${label} discovery JSON-LD is invalid: ${error.message}`);
  }
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

await access(path.join(newsRoot, 'assets', 'css', 'fmb-about-founder.css'));

const home = await read('index.html');
assert(home.includes('data-fmb-discovery-schema'), 'home is missing the discovery JSON-LD graph');
assert(home.includes('NewsMediaOrganization'), 'home does not identify FMB News as a NewsMediaOrganization');
assert(home.includes('/news/editorial-standards/'), 'home does not expose editorial standards');
assert(home.includes('/news/corrections/'), 'home does not expose the corrections policy');
assert(/max-snippet:-1/i.test(home), 'home does not permit full search snippets');
assert(/max-image-preview:large/i.test(home), 'home does not permit large image previews');

const homeGraph = discoveryGraph(home, 'home');
const homeOrg = homeGraph.find(node => node?.['@type'] === 'NewsMediaOrganization');
const homeFounder = homeGraph.find(node => node?.['@type'] === 'Person' && node?.['@id'] === FOUNDER_ID);
assert(homeOrg?.founder?.['@id'] === FOUNDER_ID, 'NewsMediaOrganization does not point to Francine Marie Bautista as founder');
assert(homeFounder?.name === 'Francine Marie Bautista', 'founder Person node has the wrong name');
assert(homeFounder?.url === FOUNDER_PROFILE, 'founder Person node does not use the canonical profile URL');

const about = await read('about/index.html');
assert(about.includes('data-fmb-founder-section'), 'About page is missing the visible founder section');
assert(about.includes('<h2 id="founderTitle">Francine Marie Bautista</h2>'), 'About page does not visibly identify Francine Marie Bautista as founder');
assert(about.includes('Founder, FMB News · Filipino Media Bulletin'), 'About page founder role is missing');
assert(about.includes('data-fmb-founder-photo-placeholder'), 'About page is missing the explicit founder portrait placeholder');
assert(about.includes(`href="${FOUNDER_PROFILE}"`), 'About page does not link to the canonical founder profile');
assert(about.includes('/news/assets/css/fmb-about-founder.css'), 'About page does not load the founder identity stylesheet');
const founderStart = about.indexOf('<section class="fmb-about-founder"');
const founderEnd = about.indexOf('<section class="fmb-about-standards"', founderStart);
assert(founderStart >= 0 && founderEnd > founderStart, 'About founder section boundaries are invalid');
const founderSection = about.slice(founderStart, founderEnd);
assert(!/<img\b/i.test(founderSection), 'Founder placeholder must not silently become an invented portrait image');

const aboutGraph = discoveryGraph(about, 'About page');
const aboutOrg = aboutGraph.find(node => node?.['@type'] === 'NewsMediaOrganization');
const aboutFounder = aboutGraph.find(node => node?.['@type'] === 'Person' && node?.['@id'] === FOUNDER_ID);
const aboutPage = aboutGraph.find(node => node?.['@type'] === 'AboutPage');
assert(aboutOrg?.founder?.['@id'] === FOUNDER_ID, 'About graph organization founder relationship is missing');
assert(aboutFounder?.name === 'Francine Marie Bautista' && aboutFounder?.url === FOUNDER_PROFILE, 'About graph founder Person node is incomplete');
assert(aboutPage?.mentions?.['@id'] === FOUNDER_ID, 'AboutPage does not mention the canonical founder entity');

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

console.log('AI/search discovery verification passed: canonical publisher and founder identity, visible founder transparency, trust policies, snippet/image permissions, sitemap inclusion, and article publisher schema are present.');
