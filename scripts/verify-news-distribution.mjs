import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const contentRoot=path.join(root,'content','news','articles');
const NEWS='https://www.francinemariebautista.com/news/';
const TWO_DAYS=48*60*60*1000;
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
function extractCanonical(html){
  return html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i)?.[1]
    ||html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["'][^>]*>/i)?.[1]
    ||null;
}

const published=[];
for(const file of await walk(contentRoot,f=>f.endsWith('.json'))){
  try{
    const s=JSON.parse(await readFile(file,'utf8'));
    if(s.status==='published'&&s.slug&&s.headline&&Number.isFinite(Date.parse(s.publishedAt)))published.push(s);
  }catch{}
}
published.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
must(published.length>0,'No published FMB News reports were found for distribution');

const indexableCanonicals=[];
let indexablePages=0;
for(const file of await walk(newsRoot,f=>path.basename(f)==='index.html')){
  const html=await readFile(file,'utf8');
  if(/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))continue;
  indexablePages++;
  must(/<link\s+rel=["']alternate["']\s+type=["']application\/rss\+xml["']\s+title=["']FMB News["']\s+href=["']\/news\/feed\.xml["']>/i.test(html),`${path.relative(newsRoot,file)} lacks RSS autodiscovery`);
  const canonical=extractCanonical(html);
  must(canonical&&canonical.startsWith(NEWS),`${path.relative(newsRoot,file)} lacks a canonical FMB News URL`);
  if(!/\/news\/(search|submit|offline)\/?$/i.test(canonical))indexableCanonicals.push(canonical);
}
const expectedSitemapUrls=[...new Set(indexableCanonicals)].sort();

const sitemap=await readFile(path.join(newsRoot,'sitemap.xml'),'utf8');
must(sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'),'General sitemap namespace missing');
const sitemapUrls=[...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map(m=>unescapeXml(m[1]));
must(new Set(sitemapUrls).size===sitemapUrls.length,'General sitemap contains duplicate canonical URLs');
for(const url of sitemapUrls){
  must(url.startsWith(NEWS),`General sitemap contains an off-network URL: ${url}`);
  must(!/\/news\/(search|submit|offline)\/?$/i.test(url),`Utility route leaked into sitemap: ${url}`);
}
const actualSitemapUrls=[...sitemapUrls].sort();
must(actualSitemapUrls.length===expectedSitemapUrls.length,`General sitemap coverage mismatch: expected ${expectedSitemapUrls.length}, got ${actualSitemapUrls.length}`);
for(let i=0;i<expectedSitemapUrls.length;i++)must(actualSitemapUrls[i]===expectedSitemapUrls[i],`General sitemap canonical mismatch: expected ${expectedSitemapUrls[i]}, got ${actualSitemapUrls[i]}`);
for(const match of sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)){
  const t=Date.parse(match[1]);
  must(Number.isFinite(t),`Invalid sitemap lastmod: ${match[1]}`);
  must(t<=Date.now()+5*60*1000,`Future sitemap lastmod: ${match[1]}`);
}

const newsSitemap=await readFile(path.join(newsRoot,'news-sitemap.xml'),'utf8');
must(newsSitemap.includes('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"'),'Google News sitemap namespace missing');
const newsUrls=[...newsSitemap.matchAll(/<url>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<news:publication_date>([^<]+)<\/news:publication_date>[\s\S]*?<news:title>([\s\S]*?)<\/news:title>[\s\S]*?<\/url>/g)]
  .map(m=>({url:unescapeXml(m[1]),date:m[2],title:unescapeXml(m[3])}));
must(new Set(newsUrls.map(item=>item.url)).size===newsUrls.length,'Google News sitemap contains duplicate article URLs');
const now=Date.now();
const expectedFresh=published.filter(s=>{const age=now-Date.parse(s.publishedAt);return age>=-5*60*1000&&age<=TWO_DAYS});
must(newsUrls.length===expectedFresh.length,`Google News sitemap freshness mismatch: expected ${expectedFresh.length}, got ${newsUrls.length}`);
const expectedFreshByUrl=new Map(expectedFresh.map(s=>[`${NEWS}${s.slug}/`,s]));
for(const item of newsUrls){
  const age=now-Date.parse(item.date);
  must(item.url.startsWith(NEWS),`News sitemap URL is outside FMB News: ${item.url}`);
  must(Number.isFinite(age)&&age>=-5*60*1000&&age<=TWO_DAYS,`News sitemap contains an article outside the last 48 hours: ${item.url}`);
  const expected=expectedFreshByUrl.get(item.url);
  must(expected,`News sitemap contains an unexpected fresh URL: ${item.url}`);
  must(item.title===expected.headline,`News sitemap title does not match the published headline: ${item.url}`);
}
for(const [url] of expectedFreshByUrl)must(newsUrls.some(item=>item.url===url),`Fresh published article missing from Google News sitemap: ${url}`);
must((newsSitemap.match(/<news:name>FMB News<\/news:name>/g)||[]).length===newsUrls.length,'Every News sitemap entry must declare FMB News as publication');
must((newsSitemap.match(/<news:language>en<\/news:language>/g)||[]).length===newsUrls.length,'Every News sitemap entry must declare English');

const rss=await readFile(path.join(newsRoot,'feed.xml'),'utf8');
must(rss.includes('<rss version="2.0"'),'RSS 2.0 declaration missing');
must(rss.includes('<atom:link href="https://www.francinemariebautista.com/news/feed.xml" rel="self" type="application/rss+xml"/>'),'RSS self-discovery atom link missing');
const buildDate=rss.match(/<lastBuildDate>([^<]+)<\/lastBuildDate>/)?.[1];
must(buildDate&&Number.isFinite(Date.parse(buildDate)),'RSS lastBuildDate is missing or invalid');
must(Date.parse(buildDate)<=Date.now()+5*60*1000,'RSS lastBuildDate is in the future');
const items=[...rss.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<guid isPermaLink="true">([^<]+)<\/guid>[\s\S]*?<pubDate>([^<]+)<\/pubDate>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<\/item>/g)]
  .map(m=>({title:unescapeXml(m[1]),link:unescapeXml(m[2]),guid:unescapeXml(m[3]),pubDate:m[4],description:unescapeXml(m[5])}));
const expectedLatest=published.slice(0,50);
must(items.length===expectedLatest.length,`RSS item count mismatch: expected ${expectedLatest.length}, got ${items.length}`);
must(new Set(items.map(item=>item.link)).size===items.length,'RSS contains duplicate report links');
for(let i=0;i<items.length;i++){
  const item=items[i];
  const expected=expectedLatest[i];
  const expectedUrl=`${NEWS}${expected.slug}/`;
  must(item.link===expectedUrl&&item.guid===expectedUrl,`RSS order/link mismatch at item ${i+1}: expected ${expectedUrl}, got ${item.link}`);
  must(Number.isFinite(Date.parse(item.pubDate)),`RSS pubDate invalid: ${item.link}`);
  must(item.title===expected.headline,`RSS title does not match published headline: ${item.link}`);
  must(item.description.trim().length>=40,`RSS item description too short: ${item.link}`);
  if(i>0)must(Date.parse(items[i-1].pubDate)>=Date.parse(item.pubDate),'RSS items are not newest-first');
}

console.log(`News distribution verification passed: ${sitemapUrls.length} exact canonical sitemap URLs, ${newsUrls.length} truthful Google News entries from the last 48 hours, ${items.length} newest-first RSS reports, and RSS autodiscovery across ${indexablePages} indexable newsroom pages.`);
