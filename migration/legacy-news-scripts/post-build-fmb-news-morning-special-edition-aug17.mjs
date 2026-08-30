import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const sitemapPath = path.join(dist, 'sitemap.xml');
const published = '2026-08-17T20:06:00+08:00';
const dateLabel = '17 August 2026';
const timeLabel = '8:06 p.m. PHT';
const esc = v => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

const stories = [
  {
    slug:'nvidia-ai-infrastructure-500-billion-financing-2026',
    category:'Technology and Business',
    kicker:'AI · Infrastructure · Capital',
    title:'AI Is Becoming an Infrastructure-Finance Business, Not Just a Software Business',
    deck:'Nvidia is working with major investment firms on financing platforms designed to mobilize more than $500 billion for AI infrastructure.',
    description:'Nvidia and major investment firms are building financing platforms for AI infrastructure, reinforcing the shift from software hype toward compute, power and data-center economics.',
    image:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/1280px-Nvidia_logo.svg.png',
    credit:'IMAGE: NVIDIA / WIKIMEDIA COMMONS',
    alt:'Nvidia corporate mark',
    eventDate:'12 August 2026',
    sections:[
      ['What happened','Nvidia is working with Apollo, BlackRock, Blackstone, Brookfield, Goldman Sachs and KKR on financing platforms intended to mobilize more than $500 billion for AI infrastructure. The initiative is designed to make long-term capital available for data centers and other compute-heavy projects.'],
      ['Why it matters','The economics of AI increasingly depend on physical infrastructure: chips, electricity, cooling, connectivity, land and financing. That means some of the biggest beneficiaries of AI growth may sit underneath the applications people use every day.'],
      ['Public perception and reputation','AI companies will face more scrutiny over whether infrastructure spending produces durable demand and returns. The phrase AI-powered will carry less weight when investors and customers are asking for measurable outcomes.'],
      ['Opportunity and risk','For Philippine businesses, the opportunity is in narrow AI applications and the infrastructure that supports them. The risk is building a brand around technological novelty without a clear business case.']
    ],
    sources:[['Business Insider, Nvidia pitches AI compute as an infrastructure asset class','https://www.businessinsider.com/nvidia-ceo-jensen-huang-financing-500-billion-ai-compute-nvda-2026-8']]
  },
  {
    slug:'asian-equity-outflows-ai-worries-philippines-inflow-july-2026',
    category:'Business and Markets',
    kicker:'Markets · AI · Asia',
    title:'Investors Are Starting to Punish AI Exposure When the Economics Look Weak',
    deck:'Foreign investors sold $25.48 billion of equities across seven Asian markets in July while the Philippines recorded a modest $69 million inflow.',
    description:'July Asian equity flows show investors becoming more selective about AI spending, chip demand and cash burn, while Philippine equities recorded a small foreign inflow.',
    image:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Makati_skyline_2024.jpg/1280px-Makati_skyline_2024.jpg',
    credit:'PHOTO: WIKIMEDIA COMMONS / FILE',
    alt:'Makati skyline in Metro Manila',
    eventDate:'11 August 2026',
    sections:[
      ['What happened','Reuters reported that foreign investors sold a net $25.48 billion of stocks across South Korea, Taiwan, India, Indonesia, Thailand, Vietnam and the Philippines in July. Taiwan and South Korea saw the largest outflows as investors questioned AI spending, chip-demand forecasts and cash burn. The Philippines recorded a $69 million inflow.'],
      ['Why it matters','The AI market is moving into a more demanding phase. Capital is beginning to distinguish between companies with real economics and companies benefiting mainly from the narrative around AI.'],
      ['Public perception and reputation','AI-first and AI-powered positioning will be less persuasive without evidence of productivity, revenue, savings or customer advantage.'],
      ['Opportunity and risk','Brands that explain exactly what AI improves can build credibility. Businesses that use AI language as decoration risk losing trust as scrutiny increases.']
    ],
    sources:[['Reuters, Taiwan and South Korea drive Asian equity outflows as AI worries bite','https://www.reuters.com/world/china/taiwan-south-korea-drive-asian-equity-outflows-july-ai-worries-bite-2026-08-11/']]
  },
  {
    slug:'philippines-2027-budget-economic-confidence-august-2026',
    category:'Business and Governance',
    kicker:'Economy · Budget · Confidence',
    title:'Philippine Economic Confidence Remains a Major Business Story',
    deck:'The proposed ₱7.2-trillion 2027 national budget arrives after a weak second quarter and amid pressure to turn public spending into visible results.',
    description:'The proposed 2027 Philippine budget is emerging as a test of economic confidence, implementation and public accountability after weak second-quarter growth.',
    image:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Philippine_Congress_Building.jpg/1280px-Philippine_Congress_Building.jpg',
    credit:'PHOTO: WIKIMEDIA COMMONS / FILE',
    alt:'Philippine Congress building in Quezon City',
    eventDate:'11 August 2026',
    sections:[
      ['What happened','The Marcos administration proposed a ₱7.2-trillion national budget for 2027, around 6 percent above the current year, after Philippine GDP growth slowed sharply in the second quarter of 2026.'],
      ['Why it matters','Weak growth affects consumer confidence, hiring, investment and marketing budgets. Public spending can help support activity, but confidence depends on implementation as much as headline size.'],
      ['Public perception and reputation','Government and companies should be careful with triumphant messaging when households may be experiencing financial pressure. Credibility comes from visible delivery and clear accountability.'],
      ['Opportunity and risk','Brands that demonstrate utility, efficiency and measurable value have a stronger proposition in a cautious economy. The risk is relying on aspiration without proof.']
    ],
    sources:[['Reuters, Philippine budget and growth coverage','https://www.reuters.com/world/asia-pacific/']]
  },
  {
    slug:'discover-more-to-love-digital-tourism-marketplace-2026',
    category:'Tourism and Digital Products',
    kicker:'Tourism · Digital products · Conversion',
    title:'Philippine Tourism Is Moving Closer to an Actual Digital Marketplace',
    deck:'Discover More to Love combines thousands of curated travel deals with direct booking paths, moving destination marketing closer to conversion.',
    description:'The Department of Tourism’s Discover More to Love platform connects curated travel deals, destinations and booking paths as part of a domestic tourism push running through November.',
    image:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Boracay_White_Beach.png/1280px-Boracay_White_Beach.png',
    credit:'PHOTO: WIKIMEDIA COMMONS / FILE',
    alt:'White Beach in Boracay, Philippines',
    eventDate:'Launched 26 June 2026 · Campaign runs July–November 2026',
    sections:[
      ['What happened','The Department of Tourism launched Discover More to Love as a domestic tourism platform bringing together more than 3,000 travel deals from hotels, tour operators, airlines and digital travel partners. The platform is intended to support year-round domestic travel and make vetted offers easier to discover and book.'],
      ['Why it matters','Tourism marketing is moving from look at this destination toward here is the experience and here is how to buy it. Conversion is becoming part of destination branding.'],
      ['Public perception and reputation','Trust matters because travelers are increasingly wary of scams and poor fulfillment. A government-backed platform can add confidence only if suppliers are vetted and complaints are handled well.'],
      ['Opportunity and risk','Zambales and other emerging destinations can eventually connect attractions, stories, businesses, accommodation and experiences into one usable digital journey. The risk is attracting demand before the local product and service experience are ready.']
    ],
    sources:[['Department of Tourism via Philippine Information Agency, Discover More to Love campaign','https://pia.gov.ph/press-release/dot-rolls-out-discover-more-to-love-campaign-with-more-than-3000-travel-deals-from-tourism-partners/'],['Philippine News Agency, PH launches portal for curated discounted travel deals','https://www.pna.gov.ph/articles/1278184']]
  },
  {
    slug:'asean-film-tv-summit-2026-philippine-screen-infrastructure',
    category:'Media and Culture',
    kicker:'Film · ASEAN · Cultural industries',
    title:'Filipino Film Is Gaining Stronger Regional and Commercial Infrastructure',
    deck:'The ASEAN Film and TV Summit brought producers, archivists, educators, policymakers and institutions together around preservation, markets and regional cooperation.',
    description:'The Philippines hosted the ASEAN Film and TV Summit 2026 in Manila, strengthening discussion around regional screen markets, preservation and cultural cooperation.',
    image:'https://fdcp.ph/sites/default/files/styles/large/public/2026-07/ASEAN%20Film%20and%20TV%20Summit%202026.jpg',
    credit:'IMAGE: FILM DEVELOPMENT COUNCIL OF THE PHILIPPINES',
    alt:'ASEAN Film and TV Summit 2026 promotional material',
    eventDate:'12–14 August 2026',
    sections:[
      ['What happened','The Philippines hosted the ASEAN Film and TV Summit 2026 at Seda Manila Bay from August 12 to 14. The summit brought together industry leaders, producers, archivists, educators, policymakers and cultural institutions from across the region.'],
      ['Why it matters','Cultural influence requires more than talented artists. It also requires financing, distribution, preservation, training and international networks that help stories travel.'],
      ['Public perception and reputation','The Philippines strengthens its cultural reputation when it is seen not only as a source of performers and content, but as a serious participant in regional screen infrastructure.'],
      ['Opportunity and risk','Stories rooted in Philippine languages, places and histories can travel internationally when professional production and distribution systems support them. The risk is chasing international legibility by flattening local identity.']
    ],
    sources:[['Film Development Council of the Philippines, ASEAN Film and TV Summit 2026','https://fdcp.ph/index.php/news/asean2026']]
  },
  {
    slug:'cinemalaya-22-final-days-cultural-journalism-2026',
    category:'Culture and Entertainment',
    kicker:'Cinemalaya · Film · Cultural journalism',
    title:'Cinemalaya Enters Its Final Stretch With a Bigger Story Than the Awards',
    deck:'Cinemalaya 22 runs through August 18, giving independent Filipino stories a national platform and creating material for deeper cultural journalism.',
    description:'Cinemalaya 22 enters its final days as independent Filipino filmmakers continue to explore social, regional and cultural questions through cinema.',
    image:'https://culturalcenter.gov.ph/wp-content/uploads/2026/08/Cinemalaya-22-Reel-Reflections.jpg',
    credit:'IMAGE: CULTURAL CENTER OF THE PHILIPPINES',
    alt:'Cinemalaya 22 Reel Reflections festival visual',
    eventDate:'6–18 August 2026',
    sections:[
      ['What happened','Cinemalaya 22: Reel Reflections is running through August 18, continuing its showcase of independent Filipino filmmaking and emerging creative voices.'],
      ['Why it matters','Independent film is one of the spaces where Philippine society can examine itself through stories about place, identity, family, politics, class and memory.'],
      ['Public perception and reputation','Cultural authority grows when media explain the social questions behind films rather than treating entertainment coverage as publicity alone.'],
      ['Opportunity and risk','There is an editorial opportunity to build deeper cultural journalism around the histories and communities represented in these films. The risk is reducing meaningful work to awards-night content.']
    ],
    sources:[['Cultural Center of the Philippines, Cinemalaya 22 event listing','https://culturalcenter.gov.ph/events/list/']]
  }
];

