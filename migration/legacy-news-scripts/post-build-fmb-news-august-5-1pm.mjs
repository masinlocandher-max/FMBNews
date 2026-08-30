import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const sitemapPath = path.join(root, 'dist', 'sitemap.xml');
const assetDir = path.join(root, 'dist', 'assets', 'images', 'news');
const slug = 'measles-rubella-vaccination-august-2026-fmb-news-1pm';
const href = `/news/${slug}/`;
const canonical = `https://www.francinemariebautista.com${href}`;
const published = '2026-08-05T13:00:00+08:00';
const label = '5 August 2026, 1:00 p.m. PHT';
const title = 'August Measles-Rubella Vaccination Drive Targets Young Children';
const description = 'Health authorities are preparing an August 10-28 supplemental measles-rubella vaccination campaign for children aged 6 to 59 months, while urging families to rely on accurate vaccine information.';
const imagePath = '/assets/images/news/fmb-news-measles-rubella-august-2026.svg';

const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

const illustration = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#121a43"/><stop offset=".55" stop-color="#4d2879"/><stop offset="1" stop-color="#8d3f88"/></linearGradient></defs><rect width="1200" height="675" fill="url(#g)"/><circle cx="940" cy="160" r="210" fill="#ffffff" opacity=".07"/><circle cx="995" cy="220" r="115" fill="#ffffff" opacity=".08"/><g transform="translate(90 70)"><path d="M0 70A70 70 0 0 1 70 0" fill="none" stroke="#fff" stroke-width="15"/><path d="M23 70A47 47 0 0 1 70 23" fill="none" stroke="#e7b544" stroke-width="15"/><text x="96" y="48" fill="#fff" font-family="Georgia,serif" font-size="64" font-weight="700">FMB</text><text x="98" y="84" fill="#d7b9ff" font-family="Arial,sans-serif" font-size="24" font-weight="700" letter-spacing="10">NEWS</text></g><text x="90" y="235" fill="#fff" font-family="Arial,sans-serif" font-size="25" font-weight="800" letter-spacing="4">PUBLIC HEALTH</text><text x="90" y="330" fill="#fff" font-family="Arial,sans-serif" font-size="62" font-weight="800">MEASLES-RUBELLA</text><text x="90" y="405" fill="#fff" font-family="Arial,sans-serif" font-size="62" font-weight="800">VACCINATION DRIVE</text><text x="90" y="475" fill="#e7b544" font-family="Arial,sans-serif" font-size="39" font-weight="800">AUGUST 10-28, 2026</text><text x="90" y="555" fill="#fff" opacity=".9" font-family="Arial,sans-serif" font-size="23">For children aged 6 to 59 months</text><text x="1110" y="630" text-anchor="end" fill="#fff" opacity=".8" font-family="Arial,sans-serif" font-size="16">EDITORIAL ILLUSTRATION: FMB NEWS</text></svg>`;

const sections = [
  ['What happened', 'The Department of Health in the Ilocos Region is intensifying preparations for the Measles-Rubella Supplemental Immunization Activity scheduled from August 10 to 28, 2026. The campaign targets children aged 6 months to 59 months and is intended to raise immunization coverage and reduce the risk of outbreaks.'],
  ['What is verified', 'The regional health office announced the campaign schedule and target age group in a July 4 press release. It also urged parents and guardians to rely on health workers and accurate vaccine information. The announcement does not claim that vaccination eliminates every possible infection, and this report does not make that claim.'],
  ['Why It Matters to Us, Filipinos', 'Measles is highly contagious, and gaps in routine childhood vaccination can allow outbreaks to spread quickly through families, schools and communities. A time-limited supplemental campaign gives local health systems another opportunity to reach children who missed earlier doses or whose records need to be checked. Parents should confirm eligibility and local schedules with their barangay health center or municipal health office.'],
  ['Key lesson', 'Public-health campaigns work best when families receive clear information early, local schedules are easy to verify, and health workers have enough supplies and staffing to reach children safely.']
];

