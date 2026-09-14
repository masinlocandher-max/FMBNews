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
for(const href of ['/news/entertainment/','/news/founder/','/news/editorial-standards/','/news/corrections/','mailto:withlovefmb@gmail.com']){
  assert.equal(await dialog.locator(`a[href="${href}"]`).count(),1,`Mobile Menu is missing the secondary/legal destination ${href}.`);
}
// One Menu, not two. The footer's removal must not grow a second navigation.
assert.equal(await page.locator('.fmb-app-action-panel[role="dialog"]').count(),1,'Exactly one mobile Menu dialog may be open.');
// ---------------------------------------------------------------------------
// The Menu itself, in both appearances
// ---------------------------------------------------------------------------
// A real-device screenshot showed the four action rows blank and the fifteen
// navigation rows as large white pill cards. Neither was a missing element:
// the actions were near-black ink (#16191b) on the dark sheet at 1.03:1, and
// the links kept a white 14px-radius pill from the retired plum layer that the
// final authority reset for `button` but not for `a`. The old QA asserted the
// links existed, which both of those defects passed.
const menuState=async appearance=>{
  const ctx=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',timezoneId:'Asia/Manila',colorScheme:appearance});
  const menuPage=await ctx.newPage();
  await menuPage.route('https://**/*',route=>route.abort());
  await menuPage.addInitScript(mode=>{try{localStorage.setItem('fmbThemeModeV1',mode)}catch{}},appearance);
  await menuPage.goto(`${base}/news/world/`,{waitUntil:'domcontentloaded'});
  await menuPage.locator('[data-fmb-shell-menu]').click();
  await menuPage.locator('.fmb-app-action-panel[role="dialog"]').waitFor({state:'visible'});
  const rows=await menuPage.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const ctx2=canvas.getContext('2d',{willReadFrequently:true});
    const flatten=(layers,base2)=>{ctx2.clearRect(0,0,1,1);ctx2.fillStyle=base2;ctx2.fillRect(0,0,1,1);for(const layer of layers){ctx2.fillStyle=layer;ctx2.fillRect(0,0,1,1)}const d=ctx2.getImageData(0,0,1,1).data;return [d[0],d[1],d[2]]};
    const luminance=([r,g,b2])=>{const channel=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*channel(r)+.7152*channel(g)+.0722*channel(b2)};
    const stack=el=>{const layers=[];let n=el;while(n&&n.nodeType===1){layers.unshift(getComputedStyle(n).backgroundColor);n=n.parentElement}return layers};
    return [...document.querySelectorAll('.fmb-app-action-list > *')].map(el=>{
      const cs=getComputedStyle(el);const box=el.getBoundingClientRect();const layers=stack(el);
      const bg=flatten(layers,'#ffffff'),fg=flatten([...layers,cs.color],'#ffffff');
      const a=luminance(fg),b2=luminance(bg);
      return {
        tag:el.tagName,
        label:(el.textContent||'').trim(),
        name:(el.getAttribute('aria-label')||el.textContent||'').trim(),
        height:Math.round(box.height),
        radius:parseFloat(cs.borderTopLeftRadius)||0,
        ratio:(Math.max(a,b2)+.05)/(Math.min(a,b2)+.05),
        overflows:box.width>document.documentElement.clientWidth+1,
      };
    });
  });
  await ctx.close();
  return rows;
};

for(const appearance of ['light','dark']){
  const rows=await menuState(appearance);
  assert(rows.length>=15,`Mobile Menu (${appearance}) rendered only ${rows.length} rows.`);
  for(const row of rows){
    // No blank reserved rows: a rendered row must carry an accessible name.
    assert(row.name.length>0,`Mobile Menu (${appearance}): a ${row.tag} row renders with no accessible name — an empty interactive row.`);
    // Readable, in both appearances. This is the assertion the blank rows failed.
    assert(row.ratio>=4.5,`Mobile Menu (${appearance}): "${row.label.slice(0,24)}" measures ${row.ratio.toFixed(2)}:1 against its own sheet.`);
    // A list row, not a card.
    assert(row.height>=44&&row.height<=64,`Mobile Menu (${appearance}): "${row.label.slice(0,24)}" row is ${row.height}px; expected a 44-64px list row.`);
    assert(row.radius<=4,`Mobile Menu (${appearance}): "${row.label.slice(0,24)}" has ${row.radius}px corner radius — a pill card, not a list row.`);
    assert(!row.overflows,`Mobile Menu (${appearance}): "${row.label.slice(0,24)}" overflows the viewport.`);
  }
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
      visibleCaptions:[...document.querySelectorAll('figcaption')].filter(el=>el.getBoundingClientRect().height>0).length,
      // Desktop institutional chrome: the large wordmark, the link groups, the
      // newsletter treatment and the copyright band.
      footerChrome:[...document.querySelectorAll('.footer-publication-title,.footer-grid,.footer-socials,.footer-bottom,footer.footer form,footer.footer [data-fmb-newsletter-form]')]
        .filter(shown).length,
      headers:[...document.querySelectorAll('.fmb-mobile-app-shell')].filter(shown).length,
      docks:[...document.querySelectorAll('.fmb-editorial-mobile-dock')].filter(shown).length,
      dockHeight:(()=>{const d=document.querySelector('.fmb-editorial-mobile-dock');return d?Math.round(d.getBoundingClientRect().height):0})(),
      bodyPadBottom:parseFloat(getComputedStyle(document.body).paddingBottom)||0,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      shellTop:(()=>{const s2=document.querySelector('.fmb-mobile-app-shell');return s2?Math.round(s2.getBoundingClientRect().top+scrollY):0})(),
    };
  });
};

