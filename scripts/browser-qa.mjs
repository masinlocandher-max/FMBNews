import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block'});
const page=await context.newPage();

// Keep QA deterministic. Local app assets remain available; external weather,
// auth, analytics and third-party imagery are not required for core UI proof.
await page.route('https://**/*',route=>route.abort());

async function open(path){
  const response=await page.goto(`${base}${path}`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`${path} returned ${response?.status()}`);
  await page.locator('.fmb-mobile-app-shell').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.body.classList.contains('fmb-mobile-product-page'));
  await page.waitForFunction(()=>document.documentElement.hasAttribute('data-fmb-mobile-polish'));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert(overflow<=1,`${path} has ${overflow}px horizontal page overflow`);
  const products=await page.locator('.fmb-mobile-product-rail>a').allTextContents();
  assert.deepEqual(products.map(v=>v.trim()),['FMB News','FMB Worldwide','FMB Explainer','FMB Daily Brief'],`${path} product rail drifted`);
  assert.equal(await page.locator('.fmb-mobile-product-rail:visible').count(),1,`${path} must have exactly one visible FMB product rail`);
  const duplicateRails=await page.evaluate(()=>[...document.querySelectorAll('nav')].filter(nav=>{
    if(nav.classList.contains('fmb-mobile-product-rail')||nav.closest('footer'))return false;
    const style=getComputedStyle(nav);if(style.display==='none'||style.visibility==='hidden')return false;
    const hrefs=[...nav.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')||'');
    const hits=[hrefs.some(h=>/^\/news\/?(?:$|[?#])/.test(h)),hrefs.some(h=>h.startsWith('/news/world')),hrefs.some(h=>h.startsWith('/news/explainer')),hrefs.some(h=>h.startsWith('/news/fmb-brief'))].filter(Boolean).length;
    return hits>=3;
  }).length);
  assert.equal(duplicateRails,0,`${path} exposes a duplicate legacy product navigation`);
  assert.equal(await page.locator('.fmb-global-week-actions:visible').count(),0,`${path} must not expose Horoscope/Crossword as top chrome`);
  const shellBox=await page.locator('.fmb-mobile-app-shell').boundingBox();
  assert(shellBox&&shellBox.height<=112,`${path} mobile chrome is too tall (${shellBox?.height}px)`);
  if(path==='/news/'||path==='/news'){
    assert.equal(await page.locator('.fmb-global-mobile-utility:visible').count(),1,'Home should retain one quiet date/weather context line');
    const utilityBox=await page.locator('.fmb-global-mobile-utility').boundingBox();
    assert(utilityBox&&utilityBox.height<=40,`Home date/weather context is too tall (${utilityBox?.height}px)`);
    const weather=(await page.locator('[data-fmb-weather]').first().textContent()||'').trim();
    assert(!/set local weather/i.test(weather),'Home weather must not look like an unfinished settings placeholder');
  }else{
    assert.equal(await page.locator('.fmb-global-mobile-utility:visible').count(),0,`${path} should start product content immediately after the product rail`);
  }
}

async function assertImage(selector,message){
  const image=page.locator(selector);
  await image.waitFor({state:'visible'});
  await page.waitForFunction(sel=>{const img=document.querySelector(sel);return img instanceof HTMLImageElement&&img.complete&&img.naturalWidth>0},selector);
  assert((await image.evaluate(img=>img.naturalWidth))>0,message);
}

async function assertReadable(selector,message){
  const el=page.locator(selector).first();
  await el.waitFor({state:'visible'});
  const info=await el.evaluate(node=>{const s=getComputedStyle(node);return{color:s.color,opacity:Number(s.opacity),visibility:s.visibility,fontSize:parseFloat(s.fontSize)}});
  assert(info.visibility!=='hidden'&&info.opacity>.2&&info.color!=='rgba(0, 0, 0, 0)'&&info.fontSize>=10,message);
}

// HOME: approved identity assets, readable hero, compact professional context, personalization, and one shell.
await open('/news/');
await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});
assert.equal(await page.locator('.network-home').evaluate(el=>getComputedStyle(el).display),'none','Desktop publication home must be hidden on phone view.');
assert.equal(await page.locator('.fmb-mobile-app-shell').count(),1,'Mobile app shell duplicated on home.');
assert.equal(await page.locator('.fmb-app-story-list').count(),1,'Mobile story list missing.');
await assertImage('[data-fmb-approved-hero]','Approved FMB hero failed to render.');
await assertImage('[data-fmb-approved-mug]','Approved Daily Brief mug failed to render.');
await assertReadable('.fmb-app-lead h2','Home hero headline is not readable.');

await page.evaluate(()=>localStorage.setItem('fmbNewsPrefsV1',JSON.stringify({daily:true,breaking:false,world:false,sections:['World']})));
await page.reload({waitUntil:'domcontentloaded'});
await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});
assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('fmbNewsPrefsV1')||'{}').sections),['World'],'Personalization preference did not persist across reload.');
await page.locator('[data-fmb-customize]').click();
await page.locator('.fmb-account-panel').waitFor({state:'visible'});
const culture=page.locator('[data-section="Culture"]');
await culture.check();
assert.equal(await culture.isChecked(),true,'Culture preference did not toggle.');
await page.waitForFunction(()=>JSON.parse(localStorage.getItem('fmbNewsPrefsV1')||'{}').sections?.includes('Culture'),null,{timeout:5000});
await page.locator('[data-account-close]').last().click();

