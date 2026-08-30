import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const sitemapPath = path.join(dist, 'sitemap.xml');
const published = '2026-08-11T08:41:00+08:00';
const dateLabel = '11 August 2026';
const timeLabel = '8:41 a.m. PHT';
const esc = v => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

const stories = [
  {
    slug:'philippines-q2-2026-growth-warning-brands-business',
    category:'Business',
    kicker:'Economy · Business · Consumer confidence',
    title:'Philippine Growth Slows Sharply, Raising the Stakes for Brands and Businesses',
    deck:'Second-quarter growth slowed to 2.3 percent, putting more pressure on consumer spending, investment and how companies justify value.',
    description:'Philippine GDP growth slowed to 2.3 percent in the second quarter of 2026, sharpening concerns around consumption, investment and business confidence.',
    image:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Makati_skyline_2024.jpg/1280px-Makati_skyline_2024.jpg',
    credit:'PHOTO: WIKIMEDIA COMMONS / FILE',
    alt:'Makati skyline in Metro Manila',
    sections:[
      ['What happened','The Philippine economy grew 2.3 percent year on year in the second quarter of 2026. Investment weakened, construction contracted and household consumption growth also slowed as inflation continued to pressure purchasing power.'],
      ['Why it matters','For businesses, slower growth changes the environment in which customers make choices. Consumers tend to scrutinize non-essential spending more closely while companies demand clearer evidence that marketing, consulting, technology and expansion spending will produce results.'],
      ['Public perception and reputation','Brands that respond only with louder aspirational messaging risk sounding disconnected from everyday financial pressure. Companies that explain value clearly, prove usefulness and communicate affordability or measurable outcomes are better positioned to retain trust.'],
      ['Opportunity and risk','The opportunity is to move from prestige-for-prestige positioning toward proof of value. The risk is aggressive discounting that weakens the brand without fixing the actual customer problem.'],
      ['Why It Matters to Us, Filipinos','Economic growth sounds abstract until it reaches household budgets, jobs, business expansion and confidence. A weaker quarter can influence what people buy, what firms postpone and where new investment goes.']
    ],
    sources:[['Reuters, Philippine growth slowed sharply in the second quarter of 2026','https://www.reuters.com/world/asia-pacific/philippines-q2-gdp-growth-slows-sharply-2026-08-10/']]
  },
  {
    slug:'asean-online-sale-day-2026-cross-border-commerce',
    category:'Business and Digital Commerce',
    kicker:'ASEAN · E-commerce · Digital products',
    title:'ASEAN Online Sale Day Tests How Ready Small Businesses Are for Cross-Border Commerce',
    deck:'The regional shopping campaign brought businesses and consumers across all 11 ASEAN member states into one cross-border e-commerce push.',
    description:'ASEAN Online Sale Day 2026 highlighted cross-border e-commerce, consumer protection and the growing importance of regional digital commerce readiness.',
    image:'https://asean.org/wp-content/uploads/2026/08/AOSD-2026.jpg',
    credit:'PHOTO: ASEAN SECRETARIAT',
    alt:'ASEAN Online Sale Day promotional visual',
    sections:[
      ['What happened','ASEAN Online Sale Day ran from August 8 to 10, connecting businesses and consumers across the 11 ASEAN member states through a coordinated regional e-commerce campaign. The initiative also points consumers toward a formal cross-border complaint mechanism.'],
      ['Why it matters','The more important signal is not the discounting. ASEAN is increasingly encouraging businesses to think beyond domestic markets. That means product information, payment systems, fulfillment, customer service and policies must work across borders.'],
      ['Public perception and reputation','Regional reach magnifies reputation. A weak delivery experience or unclear return policy can travel as quickly as a strong product review. Trust becomes part of the infrastructure of expansion.'],
      ['Opportunity and risk','Filipino beauty, fashion, food, culture-led products, creative services and digital goods can increasingly be designed for ASEAN from the start. The risk is expanding marketing reach before operations are ready.'],
      ['Why It Matters to Us, Filipinos','Cross-border commerce can give Philippine businesses access to millions more consumers, but only if they are discoverable, reliable and easy to buy from.']
    ],
    sources:[['ASEAN Online Sale Day official platform','https://onlineasean.com/']]
  },
  {
    slug:'national-ict-summit-2026-tagum-ai-regional-transformation',
    category:'Technology and AI',
    kicker:'Technology · AI · Regional development',
    title:'National ICT Summit Brings the AI Transformation Conversation to Tagum',
    deck:'The August 12 summit places regional government, talent and innovation at the center of the Philippines’ next phase of digital transformation.',
    description:'The 18th National ICT Summit in Tagum City focuses on AI-driven transformation in governance, talent development, innovation and regional digital growth.',
    image:'https://dict.gov.ph/wp-content/uploads/2026/08/18th-National-ICT-Summit.jpg',
    credit:'PHOTO: DICT',
    alt:'National ICT Summit promotional material',
    sections:[
      ['What happened','The 18th National ICT Summit opens in Tagum City on August 12, bringing together government, startups, academe and technology leaders around artificial intelligence, governance, talent and innovation.'],
      ['Why it matters','The shift away from a purely Manila-centered technology narrative is strategically important. Regional digital capability increasingly affects investment, public services, education and competitiveness.'],
      ['Public perception and reputation','Organizations now face a credibility test when they claim to be embracing AI. Audiences increasingly expect an explanation of what changed, who benefits and how risks are being managed.'],
      ['Opportunity and risk','The strongest opportunity is implementation: workflow redesign, AI literacy, governance, local service modernization and practical tools for LGUs and SMEs. The risk is another conference cycle that produces speeches but little operational change.'],
      ['Why It Matters to Us, Filipinos','AI becomes meaningful when it reaches schools, businesses, local governments and communities outside the largest urban centers.']
    ],
    sources:[['National ICT Confederation of the Philippines, 18th National ICT Summit','https://nicp.org.ph/18th-national-ict-summit/']]
  },
  {
    slug:'cinemalaya-22-reel-reflections-filipino-cultural-platform',
    category:'Culture and Entertainment',
    kicker:'Culture · Film · Filipino storytelling',
    title:'Cinemalaya 22 Puts Independent Filipino Storytelling Back at the Center',
    deck:'The festival’s Reel Reflections edition runs through August 18 and remains one of the country’s most important platforms for independent cinema.',
    description:'Cinemalaya 22 is running from August 6 to 18 under the theme Reel Reflections, showcasing independent Filipino filmmakers and stories.',
    image:'https://culturalcenter.gov.ph/wp-content/uploads/2026/08/Cinemalaya-22-Reel-Reflections.jpg',
    credit:'PHOTO: CULTURAL CENTER OF THE PHILIPPINES',
    alt:'Cinemalaya 22 festival visual',
    sections:[
      ['What happened','The 22nd Cinemalaya Philippine Independent Film Festival is running from August 6 to 18 under the theme Reel Reflections. The festival continues to provide a national platform for independent Filipino filmmakers and stories.'],
      ['Why it matters','Film festivals do more than screen movies. They influence which stories receive prestige, critical attention, distribution and long-term cultural visibility.'],
      ['Public perception and reputation','Philippine culture becomes stronger internationally when audiences encounter specific stories rooted in place, language, history and lived experience rather than generic ideas of Filipino identity.'],
      ['Opportunity and risk','Filmmakers and cultural organizations have an opportunity to reinterpret heritage through contemporary media. The risk is treating regional identity as decoration without context or genuine community connection.'],
      ['Why It Matters to Us, Filipinos','Independent film is one of the spaces where the country can examine itself rather than merely promote itself.']
    ],
    sources:[['Cultural Center of the Philippines, Cinemalaya 22','https://culturalcenter.gov.ph/event/cinemalaya-22-reel-reflections/']]
  },
  {
    slug:'pistahan-2026-filipino-diaspora-cultural-soft-power',
    category:'Culture and Heritage',
    kicker:'Culture · Heritage · Filipino diaspora',
    title:'Pistahan Shows How Filipino Culture Can Travel Without Losing Its Story',
    deck:'San Francisco’s long-running Filipino festival demonstrates how food, music, dance and memory can become cultural diplomacy rather than simple nostalgia.',
    description:'San Francisco’s Pistahan Parade and Festival marked its 33rd year, highlighting Filipino culture, food, music, dance and diaspora history.',
    image:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Pistahan_Parade_San_Francisco.jpg/1280px-Pistahan_Parade_San_Francisco.jpg',
    credit:'PHOTO: WIKIMEDIA COMMONS / FILE',
    alt:'Filipino cultural parade in San Francisco',
    sections:[
      ['What happened','San Francisco’s Pistahan Parade and Festival marked its 33rd year this past weekend with Filipino food, music, dance, art and community programming. The event is also rooted in the history of Filipino displacement around the Yerba Buena redevelopment area.'],
      ['Why it matters','Diaspora cultural festivals can function as soft power. They introduce Filipino identity to international audiences while creating space for food, fashion, tourism, performance and cultural businesses.'],
      ['Public perception and reputation','Culture is more memorable when audiences understand the story behind what they are seeing. Context turns costumes, food and music from spectacle into identity.'],
      ['Opportunity and risk','Philippine cultural brands can build international audiences through diaspora communities. The risk is presenting heritage as a surface aesthetic without history, credit or meaning.'],
      ['Why It Matters to Us, Filipinos','Cultural visibility abroad can strengthen national reputation, tourism interest and pride, but its deepest value comes from preserving meaning while adapting presentation.']
    ],
    sources:[['Pistahan Parade and Festival official site','https://www.pistahan.net/']]
  },
  {
    slug:'miss-north-carolina-usa-title-removal-governance-reputation',
    category:'Pageantry',
    kicker:'Pageantry · Governance · Reputation',
    title:'Miss North Carolina USA Dispute Shows Why Pageants Need Clear Governance Rules',
    deck:'A title removal has become a wider argument over conduct, political expression and organizational transparency because the underlying reasons remain publicly unclear.',
    description:'The removal of Miss North Carolina USA 2026 Brittany Boltinhouse has become a pageant governance and reputation case as competing explanations remain unresolved.',
    image:'https://www.missusa.com/wp-content/uploads/2026/08/Miss-North-Carolina-USA-2026.jpg',
    credit:'PHOTO: MISS USA ORGANIZATION',
    alt:'Miss North Carolina USA titleholder in official pageant imagery',
    sections:[
      ['What happened','Former Miss North Carolina USA 2026 Brittany Boltinhouse was removed from her title. The Miss USA Organization said the decision followed repeated conduct inconsistent with organizational standards, while Boltinhouse has suggested her political and religious views may have played a role. The organization has not publicly detailed the incidents behind the decision.'],
      ['What is verified and what is not','It is verified that the title was removed and that the organization and former titleholder have offered different explanations. Public information does not currently establish the exact conduct that triggered the decision.'],
      ['Why it matters','Pageants operate as reputation institutions. When conduct rules, escalation procedures and disciplinary decisions are unclear, an internal issue can quickly become a larger debate about fairness, censorship or discrimination.'],
      ['Opportunity and risk','Organizations should publish conduct standards, document decision pathways and prepare crisis communication protocols before a controversy occurs. The risk of ambiguity is that audiences fill information gaps with assumptions.'],
      ['Why It Matters to Us, Filipinos','The Philippine pageant industry is large enough that governance standards increasingly matter as much as production quality. Clear rules protect both organizations and titleholders.']
    ],
    sources:[['Associated Press, Miss North Carolina USA dispute and title removal','https://apnews.com/']]
  }
];

