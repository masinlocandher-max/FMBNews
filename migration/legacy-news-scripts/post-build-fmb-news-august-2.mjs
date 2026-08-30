import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const homePath = path.join(root, 'dist', 'index.html');
const sitemapPath = path.join(root, 'dist', 'sitemap.xml');
const artDir = path.join(root, 'dist', 'assets', 'images', 'news');
const artPath = path.join(artDir, 'fmb-news-august-2-2026.svg');
const published = '2026-08-02T01:24:00+08:00';
const publishedLabel = '2 August 2026';
const editionImage = '/assets/images/news/fmb-news-august-2-2026.svg';

const stories = [
  {
    slug: 'china-air-naval-drills-scarborough-shoal-august-2026',
    section: 'Philippines',
    kicker: 'West Philippine Sea · Security · Developing story',
    read: '5 min read',
    title: 'China Holds Air and Naval Drills Around Scarborough Shoal as Tensions Rise',
    meta: 'China conducted joint air and naval drills around Scarborough Shoal on August 1, adding military pressure to an already tense period of confrontations and fishing-access disputes.',
    deck: 'The exercise does not change the Philippines’ legal position, but it raises the operational risk around one of the most sensitive flashpoints in the West Philippine Sea.',
    image: editionImage,
    alt: 'FMB News August 2, 2026 editorial visual for verified Philippines and world developments',
    body: [
      ['What happened', 'China’s military said its naval and air forces conducted combat-readiness operations around Scarborough Shoal on August 1. The China Coast Guard also participated in patrol activity, while Chinese authorities framed the operation as protection of claimed sovereignty and maritime rights.'],
      ['Why the shoal matters', 'Scarborough Shoal is close to Luzon and has long been used by Filipino fishers. It is claimed by both the Philippines and China and has repeatedly become a site of dangerous encounters, water-cannon incidents and disputes over access. Manila calls the surrounding waters part of the West Philippine Sea.'],
      ['The new pressure point', 'Associated Press reporting said China also tightened restrictions connected to a nature reserve it declared around the area. Combined with recent confrontations, the military drills increase the chance of miscalculation even when neither side publicly announces an intention to escalate.'],
      ['What to watch next', 'The practical questions are whether Filipino fishers retain safe access, whether the Philippine Coast Guard or armed forces change their posture, and whether diplomatic protests are followed by coordinated legal, maritime and alliance responses. Claims should be assessed separately from what international law and the 2016 arbitral ruling actually recognize.']
    ],
    sources: [
      ['Reuters report on the August 1 drills', 'https://www.reuters.com/world/china/china-conducts-naval-air-patrols-around-disputed-shoal-south-china-sea-2026-08-01/'],
      ['Associated Press report on the drills and reserve restrictions', 'https://apnews.com/article/44ec8654a9c377415fffb92542508e44']
    ]
  },
  {
    slug: 'gaza-roadmap-disarmament-withdrawal-hurdles-august-2026',
    section: 'World',
    kicker: 'World · Gaza · Diplomacy',
    read: '6 min read',
    title: 'Gaza Roadmap Raises Hope, but Disarmament and Israeli Withdrawal Remain Unresolved',
    meta: 'A new Gaza roadmap has been presented as a breakthrough, but Hamas and Israeli officials remain divided over the sequence of disarmament, withdrawal and implementation.',
    deck: 'There is diplomatic movement, but no basis yet for treating the announcement as a fully implemented peace settlement.',
    image: editionImage,
    alt: 'FMB News August 2, 2026 editorial visual for diplomacy and conflict reporting',
    body: [
      ['What the roadmap proposes', 'The United States-backed plan calls for Hamas and other armed groups to disarm, a technocratic Palestinian administration to take over governance functions and Israeli forces to withdraw under an implementation framework. International officials have urged the parties to follow the roadmap in full.'],
      ['The central disagreement', 'Hamas has tied implementation to an end to attacks, humanitarian access and Israeli compliance with withdrawal commitments. Israeli officials have argued that withdrawal should follow complete disarmament. That sequencing dispute is not a technical detail; it is the core question determining whether either side acts first.'],
      ['Why the announcement is not the outcome', 'Public declarations can create momentum, but the real measure is verified action: an enforceable ceasefire, civilian protection, aid delivery, accountable weapons arrangements, functioning governance and a withdrawal process that is clear enough to monitor.'],
      ['How FMB News is labeling this', 'This is a developing diplomatic story, not a declaration that the conflict is over. Reporting should distinguish proposals, conditional acceptance, official endorsement and completed implementation.']
    ],
    sources: [
      ['Reuters report on the roadmap and remaining hurdles', 'https://www.reuters.com/world/middle-east/israel-must-approve-disarmament-agreement-before-hamas-will-implement-says-hamas-2026-07-31/'],
      ['Associated Press report on Palestinian hopes and concerns', 'https://apnews.com/article/76113dc5a9e867439f9629dbd04ec977']
    ]
  },
  {
    slug: 'kyiv-ballistic-attack-patriot-shortage-august-2026',
    section: 'World',
    kicker: 'World · Ukraine · Civilian protection',
    read: '5 min read',
    title: 'Kyiv Attack Kills at Least Nine as Ukraine Warns of Patriot Interceptor Shortage',
    meta: 'A major Russian missile and drone attack struck Kyiv, killing civilians and renewing Ukraine’s appeal for Patriot interceptors and stronger air defense.',
    deck: 'The attack damaged residential areas and public infrastructure while exposing the gap between the number of ballistic missiles launched and Ukraine’s ability to intercept them.',
    image: editionImage,
    alt: 'FMB News August 2, 2026 editorial visual for Ukraine civilian-protection reporting',
    body: [
      ['The attack and casualties', 'Russian forces launched ballistic missiles and drones at Kyiv and surrounding areas. Associated Press reported at least nine people killed and dozens injured, while Reuters later reported a death toll of 10 as rescue and assessment work continued.'],
      ['Why ballistic defense is central', 'Ukraine said most of the missiles used in the attack were ballistic and that only one was intercepted. President Volodymyr Zelenskiy and other officials renewed appeals for Patriot interceptors, arguing that shortages are leaving population centers exposed.'],
      ['Damage beyond military targets', 'Residential buildings, infrastructure and a school were among the sites reported damaged. Russia said it targeted military-industrial and logistics facilities, but the civilian deaths and damage remain the clearest immediate public consequence.'],
      ['The wider pattern', 'The strike followed another major attack earlier in the week. Repeated aerial assaults can normalize civilian harm in public attention, which is why casualty figures, verified damage and air-defense limitations must remain visible rather than being reduced to routine battlefield language.']
    ],
    sources: [
      ['Reuters report on the Kyiv attack and air-defense shortage', 'https://www.reuters.com/business/aerospace-defense/russia-pounds-kyiv-with-missiles-2026-07-31/'],
      ['Associated Press report on casualties and damage', 'https://apnews.com/article/eb62397d10bca2d6db4269a3bcfc9dc6']
    ]
  },
  {
    slug: 'habagat-western-luzon-august-3-9-2026',
    section: 'Philippines',
    kicker: 'Weather · Public service · Philippines',
    read: '4 min read',
    title: 'Habagat Likely to Stay Active Into August 3–9; Western Luzon Should Monitor Advisories',
    meta: 'PAGASA’s sub-seasonal outlook indicates continued southwest monsoon influence into August 3–9, with western sections requiring close attention to rainfall and local warnings.',
    deck: 'The outlook is useful for preparation, but short-term rainfall warnings and local disaster advisories should guide immediate decisions.',
    image: editionImage,
    alt: 'FMB News August 2, 2026 editorial visual for Philippine weather and public service',
    body: [
      ['What PAGASA’s outlook shows', 'PAGASA’s sub-seasonal guidance indicates that the southwest monsoon is likely to affect much of the country during August 3 to 9. An earlier outlook for July 29 to August 4 placed the highest projected rainfall totals over parts of western Luzon and Antique.'],
      ['Why western Luzon should remain alert', 'Zambales, Bataan and nearby western areas are exposed when Habagat pushes moisture toward mountain slopes and coastal communities. Heavy rainfall can develop unevenly, so a broad weekly outlook cannot identify the exact barangay or hour that will receive the strongest downpour.'],
      ['Practical preparation', 'Families should keep phones charged, protect medicines and documents, avoid flooded roads and monitor local government and PAGASA warnings. Fishers and small-craft operators should also check the latest coastal forecast before going to sea.'],
      ['Use live bulletins for live decisions', 'This report summarizes planning guidance, not a permanent forecast. Daily forecasts, thunderstorm advisories, rainfall warnings and local disaster notices can change quickly and should take priority.']
    ],
    sources: [
      ['PAGASA sub-seasonal outlook', 'https://www.pagasa.dost.gov.ph/climate/climate-prediction/sub-seasonal2'],
      ['PAGASA daily weather page', 'https://www.pagasa.dost.gov.ph/weather']
    ]
  }
];

