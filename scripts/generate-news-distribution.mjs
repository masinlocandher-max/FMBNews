import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const contentRoot=path.join(root,'content','news','articles');
const SITE='https://www.francinemariebautista.com';
const NEWS=`${SITE}/news/`;
const FEED=`${SITE}/news/feed.xml`;
const TWO_DAYS=48*60*60*1000;

const xml=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');

async function walk(dir,predicate=()=>true){
  const out=[];let entries=[];
  try{entries=await readdir(dir,{withFileTypes:true})}catch{return out}
  for(const entry of entries){
    const target=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(target,predicate));
    else if(entry.isFile()&&predicate(target))out.push(target);
  }
  return out;
}

function extractCanonical(html){
  return html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i)?.[1]
    ||html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["'][^>]*>/i)?.[1]
    ||null;
}
function extractLastmod(html){
  const meta=html.match(/<meta\s+property=["']article:modified_time["']\s+content=["']([^"']+)["'][^>]*>/i)?.[1];
  if(meta&&Number.isFinite(Date.parse(meta)))return new Date(meta).toISOString();
  for(const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{
      const data=JSON.parse(match[1]);
      const candidates=Array.isArray(data?.['@graph'])?data['@graph']:[data];
      for(const item of candidates){if(item?.dateModified&&Number.isFinite(Date.parse(item.dateModified)))return new Date(item.dateModified).toISOString()}
    }catch{}
  }
  return null;
}
function addFeedDiscovery(html){
  if(/<link\s+[^>]*type=["']application\/rss\+xml["'][^>]*>/i.test(html))return html;
  const tag='<link rel="alternate" type="application/rss+xml" title="FMB News" href="/news/feed.xml">';
  return html.replace('</head>',`${tag}</head>`);
}
function normalizeUtilityIndexing(html,relative){
  if(!/^(search|submit|offline|read)\/index\.html$/i.test(relative))return html;
  const robots='<meta name="robots" content="noindex,follow,max-image-preview:large">';
  if(/<meta\s+name=["']robots["'][^>]*>/i.test(html))return html.replace(/<meta\s+name=["']robots["'][^>]*>/i,robots);
  return html.replace('</head>',`${robots}</head>`);
}

const pages=[];
for(const file of await walk(newsRoot,f=>path.basename(f)==='index.html')){
  const relative=path.relative(newsRoot,file).replaceAll('\\','/');
  let html=await readFile(file,'utf8');
  html=normalizeUtilityIndexing(html,relative);
  html=addFeedDiscovery(html);
  await writeFile(file,html,'utf8');
  if(/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))continue;
  const canonical=extractCanonical(html);
  if(!canonical||!canonical.startsWith(NEWS))continue;
  pages.push({loc:canonical,lastmod:extractLastmod(html)});
}
const deduped=[...new Map(pages.map(p=>[p.loc,p])).values()].sort((a,b)=>a.loc.localeCompare(b.loc));
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/sitemap/0.9">\n${deduped.map(p=>`  <url>\n    <loc>${xml(p.loc)}</loc>${p.lastmod?`\n    <lastmod>${xml(p.lastmod)}</lastmod>`:''}\n  </url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(newsRoot,'sitemap.xml'),sitemap,'utf8');

const stories=[];
for(const file of await walk(contentRoot,f=>f.endsWith('.json'))){
  try{
    const story=JSON.parse(await readFile(file,'utf8'));
    if(story.status!=='published'||!story.slug||!story.headline||!Number.isFinite(Date.parse(story.publishedAt)))continue;
    stories.push(story);
  }catch{}
}
stories.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));

const now=Date.now();
const fresh=stories.filter(s=>{const age=now-Date.parse(s.publishedAt);return age>=-5*60*1000&&age<=TWO_DAYS});
const newsSitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${fresh.map(s=>`  <url>\n    <loc>${xml(`${NEWS}${s.slug}/`)}</loc>\n    <news:news>\n      <news:publication>\n        <news:name>FMB News</news:name>\n        <news:language>en</news:language>\n      </news:publication>\n      <news:publication_date>${xml(new Date(s.publishedAt).toISOString())}</news:publication_date>\n      <news:title>${xml(s.headline)}</news:title>\n    </news:news>\n  </url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(newsRoot,'news-sitemap.xml'),newsSitemap,'utf8');

const latest=stories.slice(0,50);
const buildDate=latest[0]?.updatedAt||latest[0]?.publishedAt||new Date().toISOString();
const rss=`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>FMB News</title>\n    <link>${NEWS}</link>\n    <description>Filipino Media Bulletin. Verified facts, visible sources, meaningful context, clear explanations.</description>\n    <language>en-PH</language>\n    <lastBuildDate>${xml(new Date(buildDate).toUTCString())}</lastBuildDate>\n    <atom:link href="${FEED}" rel="self" type="application/rss+xml"/>\n${latest.map(s=>`    <item>\n      <title>${xml(s.headline)}</title>\n      <link>${xml(`${NEWS}${s.slug}/`)}</link>\n      <guid isPermaLink="true">${xml(`${NEWS}${s.slug}/`)}</guid>\n      <pubDate>${xml(new Date(s.publishedAt).toUTCString())}</pubDate>\n      <description>${xml(s.seoDescription||s.deck||'')}</description>${s.category?`\n      <category>${xml(s.category)}</category>`:''}\n    </item>`).join('\n')}\n  </channel>\n</rss>\n`;
await writeFile(path.join(newsRoot,'feed.xml'),rss,'utf8');

console.log(`News distribution generated: ${deduped.length} canonical URLs in /news/sitemap.xml, ${fresh.length} stories from the last 48 hours in /news/news-sitemap.xml, and ${latest.length} latest FMB News reports in /news/feed.xml.`);
