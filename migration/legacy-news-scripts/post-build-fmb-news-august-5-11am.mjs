import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const fmbNewsRoot = path.join(dist, 'fmbnews');
const landingCandidates = [path.join(fmbNewsRoot, 'index.html'), path.join(newsRoot, 'index.html')];
const sitemapPath = path.join(dist, 'sitemap.xml');
const published = '2026-08-05T11:00:00+08:00';
const publishedLabel = '5 August 2026, 11:00 a.m. PHT';

const stories = [
  {
    slug: 'un-security-council-second-secretary-general-poll-august-21',
    section: 'World',
    tags: ['United Nations','UN Security Council','Secretary-General selection','Diplomacy','Developing story'],
    title: 'UN Security Council Targets August 21 for Second Secretary-General Poll',
    deck: 'The Security Council is preparing a second informal vote as members narrow the field for the United Nations’ next secretary-general.',
    meta: 'The UN Security Council is targeting August 21 for a second informal poll in the process of choosing the next secretary-general.',
    accent: '#173b78',
    graphicLabel: 'UNITED NATIONS',
    body: [
      ['What happened', 'The United Nations Security Council is targeting August 21 for a second informal poll to help narrow the field of candidates seeking to become the organization’s next secretary-general. Denmark’s UN ambassador, Christina Markus Lassen, confirmed the planned date after the first straw poll.'],
      ['How the process works', 'The Security Council conducts informal ballots before recommending one candidate to the General Assembly. The five permanent members can block a contender through a veto, although color-coded ballots that reveal permanent-member opposition are typically introduced later in the process.'],
      ['Who is in the race', 'The field includes candidates from Latin America, the Caribbean, Africa and other regions. Early polling is not a final result, and support can shift over several rounds as governments negotiate and assess whether a candidate can avoid a permanent-member veto.'],
      ['Why this matters to Filipinos', 'The secretary-general shapes the UN response to war, climate emergencies, migration, human rights and development. Those decisions affect the Philippines through peacekeeping, disaster assistance, maritime diplomacy, climate finance and the work of millions of Filipinos living abroad.'],
      ['What happens next', 'The August 21 poll is expected to provide another signal of which candidates can build broad support. Additional rounds may follow before the Security Council sends a formal recommendation to the General Assembly.']
    ],
    sources: [
      ['Reuters report on the planned August 21 poll','https://www.reuters.com/world/americas/denmark-targets-august-21-second-security-council-un-chief-poll-2026-08-03/'],
      ['United Nations: selection and appointment of the Secretary-General','https://www.un.org/pga/80/sg-selection/']
    ],
    credit: 'Editorial graphic: FMB News. Reporting sources: Reuters and the United Nations.'
  },
  {
    slug: 'italy-heat-alert-system-27-cities-public-health-august-2026',
    section: 'Environment',
    tags: ['Italy','Europe','Heatwave','Public health','Climate','Extreme weather'],
    title: 'Italy’s 27-City Heat Alert System Puts Public Health at the Center',
    deck: 'Italy’s national heat-health system issues city-level forecasts and graded warnings designed to trigger local prevention measures before extreme heat becomes deadly.',
    meta: 'Italy monitors heat-health risks across 27 cities, using graded alerts and public-health measures to protect vulnerable people and outdoor workers.',
    accent: '#a34222',
    graphicLabel: 'EXTREME HEAT',
    body: [
      ['What the system does', 'Italy’s Ministry of Health publishes heatwave bulletins for 27 cities from May to September. The forecasts cover 24, 48 and 72 hours and use four risk levels, from no risk to prolonged high-risk conditions.'],
      ['Why the alerts are different from ordinary forecasts', 'The system combines weather conditions with historical health data to estimate the danger to people, especially older adults, children, pregnant women, people with chronic illness and those working outdoors. The bulletins are shared with local governments, health services and civil-protection offices so they can activate prevention measures.'],
      ['Public-health response', 'Italy also operates a national heat information line and surveillance systems that track emergency-room visits and daily mortality during the warm season. This treats extreme heat as a health and labor-safety issue, not only a weather event.'],
      ['Why this matters to Filipinos', 'The Philippines regularly experiences dangerous heat and high humidity. A city-level heat-health system could help schools, local governments, hospitals and employers make earlier decisions about class schedules, outdoor work, cooling centers and protection for vulnerable households.'],
      ['What to watch', 'The effectiveness of heat alerts depends on local action. Warnings must be paired with clear thresholds, accessible cooling options, worker protections, reliable power and water, and communication that reaches people before exposure becomes dangerous.']
    ],
    sources: [
      ['Italian Ministry of Health heatwave bulletins','https://www.salute.gov.it/new/en/tema/ondate-di-calore/heatwave-bulletins/'],
      ['Italian Ministry of Health 2026 heat prevention campaign','https://www.salute.gov.it/new/it/campagna-di-comunicazione/campagna-2026-proteggiamoci-dal-caldo-consigli-unestate/?tema=Ondate+di+calore']
    ],
    credit: 'Editorial graphic: FMB News. Reporting source: Italian Ministry of Health.'
  }
];

