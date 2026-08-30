import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const imageDir = path.join(root, 'dist', 'assets', 'images', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const homePath = path.join(root, 'dist', 'index.html');
const sitemapPath = path.join(root, 'dist', 'sitemap.xml');
const imageName = 'fmb-news-hormuz-ship-strike-talks-august-4-2026.jpg';
const imagePath = path.join(imageDir, imageName);
const imageUrl = `/assets/images/news/${imageName}`;
const published = '2026-08-04T12:00:00+08:00';
const publishedLabel = '4 August 2026, 12:00 p.m. PHT';
const photoPage = 'https://commons.wikimedia.org/wiki/File:Iss069e056939.jpg';
const photoDownload = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Iss069e056939.jpg?width=1800';
const nasaPhotoDownload = 'https://images-assets.nasa.gov/image/iss069e056939/iss069e056939~orig.jpg';

const story = {
  slug: 'hormuz-ship-strike-us-iran-talks-uncertain-august-4-2026',
  section: 'Money',
  kicker: 'Money · Energy · Global shipping',
  read: '5 min read',
  title: 'Ship Strike Deepens Doubts Over U.S.-Iran Talks and Hormuz Security',
  meta: 'A cargo vessel was reported struck in the Strait of Hormuz while Washington and Tehran gave conflicting accounts of whether direct negotiations were underway.',
  deck: 'The attack adds a concrete maritime risk to a diplomatic picture that remains unsettled, with possible consequences for energy and shipping costs.',
  image: imageUrl,
  width: 1080,
  height: 1080,
  alt: 'FMB News cover using a NASA satellite photograph of the Strait of Hormuz for a report on a vessel strike and uncertain United States-Iran talks',
  credit: 'PHOTO: NASA Johnson Space Center via Wikimedia Commons. File photograph of the Strait of Hormuz from the International Space Station, August 14, 2023. Public domain.',
  body: [
    ['Developing story', 'Reuters reported on August 4 that a cargo vessel was struck in the Strait of Hormuz as uncertainty continued over possible negotiations between the United States and Iran. The identity of the attacker and the full circumstances of the incident were not established in the information available at publication time.'],
    ['What is confirmed', 'The vessel incident was reported in a waterway already facing heightened security risks. Separate Reuters shipping data showed traffic through Hormuz remained limited, although tracked vessel counts do not include ships operating with transponders switched off.'],
    ['Conflicting claims about talks', 'United States President Donald Trump said discussions with Iran were taking place. Iran publicly denied that direct talks or a meeting with the United States had been arranged, while confirming separate discussions with Oman about navigation through the Strait of Hormuz. These statements cannot both describe the same diplomatic process, so FMB News is treating the status of direct negotiations as unresolved.'],
    ['What remains uncertain', 'It is not yet confirmed who carried out the vessel strike, whether the incident will materially reduce shipping traffic, or whether the diplomatic contacts described by Washington will lead to a formal agreement. Oil and financial markets may react before those questions are settled.'],
    ['Why this matters to Filipinos', 'The Philippines depends on imported fuel and international shipping. Prolonged danger in the Strait of Hormuz can increase transport, insurance and energy costs that may eventually affect pump prices, electricity, food distribution and household budgets. Filipino seafarers working in the region may also face greater operational and personal risk.']
  ],
  sources: [
    ['Reuters report on the vessel strike and conflicting U.S.-Iran accounts, August 4, 2026', 'https://www.reuters.com/world/middle-east/status-us-iran-talks-uncertain-ship-struck-hormuz-2026-08-04/'],
    ['Reuters report on Gulf shipping traffic, August 4, 2026', 'https://www.reuters.com/world/middle-east/shipping-traffic-key-gulf-waterways-little-changed-uncertain-peace-talks-2026-08-04/'],
    ['U.S. Maritime Administration advisory for commercial vessels in the Persian Gulf and Strait of Hormuz', 'https://www.maritime.dot.gov/msci/2026-004-persian-gulf-strait-hormuz-and-gulf-oman-iranian-attacks-commercial-vessels'],
    ['Wikimedia Commons image and public-domain record', photoPage]
  ]
};

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const svgEsc = value => esc(value).replaceAll("'", '&apos;');

function coverSvg() {
  const sourceLabel = story.credit.startsWith('PHOTO: NASA')
    ? 'PHOTO: NASA JOHNSON SPACE CENTER'
    : 'EDITORIAL ILLUSTRATION: FMB NEWS';
  return `<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#080d2f" stop-opacity=".98"/><stop offset=".64" stop-color="#130c3f" stop-opacity=".88"/><stop offset="1" stop-color="#35106a" stop-opacity=".26"/></linearGradient></defs>
    <rect width="1080" height="1080" fill="url(#shade)"/>
    <g transform="translate(54 44)"><path d="M0 78 A78 78 0 0 1 78 0" fill="none" stroke="#fff" stroke-width="18"/><path d="M25 78 A53 53 0 0 1 78 25" fill="none" stroke="#e8ad22" stroke-width="18"/><text x="105" y="51" fill="#fff" font-family="Georgia,serif" font-size="70" font-weight="700">FMB</text><text x="108" y="91" fill="#bd82ff" font-family="Arial,sans-serif" font-size="28" font-weight="700" letter-spacing="12">NEWS</text></g>
    <text x="55" y="172" fill="#fff" font-family="Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="1.5">CLEAR NEWS. REAL IMPACT.</text>
    <rect x="55" y="213" width="116" height="34" rx="17" fill="#4b1c87"/><text x="73" y="236" fill="#fff" font-family="Arial,sans-serif" font-size="17" font-weight="700">MONEY</text>
    <text x="55" y="292" fill="#e8ad22" font-family="Arial,sans-serif" font-size="25">August 4, 2026</text>
    <text x="55" y="380" fill="#fff" font-family="Georgia,serif" font-size="68" font-weight="700">SHIP STRIKE</text>
    <text x="55" y="455" fill="#fff" font-family="Georgia,serif" font-size="68" font-weight="700">DEEPENS</text>
    <text x="55" y="530" fill="#e8ad22" font-family="Georgia,serif" font-size="68" font-weight="700">HORMUZ</text>
    <text x="55" y="605" fill="#fff" font-family="Georgia,serif" font-size="68" font-weight="700">UNCERTAINTY</text>
    <text x="58" y="668" fill="#eeeaf4" font-family="Arial,sans-serif" font-size="27"><tspan x="58" dy="0">Washington and Tehran give conflicting</tspan><tspan x="58" dy="36">accounts of whether direct talks are underway.</tspan></text>
    <rect x="55" y="784" width="655" height="112" rx="18" fill="#4b1c87" fill-opacity=".88" stroke="#e8ad22" stroke-width="2"/><text x="82" y="821" fill="#e8ad22" font-family="Arial,sans-serif" font-size="21" font-weight="700">WHY THIS MATTERS TO FILIPINOS</text><text x="82" y="854" fill="#fff" font-family="Arial,sans-serif" font-size="21"><tspan x="82" dy="0">Shipping danger can raise fuel, insurance and</tspan><tspan x="82" dy="27">transport costs while putting seafarers at risk.</tspan></text>
    <text x="1030" y="924" text-anchor="end" fill="#fff" font-family="Arial,sans-serif" font-size="15">${svgEsc(sourceLabel)}</text>
    <rect y="948" width="1080" height="132" fill="#080d2f"/><rect y="946" width="1080" height="3" fill="#e8ad22"/><text x="55" y="1003" fill="#fff" font-family="Georgia,serif" font-size="30" font-weight="700">FMB NEWS</text><text x="250" y="1000" fill="#fff" font-family="Arial,sans-serif" font-size="18">Clear news. Real impact. Always for Filipinos.</text><text x="1025" y="1046" text-anchor="end" fill="#e8ad22" font-family="Arial,sans-serif" font-size="18">francinemariebautista.com/fmbnews</text>
  </svg>`;
}

function editorialFallback() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1200"><defs><linearGradient id="ocean" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#17385f"/><stop offset=".55" stop-color="#446b89"/><stop offset="1" stop-color="#b58c59"/></linearGradient><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency=".009" numOctaves="4" seed="11"/><feColorMatrix values=".3 0 0 0 0 .3 0 0 0 0 .3 0 0 0 0 0 0 .28 0"/></filter></defs><rect width="1800" height="1200" fill="url(#ocean)"/><rect width="1800" height="1200" filter="url(#noise)" opacity=".55"/><path d="M0 770C280 630 490 650 710 740c240 98 390 65 570-35 170-95 340-75 520 30v465H0Z" fill="#c4a16d" opacity=".7"/><path d="M0 470c240-80 410-55 620 45 260 125 470 85 690-40 190-110 330-90 490-10" fill="none" stroke="#d8e5ed" stroke-opacity=".25" stroke-width="18"/></svg>`);
}

async function fetchCoverSource() {
  for (const url of [photoDownload, nasaPhotoDownload]) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'user-agent': 'FMB-News-Cover-Builder/1.0' },
      });
      if (!response.ok) throw new Error(`source returned ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 1000) throw new Error('source returned an empty image');
      return bytes;
    } catch (error) {
      console.warn(`Hormuz cover source unavailable at ${url}: ${error.message}`);
    }
  }

  story.alt = 'FMB News editorial illustration for a report on a vessel strike and uncertainty surrounding United States-Iran talks and Strait of Hormuz security';
  story.credit = 'EDITORIAL ILLUSTRATION: FMB News. The approved NASA source photograph was unavailable during this build; no substitute photograph was falsely attributed.';
  console.warn('Using a clearly labeled FMB News editorial illustration for the Hormuz report.');
  return editorialFallback();
}

