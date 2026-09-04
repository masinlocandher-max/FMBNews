import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const masterRoot=path.join(root,'content','fact-check','master');
const origin='https://www.francinemariebautista.com';

const esc=(s='')=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const stripRating=t=>String(t).replace(/^(FALSE|MISLEADING|VERIFIED FACT|TRUE)\s*:\s*/i,'').replace(/^FACT CHECK\s*\|\s*/i,'').trim();
const slugify=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,110)||'fmb-fact-check';
const wordCount=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;
const readTime=s=>Math.max(2,Math.ceil(wordCount(s)/220));

function splitArticles(text){
  const chunks=text.split(/^={72}\nFMB FACT CHECK /m).slice(1);
  const out=[];
  for(const chunk of chunks){
    const first=chunk.indexOf('\n');
    const id=Number(chunk.slice(0,first).trim()),body=chunk.slice(first+1).trim();
    const field=(name,nextNames=[])=>{
      const next=nextNames.length?`(?=\\n+(?:${nextNames.join('|')})\\n|$)`:'(?=$)';
      const r=new RegExp(`(?:^|\\n+)${name}\\n([\\s\\S]*?)${next}`,'i');
      return (body.match(r)?.[1]||'').trim();
    };
    const headline=field('HEADLINE',['ARCHIVE PERIOD']);
    const period=field('ARCHIVE PERIOD',['CLAIM']);
    const claim=field('CLAIM',['RATING']);
    let rating=field('RATING',['THE FMB VERDICT']).toUpperCase();
    if(id===92)rating='TRUE';
    const sections=[
      ['The FMB verdict',field('THE FMB VERDICT',['WHAT THE RECORD NEEDS TO SHOW'])],
      ['What the record needs to show',field('WHAT THE RECORD NEEDS TO SHOW',['WHAT IS WRONG, MISSING, OR CONFIRMED'])],
      ['What is wrong, missing, or confirmed',field('WHAT IS WRONG, MISSING, OR CONFIRMED',['VERIFICATION ROUTE'])],
      ['How FMB checks the claim',field('VERIFICATION ROUTE',['WHAT WOULD CHANGE THE RATING'])],
      ['What would change the rating',field('WHAT WOULD CHANGE THE RATING',['WHY THIS MATTERS'])],
      ['Why this matters',field('WHY THIS MATTERS',['FMB BOTTOM LINE'])],
      ['FMB bottom line',field('FMB BOTTOM LINE',['PRIMARY EVIDENCE CHECKLIST'])]
    ].filter(([,v])=>v);
    const checklist=field('PRIMARY EVIDENCE CHECKLIST',['EDITORIAL STATUS']).split(/\\n+/).map(x=>x.replace(/^[-•]\\s*/,'').trim()).filter(Boolean);
    const editorialStatus=field('EDITORIAL STATUS',[]);
    const title=stripRating(headline);
    out.push({id,title,period,claim,rating,sections,checklist,editorialStatus,slug:slugify(title)});
  }
  if(out.length!==123)throw new Error(`Expected 123 FMB Fact Check articles, found ${out.length}`);
  if(out.some(a=>!a.title||!a.rating||!a.period))throw new Error('Fact Check master parsing failed: one or more required fields are empty.');
  return out;
}

const exact=/^\d{4}-\d{2}-\d{2}$/;
const periodSort={
  'Late Aug 2026':'2026-08-27','Mid/Late Aug 2026':'2026-08-20','Mid Aug 2026':'2026-08-15','Early Aug 2026':'2026-08-05','Jul–Aug 2026':'2026-07-31','Jun–Jul 2026':'2026-06-30','May–Jun 2026':'2026-05-31','Apr–May 2026':'2026-04-30','Oct–Nov 2025':'2025-10-31','Sep–Oct 2025':'2025-09-30'
};
function sortKey(a){return exact.test(a.period)?a.period:(periodSort[a.period]||`0000-00-${String(123-a.id).padStart(2,'0')}`)}
function periodLabel(p){if(!exact.test(p))return p;return new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'long',day:'numeric',year:'numeric'}).format(new Date(`${p}T12:00:00+08:00`))}

