import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const homePath = path.join(root, 'dist', 'index.html');
const sitemapPath = path.join(root, 'dist', 'sitemap.xml');
const imageName = 'fmb-news-luis-lpa-habagat-august-4-2026.jpg';
const imageUrl = `/assets/images/news/${imageName}`;
const published = '2026-08-04T10:00:00+08:00';
const publishedLabel = '4 August 2026, 10:00 a.m. PHT';

const story = {
  slug: 'luis-weakens-low-pressure-area-habagat-hazards-august-4-2026',
  section: 'Environment',
  kicker: 'Environment · Weather · Public safety',
  read: '5 min read',
  title: 'Luis Weakens Into Low Pressure Area, but Habagat Hazards Continue',
  meta: 'PAGASA said Luis weakened into a low pressure area near Peñablanca, Cagayan, while heavy rain, strong gusts and rough seas may still affect parts of the Philippines.',
  deck: 'The cyclone warning has ended, but PAGASA says heavy rain, strong to gale-force gusts and rough seas remain possible in several areas.',
  image: imageUrl,
  width: 1080,
  height: 1080,
  alt: 'FMB News editorial illustration of people walking through heavy rain for a report on Luis weakening into a low pressure area while Habagat hazards continue',
  credit: 'Editorial illustration by FMB News. Reporting is based on DOST-PAGASA Tropical Cyclone Bulletin No. 13, issued at 11:00 p.m. on August 3, 2026.',
  body: [
    ['What changed', 'PAGASA said Luis weakened into a low pressure area at 8:00 p.m. on August 3 while it was near Peñablanca, Cagayan. The agency ended the tropical cyclone warning and reported that no Tropical Cyclone Wind Signal remained in effect.'],
    ['Hazards that remain', 'The weakening of Luis does not immediately remove the weather threat. PAGASA said the Southwest Monsoon may still bring strong to gale-force gusts over most of Luzon and the Visayas on August 4, along with several areas in Mindanao. Heavy rainfall and gusty conditions may still occur in some localities.'],
    ['Sea conditions', 'PAGASA forecast waves of up to 3.0 metres along the western seaboard of Pangasinan and up to 2.5 metres along the seaboards of Isabela and Zambales. Small craft operators, including motorbancas, were advised to avoid or use extreme caution in affected waters.'],
    ['What remains uncertain', 'PAGASA said the remnant low may move east-northeast toward the Philippine Sea before becoming absorbed into the circulation of Tropical Cyclone Dolphin. The exact location and timing of the heaviest rain and strongest gusts can still change, so local rainfall, thunderstorm and flood advisories remain important.'],
    ['Why this matters to Filipinos', 'A cyclone can weaken while dangerous conditions continue. Flooding, landslides, rough seas and strong gusts can disrupt work, classes, road travel, fishing and farming. Families should monitor PAGASA and local government advisories instead of assuming the danger has ended simply because Luis is no longer classified as a tropical cyclone.']
  ],
  sources: [
    ['DOST-PAGASA Tropical Cyclone Bulletin No. 13 for Luis', 'https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin'],
    ['DOST-PAGASA track and intensity map for the low pressure area formerly Luis', 'https://pubfiles.pagasa.dost.gov.ph/tamss/weather/track_luis.png']
  ]
};

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function storyPage() {
  const url = `https://www.francinemariebautista.com/news/${story.slug}/`;
  const body = story.body.map(([heading, text]) => `<h2>${esc(heading)}</h2><p>${esc(text)}</p>`).join('\n');
  const sourceLinks = story.sources.map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`).join('');
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.title,
    description: story.meta,
    datePublished: published,
    dateModified: published,
    inLanguage: 'en-PH',
    isAccessibleForFree: true,
    author: { '@type': 'Person', name: 'Francine Marie Bautista', url: 'https://www.francinemariebautista.com/aboutfmb/' },
    publisher: { '@type': 'Organization', name: 'FMB News', url: 'https://www.francinemariebautista.com/fmbnews/' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: story.section,
    image: [{ '@type': 'ImageObject', url: `https://www.francinemariebautista.com${story.image}`, width: story.width, height: story.height, caption: story.credit }]
  });

  return `<!doctype html>
<html lang="en-PH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(story.title)} | FMB News</title>
<meta name="description" content="${esc(story.meta)}">
<meta name="author" content="Francine Marie Bautista">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:locale" content="en_PH">
<meta property="og:site_name" content="FMB News">
<meta property="og:title" content="${esc(story.title)}">
<meta property="og:description" content="${esc(story.meta)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://www.francinemariebautista.com${story.image}">
<meta property="og:image:width" content="${story.width}">
<meta property="og:image:height" content="${story.height}">
<meta property="og:image:alt" content="${esc(story.alt)}">
<meta property="article:published_time" content="${published}">
<meta property="article:modified_time" content="${published}">
<meta property="article:section" content="${esc(story.section)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(story.title)}">
<meta name="twitter:description" content="${esc(story.meta)}">
<meta name="twitter:image" content="https://www.francinemariebautista.com${story.image}">
<script type="application/ld+json">${schema}</script>
<link rel="stylesheet" href="/assets/css/site.css?v=20260716g">
<link rel="stylesheet" href="/assets/css/news-channel.css?v=20260720a">
<link rel="stylesheet" href="/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3">
</head>
<body class="news-route news-story-route">
<header class="nc-site-header"><div class="nc-brandline"><div class="wrap"><span class="nc-network-label">FMB News</span></div></div></header>
<main id="story">
  <div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/fmbnews/">Back to headlines</a><span>${publishedLabel}</span></div></div>
  <header class="nc-article-hero"><div class="wrap"><p class="nc-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1><p class="nc-article-deck">${esc(story.deck)}</p><div class="nc-article-meta"><span>By Francine Marie Bautista</span><span>${publishedLabel}</span><span>${story.read}</span></div></div></header>
  <section class="nc-story-media"><div class="wrap"><figure class="news-visual"><img src="${story.image}" width="${story.width}" height="${story.height}" fetchpriority="high" decoding="async" alt="${esc(story.alt)}"><figcaption>${esc(story.credit)}</figcaption></figure></div></section>
  <article class="nc-article"><div class="wrap nc-article-layout"><div class="nc-story-body"><div class="nc-factbox"><p><strong>Weather update:</strong> Luis is no longer classified as a tropical cyclone, but PAGASA warns that rain, strong gusts and rough seas may continue.</p></div><p><strong>${esc(story.deck)}</strong></p>${body}<section class="nc-sources"><h2>Sources and public record</h2>${sourceLinks}</section></div></div></article>
</main>
<footer class="nc-footer"><div class="wrap"><span>© 2026 Francine Marie Bautista.</span></div></footer>
</body>
</html>`;
}

