import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');

async function walk(target){
  const info=await stat(target);
  if(info.isFile())return path.basename(target)==='index.html'?[target]:[];
  const out=[];
  for(const entry of await readdir(target))out.push(...await walk(path.join(target,entry)));
  return out;
}

const pages=await walk(newsRoot);
assert(pages.length>0,'No built newsroom pages found for appearance verification.');

for(const page of pages){
  const html=await readFile(page,'utf8');
  assert(html.includes('data-fmb-theme-boot'),`${path.relative(newsRoot,page)} is missing early theme boot.`);
  assert(html.includes('/news/assets/css/fmb-news-theme.css?v=20260912'),`${path.relative(newsRoot,page)} is missing theme stylesheet.`);
  assert(html.includes('/news/assets/js/fmb-news-theme.js?v=20260912'),`${path.relative(newsRoot,page)} is missing theme runtime.`);
}

const css=await readFile(path.join(newsRoot,'assets','css','fmb-news-theme.css'),'utf8');
const js=await readFile(path.join(newsRoot,'assets','js','fmb-news-theme.js'),'utf8');
for(const token of ['data-fmb-theme="dark"','--fmb-theme-bg','fmb-theme-toggle','prefers-reduced-motion'])assert(css.includes(token),`Theme CSS missing ${token}.`);
for(const token of ["'system'","'light'","'dark'",'fmbThemeModeV1','prefers-color-scheme: dark','data-fmb-theme-menu'])assert(js.includes(token),`Theme runtime missing ${token}.`);

console.log(`FMB News appearance verification passed across ${pages.length} built pages: System/Light/Dark boot, stylesheet and runtime are universally installed.`);
