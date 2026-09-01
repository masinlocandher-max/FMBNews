import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const resolve=(...parts)=>path.join(root,...parts);
const read=rel=>readFile(resolve(rel),'utf8');
const must=(value,message)=>{if(!value)throw new Error(message)};

const required=[
  'site/index.html','site/fmb-brief/index.html','site/world/index.html','site/explainer/index.html','site/horoscope/index.html','site/crossword/index.html','site/about/index.html',
  'public/assets/css/fmb-news-mobile-premium.css','public/assets/css/fmb-news-mobile-home.css','public/assets/css/fmb-news-mobile-global.css','public/assets/css/fmb-news-mobile-products.css','public/assets/css/fmb-news-mobile-product-heroes.css','public/assets/css/fmb-news-mobile-menu-holder.css','public/assets/css/fmb-news-mobile-app-polish.css','public/assets/css/fmb-news-mobile-home-live-hero.css','public/assets/css/fmb-news-mobile-contrast-lock.css','public/assets/css/fmb-news-mobile-features.css','public/assets/css/fmb-news-mobile-personalization.css',
  'public/assets/js/fmb-news-mobile-personalization.js','public/assets/js/fmb-news-mobile-home.js','public/assets/js/fmb-news-mobile-global.js','public/assets/js/fmb-news-mobile-products.js','public/assets/js/fmb-news-mobile-app-polish.js','public/assets/js/fmb-news-weekly-horoscope.js','public/assets/js/fmb-news-weekly-crossword.js',
  'public/assets/images/brand/fmb-bulletin-emblem.svg','public/assets/data/fmb-explained','content/news/articles',
  'scripts/fetch-approved-mobile-assets.mjs','scripts/hardfix-mobile-app-home.mjs','scripts/hardfix-mobile-first-site.mjs','src/worker.js','wrangler.jsonc',
  'dist/news/index.html','dist/news/archive/index.html','dist/news/world/index.html','dist/news/explainer/index.html','dist/news/fmb-brief/index.html','dist/news/horoscope/index.html','dist/news/crossword/index.html','dist/news/about/index.html',
  'dist/news/assets/images/mobile/fmb-mobile-hero.jpg','dist/news/assets/images/mobile/fmb-daily-brief-mug.jpg','dist/news/assets/images/brand/fmb-bulletin-emblem.svg',
  'dist/news/assets/css/fmb-news-mobile-global.css','dist/news/assets/css/fmb-news-mobile-products.css','dist/news/assets/css/fmb-news-mobile-product-heroes.css','dist/news/assets/css/fmb-news-mobile-menu-holder.css','dist/news/assets/css/fmb-news-mobile-app-polish.css','dist/news/assets/css/fmb-news-mobile-home-live-hero.css','dist/news/assets/css/fmb-news-mobile-contrast-lock.css','dist/news/assets/css/fmb-news-mobile-features.css','dist/news/assets/css/fmb-news-mobile-personalization.css',
  'dist/news/assets/js/fmb-news-mobile-home.js','dist/news/assets/js/fmb-news-mobile-products.js','dist/news/assets/js/fmb-news-mobile-app-polish.js','dist/news/assets/js/fmb-news-weekly-crossword.js'
];
for(const rel of required)await access(resolve(rel));

const worker=await read('src/worker.js'),wrangler=await read('wrangler.jsonc');
must(worker.includes("url.pathname === '/news'")&&worker.includes("url.pathname.startsWith('/news/')"),'Cloudflare Worker /news boundary missing');
must(wrangler.includes('www.francinemariebautista.com/news*')&&wrangler.includes('francinemariebautista.com/news*'),'Cloudflare /news routes missing');

const home=await read('dist/news/index.html');
for(const signal of ['FMB News','FMB Worldwide','FMB Explainer','FMB Daily Brief','data-fmb-mobile-home','fmb-hero-live-overlay','data-fmb-greeting','data-fmb-greeting-line','data-fmb-local-time','data-fmb-weather-button','Weekly Horoscope','FMB Crossword','/news/assets/images/mobile/fmb-mobile-hero.jpg','/news/assets/images/mobile/fmb-daily-brief-mug.jpg'])must(home.includes(signal),`Mobile home regression: missing ${signal}`);
must(!home.includes('FMB Explained'),'Obsolete FMB Explained label remains');

