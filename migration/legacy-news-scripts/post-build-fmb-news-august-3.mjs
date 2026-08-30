import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const homePath = path.join(root, 'dist', 'index.html');
const sitemapPath = path.join(root, 'dist', 'sitemap.xml');
const artDir = path.join(root, 'dist', 'assets', 'images', 'news');
const artPath = path.join(artDir, 'fmb-news-august-3-2026.svg');
const published = '2026-08-03T00:32:00+08:00';
const publishedLabel = '3 August 2026';
const editionImage = '/assets/images/news/fmb-news-august-3-2026.svg';

const stories = [
  {
    "slug": "tropical-depression-luis-northern-luzon-august-3-2026",
    "section": "Philippines",
    "kicker": "Weather · Public safety · Developing",
    "read": "5 min read",
    "title": "Luis Nears Northern Luzon as PAGASA Warns of Rain, Strong Gusts and Rough Seas",
    "meta": "Tropical Depression Luis was east of Aurora late Sunday and may make landfall over Northern Luzon on August 3, according to PAGASA.",
    "deck": "The storm is still capable of shifting within its forecast cone, so local rainfall warnings and evacuation instructions remain more important than a single projected landfall point.",
    "image": editionImage,
    "alt": "FMB News August 3, 2026 weather edition graphic",
    "body": [
      [
        "Where Luis was last located",
        "In its 11 p.m. bulletin on August 2, PAGASA placed the center of Tropical Depression Luis about 200 kilometers east of Baler, Aurora. It was moving west northwest at 15 kilometers per hour, with maximum sustained winds of 55 kilometers per hour and gusts reaching 70 kilometers per hour."
      ],
      [
        "Areas under Signal No. 1",
        "Signal No. 1 covered Isabela, Quirino, parts of Cagayan and Aurora, Polillo Islands, and northern municipalities of Camarines Norte. PAGASA said minor wind impacts were possible and did not rule out raising Signal No. 2 if the cyclone strengthened or moved closer."
      ],
      [
        "Rain and sea conditions matter beyond the center",
        "Luis and the southwest monsoon were expected to bring strong to gale-force gusts across much of Luzon and the Visayas on August 3 and 4. PAGASA also warned of moderate to rough seas along several eastern seaboards and parts of Bataan, making conditions risky for small vessels."
      ],
      [
        "What communities should do",
        "Residents in flood-prone, landslide-prone and exposed coastal areas should follow local disaster offices, keep essential documents and medicines protected, and avoid crossing flooded roads. The forecast track remains uncertain, and PAGASA said heavy rain and strong winds may occur outside the projected landfall area."
      ]
    ],
    "sources": [
      [
        "PAGASA Tropical Cyclone Bulletin No. 5 for Luis",
        "https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin"
      ],
      [
        "PAGASA weather advisories and regional warnings",
        "https://www.pagasa.dost.gov.ph/weather"
      ]
    ]
  },
  {
    "slug": "teodoro-officials-duty-west-philippine-sea-august-2026",
    "section": "Philippines",
    "kicker": "West Philippine Sea · Governance · National policy",
    "read": "5 min read",
    "title": "Teodoro Draws a Firm Line on Officials’ Duty to Defend the West Philippine Sea",
    "meta": "Defense Secretary Gilberto Teodoro Jr. said public officials must uphold Philippine law and policy on the West Philippine Sea, challenge them through legal channels, or leave office.",
    "deck": "The argument places the West Philippine Sea not only within foreign policy, but also within the basic responsibility of officials who serve under the Constitution.",
    "image": editionImage,
    "alt": "FMB News August 3, 2026 West Philippine Sea edition graphic",
    "body": [
      [
        "The position Teodoro set out",
        "Teodoro said government officials are expected to carry out the country’s laws and established policy on the West Philippine Sea. Those who believe that policy is unlawful, he argued, have legal avenues to challenge it. Remaining in office while working against it is a different matter."
      ],
      [
        "Why Masinloc is part of the conversation",
        "The consequences are not abstract for coastal communities. Filipino fishers from Masinloc, Zambales have repeatedly faced uncertainty, restrictions and dangerous encounters around Bajo de Masinloc, one of the most visible flashpoints in the dispute."
      ],
      [
        "Law, policy and public office",
        "The Philippine position rests on the United Nations Convention on the Law of the Sea and the 2016 arbitral award. The ruling rejected the legal basis of China’s sweeping nine-dash-line claim, while recognizing traditional fishing rights at Scarborough Shoal. Public debate remains legitimate, but officials still operate within constitutional and legal duties."
      ],
      [
        "What the dispute is really testing",
        "The immediate political clash may fade, but the deeper issue will remain: whether national policy is applied consistently when livelihoods, maritime access and sovereign rights are under pressure. For communities along the western coast of Luzon, credibility depends on action at sea as much as statements in Manila."
      ]
    ],
    "sources": [
      [
        "GMA News report on Teodoro’s clarification",
        "https://www.gmanetwork.com/news/topstories/nation/997111/teodoro-clarifies-officials-should-either-uphold-wps-law-challenge-it-in-court-or-resign/story/"
      ],
      [
        "Philippine Information Agency report on the legal basis of the West Philippine Sea position",
        "https://pia.gov.ph/news/pcg-cites-legal-basis-for-west-philippine-sea-stand-fisherfolk-support/"
      ]
    ]
  },
  {
    "slug": "alex-eala-first-wta-500-final-washington-2026",
    "section": "Sports",
    "kicker": "Sports · Tennis · Philippines",
    "read": "4 min read",
    "title": "Alex Eala Reaches First WTA 500 Final After Straight-Sets Win Over Naomi Osaka",
    "meta": "Alexandra Eala defeated four-time Grand Slam champion Naomi Osaka 6-4, 6-2 to reach the Washington Open final against Jessica Pegula.",
    "deck": "The result extends the strongest season of Eala’s career and gives Philippine tennis another milestone on one of the WTA Tour’s major stages.",
    "image": editionImage,
    "alt": "FMB News August 3, 2026 Philippine sports edition graphic",
    "body": [
      [
        "A controlled semifinal performance",
        "Eala defeated Osaka 6-4, 6-2 without dropping a set. She broke late in the opening set, carried that momentum into the second, and denied the former world No. 1 the kind of sustained comeback that has defined many of Osaka’s biggest matches."
      ],
      [
        "A new career milestone",
        "The victory placed the 21-year-old Filipina in her first WTA 500 final. It also added another elite opponent to a season in which she has repeatedly shown that her rise is no longer built on promise alone, but on results against established names."
      ],
      [
        "Pegula stands between Eala and the title",
        "World No. 3 Jessica Pegula advanced by beating Diana Shnaider 7-5, 6-4. Pegula entered the final as the more experienced player and the top seed, while Eala carried the confidence of a run that included victories over higher-ranked opponents."
      ],
      [
        "Why the moment matters",
        "Philippine tennis has rarely occupied this kind of space on the global tour. Whatever the final result, Eala’s week in Washington has already expanded what Filipino athletes and young players can imagine as reachable."
      ]
    ],
    "sources": [
      [
        "Reuters report on the Washington Open finalists",
        "https://www.reuters.com/sports/tennis/pegula-sets-up-washington-open-final-against-eala-2026-08-01/"
      ],
      [
        "Philstar report on Eala’s semifinal victory",
        "https://www.philstar.com/sports/2026/08/02/2546475/eala-blasts-osaka-books-mubadala-dc-open-finals-ticket-vs-pegula"
      ]
    ]
  },
  {
    "slug": "us-pauses-new-iran-strike-hormuz-talks-august-2026",
    "section": "World",
    "kicker": "World · Iran · Diplomacy and energy",
    "read": "5 min read",
    "title": "Washington Pauses New Iran Strike as Diplomacy Returns to the Strait of Hormuz",
    "meta": "US President Donald Trump said planned military action against Iran would be held back while negotiators pursue a deal involving Iran’s nuclear program and the Strait of Hormuz.",
    "deck": "The pause lowers the immediate risk of another strike, but it is not yet a durable settlement and military preparations remain in place.",
    "image": editionImage,
    "alt": "FMB News August 3, 2026 world diplomacy edition graphic",
    "body": [
      [
        "A pause, not a peace agreement",
        "Trump said the United States would hold off on a new attack while talks continued. The emerging framework centers on limits connected to Iran’s nuclear activities and the reopening of the Strait of Hormuz, a route central to global oil and gas shipments."
      ],
      [
        "Why Hormuz is driving urgency",
        "Disruption in the strait has affected energy markets and raised the cost of prolonged confrontation for countries far beyond the Middle East. Gulf governments have pushed for a diplomatic formula because continued insecurity threatens shipping, fuel prices and regional infrastructure."
      ],
      [
        "The military option has not disappeared",
        "Israel maintained that it was prepared to act if Iran advanced its missile or nuclear programs. Iran, which denies seeking a nuclear weapon, also kept its forces on alert. That leaves the pause vulnerable to a failed negotiation, a new maritime incident or a disputed interpretation of the terms."
      ],
      [
        "The next proof will be implementation",
        "The meaningful tests are whether shipping can move safely, whether inspectors and negotiators gain workable access, and whether the parties can prevent isolated attacks from collapsing the process. Until those steps are visible, the story remains a diplomatic opening rather than a resolution."
      ]
    ],
    "sources": [
      [
        "Reuters report on the US decision to pause a new strike",
        "https://www.reuters.com/world/asia-pacific/iran-threatens-strike-other-nations-energy-fields-if-us-launches-fresh-attacks-2026-08-01/"
      ],
      [
        "Reuters report on regional proposals for Hormuz",
        "https://www.reuters.com/world/asia-pacific/gulf-states-back-plan-let-iran-collect-voluntary-fees-use-hormuz-2026-07-28/"
      ]
    ]
  },
  {
    "slug": "ukraine-drone-attacks-russia-eight-dead-august-2026",
    "section": "World",
    "kicker": "World · Ukraine war · Drone campaign",
    "read": "5 min read",
    "title": "Ukraine Expands Deep-Strike Campaign as Drone Attacks Kill Eight Across Russia",
    "meta": "Regional officials said Ukrainian drone attacks killed at least eight people across Russia while hitting an airbase, oil facilities and a Wildberries warehouse.",
    "deck": "The scale of the overnight assault shows how the war’s geography is widening, with economic sites and civilian areas increasingly exposed far from the front.",
    "image": editionImage,
    "alt": "FMB News August 3, 2026 Ukraine war edition graphic",
    "body": [
      [
        "A wide overnight attack",
        "Russian regional authorities reported deaths in the Saratov, Udmurtia and Belgorod regions. Ukraine also said it struck the Saratov oil refinery and the Engels airbase, while a fire broke out at a Wildberries warehouse in Samara."
      ],
      [
        "Russia reports hundreds of interceptions",
        "Russia’s Defense Ministry said air defenses brought down 635 Ukrainian drones overnight. That figure is an official claim and does not establish how many aircraft were launched, how many reached their targets or how the interceptions were independently verified."
      ],
      [
        "Economic pressure is part of the strategy",
        "Ukraine has increasingly targeted energy, logistics and industrial sites that support Russia’s war effort. Wildberries warehouses have also become repeated targets, reflecting an effort to make the costs of the conflict felt beyond military installations."
      ],
      [
        "Civilian harm remains part of the record",
        "The strikes also hit residential and civilian infrastructure. Russia launched 133 drones at Ukraine during the same period, according to the Ukrainian air force, and later attacks on Zaporizhzhia and Kharkiv killed at least two people. The exchange underlines the growing civilian exposure on both sides."
      ]
    ],
    "sources": [
      [
        "Reuters report on the drone attacks across Russia",
        "https://www.reuters.com/world/ukrainian-drones-kill-two-russia-strike-wildberries-warehouse-governors-say-2026-08-02/"
      ],
      [
        "Associated Press report on the expanded drone campaign",
        "https://apnews.com/article/d2c705445dad07fced4fb8c1e3d314c5"
      ]
    ]
  },
  {
    "slug": "indonesia-ferry-fire-five-dead-41-missing-august-2026",
    "section": "World",
    "kicker": "World · Indonesia · Maritime emergency",
    "read": "4 min read",
    "title": "Ferry Fire Off Indonesia Leaves Five Dead and 41 Missing",
    "meta": "A fire aboard the Mutiara Sentosa 2 off East Java killed at least five people, with 41 still missing and 225 rescued.",
    "deck": "The search continued after passengers were forced into the water and nearby vessels joined an emergency evacuation.",
    "image": editionImage,
    "alt": "FMB News August 3, 2026 maritime emergency edition graphic",
    "body": [
      [
        "Fire broke out during a domestic voyage",
        "The Mutiara Sentosa 2 was traveling from Surabaya to Makassar when it caught fire near Madura Island on Sunday morning. The vessel was carrying 271 passengers and crew, according to Indonesian authorities."
      ],
      [
        "Passengers escaped into the sea",
        "Video from the scene showed heavy black smoke and people in life jackets leaving the ferry. Nearby tugboats and other vessels began pulling survivors from the water and transferring passengers away from the burning ship."
      ],
      [
        "Rescue numbers were still changing",
        "Authorities reported 225 people rescued, at least five dead and 41 missing as operations continued. Weather, smoke and the condition of the vessel complicated the response, while the Indonesian Navy deployed additional support."
      ],
      [
        "The cause remains under investigation",
        "Officials had not announced a confirmed cause of the fire. Indonesia depends heavily on ferries to connect its islands, but recurring maritime accidents have kept questions about vessel maintenance, passenger records and safety enforcement in public focus."
      ]
    ],
    "sources": [
      [
        "Associated Press report on the Mutiara Sentosa 2 fire",
        "https://apnews.com/article/da71e9c734e8caacd07f83e3555e3382"
      ],
      [
        "El País report on rescue and casualty figures",
        "https://elpais.com/internacional/2026-08-02/mueren-cinco-personas-en-indonesia-en-el-incendio-de-un-ferry-con-mas-de-200-pasajeros.html"
      ]
    ]
  },
  {
    "slug": "athens-firefighting-helicopters-collide-europe-wildfires-2026",
    "section": "World",
    "kicker": "World · Europe · Wildfire emergency",
    "read": "4 min read",
    "title": "Firefighting Helicopters Collide Near Athens During Europe’s Wildfire Emergency",
    "meta": "Two firefighting helicopters collided while battling a wind-driven fire west of Athens as Greece, France and Spain faced major wildfire emergencies.",
    "deck": "The accident exposed the risks carried by emergency crews working in smoke, strong winds and rapidly changing fire conditions.",
    "image": editionImage,
    "alt": "FMB News August 3, 2026 Europe wildfire edition graphic",
    "body": [
      [
        "Collision over the Psatha fire",
        "Two Bell helicopters with two crew members each collided while operating over the Psatha area west of Athens. One aircraft crashed. Greek authorities said two people were recovered safely and two were found unconscious, with their conditions not immediately released."
      ],
      [
        "Strong winds drove the emergency",
        "The fire spread through parts of Attica and forced new evacuations as gale-force winds pushed flames across difficult terrain. The same conditions that accelerate a wildfire can also reduce visibility and make aerial drops more dangerous."
      ],
      [
        "Europe faced several major fronts",
        "France was dealing with extensive burned areas in Gironde and another active fire in Provence, while Spain’s largest fires had stopped advancing after days of destruction and loss of life. Greece also faced fires on other islands and northern areas."
      ],
      [
        "A reminder of the human cost behind the response",
        "Wildfire reports often focus on hectares burned and homes evacuated. The helicopter collision shows another part of the crisis: pilots, ground crews and local responders working in conditions where a small error, sudden gust or loss of visibility can become fatal."
      ]
    ],
    "sources": [
      [
        "Associated Press report on the helicopter collision and European wildfires",
        "https://apnews.com/article/726b55a6fe6c51de1fb086b437eb28de"
      ]
    ]
  }
];

