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

const fetchApproved=await read('scripts/fetch-approved-mobile-assets.mjs');
must(fetchApproved.includes('14fKTwMW0qnVi36eVSAjSBr05_VZgq4kf'),'Approved Philippines newsroom hero Drive asset is not locked');

const home=await read('dist/news/index.html');
for(const signal of ['FMB News','FMB Worldwide','FMB Explainer','FMB Daily Brief','data-fmb-mobile-home','fmb-approved-hero-copy','fmb-approved-hero-ticker','fmb-hero-live-overlay','data-fmb-greeting','data-fmb-greeting-line','data-fmb-local-time','data-fmb-weather-button','Read the Latest','Customize','Weekly Horoscope','FMB Crossword','/news/assets/images/mobile/fmb-mobile-hero.jpg','/news/assets/images/mobile/fmb-daily-brief-mug.jpg'])must(home.includes(signal),`Mobile home regression: missing ${signal}`);
must(!home.includes('FMB Explained'),'Obsolete FMB Explained label remains');

for(const asset of ['dist/news/assets/images/mobile/fmb-mobile-hero.jpg','dist/news/assets/images/mobile/fmb-daily-brief-mug.jpg']){
  const info=await stat(resolve(asset));must(info.size>20_000,`${asset} is missing or incomplete`);
}

const pages={
  news:await read('dist/news/archive/index.html'),world:await read('dist/news/world/index.html'),explainer:await read('dist/news/explainer/index.html'),brief:await read('dist/news/fmb-brief/index.html'),horoscope:await read('dist/news/horoscope/index.html'),crossword:await read('dist/news/crossword/index.html'),about:await read('dist/news/about/index.html')
};
for(const[name,html]of Object.entries(pages)){
  for(const label of ['FMB News','FMB Worldwide','FMB Explainer','FMB Daily Brief'])must(html.includes(label),`${name}: missing ${label}`);
  // The fifteen mobile stylesheets are served concatenated, in their original
  // order, as one system stylesheet versioned by a hash of its own bytes. These
  // used to be nine separate assertions on hand-typed ?v= literals, which meant
  // editing a sheet without bumping its literal shipped a stale file and still
  // passed. Assert the bundle is linked and content-versioned; its contents are
  // asserted below, against the authored sources.
  must(/fmb-news-mobile-system\.css\?v=[0-9a-f]{10}\b/.test(html),`${name}: content-versioned mobile system stylesheet missing`);
  for(const gone of ['fmb-news-mobile-personalization.css','fmb-news-mobile-home.css','fmb-news-mobile-global.css','fmb-news-mobile-products.css','fmb-news-mobile-product-heroes.css','fmb-news-mobile-menu-holder.css','fmb-news-mobile-app-polish.css','fmb-news-mobile-home-live-hero.css','fmb-news-mobile-contrast-lock.css'])
    must(!html.includes(`<link rel="stylesheet" href="/news/assets/css/${gone}`),`${name}: ${gone} is linked separately as well as bundled — duplicate cascade`);
  must(html.includes('fmb-news-mobile-global.js?v=20260901-global-v3'),`${name}: global mobile runtime v3 missing`);
  must(html.includes('fmb-news-mobile-products.js?v=20260902-products-v3'),`${name}: strict product runtime v3 missing`);
  must(html.includes('fmb-news-mobile-app-polish.js?v=20260902-polish-v2'),`${name}: final premium mobile polish runtime v2 missing`);
}