const briefs = [
  {
    type:'Philippine update',
    slug:'philippine-news-trust-digital-news-report-2026',
    title:'Philippine News Trust Falls as More Audiences Rely on Platform Feeds',
    subheadline:'The 2026 Digital News Report says overall trust in news in the Philippines fell to 28%, while social platforms remain central to how many people encounter journalism.',
    text:'The Reuters Institute country report for the Philippines recorded overall news trust at 28%, down 10 percentage points, and said fewer Filipinos were accessing news directly through television, radio or news websites. The report also noted intensified debate over proposed anti-disinformation laws and the risks such measures may pose to legitimate journalism.',
    why:'For Filipinos, weaker trust makes it easier for political messaging, manipulated content and personality-driven accounts to replace verified reporting. News organizations must show their sources, separate fact from analysis and correct errors visibly.',
    lesson:'Trust is earned through transparent sourcing and consistent accuracy, not branding alone.',
    seo:'Philippine News Trust Falls to 28% in 2026 Report | FMB News',
    meta:'The Reuters Institute says overall news trust in the Philippines fell to 28% as platform feeds play a larger role in news discovery.',
    keywords:'Philippine news trust, Digital News Report 2026, disinformation Philippines, media literacy',
    facebook:'News trust in the Philippines has fallen sharply. The challenge for every newsroom is clear: show the evidence, separate facts from claims, and make corrections visible.',
    pubmat:'PH NEWS TRUST FALLS TO 28%',
    image:'Use an original FMB News editorial illustration of a phone feed, verified-source markers and a newsroom desk. Credit: Editorial illustration by FMB News.',
    sources:[['Reuters Institute Digital News Report 2026: Philippines','https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/philippines']]
  },
  {
    type:'Global development with Filipino relevance',
    slug:'asia-markets-rise-oil-retreats-august-5-2026',
    title:'Asian Markets Rise as Oil Retreats and Technology Sentiment Recovers',
    subheadline:'Major Asian indexes advanced while Brent crude moved further below its July high, offering limited relief from inflation concerns.',
    text:'Reuters reported that Japan’s Nikkei rose 3.0%, South Korea’s KOSPI gained 4.1% and the broader Asia-Pacific index outside Japan advanced 2.4%. Brent crude fell to about $78.27 a barrel as markets responded to signs that Strait of Hormuz traffic was more resilient than initially feared and to cautious diplomatic optimism.',
    why:'The Philippines imports most of its petroleum needs. Sustained lower oil prices can ease pressure on transport, food distribution and inflation, while stronger regional markets can influence investment flows and the peso. One trading session, however, does not guarantee cheaper local fuel or lasting stability.',
    lesson:'Market optimism should be measured against the durability of the underlying supply and diplomatic conditions.',
    seo:'Asian Markets Rise as Oil Falls Below $79 | FMB News',
    meta:'Asian shares advanced and oil prices retreated as technology sentiment improved and Hormuz supply fears eased.',
    keywords:'Asian markets, oil prices Philippines, Strait of Hormuz, Nikkei, KOSPI',
    facebook:'Asian markets climbed while oil prices moved lower. The development may ease some inflation pressure, but lasting relief for Filipinos depends on sustained supply and local pump-price adjustments.',
    pubmat:'ASIAN MARKETS RISE AS OIL RETREATS',
    image:'Use an original FMB News market illustration showing Asian index lines and an oil tanker. Credit: Editorial illustration by FMB News.',
    sources:[['Reuters global markets report, August 5, 2026','https://www.reuters.com/world/china/global-markets-global-markets-2026-08-05/']]
  },
  {
    type:'Business and technology',
    slug:'ai-capital-spending-investor-scrutiny-august-2026',
    title:'Investors Put AI Spending Under Greater Scrutiny',
    subheadline:'Strong technology demand is no longer enough to calm concerns about the cost of chips, computing capacity and large infrastructure programs.',
    text:'Reuters reported that AMD shares fell after hours despite results that beat forecasts, while SpaceX shares also declined as investors focused on capital expenditure and future financing needs. The reaction reflects a wider concern across AI-linked companies: whether revenue and productivity gains can keep pace with the cost of computing infrastructure.',
    why:'AI investment affects global outsourcing, startup funding and demand for Filipino digital workers. The market signal is that companies need useful products, disciplined spending and credible revenue rather than relying on the AI label alone.',
    lesson:'Technology investment becomes sustainable only when capability is matched by measurable value and responsible financing.',
    seo:'Investors Scrutinize the Rising Cost of AI Expansion | FMB News',
    meta:'Technology investors are focusing on whether AI revenue can justify the rising cost of chips, data centers and computing infrastructure.',
    keywords:'AI investment, technology stocks, AMD, computing costs, Filipino digital workers',
    facebook:'The AI boom is entering a harder phase. Investors are asking whether enormous spending on chips and computing capacity can produce sustainable returns.',
    pubmat:'THE AI BOOM FACES A COST TEST',
    image:'Use an original FMB News data-center illustration with cost and revenue indicators. Credit: Editorial illustration by FMB News.',
    sources:[['Reuters global markets report, August 5, 2026','https://www.reuters.com/world/china/global-markets-global-markets-2026-08-05/']]
  }
];

