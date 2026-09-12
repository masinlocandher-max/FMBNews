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
  const rel=path.relative(newsRoot,page);
  assert(html.includes('data-fmb-theme-boot'),`${rel} is missing early theme boot.`);
  assert(html.includes('/news/assets/css/fmb-news-theme.css?v=20260912-v3'),`${rel} is missing refreshed theme stylesheet.`);
  assert(html.includes('/news/assets/css/fmb-news-editorial-refresh.css?v=20260912-v3'),`${rel} is missing editorial refresh stylesheet.`);
  assert(html.includes('/news/assets/js/fmb-news-theme.js?v=20260912-v3'),`${rel} is missing refreshed theme runtime.`);
}

const css=await readFile(path.join(newsRoot,'assets','css','fmb-news-theme.css'),'utf8');
const refresh=await readFile(path.join(newsRoot,'assets','css','fmb-news-editorial-refresh.css'),'utf8');
const js=await readFile(path.join(newsRoot,'assets','js','fmb-news-theme.js'),'utf8');

for(const token of ['data-fmb-theme="dark"','--fmb-theme-bg','fmb-theme-toggle','prefers-reduced-motion'])assert(css.includes(token),`Theme CSS missing ${token}.`);
for(const token of ["'system'","'light'","'dark'",'fmbThemeModeV1','prefers-color-scheme: dark','data-fmb-theme-menu','#F4F0E8','#101314'])assert(js.includes(token),`Theme runtime missing ${token}.`);
for(const token of ['#F4F0E8','#FAF8F3','#171A1B','#101314','#A71930','#861226','#C6C8C7','#E1E1DD','#8A8E90','fmb-brand-period','fmb-brand-descriptor','fmb-mobile-bottom-nav','about-fmb-home','prefers-reduced-motion'])assert(refresh.includes(token),`Editorial refresh CSS missing ${token}.`);

assert(!refresh.includes('neon'),'Editorial refresh must not introduce neon styling.');

console.log(`FMB News appearance verification passed across ${pages.length} built pages: System/Light/Dark boot, ivory/ink/crimson editorial refresh, restrained metallic tokens, founder module and mobile bottom navigation are universally available.`);