// The system stylesheet must carry every authored mobile sheet, in the order
// the cascade expects. Concatenation is only safe while that holds.
const systemCss=await read('dist/news/assets/css/fmb-news-mobile-system.css');
const systemOrder=['fmb-news-mobile-first-site.css','fmb-news-mobile-personalization.css','fmb-news-mobile-premium.css','fmb-news-mobile-home.css','fmb-news-mobile-global.css','fmb-news-mobile-products.css','fmb-news-mobile-app-polish.css','fmb-news-mobile-home-live-hero.css','fmb-news-mobile-home-motion.css','fmb-news-mobile-contrast-lock.css','fmb-news-mobile-product-heroes.css','fmb-news-mobile-menu-holder.css','fmb-news-mobile-final-tweaks.css','fmb-news-mobile-approved-home.css','fmb-news-mobile-material-polish.css'];
let cursor=-1;
for(const sheet of systemOrder){
  const at=systemCss.indexOf(`/* ===== ${sheet} ===== */`);
  must(at>cursor,`Mobile system stylesheet is missing ${sheet} or has it out of cascade order`);
  cursor=at;
  const source=await read(`dist/news/assets/css/${sheet}`);
  must(systemCss.includes(source.trim()),`Mobile system stylesheet does not match the authored ${sheet}`);
}
must(!/@import|@charset/i.test(systemCss),'Mobile system stylesheet must not contain @import/@charset');

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
for(const token of ['hideLegacyProductRails','cleanGlobalUtility','fmb-mobile-polish'])must(polishJs.includes(token),`Premium app runtime regression: missing ${token}`);
// This used to require `utility.remove()` — it asserted the workaround rather
// than the result. The shell built the utility strip and the fixed bottom bar,
// and the runtime tore them out again on every page. Neither is built now, so
// assert the outcome: the shared mobile runtime must not create either one.
const shellJs=await read('dist/news/assets/js/fmb-news-mobile-global.js');
for(const banned of ['fmb-global-mobile-utility','fmb-approved-bottom-nav','ensureBottomNav'])must(!shellJs.includes(banned),`Mobile shell must not build ${banned} — FMB has no fixed bottom navigation and no utility strip`);
must(!(await read('dist/news/assets/css/fmb-news-mobile-approved-home.css')).includes('fmb-approved-bottom-nav'),'Bottom-navigation styling must not ship');
const homeCss=await read('dist/news/assets/css/fmb-news-mobile-home.css');
for(const token of ['.fmb-app-brand-hero','color:#fff','fmb-app-lead h2'])must(homeCss.includes(token),`Mobile home visual regression: missing ${token}`);
const liveHeroCss=await read('dist/news/assets/css/fmb-news-mobile-home-live-hero.css');
for(const token of ['Approved FMB News mobile hero','aspect-ratio:16/10.6','fmb-approved-hero-copy','fmb-approved-hero-cta','fmb-approved-hero-ticker','height:40px','fmb-hero-weather-copy>strong'])must(liveHeroCss.includes(token),`Approved Home hero regression: missing ${token}`);
const homeJs=await read('dist/news/assets/js/fmb-news-mobile-home.js');
for(const token of ['Hello, night owl.','Good morning.','Good afternoon.','Good evening.','Still up?','The world is still moving. Here’s what changed.','data-fmb-greeting-line'])must(homeJs.includes(token),`Dynamic Home greeting regression: missing ${token}`);
const contrastCss=await read('dist/news/assets/css/fmb-news-mobile-contrast-lock.css');
for(const token of ['Final mobile contrast lock','fmb-mobile-route-crossword .fmb-clue button','-webkit-text-fill-color:#27242a','fmb-cell input','world-hero h1','explainer-hero h1','brief-archive-hero h1'])must(contrastCss.includes(token),`Mobile text contrast regression: missing ${token}`);
const personalCss=await read('dist/news/assets/css/fmb-news-mobile-personalization.css');
for(const token of ['min-height:44px','z-index:2','cursor:pointer','focus-visible'])must(personalCss.includes(token),`Personalization touch-target regression: missing ${token}`);

