import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFile(path.join(root,rel),'utf8');
const must=(value,message)=>{if(!value)throw new Error(message)};

const globalJs=await read('public/assets/js/fmb-news-mobile-global.js');
const homeJs=await read('public/assets/js/fmb-news-mobile-home.js');
const materialCss=await read('public/assets/css/fmb-news-mobile-material-polish.css');
const navCss=await read('public/assets/css/fmb-news-mobile-navigation-lock.css');
const refreshCss=await read('public/assets/css/fmb-news-editorial-refresh.css');
const pwaJs=await read('public/assets/js/fmb-news-pwa.js');
const mobilePass=await read('scripts/hardfix-mobile-first-site.mjs');

for(const duplicate of ['WEATHER_KEY','weatherLabels','fetchWeather(','geocode(','weatherSheet(','data-fmb-local-time','data-fmb-weather-button']){
  must(!globalJs.includes(duplicate),`Shared mobile shell must not own Home clock/weather runtime: ${duplicate}`);
}
must(!globalJs.includes('.style.setProperty'),'Shared mobile shell must not paint presentation with inline style.setProperty');

for(const token of [
  'mountBottomNav',
  'fmb-mobile-bottom-nav',
  '<span>Home</span>',
  '<span>World</span>',
  '<span>Sports</span>',
  '<span>Briefing</span>',
  '<span>Menu</span>',
  'data-fmb-mobile-theme',
  "new CustomEvent('fmb:theme-cycle')",
  "['sports','/news/sports/','Sports']",
  "['entertainment','/news/horoscope/','Entertainment']",
])must(globalJs.includes(token),`Approved mobile navigation contract missing: ${token}`);

must(globalJs.includes('aria-haspopup="dialog"'),'Mobile menu must expose its dialog relationship');
must(globalJs.includes("e.key==='Escape'")&&globalJs.includes('opener.focus({preventScroll:true})'),'Shared mobile action sheet must support Escape and restore focus');
must(globalJs.includes('focusableSelector')&&globalJs.includes("e.key!=='Tab'"),'Shared mobile action sheet must trap keyboard focus');
must(globalJs.includes('data-fmb-open-account')&&globalJs.includes("svg('account')"),'Your FMB account entry must remain inside the menu');
must(globalJs.includes("new CustomEvent('fmb:install-request')"),'Menu install item must route through the PWA install controller');
must(globalJs.includes("const ticker=$('.fmb-app-top-ticker')")&&globalJs.includes('if(ticker)shell.append(ticker)'),'Home Latest rail must remain inside the sticky mobile shell');

const shellTemplate=globalJs.match(/shell\.innerHTML=`<div class="fmb-mobile-shell-head">([\s\S]*?)<\/div>\$\{categoryRail/);
must(shellTemplate,'Shared mobile shell template missing');
const shellMarkup=shellTemplate[1];
must(shellMarkup.indexOf('${brand}')>=0&&shellMarkup.indexOf('${actions}')>shellMarkup.indexOf('${brand}'),'Masthead must keep FMB identity left and Search/Theme/Menu utilities right');

for(const pht of ["timeZone:'Asia/Manila'",'phtHour(',' PHT'])must(homeJs.includes(pht),`Home must keep Philippine Standard Time authoritative: ${pht}`);
must(homeJs.includes("prefers-reduced-motion: reduce")&&homeJs.includes('clearInterval(sloganTimer)')&&homeJs.includes('reducedMotion.matches'),'Rotating Home copy must stop when reduced motion is requested');
must(homeJs.includes("e.key==='Escape'")&&homeJs.includes('opener.focus({preventScroll:true})'),'Weather dialog must support Escape and restore focus while that Home utility remains available');

for(const token of ['font-size:8.8px!important','font-size:8.2px!important','font-size:9px!important','font-size:9.5px!important','min-width:44px!important']){
  must(materialCss.includes(token),`Critical mobile readability/touch-target override missing: ${token}`);
}
const routePolish={
  archive:['fmb-mobile-route-archive .archive-row','border-radius:0!important'],
  world:['fmb-mobile-route-world .country-card','font-size:13px!important'],
  explainer:['fmb-mobile-route-explainer .explained-item','font-size:15px!important'],
  brief:['fmb-mobile-route-brief .brief-issue','font-size:18px!important'],
  horoscope:['fmb-mobile-route-horoscope .fmb-zodiac-grid button','border-radius:var(--fmb-screen-radius)!important'],
  crossword:['fmb-mobile-route-crossword .fmb-crossword-toolbar button','min-height:44px!important'],
  about:['fmb-mobile-route-about .fmb-about-method-list li','font-size:14px!important'],
  article:['fmb-mobile-route-article .article-body p','font-size:17.5px!important']
};
for(const[route,tokens]of Object.entries(routePolish))for(const token of tokens)must(materialCss.includes(token),`All-screen mobile polish missing for ${route}: ${token}`);

for(const token of [
  '.fmb-mobile-bottom-nav',
  'grid-template-columns:repeat(5,minmax(0,1fr))',
  '.fmb-mobile-shell-brand',
  '.fmb-mobile-shell-actions',
  '.fmb-mobile-product-rail',
  '--fmb-crimson:#A71930',
  'env(safe-area-inset-bottom,0px)',
])must(refreshCss.includes(token),`Editorial mobile refresh missing: ${token}`);

for(const token of ['position:sticky!important','.fmb-mobile-app-shell>.fmb-app-top-ticker','position:relative!important','top:auto!important','.fmb-install-card{display:none!important']){
  must(navCss.includes(token),`Shared navigation lock missing: ${token}`);
}
must(!pwaJs.includes('.fmb-pwa-install{'),'PWA runtime must not create a floating/sticky install button');
must(pwaJs.includes("document.addEventListener('fmb:install-request',requestInstall)"),'PWA install sheet must be triggered from the menu flow');
must(pwaJs.includes('Safari controls the Apple system action'),'iOS install guidance must make Safari ownership explicit');

must(mobilePass.includes("const MOBILE_SYSTEM_FILE='fmb-news-mobile-system.css'"),'Mobile CSS must ship through the single system bundle');
must(mobilePass.includes("createHash('sha256')"),'Mobile CSS system bundle must be content-versioned');
must(mobilePass.includes('MOBILE_SYSTEM_SHEETS'),'Mobile CSS cascade order must remain explicit and verifiable');
must(mobilePass.includes("'fmb-news-mobile-navigation-lock.css'"),'Shared navigation lock must remain last in the legacy mobile bundle');
must(mobilePass.includes('v=20260901-global-v3&build=editorial-v5'),'Refreshed mobile shell runtime must be cache-busted without breaking the stable asset key');
must(mobilePass.includes('content="#F4F0E8"'),'PWA first-paint theme color must match Editorial Ivory');

console.log('Mobile stabilization contracts passed: FMB identity left, Search/Theme/Menu right, editorial category rail, five-item Home/World/Sports/Briefing/Menu dock, accessible menu sheets, one Home-owned PHT/weather runtime, PWA install flow, and route-wide readability safeguards.');