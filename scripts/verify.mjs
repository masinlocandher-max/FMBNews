import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const resolve=(...parts)=>path.join(root,...parts);
const read=rel=>readFile(resolve(rel),'utf8');
const must=(value,message)=>{if(!value)throw new Error(message)};

const required=[
  'site/index.html','site/fmb-brief/index.html','site/world/index.html','site/explainer/index.html','site/horoscope/index.html','site/crossword/index.html','site/about/index.html',
  'public/assets/css/fmb-news-theme.css','public/assets/css/fmb-news-publication-landing.css','public/assets/css/fmb-news-editorial-reference-v2.css','public/assets/css/fmb-news-mobile-navigation-lock.css',
  'public/assets/js/fmb-news-mobile-personalization.js','public/assets/js/fmb-news-mobile-home.js','public/assets/js/fmb-news-mobile-global.js','public/assets/js/fmb-news-mobile-products.js','public/assets/js/fmb-news-mobile-app-polish.js','public/assets/js/fmb-news-weekly-horoscope.js','public/assets/js/fmb-news-weekly-crossword.js','public/assets/js/fmb-news-theme.js',
  'public/assets/images/brand/fmb-bulletin-emblem.svg','public/assets/data/fmb-explained','content/news/articles',
  'scripts/fetch-approved-mobile-assets.mjs','scripts/render-home-experience.mjs','scripts/apply-brand-system.mjs','scripts/hardfix-mobile-first-site.mjs','src/worker.js','wrangler.jsonc',
  'dist/news/index.html','dist/news/archive/index.html','dist/news/world/index.html','dist/news/sports/index.html','dist/news/explainer/index.html','dist/news/fmb-brief/index.html','dist/news/fact-check/index.html','dist/news/horoscope/index.html','dist/news/crossword/index.html','dist/news/about/index.html',
  'dist/news/assets/images/mobile/fmb-mobile-hero.jpg','dist/news/assets/images/mobile/fmb-daily-brief-mug.jpg','dist/news/assets/images/brand/fmb-bulletin-emblem.svg',
  'dist/news/assets/css/fmb-news-theme.css','dist/news/assets/css/fmb-news-publication-landing.css','dist/news/assets/css/fmb-news-editorial-reference-v2.css','dist/news/assets/css/fmb-news-mobile-navigation-lock.css','dist/news/assets/css/fmb-news-mobile-system.css',
  'dist/news/assets/js/fmb-news-mobile-home.js','dist/news/assets/js/fmb-news-mobile-global.js','dist/news/assets/js/fmb-news-mobile-products.js','dist/news/assets/js/fmb-news-mobile-app-polish.js','dist/news/assets/js/fmb-news-weekly-crossword.js','dist/news/assets/js/fmb-news-theme.js'
];
for(const rel of required)await access(resolve(rel));

const worker=await read('src/worker.js'),wrangler=await read('wrangler.jsonc');
must(worker.includes("url.pathname === '/news'")&&worker.includes("url.pathname.startsWith('/news/')"),'Cloudflare Worker /news boundary missing');
must(wrangler.includes('www.francinemariebautista.com/news*')&&wrangler.includes('francinemariebautista.com/news*'),'Cloudflare /news routes missing');
must(worker.includes('www.francinemariebautista.com'),'Worker does not canonicalise onto the www host');
must(/fact-check[\s\S]{0,500}308/.test(worker),'Worker does not redirect held Fact Check URLs to the desk');

const fetchApproved=await read('scripts/fetch-approved-mobile-assets.mjs');
must(fetchApproved.includes('14fKTwMW0qnVi36eVSAjSBr05_VZgq4kf'),'Approved Philippines newsroom recovery hero Drive asset is not locked');

const canonicalHomeRenderer=await read('scripts/render-home-experience.mjs');
for(const token of [
  'applyDesktopPublicationLanding','renderMobileHome','data-fmb-mobile-home','network-home',
  'fmb-editorial-wordmark','editorial-top-grid','editorial-side-rail','editorial-bottom-grid',
  'data-fmb-editorial-lead','fmb-editorial-mobile-rail','Francine Marie Bautista','Founder'
])must(canonicalHomeRenderer.includes(token),`Canonical home renderer regression: missing ${token}`);
const canonicalBrandSystem=await read('scripts/apply-brand-system.mjs');
for(const token of ['fmb-news-theme.css','fmb-news-theme.js','data-fmb-theme-boot','fmb-lux-wordmark'])must(canonicalBrandSystem.includes(token),`Canonical brand system regression: missing ${token}`);

