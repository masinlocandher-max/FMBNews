import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',timezoneId:'Asia/Manila'});
const page=await context.newPage();
await page.route('https://**/*',route=>route.abort());

const expectedRail=['News','World','Sports','Briefing','Fact Check','Explainers','Entertainment'];
const expectedDock=['Home','World','Sports','Briefing','Menu'];

async function open(path){
  const response=await page.goto(`${base}${path}`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`${path} returned ${response?.status()}`);
  const shell=page.locator('.fmb-mobile-app-shell');
  await shell.waitFor({state:'visible'});
  const dock=page.locator('.fmb-mobile-bottom-nav');
  await dock.waitFor({state:'visible'});

  const state=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-window.innerWidth,
    brand:(document.querySelector('.fmb-mobile-shell-brand')?.textContent||'').replace(/\s+/g,' ').trim(),
    hasBrandImage:Boolean(document.querySelector('.fmb-mobile-shell-brand img')),
    hasSearch:Boolean(document.querySelector('.fmb-mobile-shell-actions a[aria-label="Search FMB News"]')),
    hasTheme:Boolean(document.querySelector('[data-fmb-mobile-theme]')),
    hasMenu:Boolean(document.querySelector('[data-fmb-shell-menu]')),
    rail:[...document.querySelectorAll('.fmb-mobile-product-rail>a')].map(a=>(a.textContent||'').trim()),
    railVisible:[...document.querySelectorAll('.fmb-mobile-product-rail')].filter(el=>el.getClientRects().length>0).length,
    dock:[...document.querySelectorAll('.fmb-mobile-bottom-nav :is(a,button)>span')].map(n=>(n.textContent||'').trim()),
    dockVisible:[...document.querySelectorAll('.fmb-mobile-bottom-nav')].filter(el=>el.getClientRects().length>0).length,
    dockPosition:getComputedStyle(document.querySelector('.fmb-mobile-bottom-nav')).position,
    legacyDock:document.querySelectorAll('.fmb-approved-bottom-nav,.nc-mobile-dock,.fmb-app-dock').length,
    oldUtility:document.querySelectorAll('.fmb-global-mobile-utility').length,
  }));

  assert(state.overflow<=1,`${path} has ${state.overflow}px horizontal page overflow`);
  assert(state.brand.includes('FMB NEWS.'),`${path} compact masthead lost FMB NEWS.`);
  assert.equal(state.hasBrandImage,false,`${path} mobile masthead must not restore the retired emblem image.`);
  assert.equal(state.hasSearch,true,`${path} mobile header is missing Search.`);
  assert.equal(state.hasTheme,true,`${path} mobile header is missing Theme.`);
  assert.equal(state.hasMenu,true,`${path} mobile header is missing Menu.`);
  assert.deepEqual(state.rail,expectedRail,`${path} category rail drifted.`);
  assert.equal(state.railVisible,1,`${path} must have exactly one visible category rail.`);
  assert.deepEqual(state.dock,expectedDock,`${path} bottom navigation drifted.`);
  assert.equal(state.dockVisible,1,`${path} must have exactly one visible bottom navigation.`);
  assert.equal(state.dockPosition,'fixed',`${path} approved mobile bottom navigation must remain fixed.`);
  assert.equal(state.legacyDock,0,`${path} retired legacy dock markup returned.`);
  assert.equal(state.oldUtility,0,`${path} retired global utility strip returned.`);

  const shellHeight=await shell.evaluate(el=>el.getBoundingClientRect().height);
  assert(shellHeight<=155,`${path} mobile sticky chrome is too tall (${shellHeight}px).`);
  return state;
}

async function assertImage(selector,message){
  const image=page.locator(selector).first();
  await image.waitFor({state:'visible'});
  await page.waitForFunction(sel=>{const img=document.querySelector(sel);return img instanceof HTMLImageElement&&img.complete&&img.naturalWidth>0},selector,{timeout:5000});
  assert((await image.evaluate(img=>img.naturalWidth))>0,message);
}

await open('/news/');
await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});
assert.equal(await page.locator('.network-home').evaluate(el=>getComputedStyle(el).display),'none','Desktop publication home must stay hidden on phone view.');
assert.equal(await page.locator('.fmb-mobile-app-shell').count(),1,'Mobile app shell duplicated on Home.');
assert.equal(await page.locator('.fmb-app-story-list').count(),1,'Mobile Latest story list missing.');
assert.equal(await page.locator('.fmb-mobile-product-rail svg').count(),0,'Mobile category rail should be text-led, not the retired icon rail.');

const legacyHero=page.locator('[data-fmb-approved-hero]');
assert.equal(await legacyHero.count(),1,'Legacy hero asset marker should remain available for metadata/recovery until its asset contract is retired deliberately.');
assert.equal(await legacyHero.evaluate(el=>getComputedStyle(el).display),'none','Old cinematic hero image must remain visually removed.');
assert.equal(await page.locator('[data-fmb-approved-hero]:visible').count(),0,'Old cinematic hero image must not be visible.');
await assertImage('[data-fmb-approved-mug]','Approved Daily Brief mug failed to render.');

