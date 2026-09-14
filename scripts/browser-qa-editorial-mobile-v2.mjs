import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',timezoneId:'Asia/Manila'});
const page=await context.newPage();
await page.route('https://**/*',route=>route.abort());

const expectedTop=['Home','World','Sports','Briefing','Fact Check'];
const expectedDock=['Home','World','Sports','Briefing','Menu'];

async function open(path,active){
  const response=await page.goto(`${base}${path}`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`${path} returned ${response?.status()}`);
  await page.locator('.fmb-mobile-app-shell').waitFor({state:'visible'});
  await page.locator('.fmb-editorial-mobile-dock').waitFor({state:'visible'});

  const state=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-innerWidth,
    shell:getComputedStyle(document.querySelector('.fmb-mobile-app-shell')).position,
    brand:(document.querySelector('.fmb-mobile-shell-copy strong')?.textContent||'').trim(),
    top:[...document.querySelectorAll('.fmb-mobile-product-rail>a')].map(a=>(a.textContent||'').trim()),
    dock:[...document.querySelectorAll('.fmb-editorial-mobile-dock>*')].map(a=>(a.textContent||'').trim()),
    active:(document.querySelector('.fmb-mobile-product-rail a[aria-current="page"]')?.textContent||'').trim(),
    visibleTopIcons:[...document.querySelectorAll('.fmb-mobile-product-rail svg')].filter(el=>getComputedStyle(el).display!=='none').length,
    dockPosition:getComputedStyle(document.querySelector('.fmb-editorial-mobile-dock')).position,
    dockBottom:Math.abs(innerHeight-document.querySelector('.fmb-editorial-mobile-dock').getBoundingClientRect().bottom),
  }));
  assert(state.overflow<=1,`${path} has ${state.overflow}px horizontal overflow.`);
  assert.equal(state.shell,'sticky',`${path} mobile masthead must remain sticky.`);
  assert.equal(state.brand,'FMB NEWS.',`${path} mobile masthead must use FMB NEWS.`);
  assert.deepEqual(state.top,expectedTop,`${path} top section rail drifted.`);
  assert.deepEqual(state.dock,expectedDock,`${path} bottom dock drifted.`);
  assert.equal(state.active,active,`${path} active top section should be ${active}.`);
  assert.equal(state.visibleTopIcons,0,`${path} top section rail must be text-only.`);
  assert.equal(state.dockPosition,'fixed',`${path} bottom dock must be fixed.`);
  assert(state.dockBottom<=2,`${path} bottom dock must stay flush to the viewport.`);
  assert.equal(await page.locator('.fmb-editorial-mobile-dock').count(),1,`${path} must build exactly one editorial dock.`);
  assert.equal(await page.locator('.fmb-approved-bottom-nav').count(),0,`${path} must not restore the retired dock.`);
}

await open('/news/','Home');
await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});
await page.locator('[data-fmb-editorial-lead]').waitFor({state:'visible'});
await page.waitForFunction(()=>{const img=document.querySelector('[data-fmb-editorial-lead]');return img instanceof HTMLImageElement&&img.complete&&img.naturalWidth>0});
assert.equal(await page.locator('[data-fmb-approved-hero]:visible').count(),0,'Retired generic mobile hero must stay hidden.');
assert.equal(await page.locator('.fmb-editorial-mobile-rail-item').count(),3,'Home must expose World, Sports and Entertainment editorial rows.');
assert.deepEqual((await page.locator('.fmb-editorial-mobile-rail-item>div>span').allTextContents()).map(v=>v.trim()),['World','Sports','Entertainment'],'Editorial side rows drifted.');
assert.equal(await page.locator('.fmb-app-story-list').count(),1,'Home must keep one Latest News list.');
assert((await page.locator('.fmb-app-story-row').count())>=1,'Home Latest News must contain published stories.');
assert.equal(await page.locator('[data-fmb-approved-mug]').count(),1,'Daily Brief image contract must remain available.');
// The lead block used to be a fixed-height frame with the headline overlaid on
// the image, so its total height was the thing worth pinning. It is not that any
// more: FMB's own editorial graphics carry the headline inside the artwork, so a
// second headline on top collided with it, and the copy now sits below the image.
// The block therefore grows with the headline, and pinning its total height would
// pin the number of lines a headline is allowed to take.
//
// What the assertion was really protecting is that branding does not eat the
// first screen. That is now asserted directly: the image keeps an editorial
// proportion, the copy does not overlap it, and real journalism starts within
// the first viewport.
const heroImage=await page.locator('[data-fmb-editorial-lead]').boundingBox();
assert(heroImage&&heroImage.height>=165&&heroImage.height<=220,`Mobile lead image proportion drifted (${heroImage?.height}px).`);
const leadCopy=await page.locator('.fmb-approved-hero-copy').boundingBox();
assert(leadCopy&&leadCopy.y>=heroImage.y+heroImage.height-2,'Mobile lead copy must sit below the image, never overlaid on artwork that already carries the headline.');
assert(leadCopy.width>=heroImage.width*0.9,`Mobile lead copy must use the full editorial measure (${Math.round(leadCopy.width)}px of ${Math.round(heroImage.width)}px).`);
const firstStory=await page.locator('.fmb-editorial-mobile-rail-item').first().boundingBox();
const viewportHeight=page.viewportSize().height;
assert(firstStory&&firstStory.y<viewportHeight,`Real journalism must start within the first screen (first story row at ${Math.round(firstStory?.y)}px of ${viewportHeight}px).`);
assert((await page.locator('[data-fmb-greeting-line]').textContent()||'').trim().length>10,'Mobile lead headline is missing.');

