import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const sitemapPath = path.join(dist, 'sitemap.xml');
const published = '2026-08-12T12:58:00+08:00';
const dateLabel = '12 August 2026';
const timeLabel = '12:58 p.m. PHT';
const esc = v => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

const stories = [
  {
    slug:'philippines-2027-budget-accountability-growth-confidence',
    category:'Business and Governance',
    kicker:'Business · Governance · Public confidence',
    title:'The 2027 Budget Is Becoming a Test of Delivery, Not Just Spending',
    deck:'A proposed ₱7.2-trillion national budget arrives as growth weakens and public scrutiny of infrastructure spending remains intense.',
    description:'The proposed 2027 Philippine national budget is emerging as a test of delivery, accountability and confidence as growth slows and infrastructure spending faces scrutiny.',
    image:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Philippine_Congress_Building.jpg/1280px-Philippine_Congress_Building.jpg',
    credit:'PHOTO: WIKIMEDIA COMMONS / FILE',
    alt:'Philippine Congress building in Quezon City',
    eventDate:'11 August 2026',
    sections:[
      ['What happened','The Marcos administration has proposed a ₱7.2-trillion national budget for 2027, roughly 6 percent higher than the current year. The proposal comes after Philippine GDP growth slowed to 2.3 percent in the second quarter of 2026 and while infrastructure spending remains under heightened public scrutiny.'],
      ['Why it matters','Large public budgets influence construction, government procurement, local development, employment and private-sector confidence. In a weaker-growth environment, the question is no longer simply how much government plans to spend, but whether that spending produces visible and timely outcomes.'],
      ['Public perception and reputation','The strongest government narrative would be delivery plus transparency. Ambitious spending announcements without equally visible accountability can deepen public skepticism rather than restore confidence.'],
      ['Opportunity and risk','Infrastructure, digitalization, public communication and government-service suppliers may see opportunities if spending accelerates. The risk is that weak execution, delays or procurement controversies undermine both economic and institutional confidence.'],
      ['Why It Matters to Us, Filipinos','Budget numbers eventually become roads, schools, digital services, local projects and jobs. The public should watch implementation, not just appropriations.']
    ],
    sources:[['Reuters, Philippines proposes ₱7.2-trillion 2027 budget amid growth concerns','https://www.reuters.com/world/asia-pacific/']]
  },
  {
    slug:'singapore-ai-investment-growth-asean-competition-2026',
    category:'Technology and Business',
    kicker:'AI · ASEAN · Economic competitiveness',
    title:'Singapore Shows What AI Competition Looks Like When It Reaches the Economy',
    deck:'Singapore raised its 2026 growth forecast after strong second-quarter expansion, with AI-related investment among the drivers.',
    description:'Singapore raised its 2026 growth forecast as AI-related investment and global technology demand helped strengthen economic performance.',
    image:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Singapore_skyline_at_sunset.jpg/1280px-Singapore_skyline_at_sunset.jpg',
    credit:'PHOTO: WIKIMEDIA COMMONS / FILE',
    alt:'Singapore skyline at sunset',
    eventDate:'11 August 2026',
    sections:[
      ['What happened','Singapore raised its 2026 growth forecast to 4.5 to 5.5 percent after second-quarter GDP grew 5.9 percent, with AI-related investment and external technology demand among the factors supporting growth.'],
      ['Why it matters','Regional AI competition is increasingly about capital, infrastructure, skills, energy and firms that can absorb new technologies into real operations. Conferences and announcements alone do not create an AI economy.'],
      ['Public perception and reputation','Countries that can point to jobs, investment and productivity gains will build stronger credibility than those relying mainly on future-facing language.'],
      ['Opportunity and risk','The Philippines can compete in vertical AI applications, outsourcing, education, tourism, language technology and AI-enabled services. The risk is mistaking visibility for readiness while regional competitors build deeper infrastructure.'],
      ['Why It Matters to Us, Filipinos','Singapore’s experience is a reminder that AI strategy should ultimately be measured in stronger businesses, better jobs and economic output.']
    ],
    sources:[['Reuters, Singapore raises 2026 growth forecast as AI investment supports expansion','https://www.reuters.com/world/asia-pacific/']]
  },
  {
    slug:'national-ict-summit-tagum-august-12-2026-ai-lgus',
    category:'Technology and AI',
    kicker:'Technology · AI · Regional development',
    title:'National ICT Summit Opens in Tagum With AI, LGUs and Digital Trust on the Agenda',
    deck:'The three-day summit moves the Philippine digital-transformation conversation beyond Metro Manila and toward regional implementation.',
    description:'The 18th National ICT Summit opened in Tagum City with AI, cybersecurity, digital trust, startups, MSME digitalization and LGU technology on the agenda.',
    image:'https://nicp.org.ph/wp-content/uploads/2026/08/18th-National-ICT-Summit.jpg',
    credit:'PHOTO: NATIONAL ICT CONFEDERATION OF THE PHILIPPINES',
    alt:'18th National ICT Summit promotional visual',
    eventDate:'12–14 August 2026',
    sections:[
      ['What happened','The 18th National ICT Summit opened in Tagum City on August 12 and runs through August 14. Its program covers artificial intelligence, cybersecurity, digital trust, startups, MSME digitalization and technology initiatives for local governments.'],
      ['Why it matters','Regional digital capability affects public services, investment, education and competitiveness. The summit matters most if it produces implementation beyond speeches.'],
      ['Public perception and reputation','LGUs and institutions increasingly face a credibility test when they use the phrase digital transformation. Residents will judge it through shorter transactions, clearer information and fewer bureaucratic dead ends.'],
      ['Opportunity and risk','There is room for digital-service design, AI literacy, public communication, websites, data systems and citizen-experience work. The risk is another event cycle that generates attention without operational change.'],
      ['Why It Matters to Us, Filipinos','Digital transformation becomes meaningful when communities outside major urban centers experience better services because of it.']
    ],
    sources:[['National ICT Confederation of the Philippines, 18th National ICT Summit','https://nicp.org.ph/18th-national-ict-summit/']]
  },
  {
    slug:'philippines-bpo-ai-workforce-value-2026',
    category:'Business and Technology',
    kicker:'BPO · AI · Workforce transformation',
    title:'AI Is Forcing Philippine BPO to Defend Value Beyond Cheap Labor',
    deck:'Shared-services leaders are confronting automation, reskilling and the need to move Filipino workers into higher-value roles.',
    description:'Philippine shared services and BPO leaders are focusing on AI, workforce transformation and higher-value operating models as automation changes routine work.',
    image:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/BGC_night_skyline.jpg/1280px-BGC_night_skyline.jpg',
    credit:'PHOTO: WIKIMEDIA COMMONS / FILE',
    alt:'Bonifacio Global City skyline at night',
    eventDate:'11–14 August 2026',
    sections:[
      ['What happened','The 16th Philippines Shared Services and BPO Week is running in Manila from August 11 to 14, with AI, workforce transformation, operating models and global business services among the main themes.'],
      ['Why it matters','AI increasingly automates routine work, which means the Philippine BPO sector has to move further into judgment-heavy, specialist and relationship-driven work.'],
      ['Public perception and reputation','Claims about world-class Filipino talent need evidence that workers are being reskilled and moved into more valuable roles rather than simply exposed to automation risk.'],
      ['Opportunity and risk','Training, process redesign, AI implementation, knowledge management and internal communications are growing B2B opportunities. The risk is failing to upgrade skills fast enough while other markets move up the value chain.'],
      ['Why It Matters to Us, Filipinos','BPO remains a major source of employment and foreign earnings. How the industry handles AI will affect careers, salaries and the country’s long-term competitiveness.']
    ],
    sources:[['Philippines Shared Services & BPO Week 2026 official event information','https://www.ssonetwork.com/events-philippines-shared-services-and-bpo-week']]
  },
  {
    slug:'philippine-news-trust-28-percent-media-reputation-2026',
    category:'Media and Communications',
    kicker:'Media · Trust · Strategic communications',
    title:'Low News Trust Raises the Value of Visible Sourcing and Clear Corrections',
    deck:'The 2026 Reuters Institute Digital News Report puts Philippine news trust at 28 percent, intensifying the premium on transparent editorial practice.',
    description:'Philippine news trust stands at 28 percent in the 2026 Reuters Institute Digital News Report, reinforcing the importance of visible sourcing and transparent corrections.',
    image:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Smartphone_news_reading.jpg/1280px-Smartphone_news_reading.jpg',
    credit:'PHOTO: WIKIMEDIA COMMONS / FILE',
    alt:'Person reading news on a smartphone',
    eventDate:'2026 Digital News Report',
    sections:[
      ['What happened','The 2026 Reuters Institute Digital News Report places overall news trust in the Philippines at 28 percent, while social media remains a major route through which Filipinos encounter news.'],
      ['Why it matters','A low-trust environment affects not only media companies but also brands, public officials and institutions whose messages travel through the same information ecosystem.'],
      ['Public perception and reputation','Credibility increasingly comes from showing sources, separating verified fact from interpretation and correcting mistakes visibly. Publishing quickly without documenting evidence can create a larger reputational cost later.'],
      ['Opportunity and risk','Smaller newsrooms can compete through clarity and documented trust rather than volume. The risk is copying the speed incentives of social media while sacrificing editorial discipline.'],
      ['Why It Matters to Us, Filipinos','Trust determines whether important information is believed, shared and acted upon. Better sourcing is therefore a public-service issue, not merely an editorial preference.']
    ],
    sources:[['Reuters Institute, Digital News Report 2026','https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026']]
  },
  {
    slug:'lee-hi-manila-2026-concert-tourism-city-economy',
    category:'Entertainment and Business',
    kicker:'Entertainment · Concert tourism · Manila',
    title:'Lee Hi’s Manila Stop Highlights the Business Around Regional Touring',
    deck:'The Korean R&B singer’s Manila show is a reminder that concerts create value far beyond the venue itself.',
    description:'Lee Hi performed in Manila as part of her 2026 regional tour, highlighting the wider economic role of concerts in hotels, dining, transport and creator activity.',
    image:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Lee_Hi_2017.jpg/1024px-Lee_Hi_2017.jpg',
    credit:'PHOTO: WIKIMEDIA COMMONS / FILE',
    alt:'South Korean singer Lee Hi performing on stage',
    eventDate:'11 August 2026',
    sections:[
      ['What happened','South Korean R&B singer Lee Hi performed in Manila on August 11 as part of a regional tour that also includes other Southeast Asian cities.'],
      ['Why it matters','Concerts generate secondary demand for hotels, restaurants, transportation, merchandise and creator content. They can function as city-economy events rather than isolated entertainment nights.'],
      ['Public perception and reputation','Cities that become reliable tour stops strengthen their reputation among promoters and international fan communities. Audience experience, venue quality and logistics all contribute to that reputation.'],
      ['Opportunity and risk','Hospitality, lifestyle brands, tourism operators and local creators can build around concert traffic. The risk is failing to coordinate the wider visitor experience while focusing only on ticket sales.'],
      ['Why It Matters to Us, Filipinos','Manila’s place in regional touring creates opportunities for creative workers and service businesses well beyond the stage.']
    ],
    sources:[['Lee Hi 2026 tour and Manila show announcements','https://www.instagram.com/leehi_hi/']]
  }
];