await page.locator('.fmb-app-brand-hero').waitFor({state:'visible'});
const intro=await page.locator('.fmb-app-brand-hero').evaluate(el=>({
  bg:getComputedStyle(el).backgroundColor,
  radius:getComputedStyle(el).borderRadius,
  height:el.getBoundingClientRect().height
}));
assert.equal(intro.radius,'0px','Mobile editorial intro must not look like an attached rounded card.');
assert(intro.height>=250&&intro.height<=360,`Mobile editorial intro height is out of control (${intro.height}px).`);

await page.locator('.fmb-app-top-ticker').waitFor({state:'visible'});
assert.equal((await page.locator('.fmb-app-top-ticker>strong').textContent())?.trim(),'LATEST','Mobile moving headline rail must say LATEST.');
assert.equal(await page.locator('.fmb-approved-hero-ticker:visible').count(),1,'Home must expose exactly one moving Latest rail.');

const localTime=await page.locator('[data-fmb-local-time]').textContent();
const expectedTime=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date())+' PHT';
assert.equal((localTime||'').trim(),expectedTime,'Home local time must be Philippine Standard Time.');

const founder=page.locator('.about-fmb-home');
await founder.waitFor({state:'visible'});
assert.equal((await founder.locator('h2').textContent())?.trim(),'Francine Marie Bautista','Homepage founder identity changed.');
assert((await founder.textContent())?.includes('Founder, FMB News'),'Homepage founder role is missing.');
assert.equal(await founder.locator('img').count(),0,'Homepage founder module must not fabricate a portrait.');
const founderRatio=await founder.locator('.about-fmb-portrait').evaluate(el=>{const r=el.getBoundingClientRect();return r.width/r.height});
assert(Math.abs(founderRatio-.8)<.08,`Homepage founder placeholder should remain approximately 4:5 (${founderRatio.toFixed(2)}).`);

const menu=page.locator('[data-fmb-shell-menu]');
await menu.click();
const menuPanel=page.locator('.fmb-app-action-panel');
await menuPanel.waitFor({state:'visible'});
for(const [label,href] of [['Fact Check','/news/fact-check/'],['Explainers','/news/explainer/'],['Horoscope','/news/horoscope/'],['Crossword','/news/crossword/'],['About FMB','/news/about/']]){
  const link=menuPanel.locator(`a[href="${href}"]`);
  assert.equal(await link.count(),1,`Mobile menu missing ${label}.`);
}
assert.equal(await menuPanel.locator('.fmb-menu-group-label').filter({hasText:'Entertainment'}).count(),1,'Horoscope/Crossword must stay grouped under Entertainment.');
await page.keyboard.press('Escape');
await menuPanel.waitFor({state:'detached'});

const routes=[
  ['/news/archive/','News'],
  ['/news/world/','World'],
  ['/news/sports/','Sports'],
  ['/news/fmb-brief/','Briefing'],
  ['/news/fact-check/','Fact Check'],
  ['/news/explainer/','Explainers'],
  ['/news/horoscope/','Entertainment'],
  ['/news/crossword/','Entertainment'],
  ['/news/about/','News'],
];

for(const [route,active] of routes){
  await open(route);
  const activeRail=(await page.locator('.fmb-mobile-product-rail a[aria-current="page"]').textContent())?.trim();
  if(route==='/news/about/') assert(['News',''].includes(activeRail||''),`About should not falsely activate another editorial category (${activeRail}).`);
  else assert.equal(activeRail,active,`${route} category state drifted.`);
  const main=page.locator('main').first();
  if(await main.count())assert(await main.isVisible(),`${route} main content is not visible.`);
}

await open('/news/sports/');
await page.locator('#sports-title').waitFor({state:'visible'});
const sports=await page.evaluate(()=>({stories:document.querySelectorAll('.sports-story').length,empty:Boolean(document.querySelector('.sports-empty'))}));
assert(sports.stories>0||sports.empty,'Sports must show real inventory or one explicit empty state.');
assert(!(sports.stories>0&&sports.empty),'Sports cannot show inventory and empty state simultaneously.');

await open('/news/horoscope/');
assert((await page.locator('body').textContent())?.includes('freewill'),'Horoscope free-will framing is missing.');

await open('/news/crossword/');
assert.equal(await page.locator('.fmb-crossword-grid,.crossword-grid').count()>0,true,'Crossword puzzle grid is missing.');

await open('/news/about/');
const dedicatedFounder=page.locator('[data-fmb-founder-section]');
await dedicatedFounder.waitFor({state:'visible'});
assert.equal(await dedicatedFounder.locator('img').count(),0,'Dedicated About founder section must keep its real-photo placeholder until an approved portrait exists.');

await context.close();
await browser.close();
console.log('FMB News mobile browser QA passed: approved FMB NEWS. shell, text category rail, fixed Home/World/Sports/Briefing/Menu dock, Latest/PHT Home utilities, image-free founder placeholder, Entertainment grouping, no horizontal overflow, and all major editorial routes remain functional.');