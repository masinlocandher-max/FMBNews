import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(root, 'content', 'news', 'articles');
const outputDir = path.join(root, 'dist', 'news', 'sports');
const fallback = '/assets/images/news/fmb-news-editorial-fallback.svg';

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

async function walk(dir) {
  const files = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return files; }
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (entry.isFile() && target.endsWith('.json')) files.push(target);
  }
  return files;
}

function isSports(story) {
  const category = String(story?.category || '').trim().toLowerCase();
  const kicker = String(story?.kicker || '').toLowerCase();
  return category === 'sports' || category === 'sport' || /(^|[ ·|])sports?([ ·|]|$)/i.test(kicker);
}

async function sportsStories() {
  const stories = [];
  for (const file of await walk(contentRoot)) {
    try {
      const story = JSON.parse(await readFile(file, 'utf8'));
      if (story.status === 'published' && story.slug && story.headline && story.publishedAt && isSports(story)) stories.push(story);
    } catch {}
  }
  return stories.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

function imageFor(story) {
  const url = String(story?.image?.url || '').trim();
  return /^https?:\/\//i.test(url) || url.startsWith('/') ? url : fallback;
}

function storyCard(story) {
  const date = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(story.publishedAt));
  return `<article class="sports-story"><a href="/news/${esc(story.slug)}/"><img src="${esc(imageFor(story))}" alt="${esc(story.image?.alt || story.headline)}" loading="lazy"><div><span>${esc(story.kicker || 'SPORTS')}</span><h2>${esc(story.headline)}</h2><p>${esc(story.deck || '')}</p><time datetime="${esc(story.publishedAt)}">${esc(date)} · PHT</time></div></a></article>`;
}

const stories = await sportsStories();
const listing = stories.length
  ? `<div class="sports-story-grid">${stories.map(storyCard).join('')}</div>`
  : `<div class="sports-empty"><span>Sports desk</span><h2>No Sports report is published yet.</h2><p>This desk is active and will automatically surface verified Sports stories as soon as they are published. FMB News will not fill it with unrelated coverage just to make the page look busy.</p><a href="/news/archive/">Read the latest FMB News</a></div>`;

const html = `<!doctype html>
<html lang="en-PH">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>Sports | FMB News · Filipino Media Bulletin</title>
  <meta name="description" content="FMB News Sports coverage: verified reports on competitions, athletes, leagues, and major sporting developments relevant to Filipino readers.">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
  <link rel="canonical" href="https://www.francinemariebautista.com/news/sports/">
  <meta property="og:title" content="Sports | FMB News">
  <meta property="og:description" content="Verified Sports coverage from FMB News, Filipino Media Bulletin.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.francinemariebautista.com/news/sports/">
  <meta property="og:site_name" content="FMB News">
  <link rel="stylesheet" href="/assets/css/fmb-news-editorial-ia.css?v=20260912-desk-v1">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Sports | FMB News',
    url: 'https://www.francinemariebautista.com/news/sports/',
    description: 'Verified Sports coverage from FMB News, Filipino Media Bulletin.',
    inLanguage: 'en-PH',
    isPartOf: { '@type': 'WebSite', name: 'FMB News', url: 'https://www.francinemariebautista.com/news/' },
  }).replaceAll('<', '\\u003c')}</script>
</head>
<body class="fmb-news-route fmb-sports-page">
  <main class="sports-main">
    <section class="sports-hero" aria-labelledby="sports-title">
      <div class="sports-shell"><p>FMB News · Editorial Desk</p><h1 id="sports-title">Sports</h1><span></span><p>Verified competition, athlete, league, and major sporting developments, with Filipino relevance kept clear.</p></div>
    </section>
    <section class="sports-content" aria-label="Sports reports"><div class="sports-shell">${listing}</div></section>
  </main>
</body>
</html>`;

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
console.log(`Rendered FMB Sports desk with ${stories.length} published Sports ${stories.length === 1 ? 'story' : 'stories'}; empty state remains explicit when no Sports inventory exists.`);
