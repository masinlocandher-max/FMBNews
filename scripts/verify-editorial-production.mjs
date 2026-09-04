import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contentRoot=path.join(root,'content','news','articles');
const newsRoot=path.join(root,'dist','news');
const MODERN_CUTOFF=Date.parse('2026-09-01T00:00:00+08:00');
const must=(value,message)=>{if(!value)throw new Error(message)};

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
const words=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;
const sectionText=story=>(story.sections||[]).flatMap(s=>s.paragraphs||[]).join(' ');
const validIso=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const normalizedImagePath=u=>{
  if(/^https?:\/\//i.test(String(u||'')))return null;
  let rel=String(u||'');
  if(rel.startsWith('/news/'))rel=rel.slice('/news'.length);
  if(!rel.startsWith('/'))rel=`/${rel}`;
  return path.join(newsRoot,rel.slice(1));
};

const seen=new Set();
let published=0,modern=0,legacy=0,updated=0;
for(const file of await walk(contentRoot)){
  let story;
  try{story=JSON.parse(await readFile(file,'utf8'))}catch(e){throw new Error(`${path.relative(root,file)} is invalid JSON: ${e.message}`)}
  if(story.status!=='published')continue;
  published++;
  const label=story.slug||path.relative(root,file);
  must(story.schemaVersion===1,`${label}: schemaVersion must be 1`);
  must(typeof story.slug==='string'&&story.slug.length>=8,`${label}: published story is missing a stable slug`);
  must(!seen.has(story.slug),`${label}: duplicate published slug`);seen.add(story.slug);
  must(typeof story.headline==='string'&&story.headline.trim().length>=20,`${label}: headline is missing or too short`);
  must(validIso(story.publishedAt),`${label}: publishedAt is invalid`);
  must(Array.isArray(story.sections)&&story.sections.length>0,`${label}: sections are missing`);

  const page=path.join(newsRoot,story.slug,'index.html');
  await access(page);
  const html=await readFile(page,'utf8');
  const canonical=`https://www.francinemariebautista.com/news/${story.slug}/`;
  must(html.includes(`rel="canonical" href="${canonical}"`),`${label}: canonical URL mismatch`);
  must(/<meta\s+property=["']og:type["']\s+content=["']article["']>/i.test(html),`${label}: og:type must be article`);
  must(html.includes(`property="article:published_time" content="${story.publishedAt}"`),`${label}: article:published_time mismatch`);
  must(html.includes(`property="article:modified_time" content="${story.updatedAt||story.publishedAt}"`),`${label}: article:modified_time mismatch`);
  must(/<meta\s+name=["']author["']\s+content=["'][^"']+["']>/i.test(html),`${label}: author metadata missing`);
  const ldBlocks=[...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let articleLd=null;
  for(const block of ldBlocks){try{const parsed=JSON.parse(block[1]);const t=Array.isArray(parsed?.['@type'])?parsed['@type'].join(' '):String(parsed?.['@type']||'');if(/NewsArticle|Article/i.test(t)){articleLd=parsed;break}}catch{}}
  must(articleLd,`${label}: valid article JSON-LD missing`);
  must(articleLd.datePublished===story.publishedAt,`${label}: JSON-LD datePublished mismatch`);
  must(articleLd.dateModified===(story.updatedAt||story.publishedAt),`${label}: JSON-LD dateModified mismatch`);

  const publishedMs=Date.parse(story.publishedAt);
  const modifiedMs=Date.parse(story.updatedAt||story.publishedAt);
  if(modifiedMs-publishedMs>=5*60*1000){updated++;must(html.includes('data-fmb-article-updated'),`${label}: materially updated story must expose an Updated timestamp to readers`)}

  // The pre-September archive predates the current source schema. Preserve it
  // as the historical record while still requiring stable routes and normalized
  // production metadata above. New reporting must satisfy the full standard.
  if(publishedMs<MODERN_CUTOFF){legacy++;continue}
  modern++;
  must(typeof story.seoTitle==='string'&&story.seoTitle.trim().length>=20&&story.seoTitle.length<=85,`${label}: SEO title must be 20-85 characters`);
  must(typeof story.seoDescription==='string'&&story.seoDescription.trim().length>=60&&story.seoDescription.length<=190,`${label}: SEO description must be 60-190 characters`);
  must(validIso(story.updatedAt||story.publishedAt),`${label}: updatedAt is invalid`);
  must(Date.parse(story.updatedAt||story.publishedAt)>=publishedMs,`${label}: updatedAt predates publishedAt`);
  must(['NewsArticle','Article'].includes(story.articleType),`${label}: articleType must be NewsArticle or Article`);
  must(story.headline.length<=120,`${label}: headline is too long for production use`);
  must(typeof story.deck==='string'&&story.deck.trim().length>=55&&story.deck.length<=280,`${label}: deck must be 55-280 characters`);
  must(words(sectionText(story))>=100,`${label}: modern report is too thin; minimum 100 body words`);
  const headings=(story.sections||[]).map(s=>String(s.heading||'').trim().toLowerCase());
  must(headings.some(h=>/^(what happened|what changed|verified facts|latest national toll|sunday forecast)/.test(h)),`${label}: modern report needs a clear opening facts/change section`);
  must(headings.some(h=>h==='context'),`${label}: modern report needs Context`);
  must(headings.some(h=>h.startsWith('why this matters')),`${label}: modern report needs Why this matters`);
  must(headings.some(h=>h==='what to watch next'),`${label}: modern report needs What to watch next`);
  must(Array.isArray(story.sources)&&story.sources.length>=2,`${label}: modern report requires source records`);
  const sourceUrls=new Set();let externalSources=0;
  for(const src of story.sources){
    must(typeof src.publisher==='string'&&src.publisher.trim(),`${label}: source publisher is missing`);
    must(typeof src.title==='string'&&src.title.trim(),`${label}: source title is missing`);
    const url=String(src.url||'');
    const external=/^https:\/\//i.test(url),internal=/^\/news\//i.test(url);
    must(external||internal,`${label}: source URL must be HTTPS or an internal /news/ continuity link`);
    if(external)externalSources++;
    must(!sourceUrls.has(url),`${label}: duplicate source URL ${url}`);sourceUrls.add(url);
  }
  must(externalSources>=2,`${label}: modern report requires at least two external HTTPS sources`);
  must(story.image&&typeof story.image.url==='string'&&story.image.url.trim(),`${label}: content image URL is missing`);
  must(typeof story.image.alt==='string'&&story.image.alt.trim(),`${label}: image alt text is missing`);
  must(typeof story.image.caption==='string'&&story.image.caption.trim(),`${label}: image caption is required`);
  must(typeof story.image.credit==='string'&&story.image.credit.trim(),`${label}: image credit is required`);
  must(Number(story.image.width)>0&&Number(story.image.height)>0,`${label}: image dimensions are required`);
  const localImage=normalizedImagePath(story.image.url);
  if(localImage){await access(localImage);const info=await stat(localImage);must(info.size>100,`${label}: local content image is empty`)}
  must(story.audit&&validIso(story.audit.sourceCheckedAt),`${label}: audit.sourceCheckedAt is required`);
}

must(published>0,'No published FMB News stories were audited');
must(modern>0,'No modern September-era stories were audited');
console.log(`Editorial production verification passed: ${published} published FMB News stories audited (${modern} modern standard, ${legacy} preserved legacy); ${updated} materially updated stories expose reader-visible update timestamps.`);
