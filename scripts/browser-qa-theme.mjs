import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const LIGHT='rgb(244, 240, 232)';
const DARK='rgb(16, 19, 20)';

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
await page.waitForFunction(light=>getComputedStyle(document.body).backgroundColor===light,LIGHT,{timeout:1500});

await toggle.click();
assert.equal(await page.locator('html').getAttribute('data-fmb-theme-mode'),'light','First appearance cycle must select Light.');
assert.equal(await page.evaluate(()=>localStorage.getItem('fmbThemeModeV1')),'light','Light mode must persist.');
assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),LIGHT,'Light mode must paint Editorial Ivory.');

await toggle.click();
assert.equal(await page.locator('html').getAttribute('data-fmb-theme-mode'),'dark','Second appearance cycle must select Dark.');
assert.equal(await page.locator('html').getAttribute('data-fmb-theme'),'dark','Dark mode must resolve immediately.');
assert.equal(await page.evaluate(()=>localStorage.getItem('fmbThemeModeV1')),'dark','Dark mode must persist.');
await page.waitForFunction(dark=>getComputedStyle(document.body).backgroundColor===dark,DARK,{timeout:1500});
assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),DARK,'Dark mode must paint FMB Deep Charcoal.');

await page.reload({waitUntil:'domcontentloaded'});
await page.locator('[data-fmb-theme-control]').waitFor({state:'visible'});
assert.equal(await page.locator('html').getAttribute('data-fmb-theme-mode'),'dark','Persisted Dark mode must survive reload.');
assert.equal((await page.locator('[data-fmb-theme-label]').first().textContent())?.trim(),'Dark','Reloaded desktop control must reflect Dark mode.');
await page.waitForFunction(dark=>getComputedStyle(document.body).backgroundColor===dark,DARK,{timeout:1500});
await desktop.close();

const mobile=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',colorScheme:'dark'});
const mobilePage=await mobile.newPage();
await mobilePage.route('https://**/*',route=>route.abort());
response=await mobilePage.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
assert(response?.ok(),`Mobile Home returned ${response?.status()}`);
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme-mode'),'system','Fresh mobile context must default to System.');
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme'),'dark','System mode should resolve to the mobile context dark preference.');
await mobilePage.waitForFunction(dark=>getComputedStyle(document.body).backgroundColor===dark,DARK,{timeout:1500});

const directTheme=mobilePage.locator('[data-fmb-mobile-theme]');
await directTheme.waitFor({state:'visible'});
await directTheme.click();
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme-mode'),'light','Mobile header theme control must cycle System to Light.');
await mobilePage.waitForFunction(light=>getComputedStyle(document.body).backgroundColor===light,LIGHT,{timeout:1500});

await mobilePage.locator('[data-fmb-shell-menu]').click();
const appearance=mobilePage.locator('[data-fmb-theme-menu]');
await appearance.waitFor({state:'visible'});
assert.equal((await appearance.locator('[data-fmb-theme-label]').textContent())?.trim(),'Light','Mobile Appearance row must reflect the current Light mode.');
await appearance.click();
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme-mode'),'dark','Mobile Appearance row must cycle Light to Dark.');
assert.equal((await appearance.locator('[data-fmb-theme-label]').textContent())?.trim(),'Dark','Mobile Appearance row must update its label after cycling.');
await mobilePage.waitForFunction(dark=>getComputedStyle(document.body).backgroundColor===dark,DARK,{timeout:1500});
await mobile.close();

await browser.close();
console.log('FMB News appearance browser QA passed: System follows device preference, Editorial Ivory/Deep Charcoal paint correctly, persistence survives reload, and both mobile header/menu appearance controls stay synchronized.');