import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block'});
const page=await context.newPage();

// Keep the QA deterministic. The app itself is served locally; external images,
// weather, auth and analytics are not required to prove the core mobile UI.
await page.route('https://**/*',route=>route.abort());

async function open(path){
  const response=await page.goto(`${base}${path}`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`${path} returned ${response?.status()}`);
}

await open('/news/');
await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});
assert.equal(await page.locator('.network-home').evaluate(el=>getComputedStyle(el).display),'none','Desktop publication home must be hidden on phone view.');
assert(await page.locator('[data-fmb-lead-story-image]').getAttribute('src'),'Mobile lead story image is missing.');
assert.equal(await page.locator('.fmb-app-story-list').count(),1,'Mobile story list missing.');

await page.evaluate(()=>localStorage.setItem('fmbNewsPrefsV1',JSON.stringify({daily:true,breaking:false,world:false,sections:['World']})));
await page.reload({waitUntil:'domcontentloaded'});
await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});
await page.waitForFunction(()=>document.querySelector('.fmb-app-story-list')?.dataset.fmbPersonalized==='true');

await page.locator('[data-fmb-account]').waitFor({state:'visible'});
await page.locator('[data-fmb-customize]').click();
await page.locator('.fmb-account-panel').waitFor({state:'visible'});
const culture=page.locator('[data-section="Culture"]');
// Exercise the visible preference label, matching the real touch target on mobile.
await culture.locator('xpath=..').click();
assert.equal(await culture.isChecked(),true,'Culture preference did not toggle from the visible label.');
await page.waitForFunction(()=>JSON.parse(localStorage.getItem('fmbNewsPrefsV1')||'{}').sections?.includes('Culture'));
await page.locator('[data-account-close]').last().click();

await open('/news/horoscope/');
await page.locator('[data-zodiac-grid]').waitFor({state:'visible'});
await page.locator('button[data-sign="Pisces"]').click();
assert.equal(await page.evaluate(()=>localStorage.getItem('fmbZodiacV1')),'Pisces','Horoscope preference did not persist.');
assert.equal((await page.locator('[data-horoscope-reading] h2').textContent())?.trim(),'Pisces','Horoscope reading did not update.');

await open('/news/crossword/');
await page.locator('[data-cw-grid]').waitFor({state:'visible'});
assert((await page.locator('[data-cw-grid]').locator('input,button').count())>0,'Crossword has no playable controls.');

await open('/news/explainer/leptospirosis-after-flood-resilience-metro-manila/');
await page.locator('article.article').waitFor({state:'visible'});
await page.locator('.fmb-mobile-reader-actions').waitFor({state:'visible'});
await page.locator('[data-fmb-reader-save]').click();
const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fmbSavedStoriesV1')||'[]'));
assert(saved.some(item=>item.path.includes('/news/explainer/leptospirosis-after-flood-resilience-metro-manila/')),'Reader Save did not persist the article.');
assert.equal(await page.locator('meta[property="og:type"]').getAttribute('content'),'article','Open Graph article metadata missing.');
const structured=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
assert.equal(structured['@type'],'NewsArticle','FMB Explained structured data is not NewsArticle.');
assert(structured.datePublished,'FMB Explained structured data is missing the real publication timestamp.');

await browser.close();
console.log('Mobile browser QA passed: app home, personalization, customization, horoscope, crossword, reader save, and FMB Explained metadata are functional.');
