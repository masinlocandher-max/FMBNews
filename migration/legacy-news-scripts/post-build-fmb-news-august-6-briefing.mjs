import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const sitemapPath = path.join(root, 'dist', 'sitemap.xml');
const published = '2026-08-06T15:00:00+08:00';
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

const stories = [
  {
    slug:'western-visayas-ai-festival-2026', category:'Technology', kicker:'Technology · Western Visayas',
    title:'Iloilo AI Festival Pushes Local Innovation Toward Tourism, Energy and the Blue Economy',
    deck:'The three-day gathering connects government, universities, developers and businesses around practical uses of artificial intelligence in regional industries.',
    description:'The 2026 Western Visayas AI Festival in Iloilo City brought together government, academe and industry around AI applications in tourism, the blue economy, renewable energy and cultural preservation.',
    image:'https://pia.gov.ph/wp-content/uploads/2026/05/1000000802-1024x768.jpg', credit:'PHOTO: PIA ILOILO',
    alt:'Participants and organizers at an artificial intelligence festival in Iloilo City',
    sections:[
      ['What happened','The Western Visayas AI Festival ran in Iloilo City from August 3 to 5, with technical sessions, a hackathon, policy discussions, exhibits, robotics activities and a national game-development competition. Organizers placed tourism, the blue economy, renewable energy and cultural preservation among the areas where participants were encouraged to build practical AI solutions.'],
      ['Why it matters','Regional innovation is often discussed as if it begins and ends in Metro Manila. Iloilo’s festival shows a different model: local universities, government offices, business groups and developers working around problems that are specific to their communities and industries.'],
      ['Opportunity and risk','Promising prototypes can support fisheries, visitor services, energy management and public information. The harder work begins after the event. Projects need reliable data, users who can operate them, funding for maintenance and clear accountability when automated systems make mistakes.'],
      ['Why It Matters to Us, Filipinos','A useful Philippine AI sector will not be measured by the number of conferences held. It will be measured by whether technology helps communities solve real problems, creates durable work and remains understandable to the people affected by it.']
    ],
    sources:[['Philippine Information Agency, AI Festival eyes collaborative use in various sectors','https://pia.gov.ph/news/ai-festival-eyes-collaborative-use-in-various-sectors/']]
  },
  {
    slug:'pax-silica-new-clark-city-jobs-2026', category:'Business and Technology', kicker:'Business · Technology Policy',
    title:'Pax Silica Promises High-Value Jobs, but Delivery Will Define Its Reputation',
    deck:'BCDA says the proposed New Clark City technology hub could generate more than 130,000 skilled jobs and attract major investment, while energy, water, environmental and governance questions remain central.',
    description:'BCDA says the proposed Pax Silica development in New Clark City could create more than 130,000 jobs and draw billions of dollars in investment.',
    image:'https://pia.gov.ph/wp-content/uploads/2026/07/20260723-BCDA_Briefing-1.jpg', credit:'PHOTO: PCO / RTVM VIA PIA',
    alt:'BCDA President Joshua Bingcang discusses the proposed Pax Silica development at a Palace briefing',
    sections:[
      ['What happened','The Bases Conversion and Development Authority said the proposed Pax Silica industrial ecosystem in New Clark City could create more than 130,000 high-quality jobs. BCDA also projected possible investment of 40 billion to 70 billion US dollars once the development is fully built. These are official projections, not completed investments or guaranteed employment figures.'],
      ['What the project is meant to do','Pax Silica is being presented as an advanced-manufacturing and technology hub linked to semiconductors, artificial intelligence and critical-mineral processing. BCDA says the goal is to move the Philippines into higher-value parts of global supply chains instead of relying mainly on raw-material exports and lower-value production.'],
      ['Public perception test','The project has a strong futuristic story, but reputation will depend on visible execution. People will judge it through actual contracts, hiring, training, power reliability, water use, environmental protection and respect for nearby communities. Large projections without transparent milestones can quickly become a credibility problem.'],
      ['Why It Matters to Us, Filipinos','A successful hub could keep more engineers, researchers and technology workers in the country. A poorly governed one could consume public attention and resources without producing benefits at the scale promised. The public should watch signed investments and operating facilities, not announcements alone.']
    ],
    sources:[['Philippine Information Agency and PCO, BCDA says Pax Silica could generate over 130,000 jobs','https://pia.gov.ph/news/bcda-says-pax-silica-project-could-generate-over-130000-high-quality-jobs/'],['Reuters, US and Philippines discuss an economic security zone framework','https://www.reuters.com/world/china/us-philippines-reach-deal-economic-security-zone-sooner-rather-than-later-us-2026-05-21/']]
  },
  {
    slug:'sb19-lollapalooza-filipino-heritage-branding', category:'Entertainment and Culture', kicker:'Entertainment · Philippine Culture',
    title:'SB19 Turns Lollapalooza Debut Into a Statement of Filipino Identity',
    deck:'The group’s historic festival appearance used music, styling and indigenous-inspired details to make Philippine identity legible to a wider global audience.',
    description:'SB19 became the first Filipino act to perform at Lollapalooza and used Filipino-inspired styling to introduce the group and its identity to a global festival audience.',
    image:'https://assets.teenvogue.com/photos/6a6ce3d2f34041d1d51d24a2/16%3A9/w_2560%2Cc_limit/SB19LollapaloozaTeenVogue-14.jpg', credit:'PHOTO: GINO LUCAS / COURTESY OF SB19',
    alt:'SB19 and dancers huddle backstage before their Lollapalooza performance',
    sections:[
      ['What happened','SB19 became the first Filipino act to perform at Lollapalooza in Chicago. For the appearance, the group worked with stylist Roy Back on looks influenced by Filipino culture and indigenous embroidery, while adapting its performance for an audience that included many people encountering the group for the first time.'],
      ['Why the branding worked','The cultural references were part of the full presentation rather than an accessory added after the fact. Music, wardrobe, preparation and messaging all reinforced the same idea: this was a Filipino group entering a global stage without removing the identity that made it distinct.'],
      ['Cultural responsibility','Using indigenous visual language carries obligations. Designers and performers should document where references come from, credit communities and makers, and avoid turning living traditions into anonymous decoration. Cultural pride becomes stronger when recognition and economic value are shared.'],
      ['Why It Matters to Us, Filipinos','International visibility is most valuable when Filipino artists are remembered for a clear point of view, not only for appearing on a famous stage. SB19’s performance offers a useful lesson for tourism, fashion, pageantry and entertainment brands seeking global relevance.']
    ],
    sources:[['Teen Vogue, SB19 Honor Their Filipino Heritage With Lollapalooza 2026 Looks','https://www.teenvogue.com/story/sb19-honor-their-filipino-heritage-with-lollapalooza-2026-looks'],['Vogue Philippines, SB19 performance at Lollapalooza 2026','https://vogue.ph/lifestyle/music/sb19-performance-at-lollapalooza-2026/']]
  },
  {
    slug:'katrina-llegado-miss-supranational-2026', category:'Pageantry', kicker:'Pageantry · Philippines',
    title:'Katrina Llegado Wins Miss Supranational 2026 for the Philippines',
    deck:'The Filipina delegate secured the international crown in Poland after advancing through a field of 67 contestants and delivering a message about identity beyond imposed expectations.',
    description:'Katrina Llegado of the Philippines won Miss Supranational 2026 in Nowy Sącz, Poland, becoming the new titleholder after competing against 66 other delegates.',
    image:'https://people.com/thmb/RLVJ_PwsWPquKtV-LWNbY6iqgXc%3D/1500x0/filters%3Ano_upscale%28%29%3Amax_bytes%28150000%29%3Astrip_icc%28%29%3Afocal%28749x0%3A751x2%29%3Aformat%28webp%29/MISS-SUPRANATIONAL-winner-2026-Katrina-Llegado-073126-586df0e3dd7347d09c32a91d63417af9.jpg', credit:'PHOTO: MISS & MISTER SUPRANATIONAL OFFICIAL / YOUTUBE',
    alt:'Katrina Llegado wearing the Miss Supranational 2026 crown',
    sections:[
      ['What happened','Katrina Llegado was crowned Miss Supranational 2026 at the competition held in Nowy Sącz, Poland. Sixty-seven delegates joined the 17th edition of the pageant. Llegado reached the final five with representatives from Brazil, the Czech Republic, France and Nigeria before receiving the title.'],
      ['The message behind the moment','During the final interview, Llegado spoke about refusing to fit into a fixed mold and working toward the best version of herself. The message gave the result an identity-centered frame rather than reducing the win to appearance and stage performance alone.'],
      ['The industry behind a crown','An international pageant campaign depends on a wider creative and professional network: trainers, designers, makeup artists, photographers, communications teams, sponsors and organizers. Crediting that ecosystem helps the public understand pageantry as an industry rather than a single-night spectacle.'],
      ['Why It Matters to Us, Filipinos','The victory strengthens the Philippines’ pageant reputation and can create opportunities in endorsements, tourism, fashion and creative services. The lasting value will depend on how the titleholder and her team translate the crown into credible work after the competition.']
    ],
    sources:[['People, Miss Supranational 2026 Crowns New Winner Katrina Llegado','https://people.com/miss-supranational-2026-crowns-new-winner-12031254']]
  },
  {
    slug:'myanmar-min-aung-hlaing-thailand-visit-2026', category:'Southeast Asia', kicker:'Southeast Asia · Diplomacy',
    title:'Myanmar Leader’s Thailand Visit Tests ASEAN’s Line Between Dialogue and Legitimacy',
    deck:'Min Aung Hlaing received an official welcome in Bangkok as Thailand defended renewed engagement, while rights groups warned that ceremony and business talks could normalize military rule.',
    description:'Myanmar President Min Aung Hlaing began an official visit to Thailand amid criticism that renewed regional engagement could grant legitimacy without progress on peace and rights.',
    image:'https://dims.apnews.com/dims4/default/7b42ac5/2147483647/strip/true/crop/5000x3333%2B0%2B0/resize/1200x800%21/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fc9%2Fb8%2Fc9ad8538bf89cdda449050485594%2F705cb7273e7f4251ba34cdb2ccc2563c', credit:'PHOTO: SAKCHAI LALIT / AP',
    alt:'Thailand Prime Minister Anutin Charnvirakul and Myanmar President Min Aung Hlaing review an honor guard in Bangkok',
    sections:[
      ['What happened','Myanmar President Min Aung Hlaing arrived in Thailand for a two-day official visit that includes meetings with Thai Prime Minister Anutin Charnvirakul, planned agreements and a bilateral business forum. Thailand describes its approach as calibrated re-engagement intended to keep communication open.'],
      ['Why the visit is controversial','Min Aung Hlaing led the 2021 military takeover that removed Myanmar’s elected government. Armed conflict and repression have continued, while critics rejected the political process that later installed him as president. Rights groups argue that state honors can provide international legitimacy without requiring meaningful change.'],
      ['The communications problem','Diplomatic engagement can be defended as necessary for border stability, humanitarian access and negotiation. But photographs of formal welcomes can communicate recognition more powerfully than carefully written statements communicate conditions. Governments must explain what engagement achieved and what limits remain.'],
      ['Why It Matters to Us, Filipinos','The Philippines has a direct interest in ASEAN credibility. Regional diplomacy should be judged by measurable movement on violence, humanitarian access, political prisoners and inclusive dialogue, not simply by the number of meetings held.']
    ],
    sources:[['Associated Press, Myanmar leader arrives in Thailand seeking political legitimacy','https://apnews.com/article/thailand-myanmar-asean-min-aung-hlaing-40b15f180969717a7260e7093fa1d6fb'],['Reuters, Min Aung Hlaing visits Thailand as Bangkok backs engagement','https://www.reuters.com/world/asia-pacific/myanmar-president-visits-thailand-quest-legitimacy-bangkok-backs-engagement-2026-08-05/']]
  },
  {
    slug:'san-marcelino-scholarship-requirements-august-2026', category:'Zambales and Community', kicker:'Zambales · Public Service',
    title:'San Marcelino Reminds College Students to Prepare Scholarship Requirements',
    deck:'The municipal government has advised applicants for first-semester educational assistance to prepare residency, indigency, voter-registration and enrollment documents for the August application period.',
    description:'San Marcelino, Zambales has reminded college students to prepare documents for its August 2026 educational assistance and scholarship application period.',
    image:'https://sanmarcelinozambales.gov.ph/wp-content/uploads/2026/05/paalala-1024x1024.jpg', credit:'PHOTO: LGU SAN MARCELINO',
    alt:'Official San Marcelino advisory listing scholarship and educational assistance requirements',
    sections:[
      ['What happened','The San Marcelino municipal government, through its Public Employment Service Office, reminded college students to prepare the documents required for first-semester educational assistance and scholarship applications in August 2026.'],
      ['Documents identified by the LGU','The official advisory lists a voter’s ID or proof of voter registration, barangay indigency, barangay residency, and an original or certified true copy of either the certificate of registration with grades or the certificate of enrollment. Applicants should confirm current procedures directly with PESO before submitting documents.'],
      ['Why communication matters','A public program can exist on paper and still miss qualified residents when instructions are difficult to find, published too early without follow-up, or scattered across different channels. Repeating requirements close to the application period reduces avoidable delays.'],
      ['Why It Matters to Us, Filipinos','Educational assistance can help families manage enrollment and school expenses, but access depends on clear and timely information. Local governments should keep application dates, eligibility rules, contact details and document checklists easy to find on mobile devices.']
    ],
    sources:[['Official website of the Municipality of San Marcelino, scholarship applicant reminder','https://sanmarcelinozambales.gov.ph/paalala-sa-mga-aplikante-ng-1st-semester-educational-assistance-at-scholarship-program-ng-lgu-san-marcelino/']]
  }
];

