import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFile(path.join(root,rel),'utf8');
const must=(value,message)=>{if(!value)throw new Error(message)};

const globalJs=await read('public/assets/js/fmb-news-mobile-global.js');
const homeJs=await read('public/assets/js/fmb-news-mobile-home.js');
const materialCss=await read('public/assets/css/fmb-news-mobile-material-polish.css');
const mobilePass=await read('scripts/hardfix-mobile-first-site.mjs');

for(const duplicate of ['WEATHER_KEY','weatherLabels','fetchWeather(','geocode(','weatherSheet(','data-fmb-local-time','data-fmb-weather-button']){
  must(!globalJs.includes(duplicate),`Shared mobile shell must not own Home clock/weather runtime: ${duplicate}`);
}
must(!globalJs.includes('.style.setProperty'),'Shared mobile shell must not paint presentation with inline style.setProperty');
must(!globalJs.includes('ensureBottomNav'),'Shared mobile shell must not contain bottom-nav generation');
must(!globalJs.includes('fmb-approved-bottom-nav'),'Shared mobile shell must not reference the retired bottom navigation');
must(globalJs.includes('aria-haspopup="dialog"'),'Home menu must expose its dialog relationship');
must(globalJs.includes("e.key==='Escape'")&&globalJs.includes('opener.focus({preventScroll:true})'),'Shared mobile action sheet must support Escape and restore focus');
must(globalJs.includes('focusableSelector')&&globalJs.includes("e.key!=='Tab'"),'Shared mobile action sheet must trap keyboard focus');

const homeShellMatch=globalJs.match(/if\(isHome\)\{[\s\S]*?\}\s*else\{/);
must(homeShellMatch&&!homeShellMatch[0].includes('data-fmb-shell-account'),'Home shell must contain menu + brand + search only, without a hidden account control');

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

must(mobilePass.includes("const MOBILE_SYSTEM_FILE='fmb-news-mobile-system.css'"),'Mobile CSS must ship through the single system bundle');
must(mobilePass.includes("createHash('sha256')"),'Mobile CSS system bundle must be content-versioned');
must(mobilePass.includes('MOBILE_SYSTEM_SHEETS'),'Mobile CSS cascade order must remain explicit and verifiable');

console.log('Mobile stabilization contracts passed across Home and internal screens: one PHT runtime, CSS-owned presentation, accessible sheets, reduced motion, readable chrome, and route-wide spacing/polish.');