const sourceLinks = [
  ['DOH Ilocos measles-rubella campaign release, July 4, 2026','https://ro1.doh.gov.ph/doh-pushes-for-accurate-vaccine-information-urges-parents-to-protect-children-through-measles-rubella-vaccination-this-august/'],
  ['Reuters Institute Digital News Report 2026: Philippines','https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/philippines'],
  ['Reuters global markets report, August 5, 2026','https://www.reuters.com/world/china/global-markets-global-markets-2026-08-05/']
];

function briefHtml(b){return `<section class="nc-brief"><p class="nc-kicker">${esc(b.type)}</p><h2>${esc(b.title)}</h2><p><strong>${esc(b.subheadline)}</strong></p><p>${esc(b.text)}</p><h3>Why It Matters to Us, Filipinos</h3><p>${esc(b.why)}</p><h3>Key lesson</h3><p>${esc(b.lesson)}</p><div class="nc-factbox"><p><strong>Slug:</strong> ${esc(b.slug)}</p><p><strong>SEO title:</strong> ${esc(b.seo)}</p><p><strong>Meta description:</strong> ${esc(b.meta)}</p><p><strong>Keywords:</strong> ${esc(b.keywords)}</p><p><strong>Facebook caption:</strong> ${esc(b.facebook)}</p><p><strong>Pubmat text:</strong> ${esc(b.pubmat)}</p><p><strong>Image guidance:</strong> ${esc(b.image)}</p></div></section>`}

const schema = JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:title,description,datePublished:published,dateModified:published,inLanguage:'en-PH',isAccessibleForFree:true,author:{'@type':'Person',name:'Francine Marie Bautista'},publisher:{'@type':'Organization',name:'FMB News'},mainEntityOfPage:{'@type':'WebPage','@id':canonical},articleSection:'Public Health',image:[`https://www.francinemariebautista.com${imagePath}`]});

