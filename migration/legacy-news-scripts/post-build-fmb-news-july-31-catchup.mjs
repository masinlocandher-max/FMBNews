import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const published = '2026-07-31T06:10:00+08:00';

const stories = [
  {
    slug: 'marcos-tax-relief-workers-small-businesses',
    section: 'Philippines', kicker: 'Philippines · Economy · Explainer', read: '5 min read',
    title: 'Marcos Tax Relief Proposals: Who Could Benefit and What Congress Must Decide',
    meta: 'President Marcos asked Congress to widen income-tax relief, reduce taxes for more workers and ease selected burdens on small businesses. Here is what still needs legislation.',
    deck: 'The proposals could increase take-home pay and ease pressure on small enterprises, but the details, fiscal cost and final eligibility rules remain with Congress.',
    image: '/assets/images/news/pbbm-sona-2026-analysis.svg', alt: 'FMB News editorial illustration for Philippine economic policy and tax relief',
    body: [
      ['What was proposed', 'In his 2026 State of the Nation Address, President Ferdinand Marcos Jr. asked Congress to prioritize measures that would expand the income-tax exemption to workers earning up to ₱350,000 annually, lower rates for other workers, exempt qualified small businesses from the minimum corporate income tax and consider tax-amnesty measures. These are policy proposals, not yet automatic benefits.'],
      ['Why workers are watching', 'For households facing food, transport, rent and electricity costs, even a modest reduction in withholding tax can affect monthly cash flow. The strongest public-interest question is not only how much relief is announced, but who qualifies, when the change takes effect and whether employers can implement it clearly.'],
      ['The trade-off Congress must examine', 'Tax relief can support consumption and help businesses retain cash, but it also reduces government revenue unless offset by stronger collection, spending discipline or broader economic growth. Lawmakers should publish clear estimates of the cost, the number of beneficiaries and the effect on education, health, infrastructure and social protection.'],
      ['What happens next', 'The House has begun listing tax-reform bills for committee consideration. The final law may combine, revise or reject parts of the administration proposal. Until a bill passes both chambers and is signed, workers and businesses should not treat the announced thresholds as final.']
    ],
    sources: [['House committee schedule and tax bills','https://congress.gov.ph/committees/committee-meetings'],['House statement on SONA legislative priorities','https://www.congress.gov.ph/media/press-releases/9952'],['Reuters report on the 2026 SONA','https://www.reuters.com/world/asia-pacific/philippines-marcos-puts-anti-graft-campaign-centre-address-congress-2026-07-27/']]
  },
  {
    slug: 'lower-electricity-costs-system-loss-consumer-protection',
    section: 'Philippines', kicker: 'Philippines · Consumer affairs · Energy', read: '5 min read',
    title: 'Lower Electricity Costs Move to Congress as Consumer Protection Questions Grow',
    meta: 'Congress is considering proposals on electricity taxes, system-loss recovery and consumer protection as households continue to question high power bills.',
    deck: 'Bills and resolutions now before the House could reshape electricity charges, but affordability will depend on the final text, regulation and enforcement.',
    image: '/assets/images/news/pbbm-sona-2026-analysis.svg', alt: 'FMB News editorial illustration representing electricity costs and consumer protection',
    body: [
      ['What is before Congress', 'House measures include proposals to zero-rate value-added tax on electricity components, reduce recoverable system-loss rates, rationalize universal and transition charges and strengthen government support for lifeline and senior-citizen discounts. A separate resolution seeks an inquiry into reported overbilling, disputed meter readings and high rates involving Meralco.'],
      ['Why system loss matters', 'System loss refers broadly to electricity lost while power moves through distribution networks, including technical losses and other recognized categories. Regulators allow part of these costs to be recovered from consumers. The policy question is how much should be recoverable, how efficiently utilities operate and whether customers receive transparent explanations.'],
      ['What consumers need from reform', 'A serious affordability package should show the effect on an ordinary monthly bill, identify which charges change, protect lifeline users and prevent savings in one line item from being offset elsewhere. It should also strengthen complaint handling and meter-review procedures.'],
      ['What remains uncertain', 'Filed bills and resolutions are not yet law. Committee hearings, regulator input, utility data and budget implications can substantially change the proposals before final approval.']
    ],
    sources: [['House energy legislation record','https://www.congress.gov.ph/committees/committee/view/0510?page=2'],['House resolution on reported overbilling and high rates','https://congress.gov.ph/house-members/view/L022'],['House statement on lowering electricity costs','https://www.congress.gov.ph/media/press-releases/9952']]
  },
  {
    slug: 'ayungin-provisional-understanding-senate-review',
    section: 'Philippines', kicker: 'West Philippine Sea · Diplomacy · Explainer', read: '6 min read',
    title: 'Ayungin Understanding Faces Senate Scrutiny: What the Government Says It Does Not Concede',
    meta: 'The DFA says the provisional understanding with China does not require permission for Philippine resupply missions or concede sovereign rights at Ayungin Shoal.',
    deck: 'The Senate may examine whether the arrangement is consistent with the 2016 arbitral award, while the DFA says Philippine legal positions remain unchanged.',
    image: '/assets/images/news/new-clark-city-pax-silica-pia.jpg', alt: 'FMB News report on Philippine sovereignty and the West Philippine Sea',
    body: [
      ['The arrangement under review', 'The Department of Foreign Affairs describes the provisional understanding with China as a set of principles intended to reduce misunderstanding and miscalculation during rotation and resupply missions to the BRP Sierra Madre at Ayungin Shoal.'],
      ['What the DFA says it does not do', 'According to the DFA, the understanding is not a request for Chinese permission, does not recognize foreign jurisdiction over Philippine waters, does not permit boarding or inspection of Philippine vessels and does not prejudice either country’s formal position.'],
      ['Why the Senate wants answers', 'A proposed Senate inquiry seeks to examine the arrangement’s consistency with the 2016 arbitral award and its implications for Philippine sovereign rights. The DFA has said it is prepared to explain the understanding in coordination with defense and security agencies.'],
      ['The public-interest test', 'De-escalation can protect personnel and reduce the risk of conflict. But any operational understanding involving a strategic maritime feature requires clear limits, democratic oversight and confidence that practical safety measures do not become a basis for another state to claim authority it does not possess under international law.']
    ],
    sources: [['DFA explanation reported by PNA','https://www.pna.gov.ph/articles/1280177'],['DFA readiness for Senate review','https://www.pna.gov.ph/articles/1280535'],['2016 arbitral award background','https://www.pna.gov.ph/index.php/articles/1279229']]
  },
  {
    slug: 'middle-east-war-suez-red-sea-shipping-filipino-impact',
    section: 'World', kicker: 'World · Middle East · Philippine impact', read: '6 min read',
    title: 'Widening Middle East War Threatens Suez and Red Sea Shipping: Why Filipinos Should Watch',
    meta: 'A drone strike near the Suez Canal and attacks across regional shipping routes are raising risks for fuel prices, trade, seafarers and overseas Filipino workers.',
    deck: 'The danger is no longer confined to one waterway. Disruption around Hormuz, the Red Sea and the Suez route could reach Filipino households through energy and shipping costs.',
    image: '/assets/images/news/todays-headlines-july-27-2026.svg', alt: 'FMB News world briefing illustration about Middle East conflict and shipping routes',
    body: [
      ['A new threat near the Suez Canal', 'Reuters reported that an unidentified drone caused a fire on two vessels at Egypt’s Damietta port, near the Suez Canal. The incident raised concern that the widening conflict could threaten another major route for energy and commercial shipping.'],
      ['Why maritime chokepoints matter', 'The Strait of Hormuz, Bab el-Mandeb, the Red Sea and the Suez Canal connect energy producers, Asian importers and European markets. When ships reroute, suspend tracking or face higher insurance costs, freight and fuel become more expensive even far from the fighting.'],
      ['The Philippine connection', 'The Philippines imports fuel, depends heavily on maritime trade and has many citizens working as seafarers or across the Middle East. Companies and government agencies should review crew safety, evacuation readiness, contract protections, remittance continuity and the possible effect of higher transport costs on consumer prices.'],
      ['What to monitor', 'The most important signals are safe passage through key routes, official advisories for Filipino workers and seafarers, oil-price movements, airline changes and whether diplomatic efforts reduce rather than expand the conflict.']
    ],
    sources: [['Reuters on the Damietta drone strike','https://www.reuters.com/world/middle-east/us-military-says-it-hit-dozens-irans-irgc-targets-2026-07-30/'],['Reuters on Red Sea maritime coalition plans','https://www.reuters.com/world/middle-east/saudi-arabia-unveils-plans-multinational-maritime-defence-coalition-2026-07-30/'],['Reuters on oil-market volatility','https://www.reuters.com/business/energy/oil-prices-slip-tankers-continue-ply-middle-east-conflict-zones-2026-07-30/']]
  },
  {
    slug: 'russia-ukraine-missile-drone-attack-children-killed',
    section: 'World', kicker: 'World · Ukraine · Civilian protection', read: '5 min read',
    title: 'Children Among Nine Killed as Russia Launches Major Missile and Drone Attack on Ukraine',
    meta: 'A major Russian aerial attack killed at least nine people in Ukraine, including children, as Kyiv renewed calls for faster air-defense support.',
    deck: 'More than 70 missiles and about 280 drones were launched, according to Ukraine, with residential areas and civilian facilities among those damaged.',
    image: '/assets/images/news/todays-headlines-july-27-2026.svg', alt: 'FMB News world report illustration about the war in Ukraine',
    body: [
      ['The attack', 'Russia launched more than 70 missiles and about 280 drones in an overnight assault, according to Ukrainian President Volodymyr Zelenskiy. At least nine people were reported killed, including children, with Kyiv, Lviv and other areas affected.'],
      ['Civilian damage', 'Officials reported damage to homes, a school and kindergartens. In a village in the Dnipropetrovsk region, six people, including three children, were killed in a missile strike. Reuters said it could not independently verify every battlefield claim.'],
      ['The air-defense problem', 'Ukraine said its defenses intercepted many incoming weapons but stopped only one of nine ballistic missiles. Zelenskiy again argued that delays in anti-ballistic missile supplies were costing lives.'],
      ['Why the story still matters', 'Long wars can disappear from public attention while civilians continue to die. Responsible coverage must resist treating repeated attacks as routine and should distinguish confirmed civilian consequences from unverified military claims by either side.']
    ],
    sources: [['Reuters report on the attack','https://www.reuters.com/world/europe/russia-striking-kyiv-with-ballistic-missiles-mayor-says-2026-07-29/']]
  },
  {
    slug: 'wildfires-europe-north-africa-canada-extreme-heat',
    section: 'World', kicker: 'World · Climate · Disasters', read: '5 min read',
    title: 'Wildfires Spread Across Europe, North Africa and Canada as Extreme Heat Tests Emergency Systems',
    meta: 'Major wildfires and evacuations across Europe, North Africa and Canada are exposing the growing strain of longer, more intense fire seasons.',
    deck: 'Firefighters are confronting simultaneous emergencies, heavy evacuations and pressure on aircraft, crews and local response capacity.',
    image: '/assets/images/news/todays-headlines-july-27-2026.svg', alt: 'FMB News climate report illustration representing wildfires and extreme heat',
    body: [
      ['A crisis across regions', 'Wildfires have affected France, Spain, parts of North Africa and Canada during a period of intense heat and dry conditions. Reuters reported large evacuations in France and Spain, while hundreds of fires remained active in Canada.'],
      ['Emergency systems under strain', 'Longer fire seasons mean aircraft, pilots, firefighters and emergency budgets are needed for more months of the year. When multiple regions burn at once, countries have less capacity to share equipment and personnel.'],
      ['Beyond burned land', 'Wildfires disrupt health, tourism, agriculture, transport, housing and insurance. Smoke can travel far beyond the fire line, while repeated evacuations carry emotional and economic costs that are difficult to capture in a single damage estimate.'],
      ['The lesson for the Philippines', 'The hazard is different from typhoons and monsoon flooding, but the governance principle is similar: prevention, land management, early warning, evacuation planning and resilient local systems matter before a disaster becomes an international headline.']
    ],
    sources: [['Reuters overview of wildfires','https://www.reuters.com/sustainability/europe-north-africa-canada-wildfires-2026-07-28/'],['Reuters report from Bordeaux','https://www.reuters.com/business/environment/french-firefighters-battle-keep-blazes-bordeaux-2026-07-26/']]
  },
  {
    slug: 'gaza-ceasefire-talks-rare-progress-no-final-deal',
    section: 'World', kicker: 'World · Gaza · Developing story', read: '5 min read',
    title: 'Gaza Talks Show Rare Progress, but Major Disarmament and Control Disputes Remain',
    meta: 'Mediators reported progress in Gaza ceasefire talks, but Israel rejected the current proposal and major disputes over weapons, territory and governance remain.',
    deck: 'The negotiations may be moving, but there is no final agreement and violence has continued during the diplomatic push.',
    image: '/assets/images/news/todays-headlines-july-27-2026.svg', alt: 'FMB News world report illustration about Gaza ceasefire negotiations',
    body: [
      ['What negotiators are discussing', 'Hamas leaders and mediators from Egypt, Qatar and Turkey have been discussing implementation of a United States-backed Gaza plan. Sources told Reuters the talks were positive and making progress.'],
      ['Why there is no deal yet', 'Disarmament remains the central obstacle. An Israeli official said the current proposal was not satisfactory because it did not meet Israel’s demand for complete disarmament and demilitarization. Questions also remain over Israeli withdrawal, governance and an international stabilization force.'],
      ['Violence continues', 'The diplomatic movement has not ended attacks. Reuters reported Israeli strikes killed Palestinians, including children, while the broader death toll since the ceasefire remained contested and politically sensitive.'],
      ['How to read developing diplomacy', 'Progress in negotiations is meaningful, but headlines should not convert movement into an agreement that does not exist. The real test is a signed, implemented arrangement that protects civilians, expands aid and creates enforceable obligations for all parties.']
    ],
    sources: [['Reuters on Gaza ceasefire talks','https://www.reuters.com/world/middle-east/israeli-strikes-kill-three-gaza-including-two-children-amid-new-ceasefire-push-2026-07-30/']]
  },
  {
    slug: 'philippines-weather-habagat-rain-thunderstorms-august-2026',
    section: 'Philippines', kicker: 'Weather · Public service · Philippines', read: '4 min read',
    title: 'Habagat Keeps Rain and Thunderstorm Risk in the Forecast as August Begins',
    meta: 'PAGASA forecasts continued rain and thunderstorm risk, with western Luzon and parts of the country facing possible heavy downpours and localized flooding.',
    deck: 'Zambales and other western areas should continue monitoring short-term advisories even when the day begins with only cloudy or partly cloudy skies.',
    image: '/assets/images/news/todays-headlines-july-27-2026.svg', alt: 'FMB News Philippine weather advisory illustration for Habagat rains and thunderstorms',
    body: [
      ['The weather pattern', 'PAGASA forecasts show the southwest monsoon affecting western sections of Luzon, with easterlies and localized thunderstorms influencing other areas. Forecasts can change quickly, especially during afternoon and evening thunderstorm development.'],
      ['Zambales and western Luzon', 'Recent PAGASA bulletins placed Zambales among areas experiencing scattered rain and thunderstorms, with possible flash floods or landslides during moderate to at times heavy rain. Residents near slopes, rivers and low-lying roads should monitor local warnings.'],
      ['What families should do', 'Keep phones charged, protect documents and medicines from water, avoid crossing flooded roads and confirm sea conditions before fishing or small-craft travel. Thunderstorms can produce intense rain and strong winds even when no tropical cyclone warning is in effect.'],
      ['Use the latest bulletin', 'Weather articles become outdated quickly. Readers should rely on PAGASA’s newest daily forecast, rainfall warnings and local disaster advisories rather than treating this report as a permanent forecast.']
    ],
    sources: [['PAGASA daily weather forecast','https://www.pagasa.dost.gov.ph/weather'],['PAGASA sub-seasonal outlook','https://www.pagasa.dost.gov.ph/climate/climate-prediction/sub-seasonal2'],['PAGASA weekly outlook','https://www.pagasa.dost.gov.ph/weather/weather-outlook-weekly']]
  },
  {
    slug: 'virgin-mary-house-replica-alfonso-cavite-pilgrimage',
    section: 'Culture', kicker: 'Culture · Faith · Tourism', read: '5 min read',
    title: 'Replica of the Virgin Mary’s House in Cavite Draws Pilgrims Seeking Quiet and Refuge',
    meta: 'A replica of the House of the Virgin Mary in Alfonso, Cavite, is becoming a pilgrimage destination rooted in Filipino Marian devotion and hospitality.',
    deck: 'Built to mirror the shrine in Ephesus, Turkey, the small structure has attracted visitors despite limited promotion.',
    image: '/assets/images/news/todays-headlines-july-27-2026.svg', alt: 'FMB News culture report illustration about pilgrimage and Filipino Marian devotion',
    body: [
      ['A pilgrimage site closer to home', 'A 67-square-meter replica of the House of the Virgin Mary in Ephesus, Turkey, now stands in Alfonso, Cavite. The site was inaugurated in 2024 and has hosted Catholic pilgrimages, including celebrations connected to the Feast of Our Lady of Mount Carmel.'],
      ['Built as a place of refuge', 'The project was led by priest and psychologist Dennis Paez, who described the site as a place where visitors can arrive without being judged. Workers of different faiths helped construct the replica, which follows the dimensions and appearance of the original shrine.'],
      ['Why Marian devotion remains powerful', 'For many Filipino Catholics, Mary represents maternal comfort and intercession. That devotion appears in homes, vehicles, processions, churches and moments of national crisis. The Cavite site gives that spiritual tradition a physical destination within reach of Metro Manila and nearby provinces.'],
      ['Faith, culture and local tourism', 'Pilgrimage can support local livelihoods, but responsible destination development should protect the atmosphere that drew visitors in the first place. Access, traffic, waste management and truthful interpretation matter as awareness of the site grows.']
    ],
    sources: [['Associated Press feature','https://apnews.com/article/a809aed3efa85279982e3e006b8b5570']]
  }
];