for(const asset of ['dist/news/assets/images/mobile/fmb-mobile-hero.jpg','dist/news/assets/images/mobile/fmb-daily-brief-mug.jpg']){
  const info=await stat(resolve(asset));must(info.size>20_000,`${asset} is missing or incomplete`);
}

const pages={
  news:await read('dist/news/archive/index.html'),world:await read('dist/news/world/index.html'),explainer:await read('dist/news/explainer/index.html'),brief:await read('dist/news/fmb-brief/index.html'),horoscope:await read('dist/news/horoscope/index.html'),crossword:await read('dist/news/crossword/index.html'),about:await read('dist/news/about/index.html')
};
for(const[name,html]of Object.entries(pages)){
  for(const label of ['FMB News','FMB Worldwide','FMB Explainer','FMB Daily Brief'])must(html.includes(label),`${name}: missing ${label}`);
  must(html.includes('fmb-news-mobile-personalization.css?v=20260901-personal-v3'),`${name}: corrected personalization CSS v3 missing`);
  must(html.includes('fmb-news-mobile-home.css?v=20260901-app-home-v2'),`${name}: mobile home CSS v2 missing`);
  must(html.includes('fmb-news-mobile-global.css?v=20260901-global-v3'),`${name}: global mobile CSS v3 missing`);
  must(html.includes('fmb-news-mobile-global.js?v=20260901-global-v3'),`${name}: global mobile runtime v3 missing`);
  must(html.includes('fmb-news-mobile-products.css?v=20260901-products-v1'),`${name}: dedicated product CSS missing`);
  must(html.includes('fmb-news-mobile-products.js?v=20260902-products-v3'),`${name}: strict product runtime v3 missing`);
  must(html.includes('fmb-news-mobile-product-heroes.css?v=20260902-product-heroes-v4'),`${name}: strict three-product hero CSS v4 missing`);
  must(html.includes('fmb-news-mobile-menu-holder.css?v=20260902-menu-holder-v2'),`${name}: compact premium menu holder CSS missing`);
  must(html.includes('fmb-news-mobile-app-polish.css?v=20260902-polish-v2'),`${name}: final premium mobile polish CSS v2 missing`);
  must(html.includes('fmb-news-mobile-app-polish.js?v=20260902-polish-v2'),`${name}: final premium mobile polish runtime v2 missing`);
  must(html.includes('fmb-news-mobile-home-live-hero.css?v=20260902-live-hero-v2'),`${name}: proportional full-bleed Home hero stylesheet missing`);
  must(html.includes('fmb-news-mobile-contrast-lock.css?v=20260902-contrast-v1'),`${name}: final mobile contrast lock missing`);
}