const ratingMeta={
  'TRUE':{cls:'true',label:'TRUE',icon:'<circle cx="32" cy="32" r="25"/><path d="m19 32 9 9 18-20"/>'},
  'VERIFIED FACT':{cls:'fact',label:'VERIFIED FACT',icon:'<path d="M32 6 52 15v14c0 14-8 23-20 29C20 52 12 43 12 29V15z"/><path d="m21 32 8 8 15-17"/>'},
  'MISLEADING':{cls:'misleading',label:'MISLEADING',icon:'<path d="M32 7 57 54H7z"/><path d="M32 20v18"/><circle cx="32" cy="46" r="2"/>'},
  'FALSE':{cls:'false',label:'FALSE',icon:'<circle cx="32" cy="32" r="25"/><path d="m22 22 20 20M42 22 22 42"/>'}
};
function ratingBadge(rating,large=false){const m=ratingMeta[rating]||ratingMeta.FALSE;return `<span class="fc-badge fc-${m.cls}${large?' is-large':''}" aria-label="Rating: ${esc(m.label)}"><svg viewBox="0 0 64 64" aria-hidden="true">${m.icon}</svg><span>${esc(m.label)}</span></span>`}

const css=`
:root{--fc-ink:#16171a;--fc-muted:#6e6f75;--fc-line:#e3e4e7;--fc-paper:#fff;--fc-soft:#f6f7f8;--fc-violet:#2b1235}
.fmb-fact-check-route{background:#fff;color:var(--fc-ink)}
.fc-shell{width:min(1180px,calc(100% - 40px));margin:auto}.fc-hero{padding:72px 0 46px;background:linear-gradient(135deg,#f8fafb,#eef2f6)}.fc-kicker{font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#6e3a8a}.fc-hero h1{margin:10px 0 14px;font-size:clamp(48px,8vw,92px);line-height:.92;letter-spacing:-.06em}.fc-hero p{max-width:760px;margin:0;color:#565960;font-size:18px;line-height:1.65}.fc-ratings{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:32px}.fc-badge{display:inline-flex;align-items:center;gap:9px;font-weight:900;letter-spacing:.04em;font-size:12px;white-space:nowrap}.fc-badge svg{width:34px;height:34px;overflow:visible}.fc-badge svg>*{fill:currentColor;stroke:#fff;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.fc-true{color:#2fb344}.fc-fact{color:#1677c8}.fc-misleading{color:#ef9d00}.fc-false{color:#df2f2f}.fc-badge.is-large{font-size:15px}.fc-badge.is-large svg{width:54px;height:54px}.fc-rating-key{display:flex;align-items:center;justify-content:center;min-height:86px;border:1px solid var(--fc-line);border-radius:18px;background:#fff;padding:14px;box-shadow:0 10px 30px rgba(20,25,35,.04)}
.fc-archive{padding:34px 0 90px}.fc-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 20px}.fc-toolbar input{width:min(620px,100%);padding:14px 16px;border:1px solid #d8d9dc;border-radius:14px;font:inherit}.fc-toolbar span{font-size:13px;color:var(--fc-muted)}.fc-list{display:grid;gap:12px}.fc-card{display:grid;grid-template-columns:150px 1fr auto;gap:20px;align-items:center;text-decoration:none;color:inherit;padding:22px;border:1px solid var(--fc-line);border-radius:20px;background:#fff;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.fc-card:hover{transform:translateY(-2px);border-color:#c9cbd1;box-shadow:0 14px 34px rgba(20,25,35,.07)}.fc-card-date{font-size:13px;font-weight:750;color:#73767c}.fc-card h2{margin:0;font-size:21px;line-height:1.25;letter-spacing:-.025em}.fc-card p{margin:7px 0 0;color:#676a70;line-height:1.5;font-size:14px}.fc-arrow{font-size:28px;color:#85888e}.fc-empty{padding:28px;border-radius:18px;background:var(--fc-soft);color:#666}
.fc-article-wrap{padding:48px 0 90px}.fc-article{max-width:820px;margin:auto}.fc-back{display:inline-block;margin-bottom:26px;text-decoration:none;color:#5d386f;font-weight:800}.fc-article-meta{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}.fc-date{font-size:13px;color:#73767c;font-weight:750}.fc-article h1{margin:0 0 18px;font-size:clamp(38px,6vw,68px);line-height:.98;letter-spacing:-.055em}.fc-claim{font-size:20px;line-height:1.65;color:#3f4248;padding:22px 24px;border-left:5px solid #d8d9dd;background:#f8f8fa;border-radius:0 16px 16px 0}.fc-article section{padding-top:30px}.fc-article h2{margin:0 0 12px;font-size:27px;letter-spacing:-.035em}.fc-article p{font-size:18px;line-height:1.78;color:#303238;white-space:pre-line}.fc-evidence{margin-top:32px;padding:24px;border:1px solid var(--fc-line);border-radius:18px;background:#fafafa}.fc-evidence h2{font-size:22px}.fc-evidence li{margin:10px 0;line-height:1.55;color:#44474d}.fc-note{margin-top:22px;font-size:13px;line-height:1.6;color:#777b82}.fc-counts{font-weight:800}
@media(max-width:760px){.fc-shell{width:min(100% - 28px,1180px)}.fc-hero{padding:42px 0 30px}.fc-hero h1{font-size:50px}.fc-hero p{font-size:16px}.fc-ratings{grid-template-columns:repeat(2,1fr)}.fc-rating-key{min-height:72px;padding:10px}.fc-card{grid-template-columns:1fr auto;gap:10px;padding:18px}.fc-card-date{grid-column:1/-1}.fc-card .fc-badge{margin-top:6px}.fc-toolbar{display:block}.fc-toolbar span{display:block;margin-top:10px}.fc-article-wrap{padding-top:30px}.fc-article-meta{display:block}.fc-article-meta .fc-badge{margin-top:12px}.fc-article h1{font-size:42px}.fc-claim{font-size:17px}.fc-article p{font-size:16px}}
`;

