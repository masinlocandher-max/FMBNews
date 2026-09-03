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

async function assertPersistentShell(page,path){
  const response=await page.goto(`${base}${path}`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`${path} returned ${response?.status()}`);
  const shell=page.locator('.fmb-mobile-app-shell');
  await shell.waitFor({state:'visible'});
  const geometry=await page.evaluate(()=>{
    const shell=document.querySelector('.fmb-mobile-app-shell');
    const search=document.querySelector('.fmb-mobile-shell-search');
    const brand=document.querySelector('.fmb-mobile-shell-brand');
    const menu=document.querySelector('[data-fmb-shell-menu]');
    const sr=search?.getBoundingClientRect(),br=brand?.getBoundingClientRect(),mr=menu?.getBoundingClientRect();
    return{
      shellPosition:shell?getComputedStyle(shell).position:'',shellTop:shell?getComputedStyle(shell).top:'',
      searchCenter:sr?sr.left+sr.width/2:999,brandCenter:br?br.left+br.width/2:999,menuCenter:mr?mr.left+mr.width/2:-999,
      viewport:innerWidth,icons:document.querySelectorAll('.fmb-mobile-product-rail svg').length
    };
  });
  assert.equal(geometry.shellPosition,'sticky',`${path} FMB shell must stay sticky.`);
  assert.equal(geometry.shellTop,'0px',`${path} FMB shell must pin to the top.`);
  assert(geometry.searchCenter<geometry.viewport*.25,`${path} search must stay on the left.`);
  assert(Math.abs(geometry.brandCenter-geometry.viewport/2)<=12,`${path} FMB logo is not centered.`);
  assert(geometry.menuCenter>geometry.viewport*.75,`${path} hamburger must always stay on the right.`);
  assert.equal(geometry.icons,5,`${path} must use the five-icon FMB product rail.`);
}

{
  const{context,page}=await makeContext({timezoneId:'America/New_York',reducedMotion:'no-preference'});
  await assertPersistentShell(page,'/news/');
  await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});

  assert.equal(await page.locator('.fmb-mobile-shell-head [data-fmb-shell-account]').count(),0,'Home shell must not build a standalone account button.');
  assert.equal(await page.locator('.fmb-approved-bottom-nav').count(),0,'Retired bottom navigation must not return.');
  assert.equal(await page.locator('[data-fmb-install-app]').count(),0,'PWA runtime must not build a floating Add to Home Screen button.');

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

  const tickerPosition=await page.locator('.fmb-app-top-ticker').evaluate(el=>({position:getComputedStyle(el).position,top:getComputedStyle(el).top}));
  assert.equal(tickerPosition.position,'sticky','Home Headlines ticker must stay attached below the sticky FMB shell.');
  assert.equal(tickerPosition.top,'100px','Home Headlines ticker must sit immediately below the 100px shell stack.');

  const menu=page.locator('[data-fmb-shell-menu]');
  await menu.focus();
  await menu.click();
  const dialog=page.locator('.fmb-app-action-panel[role="dialog"]');
  await dialog.waitFor({state:'visible'});
  assert(await page.evaluate(()=>Boolean(document.querySelector('.fmb-app-action-panel')?.contains(document.activeElement))),'Opening the menu must move focus inside the dialog.');
  const profile=page.locator('[data-fmb-open-account]');
  await profile.waitFor({state:'visible'});
  assert.equal(await profile.locator('svg').count(),1,'Your FMB profile icon must live inside the hamburger menu.');
  assert.equal((await profile.textContent())?.includes('Your FMB'),true,'Hamburger menu must expose Your FMB.');
  assert.equal(await page.locator('[data-fmb-install]').count(),1,'Add to Home Screen must live inside the hamburger menu.');
  await page.locator('[data-fmb-install]').click();
  await page.locator('.fmb-pwa-sheet').waitFor({state:'visible'});
  assert.equal(await page.locator('[data-fmb-install-app]').count(),0,'Opening install guidance must not create a sticky/floating install button.');
  await page.locator('.fmb-pwa-panel button').click();

  await menu.focus();
  await menu.click();
  await dialog.waitFor({state:'visible'});
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'detached'});
  assert(await menu.evaluate(el=>document.activeElement===el),'Closing the menu with Escape must restore focus to its opener.');

  await assertPersistentShell(page,'/news/world/');
  assert.equal(await page.locator('[data-fmb-shell-account]').count(),0,'Worldwide must not restore a standalone profile icon.');
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
console.log('Mobile stabilization browser QA passed: sticky shell, search-left/brand-center/hamburger-right geometry, profile inside menu, non-floating install flow, PHT authority, focus restoration, and reduced motion.');