function esc(value) { return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function page(story) {
  const url = `https://www.francinemariebautista.com/news/${story.slug}/`;
  const sourceLinks = story.sources.map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`).join('');
  const body = story.body.map(([heading, text]) => `<h2>${esc(heading)}</h2><p>${esc(text)}</p>`).join('\n');
  const schema = JSON.stringify({ '@context':'https://schema.org','@type':'NewsArticle',headline:story.title,description:story.meta,datePublished:published,dateModified:published,inLanguage:'en-PH',isAccessibleForFree:true,author:{'@type':'Person',name:'Francine Marie Bautista',url:'https://www.francinemariebautista.com/aboutfmb/'},publisher:{'@type':'Organization',name:'FMB News Center',url:'https://www.francinemariebautista.com/news/'},mainEntityOfPage:{'@type':'WebPage','@id':url},articleSection:story.section,image:`https://www.francinemariebautista.com${story.image}`});
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(story.title)} | FMB News</title><meta name="description" content="${esc(story.meta)}"><meta name="author" content="Francine Marie Bautista"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:locale" content="en_PH"><meta property="og:site_name" content="FMB News Center"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.meta)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://www.francinemariebautista.com${story.image}"><meta property="article:published_time" content="${published}"><meta property="article:modified_time" content="${published}"><meta property="article:author" content="Francine Marie Bautista"><meta property="article:section" content="${esc(story.section)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(story.title)}"><meta name="twitter:description" content="${esc(story.meta)}"><meta name="twitter:image" content="https://www.francinemariebautista.com${story.image}"><script type="application/ld+json">${schema}</script><link rel="icon" href="/assets/images/fmb-approved/fmb-master-purple-square.webp" type="image/webp"><link rel="stylesheet" href="/assets/css/site.css?v=20260716g"><link rel="stylesheet" href="/assets/css/fmb-polish.css?v=20260717a"><link rel="stylesheet" href="/assets/css/news-channel.css?v=20260720a"><link rel="stylesheet" href="/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3"></head><body class="news-route news-story-route"><a class="nc-skip" href="#story">Skip to the story</a><header class="nc-site-header"><div class="nc-brandline"><div class="wrap"><span class="nc-network-label"><i></i> FMB News Center</span><span class="nc-network-clock"><time data-news-clock>Philippine Standard Time</time><b>PHT</b></span></div></div><div class="nc-nav-shell wrap"><a class="nc-publication-brand" href="/news/" aria-label="FMB News Center front page"><span>FMB News Center</span></a><nav class="nc-site-links" id="newsNav" aria-label="News navigation"><a href="/news/">Headlines</a><a href="/news/#philippines">Philippines</a><a href="/news/#world">World</a><a href="/news/#culture">Culture</a></nav></div></header><main id="story"><div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/news/">Back to headlines</a><span class="nc-story-edition">FMB News Center · 31 July 2026</span></div></div><header class="nc-article-hero"><div class="wrap"><div class="nc-article-hero-grid"><div><p class="nc-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1></div><p class="nc-article-deck">${esc(story.deck)}</p></div><div class="nc-article-meta"><span>By Francine Marie Bautista</span><span>Published 31 July 2026</span><span>${story.read}</span><span>Sources reviewed</span></div></div></header><section class="nc-story-media"><div class="wrap"><figure class="news-visual"><img src="${story.image}" width="1536" height="864" alt="${esc(story.alt)}" fetchpriority="high" decoding="async"><figcaption>FMB News Center editorial visual. Source links and reporting basis appear below.</figcaption></figure></div></section><article class="nc-article"><div class="wrap nc-article-layout"><aside class="nc-story-aside"><dl><div><dt>Desk</dt><dd>${esc(story.section)}</dd></div><div><dt>Format</dt><dd>News explainer</dd></div><div><dt>Published</dt><dd>31 July 2026</dd></div></dl><button class="nc-share-button" type="button" data-news-share>Share this report</button></aside><div class="nc-story-body"><div class="nc-factbox"><p><strong>Editorial note:</strong> This report distinguishes confirmed developments, official claims and matters that remain under negotiation or legislative review.</p></div><p><strong>${esc(story.deck)}</strong></p>${body}<section class="nc-sources"><h2>Sources and public record</h2>${sourceLinks}</section></div><aside class="nc-story-rail"><p>More from this edition</p><a href="/news/marcos-authorizes-release-sara-duterte-tax-records/">Sara Duterte tax records authorized for release<span>Philippines</span></a><a href="/news/pbbm-sona-2026-accountability-delivery/">The 2026 SONA and the test of delivery<span>Analysis</span></a><a href="/news/">Return to all headlines<span>FMB News Center</span></a></aside></div></article></main><footer class="nc-footer"><div class="wrap"><div class="nc-footer-bottom"><span>© 2026 Francine Marie Bautista. All rights reserved.</span><span>FMB News Center · ${esc(story.section)}</span></div></div></footer><script src="/assets/js/news-channel.js?v=20260719-broadcast-v3"></script></body></html>`;
}

for (const story of stories) {
  const dir = path.join(newsRoot, story.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), page(story), 'utf8');
}

let landing = await readFile(landingPath, 'utf8');
const latestBriefingHref = '/news/todays-headlines-august-2-2026/';
const hasLatestBriefing = landing.includes(latestBriefingHref);
const canUpdateLegacyLanding = landing.includes('<div class="nc-wire-track">')
  && landing.includes('<div class="nc-rundown-head">')
  && landing.includes('"itemListElement":[');

if (!canUpdateLegacyLanding) {
  console.warn('Catch-up edition: legacy landing hooks are absent; the final feed renderer will index the generated reports.');
}

for (const story of [...stories].reverse()) {
  if (!canUpdateLegacyLanding) break;
  const href = `/news/${story.slug}/`;
  if (landing.includes(href)) continue;

  const wireMarker = '<div class="nc-wire-track">';
  const wireStart = landing.indexOf(wireMarker);
  if (wireStart < 0) throw new Error('Catch-up edition: news wire insertion point not found');
  if (hasLatestBriefing) {
    const firstWireItemEnd = landing.indexOf('</span>', wireStart);
    if (firstWireItemEnd < 0) throw new Error('Catch-up edition: news wire item not found');
    const insertionPoint = firstWireItemEnd + '</span>'.length;
    landing = `${landing.slice(0, insertionPoint)}<span>${esc(story.title)}</span>${landing.slice(insertionPoint)}`;
  } else {
    landing = landing.replace(wireMarker, `${wireMarker}<span>${esc(story.title)}</span>`);
  }

  const header = '<div class="nc-rundown-head">';
  const headerStart = landing.indexOf(header);
  const latestCardHref = landing.indexOf(`href="${latestBriefingHref}"`, headerStart);
  let cardInsertionPoint;
  if (latestCardHref >= 0) {
    const latestCardEnd = landing.indexOf('</article>', latestCardHref);
    if (latestCardEnd < 0) throw new Error('Catch-up edition: latest briefing card is incomplete');
    cardInsertionPoint = latestCardEnd + '</article>'.length;
  } else {
    cardInsertionPoint = landing.indexOf('<article class="nc-rundown-story"', headerStart);
  }
  if (cardInsertionPoint < 0) throw new Error('Catch-up edition: rundown insertion point not found');

  const card = `\n        <article class="nc-rundown-story"><a href="${href}"><span class="nc-rundown-number">NEW</span><figure class="news-visual"><img src="${story.image}" width="1536" height="864" loading="lazy" decoding="async" alt="${esc(story.alt)}"><figcaption>FMB News Center editorial visual. Sources appear in the report.</figcaption></figure><div><p>${esc(story.kicker)}</p><h3>${esc(story.title)}</h3><span>${story.read}</span></div></a></article>`;
  landing = `${landing.slice(0, cardInsertionPoint)}${card}${landing.slice(cardInsertionPoint)}`;

  const listMarker = '"itemListElement":[';
  const listStart = landing.indexOf(listMarker);
  const latestListUrl = `"url":"https://www.francinemariebautista.com${latestBriefingHref}"`;
  const latestListItem = landing.indexOf(latestListUrl, listStart);
  if (latestListItem >= 0) {
    const latestListItemEnd = landing.indexOf('},', latestListItem);
    if (latestListItemEnd < 0) throw new Error('Catch-up edition: latest structured-data item is incomplete');
    const insertionPoint = latestListItemEnd + 2;
    const item = `\n        {"@type":"ListItem","position":2,"url":"https://www.francinemariebautista.com${href}","name":${JSON.stringify(story.title)}},`;
    landing = `${landing.slice(0, insertionPoint)}${item}${landing.slice(insertionPoint)}`;
  } else {
    landing = landing.replace(listMarker, `${listMarker}\n        {"@type":"ListItem","position":1,"url":"https://www.francinemariebautista.com${href}","name":${JSON.stringify(story.title)}},`);
  }
}

let rundownPosition = 0;
landing = landing.replace(
  /<span class="nc-rundown-number">(?:NEW|\d+)<\/span>/g,
  () => `<span class="nc-rundown-number">${String(++rundownPosition).padStart(2, '0')}</span>`
);

const listStart = landing.indexOf('"itemListElement":[');
const listEnd = listStart >= 0 ? landing.indexOf(']', listStart) : -1;
if (listStart >= 0 && listEnd >= 0) {
  let structuredPosition = 0;
  const listBlock = landing
    .slice(listStart, listEnd)
    .replace(/"position":\d+/g, () => `"position":${++structuredPosition}`);
  landing = `${landing.slice(0, listStart)}${listBlock}${landing.slice(listEnd)}`;
}

const editionDate = hasLatestBriefing ? '2 August 2026' : '31 July 2026';
landing = landing.replace(
  /<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/,
  `<time data-news-updated>Updated ${editionDate}</time>`
);
await writeFile(landingPath, landing, 'utf8');
console.log(`Published ${stories.length} verified FMB News catch-up reports behind the latest daily briefing.`);
