import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contentRoot=path.join(root,'content','explained','articles');
const newsRoot=path.join(root,'dist','news');
const fallback='/assets/images/news/fmb-news-editorial-fallback.svg';
const origin='https://www.francinemariebautista.com';
const esc=(s='')=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const fmtDate=iso=>new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'long',day:'numeric',year:'numeric'}).format(new Date(iso));
const readTime=s=>Math.max(1,Math.ceil((s.sections||[]).flatMap(x=>x.paragraphs||[]).join(' ').split(/\s+/).filter(Boolean).length/220));
const absolute=u=>/^https?:\/\//i.test(String(u||''))?String(u):`${origin}${String(u||'').startsWith('/')?'':'/'}${u||''}`;
async function walk(d){const out=[];let entries=[];try{entries=await readdir(d,{withFileTypes:true})}catch{return out}for(const e of entries){const p=path.join(d,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile()&&e.name.endsWith('.json'))out.push(p)}return out}
async function load(){const out=[];for(const f of await walk(contentRoot)){try{const s=JSON.parse(await readFile(f,'utf8'));if(s.status==='published'&&s.slug&&s.headline)out.push(s)}catch{}}return out}
function page(s){
  const image=s.image?.url||fallback;
  const canonical=`${origin}/news/explainer/${s.slug}/`;
  const title=s.seoTitle||`${s.headline} | FMB Explained`;
  const description=s.seoDescription||s.deck||'';
  const imageUrl=absolute(image);
  const sections=(s.sections||[]).map(sec=>`<section><h2>${esc(sec.heading)}</h2>${(sec.paragraphs||[]).map(p=>`<p>${esc(p)}</p>`).join('')}</section>`).join('');
  const sources=(s.sources||[]).map(src=>`<li><a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(src.publisher||'Source')}</strong>: ${esc(src.title||src.url)}</a></li>`).join('');
  const jsonLd=JSON.stringify({
    '@context':'https://schema.org',
    '@type':'NewsArticle',
    headline:s.headline,
    description,
    datePublished:s.publishedAt||s.archiveDate,
    dateModified:s.updatedAt||s.publishedAt||s.archiveDate,
    mainEntityOfPage:{'@type':'WebPage','@id':canonical},
    image:[imageUrl],
    articleSection:s.category||'FMB Explained',
    genre:'Analysis',
    author:{'@type':'Organization',name:s.author||'FMB Explained Editorial Team'},
    publisher:{'@type':'Organization',name:'Filipino Media Bulletin',url:`${origin}/news/`}
  }).replaceAll('<','\\u003c');
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="article"><meta property="og:site_name" content="Filipino Media Bulletin"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(imageUrl)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(imageUrl)}"><script type="application/ld+json">${jsonLd}</script><link rel="stylesheet" href="/assets/css/fmb-news-reference.css"><link rel="stylesheet" href="/assets/css/fmb-news-reference-final.css"></head><body class="fmb-ref fmb-explainer-route"><header class="masthead"><div class="shell"><a href="/news/explainer/" aria-label="FMB Explained">FMB Explained</a></div></header><main class="shell article-shell" data-fmb-explained-article><a class="back" href="/news/explainer/">← Back to FMB Explained</a><div class="article-grid"><article class="article"><div class="article-date">FMB Explained Archive · ${fmtDate(s.archiveDate||s.publishedAt)} · ${readTime(s)} min read</div><div class="article-kicker">${esc(s.kicker||s.category||'FMB Explained')}</div><h1>${esc(s.headline)}</h1><p class="article-deck">${esc(s.deck||'')}</p><div class="byline"><div class="byline-badge">FMB<br>Explained</div><div><strong>By ${esc(s.author||'FMB Explained Editorial Team')}</strong><br><small>Filipino Media Bulletin</small></div></div><figure class="article-figure"><img src="${esc(image)}" alt="${esc(s.image?.alt||s.headline)}" fetchpriority="high"><figcaption>${esc(s.image?.caption||'FMB Explained editorial image.')}<br><small>${esc(s.image?.credit||'')}</small></figcaption></figure>${sections}<section class="sources"><h2>Sources</h2><ul>${sources}</ul></section></article></div></main><footer class="footer"><div class="shell footer-bottom">© 2026 Filipino Media Bulletin.</div></footer></body></html>`;
}
for(const s of await load()){const dir=path.join(newsRoot,'explainer',s.slug);await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'index.html'),page(s),'utf8')}
console.log('Rendered FMB Explained long-form article routes with social metadata and NewsArticle structured data.');