const globalCss=await read('dist/news/assets/css/fmb-news-mobile-global.css');
for(const token of ['.fmb-mobile-app-shell','.fmb-mobile-product-rail','SF Pro Text','High-contrast rules','world-hero p','brief-archive-hero'])must(globalCss.includes(token),`Global mobile readability regression: missing ${token}`);
const productCss=await read('dist/news/assets/css/fmb-news-mobile-products.css');
for(const token of ['fmb-mobile-route-archive','fmb-mobile-route-world','fmb-mobile-route-explainer','fmb-mobile-route-brief','fmb-mobile-route-horoscope','fmb-mobile-route-crossword','fmb-mobile-route-about','fmb-mobile-route-article'])must(productCss.includes(token),`Dedicated mobile product design missing: ${token}`);
const productJs=await read('dist/news/assets/js/fmb-news-mobile-products.js');
for(const token of ['addArchiveIntro','addWorldSignature','addExplainerSignature','addBriefSignature','addHoroscopeSignature','addCrosswordSignature','addAboutSignature','addArticleProgress','.brief-archive-hero .brief-shell','EXPLAINER DESK','DAILY DESK','PLAIN LANGUAGE · CONTEXT FIRST · FILIPINO RELEVANCE'])must(productJs.includes(token),`Dedicated mobile product runtime missing: ${token}`);
must(!productJs.includes('TOPICS<br>MADE CLEAR'),'Explainer 206 hero badge must stay removed');
must(!productJs.includes('fmb-brief-signature-visual'),'Daily Brief hero must not inject a floating mug');
const heroCss=await read('dist/news/assets/css/fmb-news-mobile-product-heroes.css');
for(const token of ['One exact hero canvas','height:300px','padding:28px 22px 26px','.fmb-product-signal','font-size:46px','Same bottom capsule','fmb-mobile-route-world .world-hero','fmb-mobile-route-explainer .explainer-hero','brief-route.fmb-mobile-route-brief .brief-archive-hero'])must(heroCss.includes(token),`Strict three-product hero regression: missing ${token}`);
must(heroCss.includes('fmb-explainer-mark')&&heroCss.includes('display:none!important'),'Explainer legacy 206 mark must be suppressed');
must(heroCss.includes('fmb-brief-signature-visual')&&heroCss.includes('display:none!important'),'Daily Brief legacy floating mug must be suppressed');
const menuCss=await read('dist/news/assets/css/fmb-news-mobile-menu-holder.css');
must(menuCss.includes('min-height:46px!important'),'Premium menu holder must stay compact at 46px');
const polishCss=await read('dist/news/assets/css/fmb-news-mobile-app-polish.css');
for(const token of ['one FMB shell','fmb-legacy-product-rail','.fmb-global-week-actions{display:none','Every internal product starts immediately after the rail'])must(polishCss.includes(token),`Premium app chrome regression: missing ${token}`);
const polishJs=await read('dist/news/assets/js/fmb-news-mobile-app-polish.js');
for(const token of ['hideLegacyProductRails','cleanGlobalUtility','utility.remove()','fmb-mobile-polish'])must(polishJs.includes(token),`Premium app runtime regression: missing ${token}`);
const homeCss=await read('dist/news/assets/css/fmb-news-mobile-home.css');
for(const token of ['.fmb-app-brand-hero','color:#fff','fmb-app-lead h2'])must(homeCss.includes(token),`Mobile home visual regression: missing ${token}`);
const liveHeroCss=await read('dist/news/assets/css/fmb-news-mobile-home-live-hero.css');
for(const token of ['width:100%!important','max-width:none!important','overflow:hidden!important','border-radius:0','fmb-hero-readable-shade','fmb-hero-greeting','fmb-hero-live-overlay','font-size:clamp(38px','fmb-hero-weather-copy>strong'])must(liveHeroCss.includes(token),`Full-bleed live Home hero regression: missing ${token}`);
const homeJs=await read('dist/news/assets/js/fmb-news-mobile-home.js');
for(const token of ['Hello, night owl.','Good morning, news fan.','Hello, lunch-break reader.','Good afternoon, news fan.','Still up?','data-fmb-greeting-line'])must(homeJs.includes(token),`Dynamic Home greeting regression: missing ${token}`);
const contrastCss=await read('dist/news/assets/css/fmb-news-mobile-contrast-lock.css');
for(const token of ['Final mobile contrast lock','fmb-mobile-route-crossword .fmb-clue button','-webkit-text-fill-color:#27242a','fmb-cell input','world-hero h1','explainer-hero h1','brief-archive-hero h1'])must(contrastCss.includes(token),`Mobile text contrast regression: missing ${token}`);
const personalCss=await read('dist/news/assets/css/fmb-news-mobile-personalization.css');
for(const token of ['min-height:44px','z-index:2','cursor:pointer','focus-visible'])must(personalCss.includes(token),`Personalization touch-target regression: missing ${token}`);