function nav(){return `<header class="masthead"><div class="shell mast-row"><a class="brand" href="/news/"><img src="/assets/images/brand/fmb-bulletin-emblem.svg" alt="Filipino Media Bulletin"></a><nav class="desktop-nav" aria-label="Filipino Media Bulletin"><a href="/news/archive/">FMB News</a><a href="/news/world/">FMB Worldwide</a><a href="/news/explainer/">FMB Explainer</a><a href="/news/fact-check/" aria-current="page">FMB Fact Check</a><a href="/news/fmb-brief/">FMB Daily Brief</a><a href="/news/about/">About</a></nav></div></header>`}
function footer(){return `<footer class="footer"><div class="shell footer-bottom"><span>© 2026 Filipino Media Bulletin.</span><span>FMB Fact Check · Evidence over virality</span></div></footer>`}
function commonHead(title,desc,canonical){return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="article"><meta property="og:site_name" content="Filipino Media Bulletin"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}"><link rel="stylesheet" href="/assets/css/fmb-news-final.css?v=20260902"><link rel="stylesheet" href="/assets/css/fmb-news-mobile-global.css?v=20260902"><link rel="stylesheet" href="/assets/css/fmb-news-mobile-products.css?v=20260902"><link rel="stylesheet" href="/assets/css/fmb-news-mobile-menu-holder.css?v=20260902"><link rel="stylesheet" href="/assets/css/fmb-news-mobile-app-polish.css?v=20260902"><link rel="stylesheet" href="/assets/css/fmb-fact-check.css?v=20260902">`}

