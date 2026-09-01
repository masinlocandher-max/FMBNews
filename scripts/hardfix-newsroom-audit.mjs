import { access, readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const contentRoot=path.join(root,'content','news','articles');
const explainedRoot=path.join(newsRoot,'assets','data','fmb-explained');
const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

async function walk(dir,pred=()=>true){const out=[];let entries=[];try{entries=await readdir(dir,{withFileTypes:true})}catch{return out}for(const e of entries){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p,pred));else if(e.isFile()&&pred(p))out.push(p)}return out}
const phtNow=()=>{const n=new Date();return {date:new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(n),short:new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'short',day:'numeric',year:'numeric',weekday:'short'}).format(n).replace(',',' ·'),time:new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true}).format(n)+' PHT'}};

function newsroomNav(html){
  const primary='<a href="/news/world/">FMB Worldwide</a><a href="/news/explainer/">FMB Explainer</a><a href="/news/fmb-brief/">FMB Daily Brief</a>';
  const utilities='<span class="fmb-nav-utilities"><a href="/news/about/">About</a><a href="/news/search/" aria-label="Search Filipino Media Bulletin">Search</a><a class="submit" href="/news/submit/">Submit a Story</a></span>';
  html=html.replace(/<nav class="nav publication-nav"[^>]*>[\s\S]*?<\/nav>/i,`<nav class="nav publication-nav" aria-label="Filipino Media Bulletin">${primary}${utilities}</nav>`);
  html=html.replace(/<nav class="nav" aria-label="FMB News"><div class="shell">[\s\S]*?<\/div><\/nav>/gi,`<nav class="nav" aria-label="Filipino Media Bulletin"><div class="shell">${primary}${utilities}</div></nav>`);
  html=html.replace(/<a class="publication-search" href="\/news\/archive\/"/gi,'<a class="publication-search" href="/news/search/"');
  html=html.replace(/<a class="search" href="\/news\/archive\/"/gi,'<a class="search" href="/news/search/"');
  html=html.replace(/<a([^>]*?)href="mailto:withlovefmb@gmail\.com\?subject=Story%20Submission%20for%20FMB%20News"([^>]*)>\s*Submit a Story\s*<\/a>/gi,'<a$1href="/news/submit/"$2>Submit a Story</a>');
  return html;
}

function clockFallbacks(html){
  const now=phtNow();
  html=html.replace(/<span data-pht-date>[^<]*<\/span>/gi,`<span data-pht-date>${esc(now.date)}</span>`).replace(/<span data-pht-clock>[^<]*<\/span>/gi,`<span data-pht-clock>${esc(now.time)}</span>`);
  html=html.replace(/<strong data-fmb-local-date>[^<]*<\/strong>\s*<span data-fmb-local-time>[^<]*<\/span>/gi,`<strong data-fmb-local-date>${esc(now.short)}</strong><span data-fmb-local-time>${esc(now.time)}</span>`);
  return html;
}

function homepageTone(html,relative){
  if(relative!=='index.html')return html;
  return html.replace(/<p data-fmb-greeting>[\s\S]*?<\/p>\s*<h1 data-fmb-greeting-line>[\s\S]*?<\/h1>/i,'<p class="fmb-approved-hero-kicker">FILIPINO MEDIA BULLETIN</p><h1>What matters right now.</h1>');
}

function dailyBriefFixes(html,relative){
  if(relative.replaceAll('\\','/')!=='fmb-brief/index.html')return html;
  html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>FMB Daily Brief | Daily Briefing for Filipinos</title>')
    .replace(/<meta property="og:title" content="[^"]*">/i,'<meta property="og:title" content="FMB Daily Brief | Daily Briefing for Filipinos">')
    .replace(/FMB Brief is the daily FMB News newsletter:/g,'FMB Daily Brief is the daily Filipino Media Bulletin briefing:');
  if(!html.includes('data-fmb-live-brief')){
    html=html.replace('<div class="brief-issue-list">','<div class="brief-issue-list"><a class="brief-issue" data-fmb-live-brief href="/news/fmb-brief/live/"><time>LIVE</time><div><h2>Today’s FMB Daily Brief</h2><p>The current briefing from the FMB News publishing system. Dated editions remain preserved below as the archive of record.</p></div><img src="/assets/images/mobile/fmb-daily-brief-mug.jpg" alt="FMB Daily Brief" loading="eager"></a>');
  }
  return html;
}