const horoscopeHtml=pages.horoscope,horoscopeJs=await read('public/assets/js/fmb-news-weekly-horoscope.js');
must(horoscopeHtml.includes('Hindi hawak ng mga bituin ang ating kapalaran, meron tayong freewill gamitin natin'),'Horoscope free-will header missing');
for(const icon of ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'])must(horoscopeJs.includes(icon),`Horoscope zodiac icon missing: ${icon}`);
must(horoscopeHtml.includes('features-v2'),'Horoscope feature stylesheet/runtime version not updated');

const crosswordHtml=pages.crossword,crosswordJs=await read('dist/news/assets/js/fmb-news-weekly-crossword.js');
const crosswordLayout=JSON.parse(await read('dist/news/assets/data/fmb-crossword-current.json'));
const entryCount=crosswordLayout.length;
must(crosswordHtml.includes('35+ current-event answers'),'Crossword 35+ word promise missing');
must(entryCount>=35,`Crossword has only ${entryCount} layout entries`);
must(crosswordJs.includes('fmb-crossword-current.json'),'Crossword secure layout runtime missing');
must(!crosswordJs.includes('answer:')&&!crosswordJs.includes('answer=')&&!JSON.stringify(crosswordLayout).includes('"answer"'),'Active crossword answer data must not ship to browsers');
must(crosswordHtml.includes('ACTIVE PUZZLE • ANSWERS EMBARGOED'),'Crossword AI embargo banner missing');
must(crosswordHtml.includes('provided as a screenshot or image'),'Crossword screenshot embargo missing');
for(const forbidden of ['data-cw-reveal-letter','data-cw-reveal-word','data-cw-reveal-puzzle','Reveal Letter','Reveal Word','Reveal Puzzle'])must(!crosswordHtml.includes(forbidden)&&!crosswordJs.includes(forbidden),`Active crossword must not expose reveal control: ${forbidden}`);
must(crosswordHtml.includes('The complete answer key is released only when the next weekly crossword goes live'),'Weekly answer-release policy missing');

const emblem=await read('dist/news/assets/images/brand/fmb-bulletin-emblem.svg');
must(emblem.includes('Gold shell-inspired emblem with a pearl center'),'Official FMB shell emblem missing');

const shards=(await readdir(resolve('public/assets/data/fmb-explained'))).filter(name=>name.endsWith('.json'));must(shards.length===9,`FMB Explainer must contain 9 shards; found ${shards.length}`);
let explainerCount=0;for(const shard of shards){const items=JSON.parse(await readFile(resolve('public/assets/data/fmb-explained',shard),'utf8'));explainerCount+=items.length}must(explainerCount===206,`FMB Explainer library must contain 206 topics; found ${explainerCount}`);

let builtPageCount=0;
// Every built page must carry the whole mobile system. This used to be eight
// separate assertions on hand-typed ?v= literals — which passed even when a
// sheet had been edited without its literal being bumped. The stylesheets are
// now one content-versioned bundle, so assert that; the runtimes are still
// separate files and keep their own checks.
async function scan(target){
  const info=await stat(target);
  if(info.isDirectory()){for(const e of await readdir(target))await scan(path.join(target,e));return}
  if(path.basename(target)!=='index.html')return;
  const text=await readFile(target,'utf8');
  builtPageCount++;
  const where=path.relative(root,target);
  must(/fmb-news-mobile-system\.css\?v=[0-9a-f]{10}\b/.test(text),`Mobile system stylesheet not injected in ${where}`);
  must(text.includes('fmb-news-mobile-global.js?v=20260901-global-v3'),`Global mobile runtime not injected in ${where}`);
  must(text.includes('fmb-news-mobile-products.js?v=20260902-products-v3'),`Strict product runtime v3 not injected in ${where}`);
  must(text.includes('fmb-news-mobile-app-polish.js?v=20260902-polish-v2'),`Final app polish runtime v2 not injected in ${where}`);
  must(!text.includes('/news/news/assets/'),`Double-scoped asset in ${where}`);
}
await scan(resolve('dist/news'));
console.log(`FMBNews verification passed: approved Philippines newsroom hero with real HTML overlay and Read the Latest / Customize CTAs, one compact premium mobile masthead/menu holder, strict shared Worldwide/Explainer/Daily Brief hero geometry, final contrast lock, eight dedicated route designs, 12-icon horoscope, ${entryCount}-entry current-events crossword with no active reveals, ${explainerCount} Explainer library topics, and full FMB shell coverage across ${builtPageCount} pages.`);
