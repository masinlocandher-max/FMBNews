import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const homePath = path.join(root, 'dist', 'index.html');
const sitemapPath = path.join(root, 'dist', 'sitemap.xml');
const artDir = path.join(root, 'dist', 'assets', 'images', 'news');
const artPath = path.join(artDir, 'fmb-news-august-3-morning-2026.svg');
const published = '2026-08-03T08:00:00+08:00';
const publishedLabel = '3 August 2026, 8:00 a.m. PHT';
const editionImage = '/assets/images/news/fmb-news-august-3-morning-2026.svg';

const stories = [
  {
    slug: 'alex-eala-pegula-washington-final-suspended-rain-august-2026',
    section: 'Sports',
    kicker: 'Sports · Tennis · Developing story',
    read: '4 min read',
    title: 'Rain Suspends Eala–Pegula Washington Final With Match Still Unfinished',
    meta: 'The Washington Open final between Alexandra Eala and Jessica Pegula was suspended by rain after Pegula took the first set and Eala moved ahead early in the second.',
    deck: 'The championship remains undecided. Play stopped with Pegula leading 6-4, 1-2 after a day repeatedly interrupted by bad weather.',
    image: editionImage,
    alt: 'FMB News morning update graphic for the suspended Eala and Pegula final',
    body: [
      ['Where the match stands', 'Jessica Pegula won the opening set 6-4 before Alexandra Eala held an early 2-1 lead in the second. Rain then forced officials to suspend the final, leaving the title unresolved.'],
      ['A difficult rhythm for both players', 'The final had already been delayed for roughly three hours before play began. Another interruption arrived after the first set, and the later suspension prevented either player from building sustained momentum.'],
      ['What remains at stake', 'Eala is contesting her first WTA 500 final after defeating Naomi Osaka in straight sets. Pegula, the top seed and world No. 3, is pursuing another title in a season that has already included major tournament victories.'],
      ['Why the report is labeled developing', 'No champion had been confirmed as of this publication. FMB News will treat any result announced later as a separate verified update rather than presenting the interrupted score as a final outcome.']
    ],
    sources: [
      ['Reuters report on the weather suspension', 'https://www.reuters.com/sports/tennis/rain-disrupts-washington-open-final-halts-play-canada-2026-08-02/'],
      ['Reuters report on Eala and Pegula reaching the final', 'https://www.reuters.com/sports/tennis/pegula-sets-up-washington-open-final-against-eala-2026-08-01/']
    ]
  },
  {
    slug: 'us-iran-talks-monday-hormuz-no-deadline-august-2026',
    section: 'World',
    kicker: 'World · Iran · Diplomacy and energy · Developing story',
    read: '5 min read',
    title: 'U.S.–Iran Talks Set for Monday as Hormuz Crisis Keeps Energy Markets on Edge',
    meta: 'President Donald Trump said negotiations with Iran would begin Monday, but gave no deadline for a deal over the Strait of Hormuz and Tehran’s nuclear activities.',
    deck: 'The planned talks reduce the immediate risk of another U.S. strike, but neither safe passage through Hormuz nor a broader settlement has been secured.',
    image: editionImage,
    alt: 'FMB News morning update graphic for U.S. and Iran diplomacy',
    body: [
      ['Talks now have a date, but few public details', 'Trump said negotiations would begin Monday afternoon. He did not identify the venue, the full negotiating teams or a deadline for reaching an agreement.'],
      ['Hormuz remains the urgent economic issue', 'Iran has largely restricted traffic through the Strait of Hormuz, a route that carried roughly one-fifth of global oil and liquefied natural gas before the war. The disruption has raised energy prices and intensified pressure for a diplomatic opening.'],
      ['Regional diplomacy is moving in parallel', 'Iranian Foreign Minister Abbas Araqchi spoke with Saudi and Pakistani officials, while Iranian and Omani representatives continued discussions connected to maritime passage. Iranian officials said those talks should not be confused with a completed reopening of the strait.'],
      ['The risk of renewed military action remains', 'Israel said it would act if Iran rebuilt nuclear or ballistic-missile capabilities. Iran denies seeking a nuclear weapon. Until negotiators produce verifiable terms and shipping resumes safely, the current movement remains an opening rather than a settlement.']
    ],
    sources: [
      ['Reuters report confirming Monday talks', 'https://www.reuters.com/world/asia-pacific/trump-says-iran-talks-take-place-monday-sets-no-deadline-deal-2026-08-02/'],
      ['Reuters background on the pause in additional strikes', 'https://www.reuters.com/podcasts/iran-pause-moscow-restaurant-attack-glp-1-clothes-shopping-2026-08-02/']
    ]
  }
];

