import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const contentRoot=path.join(root,'content','news','articles');
const NEWS='https://www.francinemariebautista.com/news/';
const must=(v,m)=>{if(!v)throw new Error(m)};

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
const unescapeXml=s=>String(s).replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&apos;',"'");

const sitemap=await readFile(path.join(newsRoot,'sitemap.xml'),'utf8');
must(sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'),'General sitemap namespace missing');
const sitemapUrls=[...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map(m=>unescapeXml(m[1]));
must(sitemapUrls.length>=500,`General sitemap unexpectedly small: ${sitemapUrls.length} URLs`);
must(new Set(sitemapUrls).size===sitemapUrls.length,'General sitemap contains duplicate canonical URLs');
for(const url of sitemapUrls){
  must(url.startsWith(NEWS),`General sitemap contains an off-network URL: ${url}`);
  must(!/\/news\/(search|submit|offline)\/?$/i.test(url),`Utility route leaked into sitemap: ${url}`);
}
for(const match of sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)){
  const t=Date.parse(match[1]);
  must(Number.isFinite(t),`Invalid sitemap lastmod: ${match[1]}`);
  must(t<=Date.now()+5*60*1000,`Future sitemap lastmod: ${match[1]}`);
}

const newsSitemap=await readFile(path.join(newsRoot,'news-sitemap.xml'),'utf8');
must(newsSitemap.includes('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"'),'Google News sitemap namespace missing');
const newsUrls=[...newsSitemap.matchAll(/<url>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<news:publication_date>([^<]+)<\/news:publication_date>[\s\S]*?<news:title>([\s\S]*?)<\/news:title>[\s\S]*?<\/url>/g)]
  .map(m=>({url:unescapeXml(m[1]),date:m[2],title:unescapeXml(m[3])}));
must(newsUrls.length>=1,'News sitemap has no fresh articles');
for(const item of newsUrls){
  const age=Date.now()-Date.parse(item.date);
  must(item.url.startsWith(NEWS),`News sitemap URL is outside FMB News: ${item.url}`);
  must(Number.isFinite(age)&&age>=-5*60*1000&&age<=48*60*60*1000,`News sitemap contains an article outside the last 48 hours: ${item.url}`);
  must(item.title.trim().length>=20,`News sitemap title is missing/too short: ${item.url}`);
}
must((newsSitemap.match(/<news:name>FMB News<\/news:name>/g)||[]).length===newsUrls.length,'Every News sitemap entry must declare FMB News as publication');
must((newsSitemap.match(/<news:language>en<\/news:language>/g)||[]).length===newsUrls.length,'Every News sitemap entry must declare English');

const rss=await readFile(path.join(newsRoot,'feed.xml'),'utf8');
must(rss.includes('<rss version="2.0"'),'RSS 2.0 declaration missing');
must(rss.includes('<atom:link href="https://www.francinemariebautista.com/news/feed.xml" rel="self" type="application/rss+xml"/>'),'RSS self-discovery atom link missing');
const items=[...rss.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<guid isPermaLink="true">([^<]+)<\/guid>[\s\S]*?<pubDate>([^<]+)<\/pubDate>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<\/item>/g)]
  .map(m=>({title:unescapeXml(m[1]),link:unescapeXml(m[2]),guid:unescapeXml(m[3]),pubDate:m[4],description:unescapeXml(m[5])}));
must(items.length>0&&items.length<=50,`RSS item count must be 1-50, got ${items.length}`);
for(let i=0;i<items.length;i++){
  const item=items[i];
  must(item.link.startsWith(NEWS)&&item.guid===item.link,`RSS item link/guid mismatch: ${item.link}`);
  must(Number.isFinite(Date.parse(item.pubDate)),`RSS pubDate invalid: ${item.link}`);
  must(item.title.trim().length>=20,`RSS item title too short: ${item.link}`);
  must(item.description.trim().length>=40,`RSS item description too short: ${item.link}`);
  if(i>0)must(Date.parse(items[i-1].pubDate)>=Date.parse(item.pubDate),'RSS items are not newest-first');
}

const published=[];
for(const file of await walk(contentRoot,f=>f.endsWith('.json'))){
  try{const s=JSON.parse(await readFile(file,'utf8'));if(s.status==='published'&&s.slug&&Number.isFinite(Date.parse(s.publishedAt)))published.push(s)}catch{}
}
published.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
must(items[0].link===`${NEWS}${published[0].slug}/`,'RSS first item is not the latest published FMB News report');

let indexablePages=0;
for(const file of await walk(newsRoot,f=>path.basename(f)==='index.html')){
  const html=await readFile(file,'utf8');
  if(/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))continue;
  indexablePages++;
  must(/<link\s+rel=["']alternate["']\s+type=["']application\/rss\+xml["']\s+title=["']FMB News["']\s+href=["']\/news\/feed\.xml["']>/i.test(html),`${path.relative(newsRoot,file)} lacks RSS autodiscovery`);
}

console.log(`News distribution verification passed: ${sitemapUrls.length} sitemap URLs, ${newsUrls.length} current Google News entries, ${items.length} newest-first RSS items, and RSS autodiscovery across ${indexablePages} indexable newsroom pages.`);