const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function svg(story) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="t d"><title id="t">${esc(story.title)}</title><desc id="d">FMB News editorial graphic</desc><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${story.accent}"/><stop offset="1" stop-color="#100d28"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><circle cx="1010" cy="120" r="180" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/><circle cx="1010" cy="120" r="125" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/><circle cx="1010" cy="120" r="70" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/><text x="72" y="86" fill="#fff" font-family="Arial,sans-serif" font-size="34" font-weight="800">FMB NEWS</text><text x="72" y="150" fill="#f2c46d" font-family="Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="4">${esc(story.graphicLabel)}</text><foreignObject x="72" y="205" width="900" height="260"><div xmlns="http://www.w3.org/1999/xhtml" style="font:800 58px/1.08 Arial,sans-serif;color:white">${esc(story.title)}</div></foreignObject><text x="72" y="560" fill="rgba(255,255,255,.8)" font-family="Arial,sans-serif" font-size="20">5 AUGUST 2026 · 11:00 AM PHT</text><text x="1128" y="600" text-anchor="end" fill="rgba(255,255,255,.72)" font-family="Arial,sans-serif" font-size="16">Editorial graphic: FMB News</text></svg>`;
}

function page(story, imageUrl) {
  const url = `https://www.francinemariebautista.com/news/${story.slug}/`;
  const body = story.body.map(([h,p])=>`<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('\n');
  const sources = story.sources.map(([l,u])=>`<li><a href="${u}" target="_blank" rel="noopener noreferrer">${esc(l)}</a></li>`).join('');
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:story.title,description:story.meta,datePublished:published,dateModified:published,inLanguage:'en-PH',isAccessibleForFree:true,author:{'@type':'Organization',name:'FMB News Desk'},publisher:{'@type':'Organization',name:'FMB News',url:'https://www.francinemariebautista.com/fmbnews/'},mainEntityOfPage:{'@type':'WebPage','@id':url},articleSection:story.section,keywords:story.tags.join(', '),image:[`https://www.francinemariebautista.com${imageUrl}`]});
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(story.title)} | FMB News</title><meta name="description" content="${esc(story.meta)}"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:site_name" content="FMB News"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.meta)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://www.francinemariebautista.com${imageUrl}"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${schema}</script><link rel="stylesheet" href="/assets/css/site.css?v=20260716g"><link rel="stylesheet" href="/assets/css/news-channel.css?v=20260720a"><link rel="stylesheet" href="/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3"></head><body class="news-route news-story-route"><header class="nc-site-header"><div class="wrap"><a href="/fmbnews/">FMB News</a></div></header><main><div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/fmbnews/">Back to headlines</a><span>${publishedLabel}</span></div></div><header class="nc-article-hero"><div class="wrap"><p class="nc-kicker">${esc(story.section)} · ${esc(story.tags.slice(0,3).join(' · '))}</p><h1>${esc(story.title)}</h1><p class="nc-article-deck">${esc(story.deck)}</p><div class="nc-article-meta"><span>By FMB News Desk</span><span>${publishedLabel}</span><span>5 min read</span></div></div></header><section class="nc-story-media"><div class="wrap"><figure class="news-visual"><img src="${imageUrl}" width="1200" height="630" alt="${esc(story.title)}"><figcaption>${esc(story.credit)}</figcaption></figure></div></section><article class="nc-article"><div class="wrap nc-article-layout"><div class="nc-story-body"><p><strong>${esc(story.deck)}</strong></p>${body}<section class="nc-sources"><h2>Sources and public record</h2><ul>${sources}</ul></section></div></div></article></main><footer class="nc-footer"><div class="wrap">© 2026 FMB News.</div></footer></body></html>`;
}

await mkdir(newsRoot,{recursive:true});
await mkdir(path.join(dist,'assets','images','news'),{recursive:true});

for (const story of stories) {
  const imageUrl = `/assets/images/news/${story.slug}.svg`;
  await writeFile(path.join(dist,imageUrl.replace(/^\//,'')),svg(story),'utf8');
  const dir = path.join(newsRoot,story.slug); await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'index.html'),page(story,imageUrl),'utf8');
}

for (const landingPath of landingCandidates) {
  try {
    let html = await readFile(landingPath,'utf8');
    for (const story of [...stories].reverse()) {
      const href = `/news/${story.slug}/`;
      if (html.includes(href)) continue;
      const card = `<article class="nc-rundown-story" data-category="${story.section.toLowerCase().replaceAll(' ','-')}"><a href="${href}"><span class="nc-rundown-number">11AM</span><figure class="news-visual"><img src="/assets/images/news/${story.slug}.svg" width="1200" height="630" loading="lazy" decoding="async" alt="${esc(story.title)}"><figcaption>${esc(story.credit)}</figcaption></figure><div><p>${esc(story.section)} · ${esc(story.tags.slice(0,2).join(' · '))}</p><h3>${esc(story.title)}</h3><span>5 min read</span></div></a></article>`;
      const at = html.indexOf('<article class="nc-rundown-story"');
      if (at >= 0) html = html.slice(0,at)+card+html.slice(at);
    }
    html = html.replace(/<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/,`<time data-news-updated>Updated ${publishedLabel}</time>`);
    await writeFile(landingPath,html,'utf8');
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
}

try {
  let sitemap = await readFile(sitemapPath,'utf8');
  for (const story of stories) {
    const loc = `https://www.francinemariebautista.com/news/${story.slug}/`;
    if (!sitemap.includes(loc)) sitemap = sitemap.replace('</urlset>',`  <url><loc>${loc}</loc><lastmod>2026-08-05</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n</urlset>`);
  }
  await writeFile(sitemapPath,sitemap,'utf8');
} catch {}

console.log(`Published ${stories.length} verified FMB News reports for the August 5, 11:00 a.m. newsroom run.`);