const articleHtml = story => {
  const href = `/news/${story.slug}/`;
  const canonical = `https://www.francinemariebautista.com${href}`;
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:story.title,description:story.description,datePublished:published,dateModified:published,inLanguage:'en-PH',isAccessibleForFree:true,author:{'@type':'Person',name:'Francine Marie Bautista'},publisher:{'@type':'Organization',name:'FMB News'},mainEntityOfPage:{'@type':'WebPage','@id':canonical},articleSection:story.category,image:[story.image]});
  const body = story.sections.map(([h,p])=>`<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('');
  const sources = story.sources.map(([label,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`).join('');
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(story.title)} | FMB News Morning Special</title><meta name="description" content="${esc(story.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.deck)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${esc(story.image)}"><meta property="article:published_time" content="${published}"><script type="application/ld+json">${schema}</script><style>body{margin:0;background:#fffaf3;color:#1b0c2d;font-family:Manrope,Arial,sans-serif}.ms-top{background:linear-gradient(90deg,#1b0631,#4b197f);color:#fff;padding:12px 24px;font-size:11px;letter-spacing:.14em;text-transform:uppercase}.ms-hero{padding:72px 24px 36px;background:radial-gradient(circle at 82% 20%,rgba(201,154,63,.18),transparent 11rem),linear-gradient(135deg,#fffaf3,#f2e9f7)}.wrap{width:min(1120px,calc(100% - 48px));margin:auto}.ms-hero h1{max-width:14ch;margin:12px 0;color:#1b0631;font-family:Cormorant Garamond,Georgia,serif;font-size:clamp(3rem,7vw,6.2rem);font-weight:600;line-height:.92}.ms-kicker{color:#7b4aa8;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.ms-deck{max-width:760px;font-size:1.12rem;line-height:1.65;color:#55465f}.ms-meta{margin-top:20px;color:#806f84;font-size:11px}.ms-media{padding:28px 0;background:#fff}.ms-media figure{position:relative;margin:0;border-radius:18px;overflow:hidden;background:#eee6f3;box-shadow:0 20px 50px rgba(36,10,61,.12)}.ms-media img{display:block;width:100%;max-height:72vh;object-fit:cover}.ms-credit{position:absolute;right:10px;bottom:10px;padding:5px 8px;border-radius:4px;background:rgba(22,5,38,.78);color:#fff;font-size:9px;font-weight:800;letter-spacing:.04em}.ms-body{padding:26px 0 90px}.ms-body .inner{width:min(760px,calc(100% - 48px));margin:auto}.ms-body h2{margin:2.2em 0 .55em;color:#250641;font-family:Cormorant Garamond,Georgia,serif;font-size:2.5rem;line-height:1}.ms-body p{font-family:Georgia,'Times New Roman',serif;font-size:1.12rem;line-height:1.9;color:#33283a}.ms-note{padding:18px 20px;border-left:3px solid #c99a3f;background:#f6eff9;color:#4f3f59}.ms-sources{margin-top:44px;padding-top:22px;border-top:1px solid #ddcde8}.ms-sources a{display:block;margin:10px 0;color:#6b2f98;font-size:.92rem}</style></head><body><div class="ms-top">FMB News · Morning Special Edition · ${dateLabel}</div><section class="ms-hero"><div class="wrap"><div class="ms-kicker">${esc(story.kicker)}</div><h1>${esc(story.title)}</h1><p class="ms-deck">${esc(story.deck)}</p><div class="ms-meta">EVENT / REPORT: ${esc(story.eventDate)} · PUBLISHED: ${dateLabel}, ${timeLabel}</div></div></section><section class="ms-media"><div class="wrap"><figure><img src="${esc(story.image)}" alt="${esc(story.alt)}"><figcaption class="ms-credit">${esc(story.credit)}</figcaption></figure></div></section><main class="ms-body"><div class="inner"><div class="ms-note">Morning Special Edition. FMB News distinguishes the underlying event or report date from the newsroom publication timestamp.</div>${body}<div class="ms-sources"><strong>Sources</strong>${sources}</div></div></main></body></html>`;
};