const storyHtml = story => {
  const href = `/news/${story.slug}/`;
  const canonical = `https://www.francinemariebautista.com${href}`;
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:story.title,description:story.description,datePublished:published,dateModified:published,inLanguage:'en-PH',isAccessibleForFree:true,author:{'@type':'Person',name:'Francine Marie Bautista'},publisher:{'@type':'Organization',name:'FMB News'},mainEntityOfPage:{'@type':'WebPage','@id':canonical},articleSection:story.category,image:[story.image]});
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(story.title)} | FMB News</title><meta name="description" content="${esc(story.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.deck)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${esc(story.image)}"><meta property="article:published_time" content="${published}"><script type="application/ld+json">${schema}</script><link rel="stylesheet" href="/assets/css/site.css?v=20260716g"><link rel="stylesheet" href="/assets/css/news-channel.css?v=20260720a"><link rel="stylesheet" href="/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3"><style>.fmb-photo{position:relative;overflow:hidden;background:#07152f}.fmb-photo img{display:block;width:100%;max-height:760px;object-fit:cover}.fmb-photo-credit{position:absolute;right:10px;bottom:10px;padding:5px 8px;background:rgba(4,10,25,.78);color:#fff;font:700 10px/1.2 Arial,sans-serif;letter-spacing:.04em;text-transform:uppercase}.nc-sources a{display:block;margin:.65rem 0}</style></head><body class="news-route news-story-route"><main id="story"><div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/news/">Back to headlines</a><span>6 August 2026, 3:00 p.m. PHT</span></div></div><header class="nc-article-hero"><div class="wrap"><p class="nc-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1><p class="nc-article-deck">${esc(story.deck)}</p><div class="nc-article-meta"><span>By Francine Marie Bautista</span><span>Published 6 August 2026, 3:00 p.m. PHT</span><span>FMB News</span></div></div></header><section class="nc-story-media"><div class="wrap"><figure class="news-visual fmb-photo"><img src="${esc(story.image)}" alt="${esc(story.alt)}" loading="eager"><span class="fmb-photo-credit">${esc(story.credit)}</span><figcaption>${esc(story.credit.replace('PHOTO: ','Photo: '))}</figcaption></figure></div></section><article class="nc-article"><div class="wrap nc-article-layout"><div class="nc-story-body"><div class="nc-factbox"><p><strong>Category:</strong> ${esc(story.category)}</p><p><strong>Editorial note:</strong> Verified facts are attributed below. Interpretation and implications are FMB News analysis.</p></div>${story.sections.map(([h,p])=>`<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('')}<section class="nc-sources"><h2>Sources and public record</h2>${story.sources.map(([l,u])=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${esc(l)}</a>`).join('')}</section></div></div></article></main></body></html>`;
};

