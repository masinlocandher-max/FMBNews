import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export const colorLogo='/assets/images/news/fmb-news-primary-logo-2026.webp';
export const whiteLogo='/assets/images/news/fmb-news-white-transparent-2026.webp';
export const logo=colorLogo;
const canonicalOrigin='https://www.francinemariebautista.com';
const forbiddenImagePattern=/(?:fmb-news-editorial-fallback|newsroom-editorial-fallback|fmb-news-(?:primary-logo|white-transparent|official)|(?:^|[-_/])(?:logo|wordmark|masthead)(?:[-_.?/]|$))/i;
function publishableImage(value){
  if(!value)return false;
  try{
    const parsed=new URL(value,canonicalOrigin);
    return parsed.origin===canonicalOrigin&&parsed.pathname.startsWith('/assets/')&&!forbiddenImagePattern.test(parsed.pathname);
  }catch{return false}
}
function validRecord(value){
  return Boolean(value)&&Number.isFinite(Date.parse(value.publishedAt||''))&&publishableImage(value.image);
}
const excluded=new Set(['why-websites-cost-and-how-senz-makes-them-accessible','filipino-centered-training-institution-cognita-vision']);
const categoryOverride=new Map([
  ['/news/magnitude-54-quake-hits-off-occidental-mindoro/','national'],
  ['/news/enrique-razon-tops-forbes-philippines-50-richest-list/','business'],
  ['/news/western-visayas-ai-festival-2026/','technology'],
  ['/news/san-marcelino-scholarship-requirements-august-2026/','national'],
]);
export const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const decode=v=>String(v??'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#039;',"'").replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&nbsp;',' ');
const text=v=>decode(String(v??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
const attr=(s,n)=>decode(String(s??'').match(new RegExp(`\\b${n}=(['"])(.*?)\\1`,'i'))?.[2]||'');
export const cap=(s,r)=>{const m=String(s??'').match(r);return m?text(m[m.length-1]):''};
export const tag=(s,r,n)=>{const m=String(s??'').match(r);return m?attr(m[0],n):''};
export async function walk(dir){const out=[];try{for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile()&&e.name.endsWith('.html'))out.push(p)}}catch(e){if(e?.code!=='ENOENT')throw e}return out}
function category(v){v=v.toLowerCase();if(/health|vaccin|medicine/.test(v))return'health';if(/environment|weather|climate|storm|wildfire|water/.test(v))return'environment';if(/technology|tech|artificial intelligence|\bai\b|science|digital|space|semiconductor/.test(v))return'technology';if(/business|money|econom|market|investment|jobs|energy|industry/.test(v))return'business';if(/world|diplomacy|war|gaza|ukraine|iran|korea|japan|myanmar|thailand|united nations/.test(v))return'world';if(/culture|entertainment|pageant|music|sports|tennis|tourism|identity|heritage/.test(v))return'culture';return'national'}
function formatPublished(value){const raw=String(value||'').trim();if(!/^\d{4}-\d{2}-\d{2}T/.test(raw))return raw||'FMB News report';const d=new Date(raw);if(Number.isNaN(d.getTime()))return raw;return new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).format(d).replace(' at ', ', ')+ ' PHT'}
export function record(block,route){
  const title=cap(block,/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)||cap(block,/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/i)||cap(block,/<title>([\s\S]*?)<\/title>/i).replace(/\s*\|\s*FMB News.*$/i,'');
  if(!title)return null;
  const kicker=cap(block,/<p\b[^>]*class=(['"])[^'"]*\b(?:fnc|nc)-kicker\b[^'"]*\1[^>]*>([\s\S]*?)<\/p>/i)||cap(block,/<p\b[^>]*>([\s\S]*?)<\/p>/i)||'FMB News';
  const description=cap(block,/<p\b[^>]*class=(['"])[^'"]*\bnc-article-deck\b[^'"]*\1[^>]*>([\s\S]*?)<\/p>/i)||tag(block,/<meta\b[^>]*name=(['"])description\1[^>]*>/i,'content')||'Read the full report and why it matters to Filipinos.';
  const storyImageTag=String(block??'').match(/<section\b[^>]*class=(['"])[^'"]*\bnc-story-media\b[^'"]*\1[^>]*>[\s\S]*?<img\b[^>]*>/i)?.[0]||'';
  const rawImage=tag(storyImageTag,/<img\b[^>]*>/i,'src')||tag(block,/<meta\b[^>]*property=(['"])og:image\1[^>]*>/i,'content')||tag(block,/<img\b[^>]*>/i,'src')||logo;
  const image=rawImage.includes('fmb-news-official-transparent.webp')?colorLogo:rawImage;
  const alt=tag(storyImageTag,/<img\b[^>]*>/i,'alt')||title;
  const rawCredit=cap(block,/<span\b[^>]*class=(['"])[^'"]*\bfmb-photo-credit\b[^'"]*\1[^>]*>([\s\S]*?)<\/span>/i)||cap(block,/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)||'FMB News';
  const credit=rawImage.includes('fmb-news-official-transparent.webp')?'Official FMB News identity':rawCredit;
  const rawPublished=tag(block,/<(?:article|a)\b[^>]*\bdata-published-at=(['"])[^'"]+\1[^>]*>/i,'data-published-at')||tag(block,/<meta\b[^>]*property=(['"])article:published_time\1[^>]*>/i,'content')||cap(block,/<span\b[^>]*>Published\s+([\s\S]*?)<\/span>/i)||cap(block,/<time\b[^>]*>([\s\S]*?)<\/time>/i)||'FMB News report';
  return{route,title,kicker,description,image,alt,credit,publishedAt:rawPublished,published:formatPublished(rawPublished),category:categoryOverride.get(route)||category(`${kicker} ${title}`)};
}
export function landingRecords(html){const out=[];for(const m of html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/gi)){const route=tag(m[0],/<a\b[^>]*href=(['"])\/news\/[^'"]+\1[^>]*>/i,'href');const slug=route.split('/').filter(Boolean).at(-1);if(!route||excluded.has(slug))continue;const r=record(m[0],route);if(validRecord(r))out.push(r)}for(const m of html.matchAll(/<a\b(?=[^>]*\bdata-published-at=(['"])[^'"]+\1)[^>]*>[\s\S]*?<\/a>/gi)){const route=tag(m[0],/<a\b[^>]*>/i,'href');const slug=route.split('/').filter(Boolean).at(-1);if(!route.startsWith('/news/')||excluded.has(slug))continue;const title=cap(m[0],/<strong\b[^>]*>([\s\S]*?)<\/strong>/i);const kicker=cap(m[0],/<small\b[^>]*>([\s\S]*?)<\/small>/i)||cap(m[0],/<span\b[^>]*>([\s\S]*?)<\/span>/i)||'FMB News';const publishedAt=tag(m[0],/<a\b[^>]*>/i,'data-published-at');if(!title||!publishedAt)continue;out.push({route,title,kicker,description:'Read the full report and why it matters to Filipinos.',image:logo,alt:title,credit:'FMB News archive',publishedAt,published:formatPublished(publishedAt),category:tag(m[0],/<a\b[^>]*>/i,'data-category')||category(`${kicker} ${title}`)})}return[...new Map(out.filter(validRecord).map(r=>[r.route,r])).values()]}
export async function articleRecords(newsRoot){
  const out=[];
  for(const file of await walk(newsRoot)){
    if(path.basename(file)!=='index.html')continue;
    const relativeDir=path.relative(newsRoot,path.dirname(file)).split(path.sep).join('/');
    const slug=relativeDir.split('/').filter(Boolean).at(-1)||'';
    if(!relativeDir||slug==='about'||excluded.has(slug))continue;
    const html=await readFile(file,'utf8');
    if(/http-equiv=(['"])refresh\1/i.test(html)||/<meta\b[^>]*(?:name|property)=(['"])robots\1[^>]*content=(['"])[^'"]*noindex/i.test(html))continue;
    if(!/<h1\b/i.test(html))continue;
    const route=`/news/${relativeDir}/`;
    const r=record(html,route);
    if(validRecord(r))out.push(r)
  }
  return out
}
export function merge(a,b){const map=new Map();for(const r of [...a,...b]){if(!r)continue;const current=map.get(r.route);if(!current){map.set(r.route,r);continue}if(!Number.isFinite(Date.parse(current.publishedAt||''))&&Number.isFinite(Date.parse(r.publishedAt||'')))map.set(r.route,{...current,publishedAt:r.publishedAt,published:r.published})}return[...map.values()].filter(validRecord)}
export function chronological(records){return[...records].sort((a,b)=>{const at=Date.parse(a.publishedAt||'');const bt=Date.parse(b.publishedAt||'');const av=Number.isFinite(at),bv=Number.isFinite(bt);if(av&&bv&&at!==bt)return bt-at;if(av!==bv)return av?-1:1;return a.title.localeCompare(b.title)})}
export function assertChronological(records,label='FMB News feed'){let previous=Number.POSITIVE_INFINITY;for(const record of records){const published=Date.parse(record.publishedAt||'');if(!Number.isFinite(published))throw new Error(`${label}: ${record.route} has an invalid publication date`);if(published>previous)throw new Error(`${label}: ${record.route} is out of newest-first order`);previous=published}}
