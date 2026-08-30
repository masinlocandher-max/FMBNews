import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const homePath = path.join(root, 'dist', 'index.html');
const sitemapPath = path.join(root, 'dist', 'sitemap.xml');
const published = '2026-08-03T12:00:00+08:00';
const publishedLabel = '3 August 2026, 12:00 noon PHT';
const image = '/assets/images/news/fmb-news-august-3-morning-2026.svg';

const stories = [
  {
    slug: 'subic-first-locally-built-hyundai-tanker-august-2026',
    section: 'Philippines',
    kicker: 'Philippines · Industry · Maritime economy',
    read: '5 min read',
    title: 'Subic Shipyard Launches First Locally Built Hyundai Tanker',
    meta: 'HD Hyundai Heavy Industries Philippines has launched the Orion Jade, the first vessel newly built at its Subic shipyard and the first of four tankers ordered by an Asia-based customer.',
    deck: 'The launch marks a concrete return of large-scale ship construction to Subic and offers an early test of whether new investment can translate into durable industrial jobs and local supply-chain growth.',
    body: [
      ['What was launched', 'HD Hyundai Heavy Industries Philippines rolled out the Orion Jade, a 115,000-deadweight-ton crude oil and product tanker built at the Subic shipyard. The vessel is the first of four ships ordered by an Asia-based shipping company in December 2024.'],
      ['Why the launch matters', 'Subic has long been associated with heavy maritime industry, but the new vessel is the first completed under HD Hyundai’s current Philippine operation. Its launch moves the project beyond investment pledges and into actual production.'],
      ['The economic opportunity', 'A working shipyard can support skilled employment, technical training, fabrication, logistics and supplier demand. The larger question is how much of that activity will remain in the Philippines through local hiring, technology transfer and domestic procurement.'],
      ['What to watch next', 'The next indicators are delivery performance, the progress of the remaining three vessels, workforce growth and whether Subic attracts additional commercial or naval construction contracts. One completed ship is a milestone, but sustained industrial value will depend on a continuing order book.']
    ],
    sources: [
      ['Philippine Star report on the Orion Jade launch', 'https://www.philstar.com/headlines/2026/07/29/2545544/hhip-launches-first-subic-built-ship/amp/'],
      ['HD Hyundai release on the start of construction in Subic', 'https://www.hd.com/en/newsroom/media-hub/press/view?detailsKey=3645']
    ]
  },
  {
    slug: 'oil-prices-fall-us-pauses-iran-strike-august-3-2026',
    section: 'World',
    kicker: 'World · Economy · Energy · Developing story',
    read: '5 min read',
    title: 'Oil Prices Fall as Washington Pauses Iran Strike and Pursues a Deal',
    meta: 'Oil prices dropped sharply after the United States called off a planned attack on Iran and shifted toward negotiations over the Strait of Hormuz and Tehran’s nuclear program.',
    deck: 'Markets are pricing in a lower immediate risk of war, but shipping through Hormuz remains disrupted and the diplomatic opening has not yet produced a completed agreement.',
    body: [
      ['The market reaction', 'Brent crude and U.S. West Texas Intermediate both fell by roughly five percent after President Donald Trump said a planned military attack on Iran had been canceled while negotiations continued.'],
      ['Why prices moved quickly', 'Oil had risen by more than 20 percent during the previous month as attacks near Oman and restrictions around the Strait of Hormuz threatened supplies. A pause in military escalation reduced the immediate risk premium built into prices.'],
      ['The shipping problem is not resolved', 'Tanker traffic through Hormuz remains slower than normal, and additional maritime incidents were reported over the weekend. The strait is one of the world’s most important energy routes, so even limited disruption can affect fuel costs far beyond the region.'],
      ['Why this remains developing', 'The market response reflects expectations, not a signed and implemented settlement. If negotiations fail, military action resumes or shipping remains unsafe, prices could reverse quickly.']
    ],
    sources: [
      ['Reuters report on the oil-price decline and diplomatic shift', 'https://www.reuters.com/business/energy/oil-tumbles-trump-cancels-attack-iran-reach-nuclear-deal-2026-08-03/'],
      ['Reuters report on the resumption of U.S.–Iran talks', 'https://www.reuters.com/world/asia-pacific/trump-says-iran-talks-take-place-monday-sets-no-deadline-deal-2026-08-02/']
    ]
  }
];