const articleHtml = story => {
  const href = `/news/${story.slug}/`;
  const canonical = `https://www.francinemariebautista.com${href}`;
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:story.title,description:story.description,datePublished:published,dateModified:published,inLanguage:'en-PH',isAccessibleForFree:true,author:{'@type':'Person',name:'Francine Marie Bautista'},publisher:{'@type':'Organization',name:'FMB News'},mainEntityOfPage:{'@type':'WebPage','@id':canonical},articleSection:story.category,image:[story.image]});
  const body = story.sections.map(([h,p])=>`<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('');
  const sources = story.sources.map(([label,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`).join('');
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(story.title)} | FMB News Morning Special</title><meta name="description" content="${esc(story.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.deck)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${esc(story.image)}"><meta property="article:published_time" content="${published}"><script type="application/ld+json">${schema}</script><style>body{margin:0;background:#fffaf3;color:#1b0c2d;font-family:Manrope,Arial,sans-serif}.top{background:linear-gradient(90deg,#160526,#48206d);color:#fff;padding:12px 24px;font-size:11px;letter-spacing:.14em;text-transform:uppercase}.hero{padding:68px 24px 34px;background:linear-gradient(135deg,#fffaf3,#f1e8f6)}.wrap{width:min(1120px,calc(100% - 48px));margin:auto}.hero h1{max-width:14ch;margin:12px 0;color:#1b0631;font-family:Georgia,serif;font-size:clamp(2.8rem,7vw,6rem);line-height:.94}.kicker{color:#7b4aa8;font-size:11px;font-weight:800;text-transform:uppercase}.deck{max-width:760px;font-size:1.12rem;line-height:1.65;color:#55465f}.meta{margin-top:20px;color:#806f84;font-size:11px}.media{padding:28px 0;background:#fff}.media figure{position:relative;margin:0;border-radius:18px;overflow:hidden;background:#eee6f3}.media img{display:block;width:100%;max-height:72vh;object-fit:cover}.credit{position:absolute;right:10px;bottom:10px;padding:5px 8px;background:rgba(22,5,38,.82);color:#fff;font-size:9px;font-weight:800}.body{padding:26px 0 90px}.body .inner{width:min(760px,calc(100% - 48px));margin:auto}.body h2{margin:2em 0 .5em;color:#250641;font-family:Georgia,serif;font-size:2.2rem}.body p{font-family:Georgia,serif;font-size:1.12rem;line-height:1.9;color:#33283a}.sources{display:grid;gap:8px;margin-top:32px}.sources a{color:#6c318f}@media(max-width:650px){.wrap,.body .inner{width:min(100% - 28px,760px)}.hero{padding-top:48px}}</style></head><body><div class="top">FMB News · Morning Special Edition</div><header class="hero"><div class="wrap"><div class="kicker">${esc(story.kicker)}</div><h1>${esc(story.title)}</h1><p class="deck">${esc(story.deck)}</p><div class="meta">Published ${dateLabel} · ${timeLabel} · Event/report date: ${esc(story.eventDate)} · ${esc(story.category)}</div></div></header><main><section class="media"><div class="wrap"><figure><img src="${esc(story.image)}" alt="${esc(story.alt)}"><figcaption class="credit">${esc(story.credit)}</figcaption></figure></div></section><article class="body"><div class="inner">${body}<h2>Sources</h2><div class="sources">${sources}</div><p><a href="/news/">Back to FMB News</a></p></div></article></main></body></html>`;
};