await mkdir(newsRoot,{recursive:true});
let landing = await readFile(landingPath,'utf8');
for (const story of stories) {
  const href = `/news/${story.slug}/`;
  await mkdir(path.join(newsRoot,story.slug),{recursive:true});
  await writeFile(path.join(newsRoot,story.slug,'index.html'),storyHtml(story),'utf8');
  if (!landing.includes(href)) {
    const card = `<article class="nc-rundown-story"><a href="${href}"><span class="nc-rundown-number">NEW</span><figure class="news-visual fmb-photo"><img src="${esc(story.image)}" loading="lazy" decoding="async" alt="${esc(story.alt)}"><span class="fmb-photo-credit">${esc(story.credit)}</span><figcaption>${esc(story.credit.replace('PHOTO: ','Photo: '))}</figcaption></figure><div><p>${esc(story.category)} · 6 August 2026</p><h3>${esc(story.title)}</h3><span>FMB News</span></div></a></article>`;
    const marker = '<div class="nc-rundown-head">';
    if (landing.includes(marker)) {
      const headEnd = landing.indexOf('</div>',landing.indexOf(marker));
      const insertAt = landing.indexOf('</div>',headEnd + 6) + 6;
      landing = `${landing.slice(0,insertAt)}${card}${landing.slice(insertAt)}`;
    }
  }
}
landing = landing.replace('</head>','<style>.fmb-photo{position:relative;overflow:hidden}.fmb-photo img{display:block;width:100%;height:100%;object-fit:cover}.fmb-photo-credit{position:absolute;right:8px;bottom:8px;padding:4px 7px;background:rgba(4,10,25,.78);color:#fff;font:700 9px/1.2 Arial,sans-serif;letter-spacing:.03em;text-transform:uppercase}</style></head>');
landing = landing.replace(/<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/,'<time data-news-updated>Updated 6 August 2026, 3:00 p.m. PHT</time>');
await writeFile(landingPath,landing,'utf8');

try {
  let sitemap = await readFile(sitemapPath,'utf8');
  for (const story of stories) {
    const canonical = `https://www.francinemariebautista.com/news/${story.slug}/`;
    if (!sitemap.includes(canonical)) sitemap = sitemap.replace('</urlset>',`<url><loc>${canonical}</loc><lastmod>2026-08-06</lastmod></url></urlset>`);
  }
  await writeFile(sitemapPath,sitemap,'utf8');
} catch {}

console.log(`Published ${stories.length} original FMB News reports with article-specific sourced photographs, lower-right credits, categories, metadata and sitemap entries.`);