const esc = (v) => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function page(story) {
  const url = `https://www.francinemariebautista.com/news/${story.slug}/`;
  const body = story.body.map(([h,p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('');
  const sources = story.sources.map(([l,u]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${esc(l)}</a>`).join('');
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:story.title,description:story.meta,datePublished:published,dateModified:published,inLanguage:'en-PH',isAccessibleForFree:true,author:{'@type':'Person',name:'Francine Marie Bautista',url:'https://www.francinemariebautista.com/aboutfmb/'},publisher:{'@type':'Organization',name:'FMB News Center',url:'https://www.francinemariebautista.com/news/'},mainEntityOfPage:{'@type':'WebPage','@id':url},articleSection:story.section,image:`https://www.francinemariebautista.com${image}`});
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(story.title)} | FMB News</title><meta name="description" content="${esc(story.meta)}"><meta name="author" content="Francine Marie Bautista"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:site_name" content="FMB News Center"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.meta)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://www.francinemariebautista.com${image}"><meta property="article:published_time" content="${published}"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${schema}</script><link rel="icon" href="/assets/images/fmb-approved/fmb-master-purple-square.webp" type="image/webp"><link rel="stylesheet" href="/assets/css/site.css?v=20260716g"><link rel="stylesheet" href="/assets/css/fmb-polish.css?v=20260717a"><link rel="stylesheet" href="/assets/css/news-channel.css?v=20260720a"><link rel="stylesheet" href="/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3"></head><body class="news-route news-story-route"><a class="nc-skip" href="#story">Skip to the story</a><header class="nc-site-header"><div class="nc-brandline"><div class="wrap"><span class="nc-network-label"><i></i> FMB News Center</span><span class="nc-network-clock"><time data-news-clock>Philippine Standard Time</time><b>PHT</b></span></div></div><div class="nc-nav-shell wrap"><a class="nc-publication-brand" href="/news/"><span>FMB News Center</span></a><nav class="nc-site-links"><a href="/news/">Headlines</a><a href="/news/#philippines">Philippines</a><a href="/news/#world">World</a></nav></div></header><main id="story"><div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/news/">Back to headlines</a><span class="nc-story-edition">Noon update · ${publishedLabel}</span></div></div><header class="nc-article-hero"><div class="wrap"><div class="nc-article-hero-grid"><div><p class="nc-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1></div><p class="nc-article-deck">${esc(story.deck)}</p></div><div class="nc-article-meta"><span>By Francine Marie Bautista</span><span>Published ${publishedLabel}</span><span>${story.read}</span><span>Sources reviewed</span></div></div></header><section class="nc-story-media"><div class="wrap"><figure class="news-visual"><img src="${image}" width="1536" height="864" alt="FMB News noon update" fetchpriority="high"><figcaption>FMB News Center noon update. Reporting sources appear below.</figcaption></figure></div></section><article class="nc-article"><div class="wrap nc-article-layout"><aside class="nc-story-aside"><dl><div><dt>Desk</dt><dd>${esc(story.section)}</dd></div><div><dt>Published</dt><dd>${publishedLabel}</dd></div></dl><button class="nc-share-button" type="button" data-news-share>Share this report</button></aside><div class="nc-story-body"><div class="nc-factbox"><p><strong>Editorial note:</strong> This report separates confirmed developments from claims and unresolved outcomes.</p></div><p><strong>${esc(story.deck)}</strong></p>${body}<section class="nc-sources"><h2>Sources and public record</h2>${sources}</section></div><aside class="nc-story-rail"><p>Continue reading</p><a href="/news/">All FMB News headlines<span>News Center</span></a></aside></div></article></main><footer class="nc-footer"><div class="wrap"><div class="nc-footer-bottom"><span>© 2026 Francine Marie Bautista. All rights reserved.</span><span>FMB News Center · ${esc(story.section)}</span></div></div></footer><script src="/assets/js/news-channel.js?v=20260719-broadcast-v3"></script></body></html>`;
}

await mkdir(newsRoot,{recursive:true});
for (const story of stories) { const dir=path.join(newsRoot,story.slug); await mkdir(dir,{recursive:true}); await writeFile(path.join(dir,'index.html'),page(story),'utf8'); }
let landing=await readFile(landingPath,'utf8');
for (const story of [...stories].reverse()) { const href=`/news/${story.slug}/`; if(landing.includes(href)) continue; const marker='<div class="nc-rundown-head">'; const pos=landing.indexOf('<article class="nc-rundown-story"',landing.indexOf(marker)); if(pos<0) throw new Error('Noon update insertion point missing'); const card=`<article class="nc-rundown-story"><a href="${href}"><span class="nc-rundown-number">12NN</span><figure class="news-visual"><img src="${image}" width="1536" height="864" loading="lazy" decoding="async" alt="FMB News noon update"><figcaption>FMB News Center noon update.</figcaption></figure><div><p>${esc(story.kicker)}</p><h3>${esc(story.title)}</h3><span>${story.read}</span></div></a></article>`; landing=`${landing.slice(0,pos)}${card}${landing.slice(pos)}`; landing=landing.replace('<div class="nc-wire-track">',`<div class="nc-wire-track"><span>${esc(story.title)}</span>`); }
landing=landing.replace(/<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/,`<time data-news-updated>Updated ${publishedLabel}</time>`); await writeFile(landingPath,landing,'utf8');
let home=await readFile(homePath,'utf8'); home=home.replace(/<article class="fmb-approved-news-lead">[\s\S]*?<\/article>/,`<article class="fmb-approved-news-lead"><img src="${image}" width="1536" height="864" loading="lazy" decoding="async" alt="FMB News noon update"><div><small>August 3 Noon Update</small><h3>${esc(stories[0].title)}</h3></div></article>`); home=home.replace(/<div class="fmb-approved-news-list">[\s\S]*?<\/div>/,`<div class="fmb-approved-news-list"><a href="/news/${stories[0].slug}/"><span>${esc(stories[0].title)}</span><time>Philippines</time></a><a href="/news/${stories[1].slug}/"><span>${esc(stories[1].title)}</span><time>World</time></a></div>`); await writeFile(homePath,home,'utf8');
let sitemap=await readFile(sitemapPath,'utf8'); for(const story of stories){const loc=`https://www.francinemariebautista.com/news/${story.slug}/`; if(!sitemap.includes(loc)) sitemap=sitemap.replace('</urlset>',`  <url><loc>${loc}</loc><lastmod>2026-08-03</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n</urlset>`);} await writeFile(sitemapPath,sitemap,'utf8');
console.log(`Published ${stories.length} original FMB News reports for the August 3 noon update.`);