const article = `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | FMB News</title><meta name="description" content="${esc(description)}"><meta name="keywords" content="measles vaccine Philippines, rubella vaccination, child health, August 2026 immunization"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="https://www.francinemariebautista.com${imagePath}"><meta property="article:published_time" content="${published}"><script type="application/ld+json">${schema}</script><link rel="stylesheet" href="/assets/css/site.css?v=20260716g"><link rel="stylesheet" href="/assets/css/news-channel.css?v=20260720a"><link rel="stylesheet" href="/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3"></head><body class="news-route news-story-route"><main id="story"><div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/news/">Back to headlines</a><span>${label}</span></div></div><header class="nc-article-hero"><div class="wrap"><p class="nc-kicker">Public Health · FMB News Hourly</p><h1>${esc(title)}</h1><p class="nc-article-deck">${esc(description)}</p><div class="nc-article-meta"><span>By Francine Marie Bautista</span><span>${label}</span><span>8 min read</span></div></div></header><section class="nc-story-media"><div class="wrap"><figure class="news-visual"><img src="${imagePath}" width="1200" height="675" alt="FMB News illustration for the August measles-rubella vaccination campaign"><figcaption>Editorial illustration by FMB News.</figcaption></figure></div></section><article class="nc-article"><div class="wrap nc-article-layout"><div class="nc-story-body"><div class="nc-factbox"><p><strong>Impeachment Desk:</strong> No verified material change this hour.</p></div>${sections.map(([h,p])=>`<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('')}<div class="nc-factbox"><p><strong>Slug:</strong> measles-rubella-vaccination-august-2026</p><p><strong>SEO title:</strong> August Measles-Rubella Vaccination Drive for Young Children | FMB News</p><p><strong>Meta description:</strong> The August 10-28 measles-rubella campaign targets Philippine children aged 6 to 59 months and urges families to verify local schedules.</p><p><strong>Keywords:</strong> measles vaccine Philippines, rubella vaccination, child health, August 2026 immunization</p><p><strong>Facebook caption:</strong> Health authorities are preparing an August 10-28 measles-rubella vaccination campaign for children aged 6 to 59 months. Families should confirm local schedules and eligibility with their health center.</p><p><strong>Pubmat text:</strong> MEASLES-RUBELLA VACCINATION DRIVE · AUGUST 10-28</p><p><strong>Image guidance:</strong> Original FMB News editorial illustration. Credit: Editorial illustration by FMB News.</p></div>${briefs.map(briefHtml).join('')}<section class="nc-sources"><h2>Sources and public record</h2>${sourceLinks.map(([l,u])=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${esc(l)}</a>`).join('')}</section></div></div></article></main></body></html>`;

await mkdir(path.join(newsRoot, slug), {recursive:true});
await mkdir(assetDir, {recursive:true});
await writeFile(path.join(assetDir, 'fmb-news-measles-rubella-august-2026.svg'), illustration, 'utf8');
await writeFile(path.join(newsRoot, slug, 'index.html'), article, 'utf8');

let landing = await readFile(landingPath, 'utf8');
if (!landing.includes(href)) {
  const marker = landing.indexOf('<article class="nc-rundown-story"');
  if (marker < 0) {
    console.log('Skipped obsolete 1PM landing insertion; route-based recovery will collect the published report.');
  } else {
    const card = `<article class="nc-rundown-story" data-category="health"><a href="${href}"><span class="nc-rundown-number">1PM</span><figure class="news-visual"><img src="${imagePath}" width="1200" height="675" loading="lazy" alt="Measles-rubella vaccination campaign"><figcaption>Editorial illustration by FMB News.</figcaption></figure><div><p>Public Health · Child protection</p><h3>${esc(title)}</h3><span>8 min read</span></div></a></article>`;
    landing = `${landing.slice(0,marker)}${card}${landing.slice(marker)}`;
  }
}
landing = landing.replace(/<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/, `<time data-news-updated>Updated ${label}</time>`);
await writeFile(landingPath, landing, 'utf8');

let sitemap = await readFile(sitemapPath, 'utf8');
if (!sitemap.includes(canonical)) sitemap = sitemap.replace('</urlset>', `  <url><loc>${canonical}</loc><lastmod>2026-08-05</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n</urlset>`);
await writeFile(sitemapPath, sitemap, 'utf8');
console.log('Published the verified August 5 1PM FMB News cycle.');