await mkdir(newsRoot, { recursive: true });

const directory = path.join(newsRoot, story.slug);
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, 'index.html'), storyPage(), 'utf8');

const href = `/news/${story.slug}/`;
let landing = await readFile(landingPath, 'utf8');
if (!landing.includes(href)) {
  const marker = '<div class="nc-rundown-head">';
  const firstArticle = landing.indexOf('<article class="nc-rundown-story"', landing.indexOf(marker));
  if (firstArticle < 0) throw new Error('Luis LPA update insertion point not found');
  const card = `<article class="nc-rundown-story" data-category="environment"><a href="${href}"><span class="nc-rundown-number">10AM</span><figure class="news-visual"><img src="${story.image}" width="1080" height="1080" loading="lazy" decoding="async" alt="${esc(story.alt)}"><figcaption>${esc(story.credit)}</figcaption></figure><div><p>${esc(story.kicker)}</p><h3>${esc(story.title)}</h3><span>${story.read}</span></div></a></article>`;
  landing = `${landing.slice(0, firstArticle)}${card}${landing.slice(firstArticle)}`;
  landing = landing.replace('<div class="nc-wire-track">', `<div class="nc-wire-track"><span>${esc(story.title)}</span>`);
}
landing = landing.replace(/<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/, `<time data-news-updated>Updated ${publishedLabel}</time>`);
await writeFile(landingPath, landing, 'utf8');

let home = await readFile(homePath, 'utf8');
home = home.replace(/<article class="fmb-approved-news-lead">[\s\S]*?<\/article>/, `<article class="fmb-approved-news-lead"><img src="${story.image}" width="1080" height="1080" loading="lazy" decoding="async" alt="${esc(story.alt)}"><div><small>August 4 · 10:00 AM Update</small><h3>${esc(story.title)}</h3></div></article>`);
home = home.replace(/<div class="fmb-approved-news-list">[\s\S]*?<\/div>/, `<div class="fmb-approved-news-list"><a href="${href}"><span>${esc(story.title)}</span><time>${esc(story.section)}</time></a></div>`);
await writeFile(homePath, home, 'utf8');

let sitemap = await readFile(sitemapPath, 'utf8');
const loc = `https://www.francinemariebautista.com/news/${story.slug}/`;
if (!sitemap.includes(loc)) {
  sitemap = sitemap.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>2026-08-04</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n</urlset>`);
}
await writeFile(sitemapPath, sitemap, 'utf8');

console.log('Published the August 4 Luis low pressure area and Habagat hazards update with a 1080x1080 FMB News cover.');