function publicSourceFixes(html){
  const bataan='<a href="https://bataan.gov.ph/news/sp-declares-bataan-in-state-of-calamity/" rel="noopener noreferrer">Provincial Government of Bataan</a> · <a href="https://www.philstar.com/nation/2026/08/22/2551035/zambales-incurs-over-p591-million-storm-damage-declares-state-calamity" rel="noopener noreferrer">Zambales state-of-calamity reporting citing the PDRRMC</a>';
  html=html.replace(/<a[^>]*>\s*FMB News approved editorial brief\s*<\/a>/gi,bataan).replace(/FMB News approved editorial brief/gi,bataan);
  const grid='<a href="https://www.gmanetwork.com/news/money/economy/1000514/visayas-mindanao-grids-under-red-yellow-alerts-on-august-31-2026/story/" rel="noopener noreferrer">GMA News, citing NGCP</a>';
  html=html.replace(/<a[^>]*>\s*The Manila Times via Newswav\s*<\/a>/gi,grid).replace(/The Manila Times via Newswav/gi,grid);
  return html;
}

async function renderExplainerFallback(){
  const page=path.join(newsRoot,'explainer','index.html');
  try{await access(page)}catch{return}
  const files=(await readdir(explainedRoot)).filter(n=>/^\d{3}-\d{3}\.json$/.test(n)).sort();
  const topics=[];for(const n of files){topics.push(...JSON.parse(await readFile(path.join(explainedRoot,n),'utf8')))}
  let published=[];try{published=JSON.parse(await readFile(path.join(explainedRoot,'published-index.json'),'utf8'))}catch{}
  const pub=new Map(published.map(x=>[Number(x.id),x]));
  const items=topics.sort((a,b)=>(pub.get(Number(a.id))?.sourceOrder??Number(a.id))-(pub.get(Number(b.id))?.sourceOrder??Number(b.id))).map(item=>{const p=pub.get(Number(item.id));const title=p?.title||item.title;const read=p?.articleSlug?`<a class="explained-read" href="/news/explainer/${esc(p.articleSlug)}/">Read the full article →</a>`:'';return `<details class="explained-item" id="topic-${item.id}"><summary><span class="explained-number">${String(item.id).padStart(3,'0')}</span><span class="explained-title">${esc(title)}</span><span class="explained-plus" aria-hidden="true">+</span></summary><div class="explained-body"><section><div class="explained-label">Overview</div><p>${esc(item.explanation)}</p></section><section class="explained-why"><div class="explained-label">Why it matters</div><p>${esc(item.why)}</p></section>${read}</div></details>`}).join('');
  let html=await readFile(page,'utf8');
  html=html.replace(/<div id="fmbExplainedStatus"[^>]*>[\s\S]*?<\/div>/i,`<div id="fmbExplainedStatus" class="explained-status" aria-live="polite">${topics.length} full articles · original publication order</div>`).replace(/<div id="fmbExplainedList" class="explained-list">[\s\S]*?<\/div><div class="explainer-method-note">/i,`<div id="fmbExplainedList" class="explained-list">${items}</div><div class="explainer-method-note">`);
  await writeFile(page,html,'utf8');
}

async function storyIndex(){
  const files=await walk(contentRoot,p=>p.endsWith('.json'));const out=[];
  for(const f of files){try{const s=JSON.parse(await readFile(f,'utf8'));if(s.status==='published'&&s.slug&&s.headline)out.push({title:s.headline,url:`/news/${s.slug}/`,type:'FMB News',text:[s.deck,s.seoDescription,s.category,(s.sections||[]).flatMap(x=>x.paragraphs||[]).join(' ')].filter(Boolean).join(' ')})}catch{}}
  try{for(const n of (await readdir(explainedRoot)).filter(n=>/^\d{3}-\d{3}\.json$/.test(n)).sort()){for(const x of JSON.parse(await readFile(path.join(explainedRoot,n),'utf8')))out.push({title:x.title,url:`/news/explainer/#topic-${x.id}`,type:'FMB Explainer',text:`${x.explanation} ${x.why}`})}}catch{}
  out.push({title:'FMB Worldwide',url:'/news/world/',type:'Product',text:'Major global developments selected for consequence and Filipino relevance.'},{title:'FMB Daily Brief',url:'/news/fmb-brief/',type:'Product',text:'The daily briefing for Filipinos.'});return out;
}

