import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});

const desktop=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block',colorScheme:'light'});
const page=await desktop.newPage();
await page.route('https://**/*',route=>route.abort());
let response=await page.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
assert(response?.ok(),`Desktop Home returned ${response?.status()}`);

const toggle=page.locator('[data-fmb-theme-control]');
await toggle.waitFor({state:'visible'});
assert.equal(await page.locator('html').getAttribute('data-fmb-theme-mode'),'system','Default appearance mode must be System.');
assert.equal(await page.locator('html').getAttribute('data-fmb-theme'),'light','System mode should resolve to the desktop context light preference.');
assert.equal((await toggle.locator('[data-fmb-theme-label]').textContent())?.trim(),'System','Desktop control must expose System label.');
const initialLight=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor);
assert.equal(initialLight,'rgb(244, 239, 230)','Editorial Light mode must paint the warm ivory canvas.');

await toggle.click();
assert.equal(await page.locator('html').getAttribute('data-fmb-theme-mode'),'light','First appearance cycle must select Light.');
assert.equal(await page.evaluate(()=>localStorage.getItem('fmbThemeModeV1')),'light','Light mode must persist.');

await toggle.click();
assert.equal(await page.locator('html').getAttribute('data-fmb-theme-mode'),'dark','Second appearance cycle must select Dark.');
assert.equal(await page.locator('html').getAttribute('data-fmb-theme'),'dark','Dark mode must resolve immediately.');
assert.equal(await page.evaluate(()=>localStorage.getItem('fmbThemeModeV1')),'dark','Dark mode must persist.');
await page.waitForFunction(()=>getComputedStyle(document.body).backgroundColor==='rgb(14, 18, 19)',null,{timeout:1500});
const darkBackground=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor);
assert.equal(darkBackground,'rgb(14, 18, 19)','Editorial Dark mode must paint newsroom black.');

await page.reload({waitUntil:'domcontentloaded'});
await page.locator('[data-fmb-theme-control]').waitFor({state:'visible'});
assert.equal(await page.locator('html').getAttribute('data-fmb-theme-mode'),'dark','Persisted Dark mode must survive reload.');
assert.equal((await page.locator('[data-fmb-theme-label]').first().textContent())?.trim(),'Dark','Reloaded desktop control must reflect Dark mode.');
await desktop.close();

const mobile=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',colorScheme:'dark'});
const mobilePage=await mobile.newPage();
await mobilePage.route('https://**/*',route=>route.abort());
response=await mobilePage.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
assert(response?.ok(),`Mobile Home returned ${response?.status()}`);
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme-mode'),'system','Fresh mobile context must default to System.');
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme'),'dark','System mode should resolve to the mobile context dark preference.');
await mobilePage.locator('.fmb-mobile-app-shell').first().waitFor({state:'attached'});
const shellDiagnostics=await mobilePage.evaluate(()=>{
  const shellRules=[];
  for(const sheet of [...document.styleSheets]){
    let rules=[];
    try{rules=[...(sheet.cssRules||[])]}catch{continue}
    const walk=(items,media='')=>{
      for(const rule of items){
        if(rule.cssRules){
          const nextMedia=rule.media?.mediaText||media;
          walk([...rule.cssRules],nextMedia);
          continue;
        }
        if(rule.selectorText?.includes('.fmb-mobile-app-shell'))shellRules.push({href:sheet.href||'inline',media,selector:rule.selectorText,css:rule.style?.cssText||''});
      }
    };
    walk(rules);
  }
  return{
    innerWidth,
    devicePixelRatio,
    mobileMedia:matchMedia('(max-width:699px)').matches,
    bodyClass:document.body.className,
    theme:document.documentElement.getAttribute('data-fmb-theme'),
    themeMode:document.documentElement.getAttribute('data-fmb-theme-mode'),
    shells:[...document.querySelectorAll('.fmb-mobile-app-shell')].map((el,index)=>({
      index,
      className:el.className,
      inline:el.getAttribute('style')||'',
      background:getComputedStyle(el).backgroundColor,
      display:getComputedStyle(el).display,
      position:getComputedStyle(el).position,
      rect:{width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,top:el.getBoundingClientRect().top},
      parent:el.parentElement?.tagName||''
    })),
    themeLinks:[...document.querySelectorAll('link[rel="stylesheet"]')].filter(link=>link.href.includes('fmb-news-theme')||link.href.includes('fmb-news-mobile-system')).map(link=>({href:link.href,loaded:Boolean(link.sheet)})),
    shellRules
  };
});
console.log('MOBILE_THEME_DIAGNOSTICS '+JSON.stringify(shellDiagnostics));
assert.equal(shellDiagnostics.mobileMedia,true,'iPhone QA context must match the mobile stylesheet breakpoint.');
assert.equal(shellDiagnostics.shells.length,1,`Mobile Home must expose exactly one editorial shell; diagnostics: ${JSON.stringify(shellDiagnostics.shells)}`);
assert.equal(shellDiagnostics.shells[0].background,'rgb(11, 15, 17)',`Mobile editorial masthead must remain newsroom black; diagnostics: ${JSON.stringify(shellDiagnostics)}`);

await mobilePage.locator('[data-fmb-shell-menu]').click();
const appearance=mobilePage.locator('[data-fmb-theme-menu]');
await appearance.waitFor({state:'visible'});
assert.equal((await appearance.locator('[data-fmb-theme-label]').textContent())?.trim(),'System','Mobile Appearance row must expose System label.');
await appearance.click();
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme-mode'),'light','Mobile Appearance row must cycle to Light.');
assert.equal((await appearance.locator('[data-fmb-theme-label]').textContent())?.trim(),'Light','Mobile Appearance row must update its label after cycling.');
const lightToken=await mobilePage.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--fmb-theme-bg').trim());
assert.equal(lightToken,'#f4efe6','Mobile Light mode must resolve the warm ivory editorial token even while persistent app chrome stays black.');
await mobile.close();

await browser.close();
console.log('FMB News appearance browser QA passed: System follows device preference, editorial ivory/black surfaces resolve correctly, persistence survives reload, and mobile Appearance keeps the permanent newsroom-black app chrome.');