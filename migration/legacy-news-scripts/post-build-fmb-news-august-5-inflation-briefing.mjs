import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const homePath = path.join(root, 'dist', 'index.html');
const sitemapPath = path.join(root, 'dist', 'sitemap.xml');

const story = {
  slug: 'psa-july-2026-inflation-briefing-august-5',
  section: 'Business and Economy',
  category: 'business',
  kicker: 'Business and Economy · Philippines · Cost of living',
  read: '4 min read',
  title: 'PSA Holds Briefing on July 2026 Inflation',
  meta: 'The Philippine Statistics Authority scheduled its official briefing on the July 2026 inflation report for August 5 at 9:00 a.m.',
  deck: 'The official release is expected to show how prices moved in July and which goods and services drove the change.',
  image: '/assets/images/news/fmb-news-july-inflation-briefing-august-5-2026.svg',
  width: 1200,
  height: 630,
  alt: 'FMB News editorial graphic for the Philippine Statistics Authority briefing on July 2026 inflation',
  credit: 'FMB News editorial graphic. Source: Philippine Statistics Authority.',
  published: '2026-08-05T10:55:00+08:00',
  publishedLabel: '5 August 2026, 10:55 a.m. PHT',
  body: [
    ['What happened', 'The Philippine Statistics Authority scheduled a press conference on the July 2026 inflation report for August 5 at 9:00 a.m. The briefing was set to be led by National Statistician and Civil Registrar General Claire Dennis S. Mapa.'],
    ['What the report covers', 'The monthly consumer price report tracks the year-on-year movement in the prices of goods and services purchased by households. It normally includes headline inflation, core inflation, regional figures, and the main commodity groups that pushed the rate higher or lower.'],
    ['Latest confirmed comparison', 'The latest fully posted national report before the July release showed headline inflation at 6.4 percent in June 2026, down from 6.8 percent in May. The June slowdown was linked mainly to slower price increases in transport and food and non-alcoholic beverages.'],
    ['Why it matters to Filipinos', 'Inflation affects the purchasing power of wages, household budgets, transport costs, food prices, borrowing conditions, and government economic policy. The July report will help show whether price pressures continued to ease or remained elevated.'],
    ['What happens next', 'FMB News will update this report once the complete July 2026 inflation tables and official summary are available from the Philippine Statistics Authority. Any numerical update will be attributed directly to the PSA release.']
  ],
  sources: [
    ['PSA announcement: Press Conference on the July 2026 Inflation', 'https://psa.gov.ph/price-indices/cpi-ir'],
    ['PSA Summary Inflation Report for June 2026', 'https://psa.gov.ph/price-indices/cpi-ir']
  ]
};