const sectionClass = 'fmb-morning-special';
const articleHtml = story => {
  const href = `/news/${story.slug}/`;
  const canonical = `https://www.francinemariebautista.com${href}`;
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:story.title,description:story.description,datePublished:published,dateModified:published,inLanguage:'en-PH',isAccessibleForFree:true,author:{'@type':'Person',name:'Francine Marie Bautista'},publisher:{'@type':'Organization',name:'FMB News'},mainEntityOfPage:{'@type':'WebPage','@id':canonical},articleSection:story.category,image:[story.image]});
  const body = story.sections.map(([h,p])=>`<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('');
  const sources = story.sources.map(([label,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`).join('');
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(story.title)} | FMB News Morning Special</title><meta name="description" content="${esc(story.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.deck)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${esc(story.image)}"><meta property="article:published_time" content="${published}"><script type="application/ld+json">${schema}</script><style>body{margin:0;background:#fffaf3;color:#1b0c2d;font-family:Manrope,Arial,sans-serif}.ms-top{background:linear-gradient(90deg,#1b0631,#4b197f);color:#fff;padding:12px 24px;font-size:11px;letter-spacing:.14em;text-transform:uppercase}.ms-hero{padding:72px 24px 36px;background:radial-gradient(circle at 82% 20%,rgba(201,154,63,.18),transparent 11rem),linear-gradient(135deg,#fffaf3,#f2e9f7)}.wrap{width:min(1120px,calc(100% - 48px));margin:auto}.ms-hero h1{max-width:13ch;margin:12px 0;color:#1b0631;font-family:Cormorant Garamond,Georgia,serif;font-size:clamp(3rem,7vw,6.4rem);font-weight:600;line-height:.9}.ms-kicker{color:#7b4aa8;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.ms-deck{max-width:760px;font-size:1.12rem;line-height:1.65;color:#55465f}.ms-meta{margin-top:20px;color:#806f84;font-size:11px}.ms-media{padding:28px 0;background:#fff}.ms-media figure{position:relative;margin:0;border-radius:18px;overflow:hidden;background:#eee6f3;box-shadow:0 20px 50px rgba(36,10,61,.12)}.ms-media img{display:block;width:100%;max-height:72vh;object-fit:cover}.ms-credit{position:absolute;right:10px;bottom:10px;padding:5px 8px;border-radius:4px;background:rgba(22,5,38,.78);color:#fff;font-size:9px;font-weight:800;letter-spacing:.04em}.ms-body{padding:26px 0 90px}.ms-body .inner{width:min(760px,calc(100% - 48px));margin:auto}.ms-body h2{margin:2.2em 0 .55em;color:#250641;font-family:Cormorant Garamond,Georgia,serif;font-size:2.5rem;line-height:1}.ms-body p{font-family:Georgia,'Times New Roman',serif;font-size:1.12rem;line-height:1.9;color:#33283a}.ms-note{padding:18px 20px;border-left:4px solid #c99a3f;background:#f8f1fb;font-size:.9rem}.ms-sources{margin-top:42px;padding:24px;border:1px solid rgba(44,10,74,.14);background:#fffdf8}.ms-sources a{display:block;margin:.7rem 0;color:#4b197f}@media(max-width:700px){.ms-hero{padding-top:46px}.wrap{width:min(100% - 28px,1120px)}.ms-body .inner{width:min(100% - 28px,760px)}.ms-hero h1{font-size:clamp(2.7rem,13vw,4.5rem)}.ms-media img{max-height:460px}.ms-credit{font-size:7px}}</style></head><body><div class="ms-top">FMB News · Morning Special Edition · ${dateLabel}</div><header class="ms-hero"><div class="wrap"><p class="ms-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1><p class="ms-deck">${esc(story.deck)}</p><p class="ms-meta">By Francine Marie Bautista · Published ${dateLabel}, ${timeLabel} · ${esc(story.category)}</p></div></header><section class="ms-media"><div class="wrap"><figure><img src="${esc(story.image)}" alt="${esc(story.alt)}" loading="eager"><span class="ms-credit">${esc(story.credit)}</span></figure></div></section><article class="ms-body"><div class="inner"><div class="ms-note"><strong>Morning Special Edition.</strong> Verified facts are distinguished from FMB News analysis and strategic interpretation.</div>${body}<section class="ms-sources"><h2>Sources and public record</h2>${sources}</section></div></article></body></html>`;
};