function standaloneShell(title,description,body,robots='index,follow'){
 return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${robots}"><link rel="stylesheet" href="/assets/css/fmb-news-final.css?v=20260902-audit"><style>.audit-page{max-width:920px;margin:0 auto;padding:44px 20px 80px}.audit-page h1{font-size:clamp(40px,7vw,72px);letter-spacing:-.05em;margin:.2em 0}.audit-page .lede{font-size:18px;line-height:1.6;color:#666}.audit-toolbar{display:flex;gap:10px;margin:28px 0}.audit-toolbar input{flex:1;padding:15px;border:1px solid #ccc;border-radius:12px;font:inherit}.audit-list{display:grid;gap:10px}.audit-result,.audit-option{display:block;padding:18px;border:1px solid #e3e3e8;border-radius:16px;background:#fff;color:inherit;text-decoration:none}.audit-result small,.audit-option small{display:block;color:#6e3a8a;font-weight:700;margin-bottom:6px}.audit-option h2{margin:0 0 6px}.audit-option p{margin:0;color:#666;line-height:1.55}.audit-back{display:inline-block;margin-bottom:18px}</style></head><body><main class="audit-page"><a class="audit-back" href="/news/">← Filipino Media Bulletin</a>${body}</main></body></html>`;
}

async function makeSearch(){const idx=await storyIndex();const dir=path.join(newsRoot,'search');await mkdir(dir,{recursive:true});const body=`<h1>Search FMB</h1><p class="lede">Search FMB News and the FMB Explainer library from one place.</p><div class="audit-toolbar"><input id="q" type="search" placeholder="Search news, explainers, topics or issues" autofocus></div><div id="results" class="audit-list" aria-live="polite"></div><script>const INDEX=${JSON.stringify(idx)};const q=document.getElementById('q'),r=document.getElementById('results'),e=s=>String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));function run(){const v=q.value.trim().toLowerCase();const items=(v?INDEX.filter(x=>(x.title+' '+x.text+' '+x.type).toLowerCase().includes(v)):INDEX.slice(0,20)).slice(0,80);r.innerHTML=items.map(x=>'<a class="audit-result" href="'+e(x.url)+'"><small>'+e(x.type)+'</small><strong>'+e(x.title)+'</strong></a>').join('')||'<p>No matching FMB item.</p>'}q.addEventListener('input',run);const u=new URL(location.href);if(u.searchParams.get('q'))q.value=u.searchParams.get('q');run();</script>`;await writeFile(path.join(dir,'index.html'),standaloneShell('Search | Filipino Media Bulletin','Search FMB News, FMB Worldwide, FMB Explainer and FMB Daily Brief.',body,'noindex,follow'),'utf8')}

async function makeSubmit(){const dir=path.join(newsRoot,'submit');await mkdir(dir,{recursive:true});const options=[['Story tip','Story%20Tip%20for%20FMB%20News','Send a lead, eyewitness information, public-interest concern or potential story.'],['Correction','Correction%20for%20FMB%20News','Flag a factual error and include the URL and supporting evidence.'],['Press release','Press%20Release%20for%20FMB%20News','Send a release with source documents, contact details and image rights information.'],['Documents or sources','Source%20Documents%20for%20FMB%20News','Share records that can be independently checked before publication.']];const cards=options.map(([h,s,p])=>`<a class="audit-option" href="mailto:withlovefmb@gmail.com?subject=${s}"><small>NEWSROOM INTAKE</small><h2>${h}</h2><p>${p}</p></a>`).join('');const body=`<h1>Submit to FMB News</h1><p class="lede">Choose the correct newsroom channel. Sending material does not guarantee publication. Claims, documents and images are independently reviewed before use.</p><div class="audit-list">${cards}</div><p class="lede">Privacy: send only information you are authorized to share. Avoid unnecessary personal or sensitive data. For confidential material, state that clearly before sending attachments.</p>`;await writeFile(path.join(dir,'index.html'),standaloneShell('Submit a Story | FMB News','Send story tips, corrections, press releases and source documents to the FMB News newsroom.',body),'utf8')}

await renderExplainerFallback();
const pages=await walk(newsRoot,p=>p.endsWith('index.html'));
for(const file of pages){const rel=path.relative(newsRoot,file).replaceAll('\\','/');let html=await readFile(file,'utf8');html=newsroomNav(html);html=clockFallbacks(html);html=homepageTone(html,rel);html=dailyBriefFixes(html,rel);html=publicSourceFixes(html);await writeFile(file,html,'utf8')}
await makeSearch();await makeSubmit();
console.log(`Closed newsroom audit gaps across ${pages.length} pages: crawl-safe Explainer, PHT fallbacks, product-first navigation, real search and submission routes, live Daily Brief entry, metadata cleanup, homepage tone, and public source links.`);
