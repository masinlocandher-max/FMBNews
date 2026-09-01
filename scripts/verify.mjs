import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const resolve=(...parts)=>path.join(root,...parts);
const required=[
  'site/index.html','site/fmb-brief/index.html','site/world/index.html','site/explainer/index.html','site/read/index.html','site/horoscope/index.html','site/crossword/index.html',
  'public/assets/css/fmb-news-reference-final.css','public/assets/css/fmb-news-product-identity.css','public/assets/css/fmb-news-landing-hardfix.css','public/assets/css/fmb-news-mobile-first-site.css','public/assets/css/fmb-news-mobile-personalization.css','public/assets/css/fmb-news-mobile-premium.css','public/assets/css/fmb-news-mobile-home.css','public/assets/css/fmb-news-mobile-features.css',
  'public/assets/images/brand/fmb-bulletin-emblem.svg','public/assets/js/fmb-news-cms.js','public/assets/js/fmb-explained-library.js','public/assets/js/fmb-news-mobile-personalization.js','public/assets/js/fmb-news-mobile-premium.js','public/assets/js/fmb-news-mobile-home.js','public/assets/js/fmb-news-weekly-horoscope.js','public/assets/js/fmb-news-weekly-crossword.js','public/assets/data/fmb-explained','content/news/articles',
  'scripts/render-metallic-reference.mjs','scripts/hardfix-metallic-network.mjs','scripts/hardfix-product-identity.mjs','scripts/hardfix-publication-landing.mjs','scripts/hardfix-mobile-app-home.mjs','scripts/hardfix-mobile-first-site.mjs','src/worker.js','wrangler.jsonc',
  'dist/news/index.html','dist/news/archive/index.html','dist/news/world/index.html','dist/news/explainer/index.html','dist/news/fmb-brief/index.html','dist/news/read/index.html','dist/news/horoscope/index.html','dist/news/crossword/index.html','dist/news/manifest.webmanifest','dist/news/sw.js',
  'dist/news/assets/css/fmb-news-mobile-premium.css','dist/news/assets/css/fmb-news-mobile-home.css','dist/news/assets/css/fmb-news-mobile-features.css','dist/news/assets/js/fmb-news-mobile-premium.js','dist/news/assets/js/fmb-news-mobile-home.js','dist/news/assets/js/fmb-news-weekly-horoscope.js','dist/news/assets/js/fmb-news-weekly-crossword.js','dist/news/assets/images/brand/fmb-bulletin-emblem.svg'
];
for(const rel of required)await access(resolve(rel));

try{await access(resolve('vercel.json'));throw new Error('FMBNews must not contain Vercel deployment configuration')}catch(error){if(error?.code!=='ENOENT'&&/must not contain/.test(error?.message||''))throw error}

const worker=await readFile(resolve('src/worker.js'),'utf8');
const wrangler=await readFile(resolve('wrangler.jsonc'),'utf8');
const cms=await readFile(resolve('public/assets/js/fmb-news-cms.js'),'utf8');
if(!worker.includes("url.pathname === '/news'")||!worker.includes("url.pathname.startsWith('/news/')"))throw new Error('Cloudflare Worker /news boundary missing');
if(!wrangler.includes('www.francinemariebautista.com/news*')||!wrangler.includes('francinemariebautista.com/news*'))throw new Error('Cloudflare /news routes missing');
if(!cms.includes('news_articles')||!cms.includes('news_editions')||!cms.includes('news_edition_entries'))throw new Error('CMS newsroom tables missing');

const home=await readFile(resolve('dist/news/index.html'),'utf8');
for(const signal of ['Filipino Media Bulletin','<h2>FMB News</h2>','<h2>FMB Worldwide</h2>','<h2>FMB Explainer</h2>','<h2>FMB Daily Brief</h2>','/news/assets/images/brand/fmb-bulletin-emblem.svg','data-fmb-newsletter-form','data-fmb-mobile-home','data-fmb-local-date','data-fmb-weather-button','Weekly Horoscope','FMB Crossword','1BFsbaXgrFqyBuD4R2ummFR87FUSxACq1','1KUeapU5-UNZocnOPWRze220hlm5BYg_h'])if(!home.includes(signal))throw new Error(`Publication/mobile home regression: missing ${signal}`);
if(home.includes('FMB Explained'))throw new Error('Obsolete FMB Explained label remains on publication landing');
if((home.match(/data-fmb-newsletter-form/g)||[]).length!==1)throw new Error('Publication landing must contain exactly one email form');

