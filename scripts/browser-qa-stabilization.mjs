import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});

async function makeContext(options={}){
  const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',...options});
  const page=await context.newPage();
  await page.route('https://**/*',route=>route.abort());
  return{context,page};
}

{
  const{context,page}=await makeContext({timezoneId:'America/New_York',reducedMotion:'no-preference'});
  const response=await page.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`Home returned ${response?.status()}`);
  await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});
  await page.locator('.fmb-mobile-app-shell').waitFor({state:'visible'});

  assert.equal(await page.locator('.fmb-mobile-shell-head [data-fmb-shell-account]').count(),0,'Home shell must not build a hidden account button.');
  assert.equal(await page.locator('.fmb-approved-bottom-nav').count(),0,'Retired bottom navigation must not return.');

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
  assert.equal(pht.actual,pht.expected,`Home clock must stay in Philippine Standard Time even for a New York device (${pht.actual} vs ${pht.expected}).`);

  const menu=page.locator('[data-fmb-shell-menu]');
  await menu.focus();
  await menu.click();
  const dialog=page.locator('.fmb-app-action-panel[role="dialog"]');
  await dialog.waitFor({state:'visible'});
  assert(await page.evaluate(()=>Boolean(document.querySelector('.fmb-app-action-panel')?.contains(document.activeElement))),'Opening the menu must move focus inside the dialog.');
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'detached'});
  assert(await menu.evaluate(el=>document.activeElement===el),'Closing the menu with Escape must restore focus to its opener.');
  await context.close();
}

{
  const{context,page}=await makeContext({reducedMotion:'reduce'});
  const response=await page.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`Reduced-motion Home returned ${response?.status()}`);
  await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});
  const animation=await page.locator('.fmb-app-top-ticker .fmb-approved-hero-ticker-track').evaluate(el=>getComputedStyle(el).animationName);
  assert.equal(animation,'none',`Ticker animation must stop for reduced motion; got ${animation}.`);
  const prefers=await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  assert.equal(prefers,true,'Reduced-motion browser context was not honored.');
  await context.close();
}

await browser.close();
console.log('Mobile stabilization browser QA passed: PHT is authoritative, Home chrome is minimal, sheets restore focus, and reduced motion stops ticker movement.');