const horoscopeHtml=pages.horoscope,horoscopeJs=await read('public/assets/js/fmb-news-weekly-horoscope.js');
must(horoscopeHtml.includes('Hindi hawak ng mga bituin ang ating kapalaran, meron tayong freewill gamitin natin'),'Horoscope free-will header missing');
for(const icon of ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'])must(horoscopeJs.includes(icon),`Horoscope zodiac icon missing: ${icon}`);
must(horoscopeHtml.includes('features-v2'),'Horoscope feature stylesheet/runtime version not updated');

const crosswordHtml=pages.crossword,crosswordJs=await read('dist/news/assets/js/fmb-news-weekly-crossword.js');
must(crosswordHtml.includes('35+ current-event answers'),'Crossword 35+ word promise missing');
must(crosswordJs.includes('MIN_WORDS=35'),'Crossword minimum word guard missing');
const entryCount=(crosswordJs.match(/\{id:'/g)||[]).length;must(entryCount>=35,`Crossword has only ${entryCount} answer entries`);
for(const token of ['PAXSILICA','IMPEACHMENT','PADILLA','DUTERTE','HABAGAT','PILANDOK','PAGASA','VISAYAS','MINDANAO','PAMPANGA','ZAMBALES'])must(crosswordJs.includes(token),`Current-events crossword regression: missing ${token}`);
for(const forbidden of ['data-cw-reveal-letter','data-cw-reveal-word','data-cw-reveal-puzzle','Reveal Letter','Reveal Word','Reveal Puzzle'])must(!crosswordHtml.includes(forbidden)&&!crosswordJs.includes(forbidden),`Active crossword must not expose reveal control: ${forbidden}`);
must(crosswordHtml.includes('The complete answer key is released only when the next weekly crossword goes live'),'Weekly answer-release policy missing');
must(crosswordJs.includes('releasedPuzzles=[]'),'Crossword answer-release gate missing');

const emblem=await read('dist/news/assets/images/brand/fmb-bulletin-emblem.svg');
must(emblem.includes('Gold shell-inspired emblem with a pearl center'),'Official FMB shell emblem missing');

const shards=(await readdir(resolve('public/assets/data/fmb-explained'))).filter(name=>name.endsWith('.json'));must(shards.length===9,`FMB Explainer must contain 9 shards; found ${shards.length}`);
let explainerCount=0;for(const shard of shards){const items=JSON.parse(await readFile(resolve('public/assets/data/fmb-explained',shard),'utf8'));explainerCount+=items.length}must(explainerCount===206,`FMB Explainer library must contain 206 topics; found ${explainerCount}`);

let builtPageCount=0;
async function scan(target){const info=await stat(target);if(info.isDirectory()){for(const e of await readdir(target))await scan(path.join(target,e));return}if(path.basename(target)!=='index.html')return;const text=await readFile(target,'utf8');builtPageCount++;must(text.includes('fmb-news-mobile-personalization.css?v=20260901-personal-v3'),`Personalization CSS v3 not injected in ${path.relative(root,target)}`);must(text.includes('fmb-news-mobile-global.css?v=20260901-global-v3'),`Global mobile CSS not injected in ${path.relative(root,target)}`);must(text.includes('fmb-news-mobile-global.js?v=20260901-global-v3'),`Global mobile runtime not injected in ${path.relative(root,target)}`);must(text.includes('fmb-news-mobile-products.css?v=20260901-products-v1'),`Dedicated product CSS not injected in ${path.relative(root,target)}`);must(text.includes('fmb-news-mobile-products.js?v=20260902-products-v3'),`Strict product runtime v3 not injected in ${path.relative(root,target)}`);must(text.includes('fmb-news-mobile-product-heroes.css?v=20260902-product-heroes-v4'),`Strict three-product hero CSS v4 not injected in ${path.relative(root,target)}`);must(text.includes('fmb-news-mobile-menu-holder.css?v=20260902-menu-holder-v2'),`Compact premium menu holder CSS not injected in ${path.relative(root,target)}`);must(text.includes('fmb-news-mobile-app-polish.css?v=20260902-polish-v2'),`Final app polish CSS v2 not injected in ${path.relative(root,target)}`);must(text.includes('fmb-news-mobile-app-polish.js?v=20260902-polish-v2'),`Final app polish runtime v2 not injected in ${path.relative(root,target)}`);must(text.includes('fmb-news-mobile-home-live-hero.css?v=20260902-live-hero-v2'),`Proportional live Home hero CSS not injected in ${path.relative(root,target)}`);must(text.includes('fmb-news-mobile-contrast-lock.css?v=20260902-contrast-v1'),`Contrast lock not injected in ${path.relative(root,target)}`);must(!text.includes('/news/news/assets/'),`Double-scoped asset in ${path.relative(root,target)}`)}
await scan(resolve('dist/news'));
console.log(`FMBNews verification passed: one compact premium mobile masthead/menu holder, strict shared Worldwide/Explainer/Daily Brief hero geometry with final Daily Brief specificity and no 206 badge or floating hero marks, proportional full-bleed Home hero, final contrast lock, eight dedicated route designs, 12-icon horoscope, ${entryCount}-entry current-events crossword with no active reveals, ${explainerCount} Explainer library topics, and full FMB shell coverage across ${builtPageCount} pages.`);