function esc(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function page() {
  const url = `https://www.francinemariebautista.com/news/${story.slug}/`;
  const body = story.body.map(([heading, text]) => `<h2>${esc(heading)}</h2><p>${esc(text)}</p>`).join('\n');
  const sources = story.sources.map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`).join('');
  const schema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'NewsArticle', headline: story.title, description: story.meta,
    datePublished: story.published, dateModified: story.published, inLanguage: 'en-PH', isAccessibleForFree: true,
    author: { '@type': 'Organization', name: 'FMB News Desk' },
    publisher: { '@type': 'Organization', name: 'FMB News', url: 'https://www.francinemariebautista.com/fmbnews/' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url }, articleSection: story.section,
    image: [{ '@type': 'ImageObject', url: `https://www.francinemariebautista.com${story.image}`, width: story.width, height: story.height, caption: story.credit }]
  });
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(story.title)} | FMB News</title><meta name="description" content="${esc(story.meta)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:site_name" content="FMB News"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.meta)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://www.francinemariebautista.com${story.image}"><meta property="article:published_time" content="${story.published}"><meta property="article:section" content="${esc(story.section)}"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${schema}</script><link rel="stylesheet" href="/assets/css/site.css?v=20260716g"><link rel="stylesheet" href="/assets/css/news-channel.css?v=20260720a"><link rel="stylesheet" href="/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3"></head><body class="news-route news-story-route"><header class="nc-site-header"><div class="nc-brandline"><div class="wrap"><span class="nc-network-label">FMB News</span></div></div></header><main><div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/fmbnews/">Back to headlines</a><span>${story.publishedLabel}</span></div></div><header class="nc-article-hero"><div class="wrap"><p class="nc-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1><p class="nc-article-deck">${esc(story.deck)}</p><div class="nc-article-meta"><span>By FMB News Desk</span><span>${story.publishedLabel}</span><span>${story.read}</span></div></div></header><section class="nc-story-media"><div class="wrap"><figure class="news-visual"><img src="${story.image}" width="${story.width}" height="${story.height}" fetchpriority="high" alt="${esc(story.alt)}"><figcaption>${esc(story.credit)}</figcaption></figure></div></section><article class="nc-article"><div class="wrap nc-article-layout"><div class="nc-story-body"><div class="nc-factbox"><p><strong>Status:</strong> Official briefing held; complete July figures should be inserted only after the PSA tables are confirmed.</p></div><p><strong>${esc(story.deck)}</strong></p>${body}<section class="nc-sources"><h2>Sources and public record</h2>${sources}</section></div></div></article></main><footer class="nc-footer"><div class="wrap"><span>© 2026 Francine Marie Bautista.</span></div></footer></body></html>`;
}

await mkdir(newsRoot, { recursive: true });
const directory = path.join(newsRoot, story.slug);
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, 'index.html'), page(), 'utf8');

const href = `/news/${story.slug}/`;
let landing = await readFile(landingPath, 'utf8');
if (!landing.includes(href)) {
  const marker = '<div class="nc-rundown-head">';
  const first = landing.indexOf('<article class="nc-rundown-story"', landing.indexOf(marker));
  if (first < 0) {
    console.log('Skipped obsolete inflation landing insertion; route-based recovery will collect the published report.');
  } else {
    const card = `<article class="nc-rundown-story" data-category="${story.category}"><a href="${href}"><span class="nc-rundown-number">10:55</span><figure class="news-visual"><img src="${story.image}" width="1200" height="630" loading="lazy" decoding="async" alt="${esc(story.alt)}"><figcaption>${esc(story.credit)}</figcaption></figure><div><p>${esc(story.kicker)}</p><h3>${esc(story.title)}</h3><span>${story.read}</span></div></a></article>`;
    landing = `${landing.slice(0, first)}${card}${landing.slice(first)}`;
    landing = landing.replace('<div class="nc-wire-track">', `<div class="nc-wire-track"><span>${esc(story.title)}</span>`);
  }
}
landing = landing.replace(/<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/, `<time data-news-updated>Updated ${story.publishedLabel}</time>`);
await writeFile(landingPath, landing, 'utf8');

let home = await readFile(homePath, 'utf8');
home = home.replace(/<article class="fmb-approved-news-lead">[\s\S]*?<\/article>/, `<article class="fmb-approved-news-lead"><img src="${story.image}" width="1200" height="630" loading="lazy" decoding="async" alt="${esc(story.alt)}"><div><small>August 5 · 10:55 AM Update</small><h3>${esc(story.title)}</h3></div></article>`);
home = home.replace(/<div class="fmb-approved-news-list">[\s\S]*?<\/div>/, `<div class="fmb-approved-news-list"><a href="${href}"><span>${esc(story.title)}</span><time>${esc(story.section)}</time></a></div>`);
await writeFile(homePath, home, 'utf8');

let sitemap = await readFile(sitemapPath, 'utf8');
const loc = `https://www.francinemariebautista.com/news/${story.slug}/`;
if (!sitemap.includes(loc)) sitemap = sitemap.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>2026-08-05</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n</urlset>`);
await writeFile(sitemapPath, sitemap, 'utf8');
console.log('Published the FMB News July 2026 inflation briefing article and branded cover.');