const home=await read('dist/news/index.html');
for(const signal of [
  'FMB News','FMB Worldwide','FMB Explainer','FMB Fact Check','FMB Daily Brief',
  'FMB NEWS<span class="dot">.</span>','FILIPINO MEDIA BULLETIN','class="editorial-lead-story"','class="editorial-side-rail"',
  'Francine Marie Bautista','Founder','data-fmb-mobile-home','data-fmb-editorial-lead','fmb-editorial-mobile-rail',
  'fmb-approved-hero-copy','fmb-approved-hero-ticker','fmb-hero-live-overlay','data-fmb-greeting-line','data-fmb-local-time',
  'Weekly Horoscope','FMB Crossword','/news/assets/images/mobile/fmb-mobile-hero.jpg','/news/assets/images/mobile/fmb-daily-brief-mug.jpg',
  'fmb-news-editorial-reference-v2.css','data-fmb-theme-boot','fmb-news-theme.css','fmb-news-theme.js'
])must(home.includes(signal),`FMB home regression: missing ${signal}`);
must(!home.includes('FMB Explained'),'Obsolete FMB Explained label remains');
must(!home.includes('--landing-violet:#220D50'),'Superseded violet landing identity leaked into built Home');

for(const asset of ['dist/news/assets/images/mobile/fmb-mobile-hero.jpg','dist/news/assets/images/mobile/fmb-daily-brief-mug.jpg']){
  const info=await stat(resolve(asset));must(info.size>20_000,`${asset} is missing or incomplete`);
}

const pages={
  news:await read('dist/news/archive/index.html'),world:await read('dist/news/world/index.html'),sports:await read('dist/news/sports/index.html'),explainer:await read('dist/news/explainer/index.html'),fact:await read('dist/news/fact-check/index.html'),brief:await read('dist/news/fmb-brief/index.html'),horoscope:await read('dist/news/horoscope/index.html'),crossword:await read('dist/news/crossword/index.html'),about:await read('dist/news/about/index.html')
};
for(const[name,html]of Object.entries(pages)){
  must(/fmb-news-mobile-system\.css\?v=[0-9a-f]{10}\b/.test(html),`${name}: content-versioned mobile system stylesheet missing`);
  must(html.includes('fmb-news-mobile-global.js?v=20260913-editorial-shell-v1'),`${name}: editorial mobile shell runtime missing`);
  must(html.includes('fmb-news-mobile-products.js?v=20260902-products-v3'),`${name}: product runtime v3 missing`);
  must(html.includes('fmb-news-mobile-app-polish.js?v=20260902-polish-v2'),`${name}: mobile polish runtime v2 missing`);
  must(html.includes('/news/assets/css/fmb-news-theme.css?v=20260912'),`${name}: canonical appearance stylesheet missing`);
  must(html.includes('/news/assets/js/fmb-news-theme.js?v=20260912'),`${name}: canonical appearance runtime missing`);
  must(!html.includes('/news/news/assets/'),`${name}: double-scoped asset path remains`);
}

const systemCss=await read('dist/news/assets/css/fmb-news-mobile-system.css');
const systemOrder=[
  'fmb-news-mobile-first-site.css','fmb-news-mobile-personalization.css','fmb-news-mobile-premium.css','fmb-news-mobile-home.css','fmb-news-mobile-global.css','fmb-news-mobile-products.css','fmb-news-mobile-app-polish.css','fmb-news-mobile-home-live-hero.css','fmb-news-mobile-home-motion.css','fmb-news-mobile-contrast-lock.css','fmb-news-mobile-product-heroes.css','fmb-news-mobile-menu-holder.css','fmb-news-mobile-final-tweaks.css','fmb-news-mobile-approved-home.css','fmb-news-mobile-material-polish.css','fmb-news-mobile-all-screens.css','fmb-news-mobile-navigation-lock.css'
];
let cursor=-1;
for(const sheet of systemOrder){
  const at=systemCss.indexOf(`/* ===== ${sheet} ===== */`);
  must(at>cursor,`Mobile system stylesheet is missing ${sheet} or has it out of cascade order`);
  cursor=at;
  const source=await read(`dist/news/assets/css/${sheet}`);
  must(systemCss.includes(source.trim()),`Mobile system stylesheet does not match authored ${sheet}`);
}
must(!/@import|@charset/i.test(systemCss),'Mobile system stylesheet must not contain @import/@charset');

const shellJs=await read('dist/news/assets/js/fmb-news-mobile-global.js');
for(const token of ['fmb-editorial-mobile-dock','FMB NEWS<span class="fmb-mobile-brand-dot">.</span>','/news/sports/','data-fmb-dock-menu','aria-label="FMB News quick navigation"'])must(shellJs.includes(token),`Editorial mobile shell regression: missing ${token}`);
for(const banned of ['fmb-global-mobile-utility','fmb-approved-bottom-nav','ensureBottomNav'])must(!shellJs.includes(banned),`Retired mobile shell element returned: ${banned}`);
const navLock=await read('dist/news/assets/css/fmb-news-mobile-navigation-lock.css');
for(const token of ['--fmb-mobile-red:#a61f32','--fmb-mobile-black:#0b0f11','.fmb-editorial-mobile-dock','position:fixed!important','bottom:0!important','fmb-editorial-mobile-rail-item','data-fmb-editorial-lead'])must(navLock.includes(token),`New black/red mobile reference lock missing ${token}`);
must(!navLock.includes('#630661'),'Superseded plum accent returned to final mobile navigation lock');
must(!navLock.includes('#f2d17a'),'Superseded gold accent returned to final mobile navigation lock');

