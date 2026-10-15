import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isContextHeading,
  isOpeningHeading,
  isWatchHeading,
  isWhyHeading,
  NON_PRODUCTION_HOST_RE,
} from './lib/editorial-section-canon.mjs';

// Fast pre-publish check: content JSON only. No build, no photography fetch,
// no HTML render. Run this while drafting so CI is not the first failure.

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contentRoot=path.join(root,'content','news','articles');
const publicRoot=path.join(root,'public');
const MODERN_CUTOFF=Date.parse('2026-09-01T00:00:00+08:00');
const RECOVERY_ARCHIVE_CUTOFF=Date.parse('2026-09-05T00:00:00+08:00');
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
const publicImagePath=u=>{
  if(/^https?:\/\//i.test(String(u||'')))return null;
  let rel=String(u||'');
  if(rel.startsWith('/news/'))rel=rel.slice('/news'.length);
  if(!rel.startsWith('/'))rel=`/${rel}`;
  return path.join(publicRoot,rel.slice(1));
};

async function validateSourcesAndImage(story,label,minSources,minExternal){
  must(Array.isArray(story.sources)&&story.sources.length>=minSources,`${label}: report requires at least ${minSources} source record(s)`);
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
  must(externalSources>=minExternal,`${label}: report requires at least ${minExternal} external HTTPS source(s)`);
  must(story.image&&typeof story.image.url==='string'&&story.image.url.trim(),`${label}: content image URL is missing`);
  must(typeof story.image.alt==='string'&&story.image.alt.trim(),`${label}: image alt text is missing`);
  must(typeof story.image.caption==='string'&&story.image.caption.trim(),`${label}: image caption is required`);
  must(typeof story.image.credit==='string'&&story.image.credit.trim(),`${label}: image credit is required`);
  must(Number(story.image.width)>0&&Number(story.image.height)>0,`${label}: image dimensions are required`);
  const localImage=publicImagePath(story.image.url);
  if(localImage){await access(localImage);const info=await stat(localImage);must(info.size>100,`${label}: local content image is empty`)}
  must(story.audit&&validIso(story.audit.sourceCheckedAt),`${label}: audit.sourceCheckedAt is required`);
}

const seen=new Set();
let published=0,modern=0,legacy=0,recovered=0;
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

  for(const src of (Array.isArray(story.sources)?story.sources:[])){
    const host=(String(src?.url||'').match(/^https:\/\/([^/]+)/i)||[])[1]||'';
    must(!NON_PRODUCTION_HOST_RE.test(host),
      `${label}: source cites the non-production host "${host}". Cite the publisher's live site.`);
  }

  const publishedMs=Date.parse(story.publishedAt);
  if(publishedMs<MODERN_CUTOFF){legacy++;continue}

  const recoveredBackfill=story.audit?.recoveryStatus==='source-checked-backfill'&&
    publishedMs<RECOVERY_ARCHIVE_CUTOFF&&validIso(story.audit?.recoveredAt);
  if(recoveredBackfill){
    recovered++;
    must(typeof story.seoTitle==='string'&&story.seoTitle.trim().length>=20&&story.seoTitle.length<=85,`${label}: recovery SEO title must be 20-85 characters`);
    must(typeof story.seoDescription==='string'&&story.seoDescription.trim().length>=60&&story.seoDescription.length<=190,`${label}: recovery SEO description must be 60-190 characters`);
    must(validIso(story.updatedAt||story.publishedAt),`${label}: recovery updatedAt is invalid`);
    must(Date.parse(story.updatedAt||story.publishedAt)>=publishedMs,`${label}: recovery updatedAt predates publishedAt`);
    must(['NewsArticle','Article'].includes(story.articleType),`${label}: recovery articleType must be NewsArticle or Article`);
    must(typeof story.deck==='string'&&story.deck.trim().length>=55&&story.deck.length<=280,`${label}: recovery deck must be 55-280 characters`);
    must(Date.parse(story.audit.recoveredAt)>=publishedMs,`${label}: recovery timestamp predates publication`);
    await validateSourcesAndImage(story,label,1,1);
    continue;
  }

  modern++;
  must(typeof story.seoTitle==='string'&&story.seoTitle.trim().length>=20&&story.seoTitle.length<=85,`${label}: SEO title must be 20-85 characters`);
  must(typeof story.seoDescription==='string'&&story.seoDescription.trim().length>=60&&story.seoDescription.length<=190,`${label}: SEO description must be 60-190 characters`);
  must(validIso(story.updatedAt||story.publishedAt),`${label}: updatedAt is invalid`);
  must(Date.parse(story.updatedAt||story.publishedAt)>=publishedMs,`${label}: updatedAt predates publishedAt`);
  must(['NewsArticle','Article'].includes(story.articleType),`${label}: articleType must be NewsArticle or Article`);
  must(story.headline.length<=120,`${label}: headline is too long for production use`);
  must(typeof story.deck==='string'&&story.deck.trim().length>=55&&story.deck.length<=280,`${label}: deck must be 55-280 characters`);
  must(words(sectionText(story))>=100,`${label}: modern report is too thin; minimum 100 body words`);
  const headings=(story.sections||[]).map(s=>String(s.heading||'').trim());
  must(headings.some(isOpeningHeading),`${label}: modern report needs a clear opening facts/change section`);
  must(headings.some(isContextHeading),`${label}: modern report needs Context`);
  must(headings.some(isWhyHeading),`${label}: modern report needs Why this matters (or Why it matters)`);
  must(headings.some(isWatchHeading),`${label}: modern report needs What to watch next`);
  await validateSourcesAndImage(story,label,2,2);
}

must(published>0,'No published FMB News stories were audited');
must(modern>0,'No modern September-era stories were audited');
console.log(
  `Editorial content validation passed: ${published} published stories ` +
  `(${modern} modern, ${recovered} recovery, ${legacy} legacy). ` +
  `No build required.`
);