await mkdir(newsRoot,{recursive:true});
for (const story of stories) {
  const dir = path.join(newsRoot,story.slug);
  await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'index.html'),articleHtml(story),'utf8');
}

const card = story => `<article class="fmb-morning-special-card"><a href="/news/${story.slug}/"><div class="fmb-ms-image"><img src="${esc(story.image)}" alt="${esc(story.alt)}" loading="lazy"><span>${esc(story.credit)}</span></div><small>${esc(story.category)} · ${esc(story.eventDate)}</small><h3>${esc(story.title)}</h3><p>${esc(story.deck)}</p></a></article>`;
const special = `<section class="fmb-morning-special" data-fmb-morning-special="2026-08-17"><style>.fmb-morning-special{margin:34px 0 46px;padding:34px;border-radius:24px;background:linear-gradient(135deg,#19052b,#3c1362);color:#fff}.fmb-morning-special *{box-sizing:border-box}.fmb-ms-head{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:24px}.fmb-ms-head h2{margin:0;color:#fff;font-family:Georgia,serif;font-size:clamp(2rem,5vw,4.2rem)}.fmb-ms-head p{max-width:520px;margin:0;color:#d9cbe5}.fmb-ms-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.fmb-morning-special-card a{display:block;color:#fff;text-decoration:none}.fmb-ms-image{position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:14px;background:#2d1243;margin-bottom:14px}.fmb-ms-image img{width:100%;height:100%;object-fit:cover}.fmb-ms-image span{position:absolute;right:7px;bottom:7px;background:rgba(13,3,24,.78);padding:4px 6px;font-size:7px}.fmb-morning-special-card small{color:#d8b963;text-transform:uppercase;font-size:9px}.fmb-morning-special-card h3{margin:7px 0;font-family:Georgia,serif;font-size:1.35rem;line-height:1.12}.fmb-morning-special-card p{margin:0;color:#d7cee0;font-size:.92rem;line-height:1.55}@media(max-width:900px){.fmb-ms-grid{grid-template-columns:1fr 1fr}}@media(max-width:620px){.fmb-morning-special{padding:24px 18px}.fmb-ms-head{display:block}.fmb-ms-head p{margin-top:10px}.fmb-ms-grid{grid-template-columns:1fr}}</style><div class="fmb-ms-head"><div><small style="color:#d8b963;letter-spacing:.14em;text-transform:uppercase">Morning Special Edition · 17 August 2026</small><h2>What matters now.</h2></div><p>Technology, business, tourism, media and culture, selected for strategic significance and explained beyond the headline.</p></div><div class="fmb-ms-grid">${stories.map(card).join('')}</div></section>`;

for (const rel of ['news/index.html','fmbnews/index.html']) {
  const file = path.join(dist,rel);
  let html = await readFile(file,'utf8');
  html = html.replace(/<section class="fmb-morning-special" data-fmb-morning-special="2026-08-17">[\s\S]*?<\/section>/,'');
  const marker = html.includes('id="latest-reports"') ? html.indexOf('<',html.lastIndexOf('<section',html.indexOf('id="latest-reports"'))) : html.indexOf('</main>');
  html = marker > 0 ? `${html.slice(0,marker)}${special}${html.slice(marker)}` : html.replace('</main>',`${special}</main>`);
  await writeFile(file,html,'utf8');
}

try {
  let sitemap = await readFile(sitemapPath,'utf8');
  const urls = stories.map(s=>`<url><loc>https://www.francinemariebautista.com/news/${s.slug}/</loc><lastmod>2026-08-17</lastmod></url>`).join('');
  if (!sitemap.includes(stories[0].slug)) sitemap = sitemap.replace('</urlset>',`${urls}</urlset>`);
  await writeFile(sitemapPath,sitemap,'utf8');
} catch {}
console.log(`Published ${stories.length} FMB News Morning Special stories for 17 August 2026.`);