const homeJs=await read('dist/news/assets/js/fmb-news-mobile-home.js');
for(const token of ["timeZone:'Asia/Manila'",'data-fmb-greeting-line','prefers-reduced-motion: reduce'])must(homeJs.includes(token),`Home runtime regression: missing ${token}`);

const productJs=await read('dist/news/assets/js/fmb-news-mobile-products.js');
for(const token of ['addArchiveIntro','addWorldSignature','addExplainerSignature','addBriefSignature','addHoroscopeSignature','addCrosswordSignature','addAboutSignature','addArticleProgress'])must(productJs.includes(token),`Dedicated mobile product runtime missing: ${token}`);

const horoscopeHtml=pages.horoscope,horoscopeJs=await read('public/assets/js/fmb-news-weekly-horoscope.js');
must(horoscopeHtml.includes('Hindi hawak ng mga bituin ang ating kapalaran, meron tayong freewill gamitin natin'),'Horoscope free-will header missing');
for(const icon of ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'])must(horoscopeJs.includes(icon),`Horoscope zodiac icon missing: ${icon}`);

const crosswordHtml=pages.crossword,crosswordJs=await read('dist/news/assets/js/fmb-news-weekly-crossword.js');
const crosswordLayout=JSON.parse(await read('dist/news/assets/data/fmb-crossword-current.json'));
const entryCount=crosswordLayout.length;
must(crosswordHtml.includes('35+ current-event answers'),'Crossword 35+ word promise missing');
must(entryCount>=35,`Crossword has only ${entryCount} layout entries`);
must(crosswordJs.includes('fmb-crossword-current.json'),'Crossword secure layout runtime missing');
must(!crosswordJs.includes('answer:')&&!crosswordJs.includes('answer=')&&!JSON.stringify(crosswordLayout).includes('"answer"'),'Active crossword answer data must not ship to browsers');
for(const forbidden of ['data-cw-reveal-letter','data-cw-reveal-word','data-cw-reveal-puzzle','Reveal Letter','Reveal Word','Reveal Puzzle'])must(!crosswordHtml.includes(forbidden)&&!crosswordJs.includes(forbidden),`Active crossword must not expose reveal control: ${forbidden}`);

const emblem=await read('dist/news/assets/images/brand/fmb-bulletin-emblem.svg');
must(emblem.includes('Gold shell-inspired emblem with a pearl center'),'Official FMB shell emblem missing from retained product assets');

const shards=(await readdir(resolve('public/assets/data/fmb-explained'))).filter(name=>name.endsWith('.json'));must(shards.length===9,`FMB Explainer must contain 9 shards; found ${shards.length}`);
let explainerCount=0;for(const shard of shards){const items=JSON.parse(await readFile(resolve('public/assets/data/fmb-explained',shard),'utf8'));explainerCount+=items.length}must(explainerCount===206,`FMB Explainer library must contain 206 topics; found ${explainerCount}`);

let builtPageCount=0;
async function scan(target){
  const info=await stat(target);
  if(info.isDirectory()){for(const e of await readdir(target))await scan(path.join(target,e));return}
  if(path.basename(target)!=='index.html')return;
  const text=await readFile(target,'utf8');
  builtPageCount++;
  const where=path.relative(root,target);
  must(/fmb-news-mobile-system\.css\?v=[0-9a-f]{10}\b/.test(text),`Mobile system stylesheet not injected in ${where}`);
  must(text.includes('fmb-news-mobile-global.js?v=20260913-editorial-shell-v1'),`Editorial global mobile runtime not injected in ${where}`);
  must(text.includes('fmb-news-mobile-products.js?v=20260902-products-v3'),`Product runtime v3 not injected in ${where}`);
  must(text.includes('fmb-news-mobile-app-polish.js?v=20260902-polish-v2'),`App polish runtime v2 not injected in ${where}`);
  must(text.includes('/news/assets/css/fmb-news-theme.css?v=20260912'),`Canonical appearance stylesheet not injected in ${where}`);
  must(text.includes('/news/assets/js/fmb-news-theme.js?v=20260912'),`Canonical appearance runtime not injected in ${where}`);
  must(!text.includes('/news/news/assets/'),`Double-scoped asset in ${where}`);
}
await scan(resolve('dist/news'));

console.log(`FMBNews verification passed: FMB NEWS. black/ivory/red editorial home, real story-led mobile hero, text section rail, persistent five-item mobile dock, System/Light/Dark theme runtime, secure ${entryCount}-entry crossword, ${explainerCount} Explainer topics, and full shell coverage across ${builtPageCount} pages.`);