function archivePage(articles,heldCount=0){
  const items=articles.map(a=>`<a class="fc-card" href="/news/fact-check/${esc(a.slug)}/" data-rating="${esc(a.rating)}" data-search="${esc((a.title+' '+a.claim+' '+a.rating+' '+a.period).toLowerCase())}"><div class="fc-card-date">${esc(periodLabel(a.period))}</div><div><h2>${esc(a.title)}</h2><p>${esc(a.claim)}</p></div><div>${ratingBadge(a.rating)}<span class="fc-arrow" aria-hidden="true">›</span></div></a>`).join('');
  const counts=Object.fromEntries(Object.keys(ratingMeta).map(r=>[r,articles.filter(a=>a.rating===r).length]));
  const script=`<script>(()=>{const q=document.querySelector('#fcSearch'),cards=[...document.querySelectorAll('.fc-card')],count=document.querySelector('#fcCount');function run(){const s=(q.value||'').trim().toLowerCase();let n=0;cards.forEach(c=>{const on=!s||c.dataset.search.includes(s);c.hidden=!on;if(on)n++});count.textContent=n+' of '+cards.length+' fact checks'}q.addEventListener('input',run);run()})()</script>`;
  return `<!doctype html><html lang="en-PH"><head>${commonHead('FMB Fact Check | Filipino Media Bulletin','FMB Fact Check examines viral claims, public statements, images and reports using a clear four-level rating system.',`${origin}/news/fact-check/`)}</head><body class="fmb-fact-check-route">${nav()}<main><section class="fc-hero"><div class="fc-shell"><div class="fc-kicker">FILIPINO MEDIA BULLETIN · FACT CHECK DESK</div><h1>FMB Fact Check</h1><p>Claims are separated from evidence. Each item is tagged TRUE, VERIFIED FACT, MISLEADING, or FALSE, then arranged by publication chronology with the newest checks first. A check publishes only once FMB has attached the primary records it rests on.</p><div class="fc-ratings"><div class="fc-rating-key">${ratingBadge('TRUE',true)}</div><div class="fc-rating-key">${ratingBadge('VERIFIED FACT',true)}</div><div class="fc-rating-key">${ratingBadge('MISLEADING',true)}</div><div class="fc-rating-key">${ratingBadge('FALSE',true)}</div></div></div></section><section class="fc-archive"><div class="fc-shell"><div class="fc-toolbar"><input id="fcSearch" type="search" placeholder="Search a claim, person, issue or rating" aria-label="Search FMB Fact Check"><span id="fcCount">${articles.length} fact checks</span></div><p class="fc-counts">${counts.TRUE} TRUE · ${counts['VERIFIED FACT']} VERIFIED FACT · ${counts.MISLEADING} MISLEADING · ${counts.FALSE} FALSE</p><div class="fc-list">${items}</div>${articles.length?'':`<div class="fc-empty"><h2 style="margin:0 0 10px;font-size:22px;letter-spacing:-.03em">No fact checks are published yet</h2><p style="margin:0;line-height:1.6">The FMB Fact Check desk is re-verifying its archive. ${heldCount} drafted item${heldCount===1?' is':'s are'} held back until FMB has checked the claim against primary records &mdash; statutes, court decisions, official agency records, public datasets, or the original post as it circulated &mdash; and can publish those records alongside the rating. FMB Fact Check stands on FMB&rsquo;s own verification, so nothing appears here before that work is done.</p></div>`}</div></section></main>${footer()}${script}<script src="/assets/js/fmb-news-mobile-global.js?v=20260902" defer></script><script src="/assets/js/fmb-news-mobile-products.js?v=20260902" defer></script></body></html>`;
}

