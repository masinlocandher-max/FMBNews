import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const news=path.join(root,'dist','news');
const must=(value,message)=>{if(!value)throw new Error(message)};
const read=p=>readFile(p,'utf8');
const strip=html=>html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/gi,' ').replace(/\s+/g,' ').trim();

const indexPath=path.join(news,'assets','data','fmb-explained','published-index.json');
await access(indexPath);
const index=JSON.parse(await read(indexPath));
must(Array.isArray(index)&&index.length===206,`Expected 206 published FMB Explainer records; found ${index?.length}`);
const ids=index.map(x=>Number(x.id)).sort((a,b)=>a-b);must(ids.every((id,i)=>id===i+1),'FMB Explainer published index IDs are incomplete or duplicated');
must(index[0].archiveDate==='2026-06-01',`First archive date must be June 1, 2026; found ${index[0].archiveDate}`);
must(index.at(-1).archiveDate==='2026-08-31',`Last archive date must be August 31, 2026; found ${index.at(-1).archiveDate}`);

let minWords=Infinity,totalWords=0,generatedImages=0;
for(const record of index){
  const pagePath=path.join(news,'explainer',record.articleSlug,'index.html');await access(pagePath);
  const html=await read(pagePath),rel=path.relative(root,pagePath);
  must(html.includes('data-fmb-explainer-article'),`${rel}: missing full Explainer article marker`);
  must(html.includes('FMB Explainer Archive'),`${rel}: missing archive-date label`);
  must(html.includes('Sources and further reading'),`${rel}: missing source section`);
  must(html.includes('<figure class="article-figure">'),`${rel}: missing article image`);
  must((html.match(/<h2>/g)||[]).length>=4,`${rel}: article is too structurally thin`);
  must(!/explained\.ph/i.test(html),`${rel}: forbidden provenance reference detected`);
  const articleMatch=html.match(/<article class="article">([\s\S]*?)<\/article>/i);must(articleMatch,`${rel}: article body missing`);
  const words=strip(articleMatch[1]).split(/\s+/).filter(Boolean).length;minWords=Math.min(minWords,words);totalWords+=words;
  must(words>=600,`${rel}: article is too short at ${words} rendered words`);
  if(Number(record.id)!==1){const imagePath=path.join(news,'assets','images','explainer',`${record.articleSlug}.svg`);await access(imagePath);const info=await stat(imagePath);must(info.size>1000,`${record.articleSlug}: generated hero illustration is incomplete`);const svg=await read(imagePath);must(svg.includes('FMB EXPLAINER')&&svg.includes('Editorial illustration'),`${record.articleSlug}: FMB editorial illustration labels missing`);generatedImages++}
}
must(generatedImages===205,`Expected 205 generated Explainer illustrations; found ${generatedImages}`);
const imageDir=path.join(news,'assets','images','explainer');const imageFiles=(await readdir(imageDir)).filter(x=>x.endsWith('.svg'));must(imageFiles.length===205,`Expected exactly 205 generated Explainer SVGs; found ${imageFiles.length}`);
const libraryJs=await read(path.join(news,'assets','js','fmb-explained-library.js'));must(libraryJs.includes('published-index.json'), 'Explainer library is not connected to the 206-article published index');must(libraryJs.includes('206 full articles'), 'Explainer library status does not expose the full collection');
console.log(`FMB Explainer verification passed: 206 full articles, 205 original editorial illustrations plus the approved Article 001 image, archive range June 1-August 31 2026, source sections present, minimum ${minWords} rendered words, average ${Math.round(totalWords/206)} rendered words, and no forbidden provenance references.`);
