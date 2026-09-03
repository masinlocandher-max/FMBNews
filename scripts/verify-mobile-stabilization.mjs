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
const pwaJs=await read('public/assets/js/fmb-news-pwa.js');
const mobilePass=await read('scripts/hardfix-mobile-first-site.mjs');

for(const duplicate of ['WEATHER_KEY','weatherLabels','fetchWeather(','geocode(','weatherSheet(','data-fmb-local-time','data-fmb-weather-button']){
  must(!globalJs.includes(duplicate),`Shared mobile shell must not own Home clock/weather runtime: ${duplicate}`);
}
must(!globalJs.includes('.style.setProperty'),'Shared mobile shell must not paint presentation with inline style.setProperty');
must(!globalJs.includes('ensureBottomNav'),'Shared mobile shell must not contain bottom-nav generation');
must(!globalJs.includes('fmb-approved-bottom-nav'),'Shared mobile shell must not reference the retired bottom navigation');
must(globalJs.includes('aria-haspopup="dialog"'),'Mobile hamburger must expose its dialog relationship');
must(globalJs.includes("e.key==='Escape'")&&globalJs.includes('opener.focus({preventScroll:true})'),'Shared mobile action sheet must support Escape and restore focus');
must(globalJs.includes('focusableSelector')&&globalJs.includes("e.key!=='Tab'"),'Shared mobile action sheet must trap keyboard focus');

must(globalJs.includes('fmb-mobile-shell-actions fmb-mobile-shell-search'),'Search must occupy the left side of the shared masthead');
must(globalJs.includes('data-fmb-shell-menu'),'Shared masthead must contain the hamburger control');
must(!globalJs.includes('data-fmb-shell-account'),'No standalone profile/account control may exist in the mobile masthead');
must(globalJs.includes('data-fmb-open-account')&&globalJs.includes("${svg('account')}".replace("${svg('account')}","svg('account')")),'Your FMB profile must live inside the hamburger menu');
const shellTemplate=globalJs.match(/shell\.innerHTML=`<div class="fmb-mobile-shell-head">([\s\S]*?)<\/div>\$\{productRail/);
must(shellTemplate,'Shared mobile shell template missing');
const shellMarkup=shellTemplate[1];
must(shellMarkup.indexOf('fmb-mobile-shell-search')<shellMarkup.indexOf('${brand}')&&shellMarkup.indexOf('${brand}')<shellMarkup.indexOf('data-fmb-shell-menu'),'Masthead order must be search left, brand center, hamburger right');
must(globalJs.includes("new CustomEvent('fmb:install-request')"),'Hamburger install item must route through the PWA install controller');

for(const pht of ["timeZone:'Asia/Manila'",'phtHour(',' PHT'])must(homeJs.includes(pht),`Home must keep Philippine Standard Time authoritative: ${pht}`);
must(homeJs.includes("prefers-reduced-motion: reduce")&&homeJs.includes('clearInterval(sloganTimer)')&&homeJs.includes('reducedMotion.matches'),'Rotating Home slogan must stop when reduced motion is requested');
must(homeJs.includes("e.key==='Escape'")&&homeJs.includes('opener.focus({preventScroll:true})'),'Weather dialog must support Escape and restore focus');

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
must(materialCss.includes('body.fmb-mobile-first:not(.fmb-mobile-route-home) .fmb-mobile-product-rail'),'Internal product screens must share the compact editorial product rail');
must(materialCss.includes('--fmb-screen-gutter:16px'),'Internal routes must share the 16px mobile spacing system');

for(const token of ['position:sticky!important','grid-column:3!important','top:100px!important','.fmb-install-card{display:none!important','grid-template-columns:repeat(5,minmax(64px,1fr))']){
  must(navCss.includes(token),`Shared navigation lock missing: ${token}`);
}
must(!pwaJs.includes('.fmb-pwa-install{'),'PWA runtime must not create a floating/sticky install button');
must(pwaJs.includes("document.addEventListener('fmb:install-request',requestInstall)"),'PWA install sheet must be triggered from the hamburger flow');
must(pwaJs.includes('Safari controls the Apple system action'),'iOS install guidance must make Safari ownership explicit');

must(mobilePass.includes("const MOBILE_SYSTEM_FILE='fmb-news-mobile-system.css'"),'Mobile CSS must ship through the single system bundle');
must(mobilePass.includes("createHash('sha256')"),'Mobile CSS system bundle must be content-versioned');
must(mobilePass.includes('MOBILE_SYSTEM_SHEETS'),'Mobile CSS cascade order must remain explicit and verifiable');
must(mobilePass.includes("'fmb-news-mobile-navigation-lock.css'"),'Shared navigation lock must be bundled last');

console.log('Mobile stabilization contracts passed across Home and internal screens: one PHT runtime, sticky FMB shell, right-side hamburger, profile inside menu, no floating install button, accessible sheets, reduced motion, readable chrome, and route-wide spacing/polish.');