function esc(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function storyPage(story) {
  const url = `https://www.francinemariebautista.com/news/${story.slug}/`;
  const sourceLinks = story.sources
    .map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`)
    .join('');
  const body = story.body
    .map(([heading, text]) => `<h2>${esc(heading)}</h2><p>${esc(text)}</p>`)
    .join('\n');
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.title,
    description: story.meta,
    datePublished: published,
    dateModified: published,
    inLanguage: 'en-PH',
    isAccessibleForFree: true,
    author: {
      '@type': 'Person',
      name: 'Francine Marie Bautista',
      url: 'https://www.francinemariebautista.com/aboutfmb/'
    },
    publisher: {
      '@type': 'Organization',
      name: 'FMB News Center',
      url: 'https://www.francinemariebautista.com/news/'
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    articleSection: story.section,
    image: `https://www.francinemariebautista.com${story.image}`
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
<meta property="og:site_name" content="FMB News Center">
<meta property="og:title" content="${esc(story.title)}">
<meta property="og:description" content="${esc(story.meta)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://www.francinemariebautista.com${story.image}">
<meta property="article:published_time" content="${published}">
<meta property="article:modified_time" content="${published}">
<meta property="article:author" content="Francine Marie Bautista">
<meta property="article:section" content="${esc(story.section)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(story.title)}">
<meta name="twitter:description" content="${esc(story.meta)}">
<meta name="twitter:image" content="https://www.francinemariebautista.com${story.image}">
<script type="application/ld+json">${schema}</script>
<link rel="icon" href="/assets/images/fmb-approved/fmb-master-purple-square.webp" type="image/webp">
<link rel="stylesheet" href="/assets/css/site.css?v=20260716g">
<link rel="stylesheet" href="/assets/css/fmb-polish.css?v=20260717a">
<link rel="stylesheet" href="/assets/css/news-channel.css?v=20260720a">
<link rel="stylesheet" href="/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3">
</head>
<body class="news-route news-story-route">
<a class="nc-skip" href="#story">Skip to the story</a>
<header class="nc-site-header">
  <div class="nc-brandline"><div class="wrap"><span class="nc-network-label"><i></i> FMB News Center</span><span class="nc-network-clock"><time data-news-clock>Philippine Standard Time</time><b>PHT</b></span></div></div>
  <div class="nc-nav-shell wrap">
    <a class="nc-publication-brand" href="/news/" aria-label="FMB News Center front page"><span>FMB News Center</span></a>
    <nav class="nc-site-links" id="newsNav" aria-label="News navigation"><a href="/news/">Headlines</a><a href="/news/#philippines">Philippines</a><a href="/news/#world">World</a><a href="/news/#culture">Culture</a></nav>
  </div>
</header>
<main id="story">
  <div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/news/">Back to headlines</a><span class="nc-story-edition">FMB News Center · ${publishedLabel}</span></div></div>
  <header class="nc-article-hero"><div class="wrap"><div class="nc-article-hero-grid"><div><p class="nc-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1></div><p class="nc-article-deck">${esc(story.deck)}</p></div><div class="nc-article-meta"><span>By Francine Marie Bautista</span><span>Published ${publishedLabel}</span><span>${story.read}</span><span>Sources reviewed</span></div></div></header>
  <section class="nc-story-media"><div class="wrap"><figure class="news-visual"><img src="${story.image}" width="1536" height="864" alt="${esc(story.alt)}" fetchpriority="high" decoding="async"><figcaption>FMB News Center editorial visual. Source links and reporting basis appear below.</figcaption></figure></div></section>
  <article class="nc-article"><div class="wrap nc-article-layout">
    <aside class="nc-story-aside"><dl><div><dt>Desk</dt><dd>${esc(story.section)}</dd></div><div><dt>Format</dt><dd>News explainer</dd></div><div><dt>Published</dt><dd>${publishedLabel}</dd></div></dl><button class="nc-share-button" type="button" data-news-share>Share this report</button></aside>
    <div class="nc-story-body"><div class="nc-factbox"><p><strong>Editorial note:</strong> This report distinguishes confirmed developments, official claims and matters that remain disputed, conditional or subject to changing conditions.</p></div><p><strong>${esc(story.deck)}</strong></p>${body}<section class="nc-sources"><h2>Sources and public record</h2>${sourceLinks}</section></div>
    <aside class="nc-story-rail"><p>More from this edition</p><a href="/news/china-air-naval-drills-scarborough-shoal-august-2026/">Scarborough Shoal drills raise regional risk<span>Philippines</span></a><a href="/news/gaza-roadmap-disarmament-withdrawal-hurdles-august-2026/">Gaza roadmap still faces major hurdles<span>World</span></a><a href="/news/">Return to all headlines<span>FMB News Center</span></a></aside>
  </div></article>
</main>
<footer class="nc-footer"><div class="wrap"><div class="nc-footer-bottom"><span>© 2026 Francine Marie Bautista. All rights reserved.</span><span>FMB News Center · ${esc(story.section)}</span></div></div></footer>
<script src="/assets/js/news-channel.js?v=20260719-broadcast-v3"></script>
</body>
</html>`;
}

const editionArtwork = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 864" role="img" aria-labelledby="title desc">
<title id="title">FMB News August 2, 2026 edition</title>
<desc id="desc">Red, white and deep navy editorial graphic for verified Philippines and world developments.</desc>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#12030a"/><stop offset=".54" stop-color="#5f0718"/><stop offset="1" stop-color="#07152d"/></linearGradient>
  <radialGradient id="glow" cx=".2" cy=".15" r=".8"><stop stop-color="#ff516a" stop-opacity=".6"/><stop offset="1" stop-color="#ff516a" stop-opacity="0"/></radialGradient>
  <filter id="blur"><feGaussianBlur stdDeviation="30"/></filter>
</defs>
<rect width="1536" height="864" fill="url(#bg)"/>
<rect width="1536" height="864" fill="url(#glow)"/>
<circle cx="1320" cy="110" r="230" fill="#ffffff" opacity=".05"/>
<circle cx="1260" cy="790" r="420" fill="#1b4e9b" opacity=".22" filter="url(#blur)"/>
<path d="M0 660 C300 520 520 780 820 625 S1260 505 1536 680 V864 H0Z" fill="#fff" opacity=".07"/>
<path d="M0 720 C350 570 570 850 930 660 S1320 600 1536 735" fill="none" stroke="#ff334f" stroke-width="18" opacity=".65"/>
<g fill="#fff" font-family="Arial, Helvetica, sans-serif">
  <text x="112" y="150" font-size="44" font-weight="700" letter-spacing="11">FMB NEWS CENTER</text>
  <text x="112" y="356" font-size="128" font-weight="800">AUGUST 2</text>
  <text x="118" y="448" font-size="62" font-weight="700" letter-spacing="4">PHILIPPINES &amp; WORLD</text>
  <text x="118" y="535" font-size="28" font-weight="600" letter-spacing="7" opacity=".78">VERIFIED DEVELOPMENTS • CONTEXT BEFORE NOISE</text>
</g>
<g transform="translate(118 618)">
  <rect width="620" height="72" rx="36" fill="#fff"/>
  <text x="34" y="47" fill="#8c071b" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800" letter-spacing="2">FILIPINO ANG MISMONG BALITA.</text>
</g>
</svg>`;

await mkdir(newsRoot, { recursive: true });
await mkdir(artDir, { recursive: true });
await writeFile(artPath, editionArtwork, 'utf8');

for (const story of stories) {
  const directory = path.join(newsRoot, story.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), storyPage(story), 'utf8');
}

let landing = await readFile(landingPath, 'utf8');

const lead = stories[0];
const leadMarkup = `<article class="nc-lead-broadcast nc-reveal" id="philippines"><a href="/news/${lead.slug}/"><figure class="news-visual"><img src="${lead.image}" width="1536" height="864" fetchpriority="high" decoding="async" alt="${esc(lead.alt)}"><figcaption>FMB News Center editorial visual. Full sources appear in the report.</figcaption></figure><div class="nc-lead-overlay"><span class="nc-signal-tag"><i></i> West Philippine Sea · Security</span><p class="nc-lead-meta">Developing story <span>${lead.read}</span></p><h2>${esc(lead.title)}</h2><p class="nc-lead-deck">${esc(lead.deck)}</p><span class="nc-broadcast-action">Read the full report <b>→</b></span></div></a></article>`;
landing = landing.replace(
  /<article class="nc-lead-broadcast nc-reveal" id="philippines">[\s\S]*?<\/article>/,
  leadMarkup
);

for (const story of [...stories].reverse()) {
  const href = `/news/${story.slug}/`;
  if (!landing.includes(href)) {
    landing = landing.replace(
      '<div class="nc-wire-track">',
      `<div class="nc-wire-track"><span>${esc(story.title)}</span>`
    );

    const header = '<div class="nc-rundown-head">';
    const firstArticle = landing.indexOf('<article class="nc-rundown-story"', landing.indexOf(header));
    if (firstArticle < 0) throw new Error('August 2 edition: rundown insertion point not found');

    const card = `<article class="nc-rundown-story"><a href="${href}"><span class="nc-rundown-number">NEW</span><figure class="news-visual"><img src="${story.image}" width="1536" height="864" loading="lazy" decoding="async" alt="${esc(story.alt)}"><figcaption>FMB News Center editorial visual. Sources appear in the report.</figcaption></figure><div><p>${esc(story.kicker)}</p><h3>${esc(story.title)}</h3><span>${story.read}</span></div></a></article>
        `;
    landing = `${landing.slice(0, firstArticle)}${card}${landing.slice(firstArticle)}`;

    landing = landing.replace(
      '"itemListElement":[',
      `"itemListElement":[
        {"@type":"ListItem","position":1,"url":"https://www.francinemariebautista.com${href}","name":${JSON.stringify(story.title)}},`
    );
  }
}

landing = landing
  .replace(/<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/, `<time data-news-updated>Updated ${publishedLabel}</time>`)
  .replace(/<meta property="og:image" content="[^"]+">/, `<meta property="og:image" content="https://www.francinemariebautista.com${editionImage}">`)
  .replace(/<meta name="twitter:image" content="[^"]+">/, `<meta name="twitter:image" content="https://www.francinemariebautista.com${editionImage}">`);

await writeFile(landingPath, landing, 'utf8');

let home = await readFile(homePath, 'utf8');
const homeLead = `<article class="fmb-approved-news-lead"><img src="${editionImage}" width="1536" height="864" loading="lazy" decoding="async" alt="FMB News August 2, 2026 editorial visual"><div><small>August 2 Edition</small><h3>${esc(lead.title)}</h3></div></article>`;
home = home.replace(
  /<article class="fmb-approved-news-lead">[\s\S]*?<\/article>/,
  homeLead
);

const homeList = `<div class="fmb-approved-news-list"><a href="/news/${stories[1].slug}/"><span>${esc(stories[1].title)}</span><time>World</time></a><a href="/news/${stories[2].slug}/"><span>${esc(stories[2].title)}</span><time>Latest</time></a><a href="/news/${stories[3].slug}/"><span>${esc(stories[3].title)}</span><time>Weather</time></a></div>`;
home = home.replace(
  /<div class="fmb-approved-news-list">[\s\S]*?<\/div>/,
  homeList
);
await writeFile(homePath, home, 'utf8');

try {
  let sitemap = await readFile(sitemapPath, 'utf8');
  for (const story of stories) {
    const loc = `https://www.francinemariebautista.com/news/${story.slug}/`;
    if (sitemap.includes(loc)) continue;
    sitemap = sitemap.replace(
      '</urlset>',
      `  <url><loc>${loc}</loc><lastmod>2026-08-02</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n</urlset>`
    );
  }
  await writeFile(sitemapPath, sitemap, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

console.log(`Published ${stories.length} verified FMB News reports for the August 2 edition and updated the main FMB homepage.`);
