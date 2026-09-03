import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});

const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',reducedMotion:'no-preference',timezoneId:'America/New_York'});
const page=await context.newPage();
await page.route('https://**/*',route=>route.abort());

const response=await page.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
assert(response?.ok(),`Home returned ${response?.status()}`);
await page.locator('.fmb-app-brand-hero').waitFor({state:'visible'});
await page.locator('.fmb-app-top-ticker .fmb-approved-hero-ticker-track').waitFor({state:'visible'});

assert.equal(await page.locator('.fmb-mobile-shell-head [data-fmb-shell-account]').count(),0,'Home shell must not build the retired account control.');
const inlinePresentation=await page.evaluate(()=>({
  head:document.querySelector('.fmb-mobile-shell-head')?.getAttribute('style')||'',
  active:document.querySelector('.fmb-mobile-product-rail a[aria-current="page"]')?.getAttribute('style')||'',
  ticker:document.querySelector('.fmb-app-top-ticker .fmb-approved-hero-ticker-track')?.getAttribute('style')||''
}));
for(const[key,value]of Object.entries(inlinePresentation))assert.equal(value,'',`${key} must not carry inline presentation styles: ${value}`);

const pht=await page.evaluate(()=>{
  const now=new Date();
  const expected=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true}).format(now)+' PHT';
  return{expected,actual:(document.querySelector('[data-fmb-local-time]')?.textContent||'').trim()};
});
assert.equal(pht.actual,pht.expected,`Home clock must remain Philippine Standard Time on a New York device (${pht.actual} vs ${pht.expected}).`);

const geometry=await page.evaluate(()=>{
  const hero=document.querySelector('.fmb-app-brand-hero');
  const copy=document.querySelector('.fmb-approved-hero-copy');
  const ticker=document.querySelector('.fmb-app-top-ticker');
  const utility=document.querySelector('.fmb-hero-live-overlay');
  const track=document.querySelector('.fmb-app-top-ticker .fmb-approved-hero-ticker-track');
  if(!hero||!copy||!ticker||!utility||!track)throw new Error('Approved home motion structure missing');
  const h=hero.getBoundingClientRect(),c=copy.getBoundingClientRect(),t=ticker.getBoundingClientRect(),u=utility.getBoundingClientRect();
  const style=getComputedStyle(track),utilityStyle=getComputedStyle(utility);
  const matrix=new DOMMatrixReadOnly(style.transform==='none'?'matrix(1,0,0,1,0,0)':style.transform);
  return{
    heroTop:h.top,heroBottom:h.bottom,
    copyLeft:c.left,copyRight:c.right,copyTop:c.top,copyBottom:c.bottom,
    tickerTop:t.top,tickerBottom:t.bottom,
    utilityLeft:u.left,utilityRight:u.right,utilityTop:u.top,utilityBottom:u.bottom,
    utilityGap:parseFloat(utilityStyle.columnGap||utilityStyle.gap||'0'),
    animationName:style.animationName,
    animationDuration:style.animationDuration,
    x:matrix.m41,
    trackWidth:track.scrollWidth,
    windowWidth:document.querySelector('.fmb-app-top-ticker .fmb-approved-hero-ticker-window')?.clientWidth||0
  };
});

assert(geometry.tickerBottom<=geometry.heroTop+1,`Approved ticker must remain above the cinematic hero (${(geometry.tickerBottom-geometry.heroTop).toFixed(1)}px overlap)`);
assert(geometry.heroTop-geometry.tickerBottom<=14,`Approved ticker is detached from the hero (${(geometry.heroTop-geometry.tickerBottom).toFixed(1)}px gap)`);
assert(geometry.utilityTop>=geometry.heroTop&&geometry.utilityBottom<=geometry.heroBottom,'Date/time overlay escaped the cinematic hero.');
const verticalOverlap=Math.min(geometry.copyBottom,geometry.utilityBottom)-Math.max(geometry.copyTop,geometry.utilityTop);
if(verticalOverlap>0)assert(geometry.copyRight<=geometry.utilityLeft+2,`Hero slogan and date/time overlap by ${(geometry.copyRight-geometry.utilityLeft).toFixed(1)}px`);
assert(geometry.utilityGap>=6,`Date/time internal spacing is too tight (${geometry.utilityGap}px)`);
assert(geometry.trackWidth>geometry.windowWidth,`Ticker track is not wide enough to crawl (${geometry.trackWidth}px vs ${geometry.windowWidth}px)`);
assert.equal(geometry.animationName,'fmbTickerCrawl',`Ticker crawl animation is not active (${geometry.animationName})`);

await page.waitForTimeout(900);
const movedX=await page.locator('.fmb-app-top-ticker .fmb-approved-hero-ticker-track').evaluate(track=>{
  const transform=getComputedStyle(track).transform;
  return new DOMMatrixReadOnly(transform==='none'?'matrix(1,0,0,1,0,0)':transform).m41;
});
assert(Math.abs(movedX-geometry.x)>=2,`Ticker is visually static (${geometry.x.toFixed(2)} → ${movedX.toFixed(2)})`);

const menu=page.locator('[data-fmb-shell-menu]');
await menu.focus();await menu.click();
const dialog=page.locator('.fmb-app-action-panel[role="dialog"]');
await dialog.waitFor({state:'visible'});
assert(await page.evaluate(()=>Boolean(document.querySelector('.fmb-app-action-panel')?.contains(document.activeElement))),'Opening the menu must move focus into its dialog.');
await page.keyboard.press('Escape');
await dialog.waitFor({state:'detached'});
assert(await menu.evaluate(el=>document.activeElement===el),'Escape must close the menu and restore focus to its opener.');
await context.close();

const reducedContext=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',reducedMotion:'reduce'});
const reducedPage=await reducedContext.newPage();
await reducedPage.route('https://**/*',route=>route.abort());
const reducedResponse=await reducedPage.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
assert(reducedResponse?.ok(),`Reduced-motion Home returned ${reducedResponse?.status()}`);
await reducedPage.locator('.fmb-app-top-ticker .fmb-approved-hero-ticker-track').waitFor({state:'visible'});
const reducedAnimation=await reducedPage.locator('.fmb-app-top-ticker .fmb-approved-hero-ticker-track').evaluate(track=>getComputedStyle(track).animationName);
assert.equal(reducedAnimation,'none',`Ticker must stop for reduced motion; got ${reducedAnimation}`);
assert(await reducedPage.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),'Reduced-motion media query must be active.');
await reducedContext.close();

await browser.close();
console.log(`Approved Home stabilization QA passed: ticker moved ${(movedX-geometry.x).toFixed(1)}px normally, PHT stayed authoritative, menu focus restored, and reduced motion stopped animation.`);