for(const [path,active] of [
  ['/news/world/','World'],
  ['/news/sports/','Sports'],
  ['/news/fmb-brief/','Briefing'],
  ['/news/fact-check/','Fact Check'],
  ['/news/archive/','Home'],
  ['/news/explainer/','Home'],
  ['/news/about/','Home'],
  ['/news/horoscope/','Home'],
  ['/news/crossword/','Home'],
])await open(path,active);

// Crossword intentionally owns a save-gate dialog. Validate the global Menu
// from a clean Home route so the QA does not click through another modal.
await open('/news/','Home');
await page.locator('[data-fmb-dock-menu]').click();
const dialog=page.locator('.fmb-app-action-panel[role="dialog"]');
await dialog.waitFor({state:'visible'});
for(const href of ['/news/archive/','/news/world/','/news/sports/','/news/fmb-brief/','/news/fact-check/','/news/explainer/','/news/horoscope/','/news/crossword/','/news/about/']){
  assert.equal(await dialog.locator(`a[href="${href}"]`).count(),1,`Mobile Menu is missing ${href}.`);
}

// The desktop publication footer is hidden below 700px, so its secondary and
// legal destinations have to be reachable from the Menu instead. These are the
// footer links that resolve; /privacy/ is deliberately absent because it 404s
// in this build and a dead link in the Menu is worse than none.
for(const href of ['/news/editorial-standards/','/news/corrections/','mailto:withlovefmb@gmail.com']){
  assert.equal(await dialog.locator(`a[href="${href}"]`).count(),1,`Mobile Menu is missing the secondary/legal destination ${href}.`);
}
await page.keyboard.press('Escape');
await dialog.waitFor({state:'detached'});

// ---------------------------------------------------------------------------
// The desktop publication footer is a phone-only removal
// ---------------------------------------------------------------------------
// Measured before the change: 736-801px of four-column desktop footer stacked
// into a single 390px column under every internal route, with its 13 links
// rendering white on the approved ivory ground at 1.09:1.
//
// This asserts both halves of the contract, because the two footers are
// different elements in this codebase: Home carries
// <footer class="footer publication-footer"> while every internal route
// carries <footer class="footer"> with no publication-footer class. Hiding one
// and not the other would look correct on Home and change nothing anywhere
// else, so both are checked, at both sides of the breakpoint.
const footerVisibility=async(target,path)=>{
  const response=await target.goto(`${base}${path}`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`${path} returned ${response?.status()}`);
  return target.evaluate(()=>{
    const shown=el=>{
      if(!el)return null;
      let n=el;
      while(n&&n.nodeType===1){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden')return false;n=n.parentElement}
      return el.getBoundingClientRect().height>0;
    };
    return {
      publicationFooter:shown(document.querySelector('.publication-footer')),
      anyFooter:shown(document.querySelector('footer.footer')),
      articleMatterOutsideFooter:(()=>{
        const f=document.querySelector('footer.footer');
        const matter=[...document.querySelectorAll('.sources,[class*="related"],[class*="byline"]')];
        return matter.length ? matter.every(el=>!f||!f.contains(el)) : null;
      })(),
      visibleArticleMatter:[...document.querySelectorAll('.sources,[class*="related"],[class*="byline"]')]
        .filter(el=>el.getBoundingClientRect().height>0).length,
    };
  });
};

const article='/news/barmm-first-parliamentary-election-voting-underway-september-14-2026/';

const homePhone=await footerVisibility(page,'/news/');
assert.equal(homePhone.publicationFooter,false,'Home: .publication-footer must be hidden below 700px.');
assert.equal(homePhone.anyFooter,false,'Home: the desktop publication footer must be hidden below 700px.');

for(const path of ['/news/world/','/news/about/',article]){
  const phone=await footerVisibility(page,path);
  assert.equal(phone.anyFooter,false,`${path}: the desktop publication footer must be hidden below 700px.`);
}

// Article-end editorial matter is not part of the footer and must survive it.
const articlePhone=await footerVisibility(page,article);
assert.equal(articlePhone.articleMatterOutsideFooter,true,'Article-end editorial matter must sit outside footer.footer.');
assert(articlePhone.visibleArticleMatter>0,'Article-end editorial matter (Sources / Related / byline) must remain visible on a phone.');

// At 700px and above the footer is exactly as it was. 700 is the first width
// at which the mobile rule no longer applies, so it is the one that matters.
const wide=await browser.newContext({viewport:{width:700,height:900},serviceWorkers:'block',timezoneId:'Asia/Manila'});
const widePage=await wide.newPage();
await widePage.route('https://**/*',route=>route.abort());

const homeWide=await footerVisibility(widePage,'/news/');
assert.equal(homeWide.publicationFooter,true,'Home: .publication-footer must be visible at 700px and above.');
for(const path of ['/news/world/','/news/about/',article]){
  const desk=await footerVisibility(widePage,path);
  assert.equal(desk.anyFooter,true,`${path}: the desktop publication footer must be visible at 700px and above.`);
}
await wide.close();

await context.close();
await browser.close();
console.log('Editorial mobile browser QA passed: FMB NEWS. masthead, text section rail, real story hero, World/Sports/Entertainment rows, persistent five-item dock, broad route coverage, complete Menu navigation including the secondary/legal destinations, the desktop publication footer hidden below 700px and present at 700px and above, and article-end editorial matter preserved.');