const shellRoutes=[
  '/news/','/news/world/','/news/sports/','/news/fmb-brief/','/news/fact-check/','/news/explainer/',
  '/news/search/','/news/entertainment/','/news/horoscope/','/news/crossword/','/news/about/',
  '/news/founder/','/news/archive/',
  '/news/barmm-first-parliamentary-election-voting-underway-september-14-2026/',
  '/news/alex-eala-us-open-third-round-september-4-2026/',
  '/news/bsp-raises-policy-rate-5-percent-august-2026/',
];
const article=shellRoutes[13];

// Every route, at the narrowest and widest phone this publication supports, in
// both appearances. 320 is where the four-column footer was worst.
for(const width of [320,430])for(const appearance of ['light','dark']){
  const phone=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',timezoneId:'Asia/Manila'});
  const phonePage=await phone.newPage();
  await phonePage.route('https://**/*',route=>route.abort());
  await phonePage.addInitScript(mode=>{try{localStorage.setItem('fmbThemeModeV1',mode)}catch{}},appearance);
  for(const path of shellRoutes){
    const state=await footerVisibility(phonePage,path);
    assert.equal(state.anyFooter,false,`${path} at ${width}px (${appearance}): the desktop publication footer must be hidden below 700px.`);
    assert.notEqual(state.publicationFooter,true,`${path} at ${width}px (${appearance}): .publication-footer must be hidden below 700px.`);
    assert.equal(state.footerChrome,0,`${path} at ${width}px (${appearance}): desktop footer chrome (wordmark, link groups, newsletter, copyright band) must not render on a phone.`);
    assert.equal(state.headers,1,`${path} at ${width}px (${appearance}): exactly one mobile header.`);
    assert.equal(state.docks,1,`${path} at ${width}px (${appearance}): exactly one bottom dock.`);
    assert(state.bodyPadBottom>=state.dockHeight,`${path} at ${width}px (${appearance}): content sits under the dock (${state.bodyPadBottom}px clearance for a ${state.dockHeight}px dock).`);
    assert(state.overflow<=1,`${path} at ${width}px (${appearance}): ${state.overflow}px horizontal overflow.`);
    // The shell is prepended to <body>; nothing may reserve a band above it.
    assert(state.shellTop<=100,`${path} at ${width}px (${appearance}): ${state.shellTop}px of blank space above the mobile masthead.`);
  }
  await phone.close();
}

// Article-end editorial matter is not part of the footer and must survive it,
// on every representative article rather than one.
for(const path of shellRoutes.slice(13)){
  const state=await footerVisibility(page,path);
  assert.equal(state.articleMatterOutsideFooter,true,`${path}: article-end editorial matter must sit outside footer.footer.`);
  assert(state.visibleArticleMatter>0,`${path}: article-end editorial matter (Sources / Related / byline) must remain visible on a phone.`);
  assert(state.visibleCaptions>0,`${path}: captions and photo credits must remain visible on a phone.`);
}

// The breakpoint itself. 699 is the last width the mobile rule applies to and
// 700 the first it does not, so both sides are asserted rather than assumed.
for(const [width,expected] of [[699,false],[700,true]]){
  const wide=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',timezoneId:'Asia/Manila'});
  const widePage=await wide.newPage();
  await widePage.route('https://**/*',route=>route.abort());
  for(const path of shellRoutes){
    const state=await footerVisibility(widePage,path);
    assert.equal(state.anyFooter,expected,`${path} at ${width}px: the desktop publication footer must be ${expected?'visible':'hidden'}.`);
  }
  const home=await footerVisibility(widePage,'/news/');
  assert.equal(home.publicationFooter,expected,`Home at ${width}px: .publication-footer must be ${expected?'visible':'hidden'}.`);
  await wide.close();
}

await context.close();
await browser.close();
console.log('Editorial mobile browser QA passed: FMB NEWS. masthead, text section rail, real story hero, World/Sports/Entertainment rows, persistent five-item dock, broad route coverage, complete Menu navigation including the secondary/legal destinations, the desktop publication footer hidden below 700px across 16 routes at 320 and 430 in both appearances and present again at 700px, no desktop footer chrome on a phone, and article-end editorial matter preserved.');