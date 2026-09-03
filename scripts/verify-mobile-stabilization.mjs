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

must(mobilePass.includes("const MOBILE_SYSTEM_FILE='fmb-news-mobile-system.css'"),'Mobile CSS must ship through the single system bundle');
must(mobilePass.includes("createHash('sha256')"),'Mobile CSS system bundle must be content-versioned');
must(mobilePass.includes('MOBILE_SYSTEM_SHEETS'),'Mobile CSS cascade order must remain explicit and verifiable');

console.log('Mobile stabilization contracts passed: one PHT runtime, CSS-owned presentation, no hidden Home account/bottom nav, keyboard-safe sheets, reduced-motion slogan, and readable touch chrome.');