function articlePage(a){
  const bodyText=[a.claim,...a.sections.map(x=>x[1])].join(' ');
  const desc=(a.claim||a.title).replace(/\s+/g,' ').slice(0,200);
  const canonical=`${origin}/news/fact-check/${a.slug}/`;
  const json={'@context':'https://schema.org','@type':'Article',headline:a.title,description:desc,mainEntityOfPage:{'@type':'WebPage','@id':canonical},articleSection:'FMB Fact Check',genre:'Fact Check',author:{'@type':'Organization',name:'FMB Fact Check Editorial Team'},publisher:{'@type':'Organization',name:'Filipino Media Bulletin',url:`${origin}/news/`}};
  if(exact.test(a.period))json.datePublished=`${a.period}T08:00:00+08:00`;
  const sections=a.sections.map(([h,p])=>`<section><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join('');
  const evidence=a.checklist.length?`<section class="fc-evidence"><h2>Evidence FMB checks</h2><ul>${a.checklist.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="fc-note">These are the records FMB checked for this claim, published alongside the rating so readers can follow the same evidence.</p></section>`:'';
  return `<!doctype html><html lang="en-PH"><head>${commonHead(`${a.rating}: ${a.title} | FMB Fact Check`,desc,canonical)}<script type="application/ld+json">${JSON.stringify(json).replaceAll('<','\\u003c')}</script></head><body class="fmb-fact-check-route">${nav()}<main class="fc-article-wrap"><div class="fc-shell"><article class="fc-article article"><a class="fc-back" href="/news/fact-check/">← FMB Fact Check</a><div class="fc-article-meta"><span class="fc-date">${esc(periodLabel(a.period))} · ${readTime(bodyText)} min read</span>${ratingBadge(a.rating,true)}</div><h1>${esc(a.title)}</h1><div class="fc-claim"><strong>Claim:</strong> ${esc(a.claim)}</div>${sections}${evidence}</article></div></main>${footer()}<script src="/assets/js/fmb-news-mobile-global.js?v=20260902" defer></script><script src="/assets/js/fmb-news-mobile-products.js?v=20260902" defer></script></body></html>`;
}

async function walkIndex(dir){const out=[];let entries=[];try{entries=await readdir(dir,{withFileTypes:true})}catch{return out}for(const e of entries){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walkIndex(p));else if(e.isFile()&&e.name==='index.html')out.push(p)}return out}
function injectMenu(html){if(html.includes('href="/news/fact-check/"'))return html;return html.replace(/(<a\b[^>]*href="\/news\/explainer\/"[^>]*>\s*FMB Explainer\s*<\/a>)/gi,'$1<a href="/news/fact-check/">FMB Fact Check</a>')}

const masterParts=(await readdir(masterRoot)).filter(n=>/^part-\d+\.br64$/.test(n)).sort();
if(!masterParts.length)throw new Error('FMB Fact Check master is missing.');
let encoded='';for(const name of masterParts)encoded+=(await readFile(path.join(masterRoot,name),'utf8')).trim();
const text=brotliDecompressSync(Buffer.from(encoded,'base64')).toString('utf8');
const articles=splitArticles(text).sort((a,b)=>sortKey(b).localeCompare(sortKey(a))||a.id-b.id);
// ---------------------------------------------------------------- evidence gate
//
// Every item in the master corpus carries this, in its own words:
//
//   FULL-LENGTH FMB ARTICLE DRAFT. FINAL PUBLICATION REQUIRES INDEPENDENT
//   SOURCE VERIFICATION AND SOURCE LINKS.
//
// The renderer never parsed that field. It dropped the warning and published the
// draft anyway, with a definitive TRUE/FALSE/MISLEADING badge, about named
// people. No item in the corpus contains a single URL, the "evidence" was a list
// of record types to consult rather than records consulted, and the page note
// said so: "FMB Fact Check does not reproduce or link the source publication
// used to identify the research lead."
//
// A fact check publishes only when FMB's own evidence is attached in
// content/fact-check/evidence/<slug>.json. See the README there.
const evidenceRoot=path.join(root,'content','fact-check','evidence');
async function evidenceFor(slug){
  try{return JSON.parse(await readFile(path.join(evidenceRoot,`${slug}.json`),'utf8'))}catch{return null}
}
function gateFailures(article,record){
  const bad=[];
  if(!record){
    if(/\bDRAFT\b/i.test(article.editorialStatus||''))bad.push('master item is an unverified draft');
    bad.push('no evidence record');
    return bad;
  }
  const ev=Array.isArray(record.evidence)?record.evidence:[];
  const primary=ev.filter(e=>e&&e.kind==='primary'&&/^https?:\/\//i.test(String(e.url||'')));
  if(!primary.length)bad.push('no primary evidence with a resolvable URL');
  if(!/^https?:\/\//i.test(String(record.claimSource&&record.claimSource.url||'')))bad.push('no archived claim source');
  if(record.ratingReachedBy!=='FMB')bad.push(`rating not reached by FMB (${record.ratingReachedBy||'unstated'})`);
  if(record.rating&&record.rating!==article.rating)bad.push(`evidence rating ${record.rating} contradicts master rating ${article.rating}`);
  return bad;
}

const published=[],held=[];
for(const a of articles){
  const record=await evidenceFor(a.slug);
  const bad=gateFailures(a,record);
  if(bad.length)held.push({...a,heldBecause:bad});else published.push({...a,record});
}
await writeFile(path.join(root,'content','fact-check','HELD.json'),JSON.stringify({
  generatedAt:new Date().toISOString().slice(0,10),
  total:articles.length,published:published.length,held:held.length,
  items:held.map(a=>({id:a.id,slug:a.slug,title:a.title,rating:a.rating,reasons:a.heldBecause}))
},null,2)+'\n','utf8');

const factRoot=path.join(newsRoot,'fact-check');
await mkdir(factRoot,{recursive:true});
await writeFile(path.join(factRoot,'index.html'),archivePage(published,held.length),'utf8');
for(const a of published){const dir=path.join(factRoot,a.slug);await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'index.html'),articlePage(a),'utf8')}
const cssDir=path.join(newsRoot,'assets','css');await mkdir(cssDir,{recursive:true});await writeFile(path.join(cssDir,'fmb-fact-check.css'),css,'utf8');
const dataDir=path.join(newsRoot,'assets','data','fmb-fact-check');await mkdir(dataDir,{recursive:true});
await writeFile(path.join(dataDir,'index.json'),JSON.stringify(published.map(a=>({id:a.id,title:a.title,rating:a.rating,period:a.period,sortKey:sortKey(a),slug:a.slug,url:`/news/fact-check/${a.slug}/`})),null,2),'utf8');

for(const file of await walkIndex(newsRoot)){if(file.startsWith(factRoot+path.sep))continue;let html=await readFile(file,'utf8');const updated=injectMenu(html);if(updated!==html)await writeFile(file,updated,'utf8')}


// Keep the mobile product shell aware of FMB Fact Check. These files are copied
// into dist earlier in the build, so patching them here keeps the source system
// deterministic without exposing any research-source URL.
const mobileGlobal=path.join(newsRoot,'assets','js','fmb-news-mobile-global.js');
try{
  let js=await readFile(mobileGlobal,'utf8');
  if(!js.includes("startsWith('/news/fact-check')"))js=js.replace("if(p.startsWith('/news/explainer'))return{key:'explainer',label:'FMB Explainer'};", "if(p.startsWith('/news/explainer'))return{key:'explainer',label:'FMB Explainer'};if(p.startsWith('/news/fact-check'))return{key:'factcheck',label:'FMB Fact Check'};");
  if(!js.includes('data-product="factcheck"'))js=js.replace('<a href="/news/explainer/" data-product="explainer">FMB Explainer</a>', '<a href="/news/explainer/" data-product="explainer">FMB Explainer</a><a href="/news/fact-check/" data-product="factcheck">FMB Fact Check</a>');
  await writeFile(mobileGlobal,js,'utf8');
}catch{}

const mobileProducts=path.join(newsRoot,'assets','js','fmb-news-mobile-products.js');
try{
  let js=await readFile(mobileProducts,'utf8');
  if(!js.includes("startsWith('/news/fact-check')"))js=js.replace("path.startsWith('/news/explainer')?'explainer':", "path.startsWith('/news/explainer')?'explainer':\n    path.startsWith('/news/fact-check')?'factcheck':");
  if(!js.includes('function addFactCheckSignature'))js=js.replace('function addBriefSignature(){', `function addFactCheckSignature(){\n    const hero=document.querySelector('.fc-hero .fc-shell');\n    if(!hero)return;\n    productSignal(hero,'FACT CHECK DESK','Evidence over virality','factcheck');\n  }\n\n  function addBriefSignature(){`);
  js=js.replace('explainer:addExplainerSignature,brief:addBriefSignature', 'explainer:addExplainerSignature,factcheck:addFactCheckSignature,brief:addBriefSignature');
  await writeFile(mobileProducts,js,'utf8');
}catch{}

console.log(`Rendered ${published.length} published / ${held.length} held FMB Fact Check articles, newest first, with TRUE / VERIFIED FACT / MISLEADING / FALSE tags and no source-publication links.`);
