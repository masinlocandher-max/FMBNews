import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');

async function walk(dir){
  const out=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const target=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(target));
    else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(target);
  }
  return out;
}

const bannedVisible=[
  'Explore the complete FMB ecosystem',
  'FMB&CO. Home',
  'An FMB&CO. publication',
  'official digital home, bulletin, authority platform, and ecosystem gateway',
];
const bannedHrefPatterns=[
  /href=["']\/["']/i,
  /href=["']\/(?:about|projects|reading|music|get-involved|get-help|work-with-fmb|with-love-fmb|fmbco)\//i,
  /href=["']https?:\/\/(?:www\.)?senzpr\.com/i,
  /href=["']https?:\/\/(?:www\.)?thecognitainstitute\.com/i,
  /href=["']https?:\/\/yoni\.francinemariebautista\.com/i,
  /href=["']https?:\/\/(?:www\.)?francinemariebautista\.com\/(?!news\/)/i,
];

const pages=await walk(newsRoot);let checked=0;
for(const file of pages){
  const rel=path.relative(newsRoot,file).replaceAll('\\','/');
  const html=await readFile(file,'utf8');
  checked++;
  for(const text of bannedVisible)if(html.toLowerCase().includes(text.toLowerCase()))throw new Error(`${rel}: broader FMB ecosystem copy remains: ${text}`);
  for(const pattern of bannedHrefPatterns)if(pattern.test(html))throw new Error(`${rel}: broader FMB ecosystem link remains: ${pattern}`);
  if(!html.includes('/news/'))throw new Error(`${rel}: page no longer exposes the canonical newsroom namespace`);
}

console.log(`Standalone isolation verification passed across ${checked} newsroom pages: no broader FMB ecosystem navigation, no cross-product gateway links, and /news/ remains the only first-party publication namespace.`);
