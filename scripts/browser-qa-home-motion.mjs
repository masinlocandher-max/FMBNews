import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',reducedMotion:'no-preference'});
const page=await context.newPage();
await page.route('https://**/*',route=>route.abort());

const response=await page.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
assert(response?.ok(),`Home returned ${response?.status()}`);
await page.locator('.fmb-app-brand-hero').waitFor({state:'visible'});
await page.locator('.fmb-approved-hero-ticker-track').waitFor({state:'visible'});

const geometry=await page.evaluate(()=>{
  const copy=document.querySelector('.fmb-approved-hero-copy');
  const ticker=document.querySelector('.fmb-approved-hero-ticker');
  const utility=document.querySelector('.fmb-hero-live-overlay');
  const track=document.querySelector('.fmb-approved-hero-ticker-track');
  if(!copy||!ticker||!utility||!track)throw new Error('Home motion structure missing');
  const c=copy.getBoundingClientRect(),t=ticker.getBoundingClientRect(),u=utility.getBoundingClientRect();
  const style=getComputedStyle(track),utilityStyle=getComputedStyle(utility);
  const matrix=new DOMMatrixReadOnly(style.transform==='none'?'matrix(1,0,0,1,0,0)':style.transform);
  return{
    copyBottom:c.bottom,
    tickerTop:t.top,
    tickerBottom:t.bottom,
    utilityTop:u.top,
    utilityGap:parseFloat(utilityStyle.columnGap||utilityStyle.gap||'0'),
    animationName:style.animationName,
    animationDuration:style.animationDuration,
    x:matrix.m41,
    trackWidth:track.scrollWidth,
    windowWidth:document.querySelector('.fmb-approved-hero-ticker-window')?.clientWidth||0
  };
});

assert(geometry.tickerTop-geometry.copyBottom>=8,`Hero copy/ticker spacing is only ${(geometry.tickerTop-geometry.copyBottom).toFixed(1)}px`);
assert(Math.abs(geometry.tickerBottom-geometry.utilityTop)<=1,`Ticker and utility strip should meet cleanly, gap/overlap ${(geometry.utilityTop-geometry.tickerBottom).toFixed(1)}px`);
assert(geometry.utilityGap>=10,`Date/time/weather internal spacing is too tight (${geometry.utilityGap}px)`);
assert(geometry.trackWidth>geometry.windowWidth,`Ticker track is not wide enough to crawl (${geometry.trackWidth}px vs ${geometry.windowWidth}px)`);
assert(geometry.animationName.includes('fmbHomeHeadlineCrawl'),`Ticker crawl animation is not active (${geometry.animationName})`);

await page.waitForTimeout(900);
const movedX=await page.locator('.fmb-approved-hero-ticker-track').evaluate(track=>{
  const transform=getComputedStyle(track).transform;
  return new DOMMatrixReadOnly(transform==='none'?'matrix(1,0,0,1,0,0)':transform).m41;
});
assert(Math.abs(movedX-geometry.x)>=2,`Ticker is visually static (${geometry.x.toFixed(2)} → ${movedX.toFixed(2)})`);

await browser.close();
console.log(`Home motion QA passed: ticker moved ${(movedX-geometry.x).toFixed(1)}px, copy-to-ticker gap ${(geometry.tickerTop-geometry.copyBottom).toFixed(1)}px, utility gap ${geometry.utilityGap}px.`);