// ARCHIVE: dedicated newsroom-index treatment.
await open('/news/archive/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'archive','Archive route art direction missing.');
await page.locator('.fmb-archive-signature').waitFor({state:'visible'});
await assertReadable('.fmb-archive-signature h1','Archive signature is unreadable.');
assert((await page.locator('.archive-row img').count())>0,'Archive must remain image-led.');

// WORLDWIDE: separate global-desk personality inside the same FMB system.
await open('/news/world/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'world','Worldwide route art direction missing.');
await page.locator('.fmb-world-signal').waitFor({state:'visible'});
await assertReadable('.world-hero h1','Worldwide headline is unreadable.');
await assertReadable('.world-hero p','Worldwide deck is unreadable.');
assert((await page.locator('.country-card').count())>=1,'Worldwide cards missing.');

// EXPLAINER: reference-library treatment and correct product name.
await open('/news/explainer/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'explainer','Explainer route art direction missing.');
await page.locator('.fmb-explainer-mark').waitFor({state:'visible'});
assert.equal((await page.locator('.explainer-hero h1').textContent())?.trim(),'FMB Explainer','FMB Explainer product name drifted.');
await assertReadable('.explainer-hero p','Explainer introduction is unreadable.');
await page.locator('#fmbExplainedSearch').waitFor({state:'visible'});

// DAILY BRIEF: executive briefing treatment with signature mug.
await open('/news/fmb-brief/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'brief','Daily Brief route art direction missing.');
await assertImage('.fmb-brief-signature-visual','Daily Brief signature mug failed to render.');
await assertReadable('.brief-archive-hero h1','Daily Brief heading is unreadable.');
assert((await page.locator('.brief-issue').count())>=1,'Daily Brief editions missing.');

// HOROSCOPE: all 12 signs, icons, free-will editorial statement, usable reading.
await open('/news/horoscope/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'horoscope','Horoscope route art direction missing.');
await page.locator('.fmb-horoscope-constellation').waitFor({state:'visible'});
assert((await page.locator('[data-zodiac-grid] button').count())===12,'Horoscope must show all 12 zodiac signs.');
assert((await page.locator('body').innerText()).includes('Hindi hawak ng mga bituin ang ating kapalaran, meron tayong freewill gamitin natin'),'Horoscope free-will header missing.');
await page.locator('button[data-sign="Pisces"]').click();
assert.equal(await page.evaluate(()=>localStorage.getItem('fmbZodiacV1')),'Pisces','Horoscope preference did not persist.');
assert.equal((await page.locator('[data-horoscope-reading] h2').textContent())?.trim(),'Pisces','Horoscope reading did not update.');

// CROSSWORD: 36-answer current-events desk, playable, no answer reveal controls.
await open('/news/crossword/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'crossword','Crossword route art direction missing.');
await page.locator('.fmb-crossword-count').waitFor({state:'visible'});
assert.equal((await page.locator('.fmb-crossword-count strong').textContent())?.trim(),'36','Crossword current-event answer count is wrong.');
await page.locator('[data-cw-grid]').waitFor({state:'visible'});
assert((await page.locator('[data-cw-grid] input').count())>0,'Crossword has no playable cells.');
const crosswordText=await page.locator('body').innerText();
for(const forbidden of ['Reveal Letter','Reveal Word','Reveal Puzzle'])assert(!crosswordText.includes(forbidden),`Crossword exposes forbidden control: ${forbidden}`);
assert(crosswordText.includes('The complete answer key is released only when the next weekly crossword goes live'),'Weekly crossword answer-release policy missing.');

// ABOUT: institutional manifesto remains visibly part of Filipino Media Bulletin.
await open('/news/about/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'about','About route art direction missing.');
await page.locator('.fmb-about-fmb-mark').waitFor({state:'visible'});
await assertReadable('.fmb-about-hero h1','About manifesto headline is unreadable.');

// ARTICLE: premium reading room, progress, Save, metadata.
await open('/news/explainer/leptospirosis-after-flood-resilience-metro-manila/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'explainer','Explainer article must stay in the Explainer product family.');
await page.locator('article.article').waitFor({state:'visible'});
await page.locator('.fmb-mobile-reader-actions').waitFor({state:'visible'});
await page.locator('.fmb-reading-progress').waitFor({state:'visible'});
await assertReadable('article.article h1','Article headline is unreadable.');
await page.locator('[data-fmb-reader-save]').click();
const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fmbSavedStoriesV1')||'[]'));
assert(saved.some(item=>item.path.includes('/news/explainer/leptospirosis-after-flood-resilience-metro-manila/')),'Reader Save did not persist the article.');
assert.equal(await page.locator('meta[property="og:type"]').getAttribute('content'),'article','Open Graph article metadata missing.');
const structured=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
assert.equal(structured['@type'],'NewsArticle','FMB Explainer structured data is not NewsArticle.');
assert(structured.datePublished,'FMB Explainer structured data is missing the publication timestamp.');

await browser.close();
console.log('Mobile browser QA passed: one compact premium FMB masthead and product rail, no duplicate legacy navigation, Home-only professional date/weather context, immediate internal product content, and dedicated Home, Archive, Worldwide, Explainer, Daily Brief, Horoscope, Crossword, About, and article experiences.');
