import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');

async function walk(dir){
  const out=[];let entries=[];
  try{entries=await readdir(dir,{withFileTypes:true})}catch{return out}
  for(const entry of entries){
    const target=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(target));
    else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(target);
  }
  return out;
}

const ecosystemHosts=[
  'senzpr.com',
  'www.senzpr.com',
  'thecognitainstitute.com',
  'www.thecognitainstitute.com',
  'yoni.francinemariebautista.com',
];
const ecosystemPaths=[
  '/',
  '/about/',
  '/projects/',
  '/reading/',
  '/music/',
  '/get-involved/',
  '/get-help/',
  '/work-with-fmb/',
  '/with-love-fmb/',
  '/fmbco/',
];

function isEcosystemHref(raw=''){
  const href=String(raw).trim();
  if(!href)return false;
  if(ecosystemPaths.includes(href))return true;
  try{
    const url=new URL(href,'https://www.francinemariebautista.com');
    if(ecosystemHosts.includes(url.hostname.toLowerCase()))return true;
    if((url.hostname==='www.francinemariebautista.com'||url.hostname==='francinemariebautista.com')&&!url.pathname.startsWith('/news/')){
      return ecosystemPaths.includes(url.pathname.endsWith('/')?url.pathname:`${url.pathname}/`);
    }
  }catch{}
  return false;
}

function stripEcosystemAnchors(html){
  return html.replace(/<a\b([^>]*?)href=(["'])([^"']+)\2([^>]*)>[\s\S]*?<\/a>/gi,(whole,_before,_quote,href)=>isEcosystemHref(href)?'':whole);
}

function stripPromotionalCopy(html){
  return html
    .replace(/\s*An FMB&amp;CO\. publication\.?/gi,'')
    .replace(/\s*An FMB&CO\. publication\.?/gi,'')
    .replace(/\s*Explore the complete FMB ecosystem\.?/gi,'')
    .replace(/\s*The official digital home, bulletin, authority platform, and ecosystem gateway of Francine Marie Bautista\.?/gi,'')
    .replace(/<(?<tag>h[1-6]|div|span|p)\b[^>]*>\s*(?:Official Site|Public Resources|Ecosystem)\s*<\/\k<tag>>/gi,'');
}

const pages=await walk(newsRoot);let changed=0;
for(const file of pages){
  let html=await readFile(file,'utf8');
  const before=html;
  html=stripPromotionalCopy(stripEcosystemAnchors(html));
  if(html!==before){await writeFile(file,html,'utf8');changed++}
}

console.log(`Standalone newsroom isolation applied to ${changed} pages: broader FMB ecosystem navigation and promotional gateway copy removed while /news/ routes and legitimate editorial source links remain intact.`);
