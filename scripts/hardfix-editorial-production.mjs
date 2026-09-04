import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contentRoot=path.join(root,'content','news','articles');
const newsRoot=path.join(root,'dist','news');
const SITE='https://www.francinemariebautista.com';

async function walk(dir){
  const out=[];let entries=[];
  try{entries=await readdir(dir,{withFileTypes:true})}catch{return out}
  for(const entry of entries){
    const target=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(target));
    else if(entry.isFile()&&entry.name.endsWith('.json'))out.push(target);
  }
  return out;
}

const escAttr=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const absolute=u=>/^https?:\/\//i.test(String(u||''))?String(u):`${SITE}${String(u||'').startsWith('/news/')?'': '/news'}${String(u||'').startsWith('/')?String(u):`/${String(u||'')}`}`;
const formatUpdated=iso=>{
  const d=new Date(iso);
  const date=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'short',day:'numeric',year:'numeric'}).format(d);
  const time=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true}).format(d);
  return `Updated ${date} · ${time} PHT`;
};

function upsertMeta(html,kind,key,value){
  const attr=kind==='property'?'property':'name';
  const re=new RegExp(`<meta\\s+${attr}=["']${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'][^>]*>`,`i`);
  const tag=`<meta ${attr}="${escAttr(key)}" content="${escAttr(value)}">`;
  return re.test(html)?html.replace(re,tag):html.replace('</head>',`${tag}</head>`);
}

function normalizeLd(html,story){
  const canonical=`${SITE}/news/${story.slug}/`;
  const image=story.image?.url?absolute(story.image.url):`${SITE}/news/assets/images/news/fmb-news-editorial-fallback.svg`;
  const schema={
    '@context':'https://schema.org',
    '@type':story.articleType||'NewsArticle',
    headline:story.headline,
    description:story.seoDescription||story.deck||'',
    mainEntityOfPage:{'@type':'WebPage','@id':canonical},
    datePublished:story.publishedAt,
    dateModified:story.updatedAt||story.publishedAt,
    author:{'@type':'Organization',name:story.author||'FMB News Desk'},
    publisher:{'@type':'Organization',name:'FMB News',url:`${SITE}/news/`,logo:{'@type':'ImageObject',url:`${SITE}/news/assets/images/icon-transparent.png`}},
    image:[image],
    articleSection:story.category||'News',
    keywords:Array.isArray(story.keywords)?story.keywords.join(', '):String(story.keywords||'')
  };
  const script=`<script type="application/ld+json" data-fmb-editorial-schema>${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;
  const blocks=[...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi)];
  for(const match of blocks){
    try{
      const raw=match[0].replace(/^<script[^>]*>/i,'').replace(/<\/script>$/i,'');
      const parsed=JSON.parse(raw);
      const type=Array.isArray(parsed?.['@type'])?parsed['@type'].join(' '):String(parsed?.['@type']||'');
      if(/NewsArticle|Article/i.test(type))return html.replace(match[0],script);
    }catch{}
  }
  return html.replace('</head>',`${script}</head>`);
}

function visibleUpdate(html,story){
  const published=Date.parse(story.publishedAt||'');
  const modified=Date.parse(story.updatedAt||story.publishedAt||'');
  if(!Number.isFinite(published)||!Number.isFinite(modified)||modified-published<5*60*1000)return html;
  if(html.includes('data-fmb-article-updated'))return html;
  const text=escAttr(formatUpdated(story.updatedAt));
  return html.replace(/(<div\s+class=["']article-date["'][^>]*>)([\s\S]*?)(<\/div>)/i,`$1$2 <span data-fmb-article-updated> · ${text}</span>$3`);
}

let processed=0,updatedLabels=0;
for(const file of await walk(contentRoot)){
  let story;
  try{story=JSON.parse(await readFile(file,'utf8'))}catch{continue}
  if(story.status!=='published'||!story.slug||!story.headline||!story.publishedAt)continue;
  const built=path.join(newsRoot,story.slug,'index.html');
  try{await access(built)}catch{continue}
  let html=await readFile(built,'utf8');
  const canonical=`${SITE}/news/${story.slug}/`;
  html=upsertMeta(html,'property','og:type','article');
  html=upsertMeta(html,'property','og:url',canonical);
  html=upsertMeta(html,'property','article:published_time',story.publishedAt);
  html=upsertMeta(html,'property','article:modified_time',story.updatedAt||story.publishedAt);
  html=upsertMeta(html,'property','article:section',story.category||'News');
  html=upsertMeta(html,'name','author',story.author||'FMB News Desk');
  html=upsertMeta(html,'name','twitter:title',story.seoTitle||story.headline);
  html=upsertMeta(html,'name','twitter:description',story.seoDescription||story.deck||'');
  html=normalizeLd(html,story);
  const before=html;
  html=visibleUpdate(html,story);
  if(html!==before)updatedLabels++;
  await writeFile(built,html,'utf8');
  processed++;
}

console.log(`Editorial production hardening applied to ${processed} published FMB News articles; ${updatedLabels} materially updated stories now expose an explicit Updated timestamp.`);