for (const story of stories) {
  const dir = path.join(newsRoot, story.slug);
  await mkdir(dir, {recursive:true});
  await writeFile(path.join(dir,'index.html'), articleHtml(story), 'utf8');
}

const cards = stories.map(story => `<article class="fmb-morning-card"><a href="/news/${story.slug}/"><div class="fmb-morning-media"><img src="${esc(story.image)}" alt="${esc(story.alt)}" loading="lazy"><span>${esc(story.credit)}</span></div><div class="fmb-morning-copy"><small>${esc(story.category)} · ${esc(story.eventDate)}</small><h3>${esc(story.title)}</h3><p>${esc(story.deck)}</p></div></a></article>`).join('');
const special = `<section class="fmb-morning-special" data-fmb-morning-special="2026-08-12"><style>.fmb-morning-special{margin:28px auto 46px;width:min(1180px,calc(100% - 32px));padding:34px;background:linear-gradient(135deg,#1a062d,#351054 58%,#5a2b7b);color:#fff;border-radius:24px;box-shadow:0 28px 60px rgba(21,3,37,.22)}.fmb-morning-head{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:24px}.fmb-morning-head h2{margin:0;font-family:Cormorant Garamond,Georgia,serif;font-size:clamp(2.4rem,6vw,5.2rem);line-height:.9;font-weight:600}.fmb-morning-head p{max-width:440px;margin:0;color:#e2d7e9;line-height:1.6}.fmb-morning-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.fmb-morning-card a{display:block;height:100%;background:#fff;color:#21112f;text-decoration:none;border-radius:16px;overflow:hidden}.fmb-morning-media{position:relative;aspect-ratio:16/10;background:#ddd}.fmb-morning-media img{width:100%;height:100%;object-fit:cover}.fmb-morning-media span{position:absolute;right:7px;bottom:7px;background:rgba(18,3,31,.78);color:#fff;padding:4px 6px;border-radius:3px;font-size:7px;font-weight:800}.fmb-morning-copy{padding:18px}.fmb-morning-copy small{color:#80529d;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.fmb-morning-copy h3{margin:9px 0;font-family:Cormorant Garamond,Georgia,serif;font-size:1.8rem;line-height:1}.fmb-morning-copy p{margin:0;color:#5f5266;line-height:1.45;font-size:.9rem}@media(max-width:850px){.fmb-morning-grid{grid-template-columns:1fr}.fmb-morning-special{padding:24px}.fmb-morning-head{display:block}.fmb-morning-head p{margin-top:14px}}</style><div class="fmb-morning-head"><div><div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#d7b36a;font-weight:800">12 August 2026 · Morning Special Edition</div><h2>What matters this morning.</h2></div><p>Business, AI, media, workforce and culture, selected for their strategic consequence and explained for Filipinos.</p></div><div class="fmb-morning-grid">${cards}</div></section>`;

for (const relative of ['news/index.html','fmbnews/index.html']) {
  const file = path.join(dist, relative);
  let html = await readFile(file,'utf8');
  html = html.replace(/<section class="fmb-morning-special" data-fmb-morning-special="2026-08-12">[\s\S]*?<\/section>/, '');
  const marker = html.indexOf('<main');
  if (marker >= 0) {
    const end = html.indexOf('>', marker);
    html = `${html.slice(0,end+1)}${special}${html.slice(end+1)}`;
  } else {
    html = html.replace('</body>', `${special}</body>`);
  }
  await writeFile(file, html, 'utf8');
}

let sitemap = await readFile(sitemapPath,'utf8');
for (const story of stories) {
  const url = `https://www.francinemariebautista.com/news/${story.slug}/`;
  if (!sitemap.includes(url)) sitemap = sitemap.replace('</urlset>', `<url><loc>${url}</loc><lastmod>2026-08-12</lastmod></url></urlset>`);
}
await writeFile(sitemapPath,sitemap,'utf8');
console.log(`Published ${stories.length} FMB News Morning Special Edition stories for ${dateLabel}.`);
