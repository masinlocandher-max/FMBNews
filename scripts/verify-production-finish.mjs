import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFile(path.join(root,rel),'utf8');
const must=(value,message)=>{if(!value)throw new Error(message)};

const worker=await read('src/worker.js');
const wrangler=await read('wrangler.jsonc');
const personalization=await read('public/assets/js/fmb-news-mobile-personalization.js');
const globalMobile=await read('public/assets/js/fmb-news-mobile-global.js');
const homeMobile=await read('public/assets/js/fmb-news-mobile-home.js');
const home=await read('dist/news/index.html');

for(const token of ["url.pathname === '/news'","url.pathname.startsWith('/news/')",'CANONICAL_ORIGIN'])must(worker.includes(token),`Canonical worker ownership regression: missing ${token}`);
for(const route of ['www.francinemariebautista.com/news*','francinemariebautista.com/news*'])must(wrangler.includes(route),`Canonical news route is not owned by FMBNews: ${route}`);
must(!wrangler.includes('/fmbnews'),'Legacy /fmbnews route must not be registered; FMBNews is public at /news only.');
for(const token of ['fmbNewsPrefsV1','fmbNewsInterestV1','rankFeed','news_reader_profiles','news_push_subscriptions'])must(personalization.includes(token),`Personalization regression: missing ${token}`);
for(const token of ['fmb-mobile-app-shell','fmb-mobile-product-rail','fmbSavedStoriesV1'])must(globalMobile.includes(token),`Global mobile runtime regression: missing ${token}`);
must(!globalMobile.includes('open-meteo.com'),'Weather must not be duplicated in the global mobile runtime');
for(const token of ['open-meteo.com',"timeZone:'Asia/Manila'",'WEATHER_KEY'])must(homeMobile.includes(token),`Home mobile runtime regression: missing ${token}`);

must(home.includes('data-fmb-approved-hero'),'Approved FMB hero marker missing.');
must(home.includes('/news/assets/images/mobile/fmb-mobile-hero.jpg'),'Mobile hero must use the localized approved file.');
must(home.includes('/news/assets/images/mobile/fmb-daily-brief-mug.jpg'),'Daily Brief must use the localized approved mug file.');
for(const asset of ['dist/news/assets/images/mobile/fmb-mobile-hero.jpg','dist/news/assets/images/mobile/fmb-daily-brief-mug.jpg']){await access(path.join(root,asset));const info=await stat(path.join(root,asset));must(info.size>20_000,`${asset} is incomplete`)}

const explainedRoot=path.join(root,'content','explained','articles');
async function walk(dir){const out=[];let entries=[];try{entries=await readdir(dir,{withFileTypes:true})}catch{return out}for(const entry of entries){const target=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await walk(target));else if(entry.isFile()&&entry.name.endsWith('.json'))out.push(target)}return out}
let checked=0;
for(const file of await walk(explainedRoot)){
  let article;try{article=JSON.parse(await readFile(file,'utf8'))}catch{continue}
  if(article.status!=='published'||!article.slug)continue;
  const built=path.join(root,'dist','news','explainer',article.slug,'index.html');await access(built);const html=await readFile(built,'utf8');
  for(const token of ['property="og:type" content="article"','name="twitter:card" content="summary_large_image"','type="application/ld+json"'])must(html.includes(token),`${article.slug}: missing ${token}`);
  must(html.includes('"@type":"Article"')||html.includes('"@type":"NewsArticle"'),`${article.slug}: missing valid Article schema type`);
  if(article.publishedAt)must(html.includes(`"datePublished":"${article.publishedAt}"`),`${article.slug}: structured data must use the actual publication timestamp`);checked++;
}
must(checked>0,'No published long-form FMB Explainer article was verified.');
console.log(`Production finish verification passed: canonical /news routing, personalization/PWA systems, one Home-owned PHT/weather runtime, localized approved hero/mug, and ${checked} structured FMB Explainer article(s) verified; Explainer essays may use Article schema while news reports retain NewsArticle.`);