const pages={
  news:await readFile(resolve('dist/news/archive/index.html'),'utf8'),
  world:await readFile(resolve('dist/news/world/index.html'),'utf8'),
  explainer:await readFile(resolve('dist/news/explainer/index.html'),'utf8'),
  brief:await readFile(resolve('dist/news/fmb-brief/index.html'),'utf8'),
  horoscope:await readFile(resolve('dist/news/horoscope/index.html'),'utf8'),
  crossword:await readFile(resolve('dist/news/crossword/index.html'),'utf8')
};
for(const [name,html] of Object.entries(pages)){
  for(const label of ['FMB News','FMB Worldwide','FMB Explainer','FMB Daily Brief'])if(!html.includes(label))throw new Error(`${name}: missing ${label}`);
  if(html.includes('>FMB Explained<'))throw new Error(`${name}: obsolete FMB Explained label remains`);
  if(!html.includes('fmb-news-mobile-first-site.css'))throw new Error(`${name}: responsive layer missing`);
  if(!html.includes('fmb-news-mobile-premium.css?v=20260901-premium-v2'))throw new Error(`${name}: premium mobile app layer missing`);
  if(!html.includes('fmb-news-mobile-home.css?v=20260901-app-home-v1'))throw new Error(`${name}: mobile app home layer missing`);
  if(!html.includes('fmb-news-mobile-premium.js?v=20260901-premium-v2'))throw new Error(`${name}: premium mobile behavior missing`);
  if(!html.includes('fmb-news-mobile-home.js?v=20260901-app-home-v1'))throw new Error(`${name}: mobile app utility behavior missing`);
  if(html.includes('/news/news/assets/'))throw new Error(`${name}: double-scoped asset path`);
}
if(!pages.explainer.includes('aria-label="FMB Explainer"')||!pages.explainer.includes('fmb-explainer-route')||!pages.explainer.includes('206 topics, explained'))throw new Error('FMB Explainer product route regression');
if(!pages.horoscope.includes('Weekly Horoscope')||!pages.horoscope.includes('Lifestyle · Entertainment'))throw new Error('Weekly Horoscope route regression');
if(!pages.crossword.includes('Weekly Current Events')||!pages.crossword.includes('data-cw-grid'))throw new Error('Weekly Crossword route regression');

const premiumCss=await readFile(resolve('dist/news/assets/css/fmb-news-mobile-premium.css'),'utf8');
const premiumJs=await readFile(resolve('dist/news/assets/js/fmb-news-mobile-premium.js'),'utf8');
const mobileHomeCss=await readFile(resolve('dist/news/assets/css/fmb-news-mobile-home.css'),'utf8');
const mobileHomeJs=await readFile(resolve('dist/news/assets/js/fmb-news-mobile-home.js'),'utf8');
const crosswordJs=await readFile(resolve('dist/news/assets/js/fmb-news-weekly-crossword.js'),'utf8');
for(const token of ['@media (max-width:699px)','--app-plum:#2b1235','--app-bg:#f5f5f7','fmb-bulletin-emblem.svg','product-wordmark::before','fmb-app-dock'])if(!premiumCss.includes(token))throw new Error(`Premium mobile CSS regression: missing ${token}`);
if(!premiumJs.includes("matchMedia('(max-width:699px)')")||premiumJs.includes('location.replace'))throw new Error('Mobile app home must stay on /news/ without archive redirect');
for(const token of ['.fmb-mobile-app-home','max-width:699px','.fmb-app-brief-card','.fmb-app-week-grid','.fmb-app-weather'])if(!mobileHomeCss.includes(token))throw new Error(`Mobile app home CSS regression: missing ${token}`);
for(const token of ['open-meteo.com','geolocation','data-fmb-local-date','data-fmb-weather'])if(!mobileHomeJs.includes(token))throw new Error(`Mobile app utility regression: missing ${token}`);
for(const token of ['PAXSILICA','IMPEACHMENT','PADILLA','DUTERTE','SENATE','TARLAC','BCDA','AETA','DEPED'])if(!crosswordJs.includes(token))throw new Error(`Current-events crossword regression: missing ${token}`);

const emblem=await readFile(resolve('dist/news/assets/images/brand/fmb-bulletin-emblem.svg'),'utf8');
if(!emblem.includes('Gold shell-inspired emblem with a pearl center'))throw new Error('Official FMB shell emblem missing');

const shards=(await readdir(resolve('public/assets/data/fmb-explained'))).filter(name=>name.endsWith('.json'));
if(shards.length!==9)throw new Error(`Explainer library must contain 9 shards; found ${shards.length}`);
let explainerCount=0;
for(const shard of shards){const entries=JSON.parse(await readFile(resolve('public/assets/data/fmb-explained',shard),'utf8'));if(!Array.isArray(entries))throw new Error(`Invalid explainer shard ${shard}`);explainerCount+=entries.length;for(const item of entries)if(!Number.isInteger(item.id)||!item.title||!item.explanation||!item.why)throw new Error(`Invalid explainer entry in ${shard}`)}
if(explainerCount!==206)throw new Error(`FMB Explainer must contain 206 topics; found ${explainerCount}`);

const articleDays=(await readdir(resolve('content/news/articles'),{withFileTypes:true})).filter(e=>e.isDirectory());
if(!articleDays.length)throw new Error('Structured FMB News archive is empty');

async function scanBuilt(target){const info=await stat(target);if(info.isDirectory()){for(const e of await readdir(target))await scanBuilt(path.join(target,e));return}if(!/\.(?:html|css|js|mjs|json|xml|txt|svg)$/i.test(target))return;const text=await readFile(target,'utf8');if(/(?<!\/news)\/assets\//.test(text))throw new Error(`Unscoped root asset in ${path.relative(root,target)}`);if(text.includes('/news/news/assets/'))throw new Error(`Double-scoped asset in ${path.relative(root,target)}`)}
await scanBuilt(resolve('dist/news'));
console.log(`FMBNews verification passed: four official products locked, ${explainerCount} FMB Explainer topics verified, dedicated mobile app home present, live utilities wired, and current-events weekly features present without changing desktop.`);
