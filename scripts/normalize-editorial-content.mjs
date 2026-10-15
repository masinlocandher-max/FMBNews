import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { editorialFallbackUrl, pickEditorialFallback } from './lib/editorial-fallback-pool.mjs';
import { normalizeStoryRecord } from './lib/editorial-section-canon.mjs';

// Runs before article HTML is generated so lens headings, live source hosts,
// and rotating fallback plates are already correct in the content records.

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contentRoot=path.join(root,'content','news','articles');

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

const blocked=[];
let touched=0,whyFixed=0,contextFixed=0,watchFixed=0,hostsFixed=0,platesFixed=0;

for(const file of await walk(contentRoot)){
  let story;let raw;
  try{raw=await readFile(file,'utf8');story=JSON.parse(raw)}catch{continue}
  if(story.status!=='published')continue;
  const summary=normalizeStoryRecord(story,{editorialFallbackUrl,pickEditorialFallback});
  if(summary.blockedSources.length){
    for(const url of summary.blockedSources)blocked.push(`${story.slug||path.basename(file)}: ${url}`);
  }
  if(!(summary.whyHeadings||summary.contextHeadings||summary.watchHeadings||summary.sourceHosts||summary.fallbackPlates))continue;
  const next=JSON.stringify(story,null,2)+'\n';
  if(next===raw)continue;
  await writeFile(file,next,'utf8');
  touched+=1;
  whyFixed+=summary.whyHeadings;
  contextFixed+=summary.contextHeadings;
  watchFixed+=summary.watchHeadings;
  hostsFixed+=summary.sourceHosts;
  platesFixed+=summary.fallbackPlates;
}

if(blocked.length){
  throw new Error(
    `Editorial content normalize refused ${blocked.length} non-production source citation(s):\n  ${blocked.join('\n  ')}`
  );
}

console.log(
  `Editorial content normalized: ${touched} published records updated ` +
  `(${whyFixed} Why, ${contextFixed} Context, ${watchFixed} Watch headings; ` +
  `${hostsFixed} live-host citations; ${platesFixed} rotating fallback plates).`
);
