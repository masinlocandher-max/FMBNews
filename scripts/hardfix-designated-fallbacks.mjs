import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const explainerRoot=path.join(root,'dist','news','explainer');
const explainerFallback='/assets/images/mobile/fmb-explainer-fallback.jpg';
const generatedExplainerArt=/\/assets\/images\/explainer\/[^"'<>\s]+\.svg/g;

let pagesChecked=0,pagesSwitched=0;

async function scan(target){
  const info=await stat(target);
  if(info.isDirectory()){
    for(const entry of await readdir(target))await scan(path.join(target,entry));
    return;
  }
  if(path.basename(target)!=='index.html')return;
  const rel=path.relative(explainerRoot,target).replaceAll('\\','/');
  if(rel==='index.html')return;
  pagesChecked++;
  const source=await readFile(target,'utf8');
  if(!generatedExplainerArt.test(source))return;
  generatedExplainerArt.lastIndex=0;
  const updated=source
    .replace(generatedExplainerArt,explainerFallback)
    .replace(/FMB Explainer editorial illustration\./g,'FMB Explainer fallback visual.')
    .replace(/Original FMB editorial artwork/g,'Designated FMB Explainer fallback artwork');
  await writeFile(target,updated,'utf8');
  pagesSwitched++;
}

try{
  await scan(explainerRoot);
}catch(error){
  if(error?.code!=='ENOENT')throw error;
}

console.log(`Explainer image designation enforced: ${pagesChecked} article pages checked, ${pagesSwitched} no-photo generated illustrations switched to the approved Explainer fallback. Real supplied photos were left untouched.`);