function esc(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function storyPage(story) {
  const url = `https://www.francinemariebautista.com/news/${story.slug}/`;
  const body = story.body.map(([heading, text]) => `<h2>${esc(heading)}</h2><p>${esc(text)}</p>`).join('\n');
  const sources = story.sources.map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`).join('');
  const schema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'NewsArticle', headline: story.title,
    description: story.meta, datePublished: published, dateModified: published,
    inLanguage: 'en-PH', isAccessibleForFree: true,
    author: { '@type': 'Person', name: 'Francine Marie Bautista', url: 'https://www.francinemariebautista.com/aboutfmb/' },
    publisher: { '@type': 'Organization', name: 'FMB News Center', url: 'https://www.francinemariebautista.com/news/' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url }, articleSection: story.section,
    image: `https://www.francinemariebautista.com${story.image}`
  });
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(story.title)} | FMB News</title><meta name="description" content="${esc(story.meta)}"><meta name="author" content="Francine Marie Bautista"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:site_name" content="FMB News Center"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.meta)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://www.francinemariebautista.com${story.image}"><meta property="article:published_time" content="${published}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(story.title)}"><meta name="twitter:description" content="${esc(story.meta)}"><meta name="twitter:image" content="https://www.francinemariebautista.com${story.image}"><script type="application/ld+json">${schema}</script><link rel="icon" href="/assets/images/fmb-approved/fmb-master-purple-square.webp" type="image/webp"><link rel="stylesheet" href="/assets/css/site.css?v=20260716g"><link rel="stylesheet" href="/assets/css/fmb-polish.css?v=20260717a"><link rel="stylesheet" href="/assets/css/news-channel.css?v=20260720a"><link rel="stylesheet" href="/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3"></head><body class="news-route news-story-route"><a class="nc-skip" href="#story">Skip to the story</a><header class="nc-site-header"><div class="nc-brandline"><div class="wrap"><span class="nc-network-label"><i></i> FMB News Center</span><span class="nc-network-clock"><time data-news-clock>Philippine Standard Time</time><b>PHT</b></span></div></div><div class="nc-nav-shell wrap"><a class="nc-publication-brand" href="/news/"><span>FMB News Center</span></a><nav class="nc-site-links"><a href="/news/">Headlines</a><a href="/news/#philippines">Philippines</a><a href="/news/#world">World</a><a href="/news/#culture">Culture</a></nav></div></header><main id="story"><div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/news/">Back to headlines</a><span class="nc-story-edition">Morning update · ${publishedLabel}</span></div></div><header class="nc-article-hero"><div class="wrap"><div class="nc-article-hero-grid"><div><p class="nc-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1></div><p class="nc-article-deck">${esc(story.deck)}</p></div><div class="nc-article-meta"><span>By Francine Marie Bautista</span><span>Published ${publishedLabel}</span><span>${story.read}</span><span>Sources reviewed</span></div></div></header><section class="nc-story-media"><div class="wrap"><figure class="news-visual"><img src="${story.image}" width="1536" height="864" alt="${esc(story.alt)}" fetchpriority="high"><figcaption>FMB News Center morning update. Reporting sources appear below.</figcaption></figure></div></section><article class="nc-article"><div class="wrap nc-article-layout"><aside class="nc-story-aside"><dl><div><dt>Desk</dt><dd>${esc(story.section)}</dd></div><div><dt>Status</dt><dd>Developing</dd></div><div><dt>Published</dt><dd>${publishedLabel}</dd></div></dl><button class="nc-share-button" type="button" data-news-share>Share this report</button></aside><div class="nc-story-body"><div class="nc-factbox"><p><strong>Editorial note:</strong> This report separates confirmed events from claims, forecasts and unresolved outcomes.</p></div><p><strong>${esc(story.deck)}</strong></p>${body}<section class="nc-sources"><h2>Sources and public record</h2>${sources}</section></div><aside class="nc-story-rail"><p>Continue reading</p><a href="/news/">All FMB News headlines<span>News Center</span></a></aside></div></article></main><footer class="nc-footer"><div class="wrap"><div class="nc-footer-bottom"><span>© 2026 Francine Marie Bautista. All rights reserved.</span><span>FMB News Center · ${esc(story.section)}</span></div></div></footer><script src="/assets/js/news-channel.js?v=20260719-broadcast-v3"></script></body></html>`;
}

const artwork = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 864"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#10030b"/><stop offset=".55" stop-color="#770b22"/><stop offset="1" stop-color="#081a35"/></linearGradient></defs><rect width="1536" height="864" fill="url(#b)"/><path d="M0 700 C370 520 700 850 1050 620 S1400 580 1536 670 V864 H0Z" fill="#fff" opacity=".08"/><g fill="#fff" font-family="Arial,Helvetica,sans-serif"><text x="110" y="145" font-size="42" font-weight="700" letter-spacing="10">FMB NEWS CENTER</text><text x="110" y="350" font-size="118" font-weight="800">MORNING UPDATE</text><text x="116" y="450" font-size="62" font-weight="700">AUGUST 3, 2026</text><text x="116" y="540" font-size="28" font-weight="600" letter-spacing="6" opacity=".8">VERIFIED DEVELOPMENTS · CONTEXT BEFORE NOISE</text></g><rect x="116" y="625" width="620" height="72" rx="36" fill="#fff"/><text x="150" y="672" fill="#8c071b" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="800" letter-spacing="2">FILIPINO ANG MISMONG BALITA.</text></svg>`;