for (const story of stories) {
  const dir = path.join(newsRoot, story.slug);
  await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'index.html'), articleHtml(story),'utf8');
}

const featureHref = `/news/${stories[0].slug}/`;
const specialCards = stories.map((s,i)=>`<article class="fmb-morning-card"><a href="/news/${s.slug}/"><div class="fmb-morning-thumb"><img src="${esc(s.image)}" alt="${esc(s.alt)}" loading="lazy"><span>${esc(s.credit)}</span></div><p>${esc(s.category)}</p><h3>${esc(s.title)}</h3><small>${i===0?'Lead morning report':'Morning special'}</small></a></article>`).join('');
const specialSection = `<section class="${sectionClass}" id="morning-special-edition" aria-labelledby="morningSpecialTitle"><div class="fn9-shell"><div class="fmb-morning-head"><div><p>FMB News Morning Special Edition</p><h2 id="morningSpecialTitle">The strategic briefing for ${dateLabel}</h2><span>Business, technology, culture, pageantry and the stories shaping public perception today.</span></div><a href="${featureHref}">Open lead report →</a></div><div class="fmb-morning-grid">${specialCards}</div></div></section><style>.fmb-morning-special{position:relative;padding:62px 0 76px;background:linear-gradient(135deg,#1b0631 0%,#311052 55%,#4b197f 100%);color:#fff;overflow:hidden}.fmb-morning-special:after{content:'';position:absolute;right:-90px;top:-90px;width:280px;height:280px;border:1px solid rgba(201,154,63,.35);border-radius:50%;box-shadow:0 0 0 30px rgba(201,154,63,.06),0 0 0 60px rgba(255,255,255,.03)}.fmb-morning-head{position:relative;z-index:1;display:flex;justify-content:space-between;gap:30px;align-items:end;margin-bottom:28px}.fmb-morning-head p{margin:0 0 8px;color:#e8cf97;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.fmb-morning-head h2{max-width:15ch;margin:0;font-family:Cormorant Garamond,Georgia,serif;font-size:clamp(2.8rem,5vw,5rem);font-weight:500;line-height:.9}.fmb-morning-head span{display:block;max-width:62ch;margin-top:16px;color:rgba(255,255,255,.7);font-size:13px}.fmb-morning-head>a{color:#fff;font-size:11px;font-weight:800;text-decoration-color:#c99a3f;text-underline-offset:5px}.fmb-morning-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.fmb-morning-card{overflow:hidden;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.07);backdrop-filter:blur(10px)}.fmb-morning-card>a{display:block;color:#fff;text-decoration:none}.fmb-morning-thumb{position:relative;aspect-ratio:16/10;overflow:hidden;background:#291044}.fmb-morning-thumb img{width:100%;height:100%;object-fit:cover}.fmb-morning-thumb span{position:absolute;right:8px;bottom:8px;padding:4px 6px;background:rgba(18,4,31,.76);font-size:7px;font-weight:800}.fmb-morning-card p{margin:16px 18px 8px;color:#e8cf97;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.fmb-morning-card h3{margin:0 18px;font-family:Cormorant Garamond,Georgia,serif;font-size:1.75rem;font-weight:600;line-height:1.02}.fmb-morning-card small{display:block;margin:16px 18px 20px;color:rgba(255,255,255,.55);font-size:9px;text-transform:uppercase;letter-spacing:.08em}@media(max-width:900px){.fmb-morning-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.fmb-morning-special{padding:46px 0 58px}.fmb-morning-head{align-items:flex-start;flex-direction:column}.fmb-morning-grid{grid-template-columns:1fr}.fmb-morning-card h3{font-size:2rem}}</style>`;

for (const relative of ['news/index.html','fmbnews/index.html']) {
  const landingPath = path.join(dist, relative);
  let html = await readFile(landingPath,'utf8');
  html = html.replace(/<section class="fmb-morning-special"[\s\S]*?<\/section><style>[\s\S]*?<\/style>/,'');
  const anchor = '<section class="fn9-reports" id="latest-reports"';
  if (html.includes(anchor)) html = html.replace(anchor, `${specialSection}${anchor}`);
  else html = html.replace('</main>', `${specialSection}</main>`);
  await writeFile(landingPath,html,'utf8');
}

let sitemap = await readFile(sitemapPath,'utf8');
for (const story of stories) {
  const loc = `https://www.francinemariebautista.com/news/${story.slug}/`;
  if (!sitemap.includes(loc)) sitemap = sitemap.replace('</urlset>',`<url><loc>${loc}</loc><lastmod>2026-08-11</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url></urlset>`);
}
await writeFile(sitemapPath,sitemap,'utf8');
console.log(`Published ${stories.length} Morning Special Edition reports and placed the edition on both FMB News landing routes.`);