async function buildCover() {
  await mkdir(imageDir, { recursive: true });
  const background = await fetchCoverSource();
  await sharp(background).resize(1080, 1080, { fit: 'cover', position: 'centre' }).composite([{ input: Buffer.from(coverSvg()) }]).jpeg({ quality: 91, chromaSubsampling: '4:4:4' }).toFile(imagePath);
}

function storyPage() {
  const url = `https://www.francinemariebautista.com/news/${story.slug}/`;
  const body = story.body.map(([h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('');
  const sourceLinks = story.sources.map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`).join('');
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'NewsArticle', headline: story.title, description: story.meta, datePublished: published, dateModified: published, inLanguage: 'en-PH', isAccessibleForFree: true, author: { '@type': 'Person', name: 'Francine Marie Bautista', url: 'https://www.francinemariebautista.com/aboutfmb/' }, publisher: { '@type': 'Organization', name: 'FMB News', url: 'https://www.francinemariebautista.com/fmbnews/' }, mainEntityOfPage: { '@type': 'WebPage', '@id': url }, articleSection: story.section, image: [{ '@type': 'ImageObject', url: `https://www.francinemariebautista.com${story.image}`, width: 1080, height: 1080, caption: story.credit }] });
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(story.title)} | FMB News</title><meta name="description" content="${esc(story.meta)}"><meta name="author" content="Francine Marie Bautista"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:locale" content="en_PH"><meta property="og:site_name" content="FMB News"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.meta)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://www.francinemariebautista.com${story.image}"><meta property="og:image:width" content="1080"><meta property="og:image:height" content="1080"><meta property="og:image:alt" content="${esc(story.alt)}"><meta property="article:published_time" content="${published}"><meta property="article:modified_time" content="${published}"><meta property="article:section" content="Money"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(story.title)}"><meta name="twitter:description" content="${esc(story.meta)}"><meta name="twitter:image" content="https://www.francinemariebautista.com${story.image}"><script type="application/ld+json">${schema}</script><link rel="stylesheet" href="/assets/css/site.css?v=20260716g"><link rel="stylesheet" href="/assets/css/news-channel.css?v=20260720a"><link rel="stylesheet" href="/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3"></head><body class="news-route news-story-route"><header class="nc-site-header"><div class="nc-brandline"><div class="wrap"><span class="nc-network-label">FMB News</span></div></div></header><main id="story"><div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/fmbnews/">Back to headlines</a><span>${publishedLabel}</span></div></div><header class="nc-article-hero"><div class="wrap"><p class="nc-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1><p class="nc-article-deck">${esc(story.deck)}</p><div class="nc-article-meta"><span>By Francine Marie Bautista</span><span>${publishedLabel}</span><span>${story.read}</span></div></div></header><section class="nc-story-media"><div class="wrap"><figure class="news-visual"><img src="${story.image}" width="1080" height="1080" fetchpriority="high" decoding="async" alt="${esc(story.alt)}"><figcaption>${esc(story.credit)} <a href="${photoPage}" target="_blank" rel="noopener noreferrer">Photo source</a></figcaption></figure></div></section><article class="nc-article"><div class="wrap nc-article-layout"><div class="nc-story-body"><div class="nc-factbox"><p><strong>Developing story:</strong> The vessel strike is confirmed as a reported incident, but responsibility and the status of direct U.S.-Iran talks remain unresolved.</p></div><p><strong>${esc(story.deck)}</strong></p>${body}<section class="nc-sources"><h2>Sources and public record</h2>${sourceLinks}</section></div></div></article></main><footer class="nc-footer"><div class="wrap"><span>© 2026 Francine Marie Bautista.</span></div></footer></body></html>`;
}

await buildCover();
await mkdir(newsRoot, { recursive: true });
const directory = path.join(newsRoot, story.slug);
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, 'index.html'), storyPage(), 'utf8');
const href = `/news/${story.slug}/`;
let landing = await readFile(landingPath, 'utf8');
if (!landing.includes(href)) {
  const marker = '<div class="nc-rundown-head">';
  const firstArticle = landing.indexOf('<article class="nc-rundown-story"', landing.indexOf(marker));
  if (firstArticle < 0) throw new Error('Noon report insertion point not found');
  const card = `<article class="nc-rundown-story" data-category="money"><a href="${href}"><span class="nc-rundown-number">12PM</span><figure class="news-visual"><img src="${story.image}" width="1080" height="1080" loading="lazy" decoding="async" alt="${esc(story.alt)}"><figcaption>${esc(story.credit)}</figcaption></figure><div><p>${esc(story.kicker)}</p><h3>${esc(story.title)}</h3><span>${story.read}</span></div></a></article>`;
  landing = `${landing.slice(0, firstArticle)}${card}${landing.slice(firstArticle)}`;
  landing = landing.replace('<div class="nc-wire-track">', `<div class="nc-wire-track"><span>${esc(story.title)}</span>`);
}
landing = landing.replace(/<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/, `<time data-news-updated>Updated ${publishedLabel}</time>`);
await writeFile(landingPath, landing, 'utf8');
let home = await readFile(homePath, 'utf8');
home = home.replace(/<article class="fmb-approved-news-lead">[\s\S]*?<\/article>/, `<article class="fmb-approved-news-lead"><img src="${story.image}" width="1080" height="1080" loading="lazy" decoding="async" alt="${esc(story.alt)}"><div><small>August 4 · 12:00 PM Update</small><h3>${esc(story.title)}</h3></div></article>`);
home = home.replace(/<div class="fmb-approved-news-list">[\s\S]*?<\/div>/, `<div class="fmb-approved-news-list"><a href="${href}"><span>${esc(story.title)}</span><time>${esc(story.section)}</time></a></div>`);
await writeFile(homePath, home, 'utf8');
let sitemap = await readFile(sitemapPath, 'utf8');
const loc = `https://www.francinemariebautista.com/news/${story.slug}/`;
if (!sitemap.includes(loc)) sitemap = sitemap.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>2026-08-04</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n</urlset>`);
await writeFile(sitemapPath, sitemap, 'utf8');
console.log('Published the verified August 4 noon Hormuz shipping and diplomacy report with a 1080x1080 FMB News cover.');