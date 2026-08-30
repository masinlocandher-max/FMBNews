import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const newsRoot=path.join(root,'dist','news');
const mapping=JSON.parse(await readFile(path.join(root,'apps','withlovefmb','content','news','rights-cleared-image-overrides.json'),'utf8'));
const fallback='/assets/images/news/fmb-news-editorial-fallback.svg';
const esc=(s='')=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

async function walk(dir){
  const files=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) files.push(...await walk(p));
    else if(entry.isFile()&&entry.name==='index.html') files.push(p);
  }
  return files;
}

function patchAnchors(html,slug,image){
  const href=`href="/news/${slug}/"`;
  let cursor=0;
  while(true){
    const hrefAt=html.indexOf(href,cursor);
    if(hrefAt<0) break;
    const anchorStart=html.lastIndexOf('<a',hrefAt);
    const anchorEnd=html.indexOf('</a>',hrefAt);
    if(anchorStart<0||anchorEnd<0){cursor=hrefAt+href.length;continue;}
    const end=anchorEnd+4;
    let chunk=html.slice(anchorStart,end);
    const old=chunk;
    if(chunk.includes(`src="${fallback}"`)){
      chunk=chunk.replace(`src="${fallback}"`,`src="${esc(image.url)}"`);
      chunk=chunk.replace(/(<img[^>]+alt=")[^"]*(")/,`$1${esc(image.alt)}$2`);
    }
    if(chunk!==old){
      html=html.slice(0,anchorStart)+chunk+html.slice(end);
      cursor=anchorStart+chunk.length;
    }else cursor=end;
  }
  return html;
}

for(const file of await walk(newsRoot)){
  let html=await readFile(file,'utf8');
  const before=html;
  for(const [slug,image] of Object.entries(mapping)) html=patchAnchors(html,slug,image);
  if(html!==before) await writeFile(file,html);
}
console.log('Applied rights-cleared story imagery only inside matching newsroom story cards.');