function esc(value) {
  return String(value)
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
  <header class="nc-article-hero"><div class="wrap"><div class="nc-article-hero-grid"><div><p class="nc-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1></div><p class="nc-article-deck">${esc(story.deck)}</p></div><div class="nc-article-meta"><span>By Francine Marie Bautista</span><span>Published ${publishedLabel}</span><span>${story.read}</span><span>Sources listed below</span></div></div></header>
  <section class="nc-story-media"><div class="wrap"><figure class="news-visual"><img src="${story.image}" width="1536" height="864" alt="${esc(story.alt)}" fetchpriority="high" decoding="async"><figcaption>FMB News Center editorial visual. Reporting sources appear at the end of the article.</figcaption></figure></div></section>
  <article class="nc-article"><div class="wrap nc-article-layout">
    <aside class="nc-story-aside"><dl><div><dt>Desk</dt><dd>${esc(story.section)}</dd></div><div><dt>Format</dt><dd>News report</dd></div><div><dt>Published</dt><dd>${publishedLabel}</dd></div></dl><button class="nc-share-button" type="button" data-news-share>Share this report</button></aside>
    <div class="nc-story-body"><div class="nc-factbox"><p><strong>Reporting standard:</strong> Confirmed information is separated from official claims, projections and details that may change as the story develops.</p></div><p><strong>${esc(story.deck)}</strong></p>${body}<section class="nc-sources"><h2>Sources and public record</h2>${sourceLinks}</section></div>
    <aside class="nc-story-rail"><p>More from this edition</p><a href="/news/${stories[0].slug}/">${esc(stories[0].title)}<span>Philippines</span></a><a href="/news/${stories[2].slug}/">${esc(stories[2].title)}<span>Sports</span></a><a href="/news/">Return to all headlines<span>FMB News Center</span></a></aside>
  </div></article>
</main>
<footer class="nc-footer"><div class="wrap"><div class="nc-footer-bottom"><span>© 2026 Francine Marie Bautista. All rights reserved.</span><span>FMB News Center · ${esc(story.section)}</span></div></div></footer>
<script src="/assets/js/news-channel.js?v=20260719-broadcast-v3"></script>
</body>
</html>`;
}

const editionArtwork = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 864" role="img" aria-labelledby="title desc">
<title id="title">FMB News August 3, 2026 edition</title>
<desc id="desc">Deep purple, red and midnight blue editorial graphic for verified Philippines and world reports.</desc>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#14051f"/><stop offset=".5" stop-color="#5b0a3d"/><stop offset="1" stop-color="#06162f"/></linearGradient>
  <radialGradient id="glow" cx=".2" cy=".12" r=".85"><stop stop-color="#d86fff" stop-opacity=".58"/><stop offset="1" stop-color="#d86fff" stop-opacity="0"/></radialGradient>
  <filter id="blur"><feGaussianBlur stdDeviation="32"/></filter>
</defs>
<rect width="1536" height="864" fill="url(#bg)"/>
<rect width="1536" height="864" fill="url(#glow)"/>
<circle cx="1310" cy="100" r="235" fill="#ffffff" opacity=".05"/>
<circle cx="1240" cy="780" r="430" fill="#1d55a5" opacity=".22" filter="url(#blur)"/>
<path d="M0 645 C290 510 510 765 815 615 S1260 500 1536 675 V864 H0Z" fill="#fff" opacity=".07"/>
<path d="M0 715 C340 565 565 835 925 650 S1320 590 1536 730" fill="none" stroke="#f04671" stroke-width="18" opacity=".72"/>
<g fill="#fff" font-family="Arial, Helvetica, sans-serif">
  <text x="112" y="150" font-size="44" font-weight="700" letter-spacing="11">FMB NEWS CENTER</text>
  <text x="112" y="356" font-size="128" font-weight="800">AUGUST 3</text>
  <text x="118" y="448" font-size="62" font-weight="700" letter-spacing="4">PHILIPPINES &amp; WORLD</text>
  <text x="118" y="535" font-size="28" font-weight="600" letter-spacing="7" opacity=".8">ORIGINAL REPORTING • VERIFIED SOURCES • CLEAR CONTEXT</text>
</g>
<g transform="translate(118 618)">
  <rect width="620" height="72" rx="36" fill="#fff"/>
  <text x="34" y="47" fill="#66103f" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800" letter-spacing="2">FILIPINO ANG MISMONG BALITA.</text>
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
const leadMarkup = `<article class="nc-lead-broadcast nc-reveal" id="philippines"><a href="/news/${lead.slug}/"><figure class="news-visual"><img src="${lead.image}" width="1536" height="864" fetchpriority="high" decoding="async" alt="${esc(lead.alt)}"><figcaption>FMB News Center editorial visual. Full sources appear in the report.</figcaption></figure><div class="nc-lead-overlay"><span class="nc-signal-tag"><i></i> Weather · Public safety</span><p class="nc-lead-meta">Developing story <span>${lead.read}</span></p><h2>${esc(lead.title)}</h2><p class="nc-lead-deck">${esc(lead.deck)}</p><span class="nc-broadcast-action">Read the full report <b>→</b></span></div></a></article>`;
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
    if (firstArticle < 0) throw new Error('August 3 edition: rundown insertion point not found');

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
const homeLead = `<article class="fmb-approved-news-lead"><img src="${editionImage}" width="1536" height="864" loading="lazy" decoding="async" alt="FMB News August 3, 2026 editorial visual"><div><small>August 3 Edition</small><h3>${esc(lead.title)}</h3></div></article>`;
home = home.replace(
  /<article class="fmb-approved-news-lead">[\s\S]*?<\/article>/,
  homeLead
);

const homeList = `<div class="fmb-approved-news-list"><a href="/news/${stories[1].slug}/"><span>${esc(stories[1].title)}</span><time>Philippines</time></a><a href="/news/${stories[2].slug}/"><span>${esc(stories[2].title)}</span><time>Sports</time></a><a href="/news/${stories[3].slug}/"><span>${esc(stories[3].title)}</span><time>World</time></a></div>`;
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
      `  <url><loc>${loc}</loc><lastmod>2026-08-03</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n</urlset>`
    );
  }
  await writeFile(sitemapPath, sitemap, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

console.log(`Published ${stories.length} original FMB News reports for the August 3 edition and updated the main FMB homepage.`);
