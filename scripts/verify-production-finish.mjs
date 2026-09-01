import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFile(path.join(root,rel),'utf8');
const must=(value,message)=>{if(!value)throw new Error(message)};

const worker=await read('src/worker.js');
const wrangler=await read('wrangler.jsonc');
const globalMobile=await read('public/assets/js/fmb-news-mobile-global.js');
const home=await read('dist/news/index.html');

for(const token of ["'/fmbnews'","startsWith('/fmbnews/')",'FMBNews owns both the canonical newsroom'])must(worker.includes(token),`Canonical worker ownership regression: missing ${token}`);
for(const route of ['www.francinemariebautista.com/fmbnews*','francinemariebautista.com/fmbnews*'])must(wrangler.includes(route),`Legacy news route is not owned by FMBNews: ${route}`);

for(const token of ['fmbNewsPrefsV1','fmbNewsInterestV1','.fmb-app-story-list','.fmb-app-story-row','rankMobileHome'])must(globalMobile.includes(token),`Visible For You personalization regression: missing ${token}`);
must(home.includes('data-fmb-lead-story-image'),'Mobile lead must use the actual lead story image.');
must(home.includes('data-fmb-brand-fallback'),'Approved FMB hero fallback marker missing.');

const explainedRoot=path.join(root,'content','explained','articles');
async function walk(dir){const out=[];let entries=[];try{entries=await readdir(dir,{withFileTypes:true})}catch{return out}for(const entry of entries){const target=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await walk(target));else if(entry.isFile()&&entry.name.endsWith('.json'))out.push(target)}return out}
let checked=0;
for(const file of await walk(explainedRoot)){
  let article;
  try{article=JSON.parse(await readFile(file,'utf8'))}catch{continue}
  if(article.status!=='published'||!article.slug)continue;
  const built=path.join(root,'dist','news','explainer',article.slug,'index.html');
  await access(built);
  const html=await readFile(built,'utf8');
  for(const token of ['property="og:type" content="article"','name="twitter:card" content="summary_large_image"','type="application/ld+json"','"@type":"NewsArticle"'])must(html.includes(token),`${article.slug}: missing ${token}`);
  if(article.publishedAt)must(html.includes(`"datePublished":"${article.publishedAt}"`),`${article.slug}: structured data must use the actual publication timestamp`);
  checked++;
}
must(checked>0,'No published long-form FMB Explained article was verified.');

console.log(`Production finish verification passed: canonical FMBNews routing, real mobile personalization, story-aware lead imagery, and ${checked} structured FMB Explained article(s) verified.`);