await mkdir(newsRoot, { recursive: true });
await mkdir(artDir, { recursive: true });
await writeFile(artPath, artwork, 'utf8');
for (const story of stories) {
  const dir = path.join(newsRoot, story.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), storyPage(story), 'utf8');
}

let landing = await readFile(landingPath, 'utf8');
for (const story of [...stories].reverse()) {
  const href = `/news/${story.slug}/`;
  if (landing.includes(href)) continue;
  landing = landing.replace('<div class="nc-wire-track">', `<div class="nc-wire-track"><span>${esc(story.title)}</span>`);
  const marker = '<div class="nc-rundown-head">';
  const insertion = landing.indexOf('<article class="nc-rundown-story"', landing.indexOf(marker));
  if (insertion < 0) throw new Error('Morning update rundown insertion point not found');
  const card = `<article class="nc-rundown-story"><a href="${href}"><span class="nc-rundown-number">8AM</span><figure class="news-visual"><img src="${story.image}" width="1536" height="864" loading="lazy" decoding="async" alt="${esc(story.alt)}"><figcaption>FMB News Center morning update.</figcaption></figure><div><p>${esc(story.kicker)}</p><h3>${esc(story.title)}</h3><span>${story.read}</span></div></a></article>`;
  landing = `${landing.slice(0, insertion)}${card}${landing.slice(insertion)}`;
}
landing = landing.replace(/<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/, `<time data-news-updated>Updated ${publishedLabel}</time>`);
await writeFile(landingPath, landing, 'utf8');

let home = await readFile(homePath, 'utf8');
const lead = stories[0];
home = home.replace(/<article class="fmb-approved-news-lead">[\s\S]*?<\/article>/, `<article class="fmb-approved-news-lead"><img src="${editionImage}" width="1536" height="864" loading="lazy" decoding="async" alt="${esc(lead.alt)}"><div><small>August 3 Morning Update</small><h3>${esc(lead.title)}</h3></div></article>`);
home = home.replace(/<div class="fmb-approved-news-list">[\s\S]*?<\/div>/, `<div class="fmb-approved-news-list"><a href="/news/${stories[0].slug}/"><span>${esc(stories[0].title)}</span><time>Sports</time></a><a href="/news/${stories[1].slug}/"><span>${esc(stories[1].title)}</span><time>World</time></a></div>`);
await writeFile(homePath, home, 'utf8');

let sitemap = await readFile(sitemapPath, 'utf8');
for (const story of stories) {
  const loc = `https://www.francinemariebautista.com/news/${story.slug}/`;
  if (!sitemap.includes(loc)) sitemap = sitemap.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>2026-08-03</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n</urlset>`);
}
await writeFile(sitemapPath, sitemap, 'utf8');
console.log(`Published ${stories.length} verified FMB News morning updates for August 3, 2026.`);
