import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});

// This suite used to assert that Light mode painted exactly rgb(251,249,252)
// and that Dark painted anything other than that one value. Both were pinned to
// the retired plum system's near-white, so the check passed for any colour at
// all in Dark, and it would have failed the approved warm-ivory ground purely
// for not being the old hex. The property the suite is actually protecting is
// that the two appearances paint grounds of the right polarity and that they
// are clearly distinct. That is asserted directly here, by relative luminance,
// so it holds for the approved palette and for any future one.
const groundLuminance=async target=>target.evaluate(()=>{
  const parts=getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g);
  if(!parts)return null;
  const channel=value=>{const v=Number(value)/255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};
  return .2126*channel(parts[0])+.7152*channel(parts[1])+.0722*channel(parts[2]);
});
const assertLightGround=async(target,label)=>{
  const luminance=await groundLuminance(target.locator('body'));
  assert(luminance!==null&&luminance>.6,`${label} must paint a light page ground (relative luminance ${luminance}).`);
  return luminance;
};
const assertDarkGround=async(target,label)=>{
  const luminance=await groundLuminance(target.locator('body'));
  assert(luminance!==null&&luminance<.06,`${label} must paint a dark page ground (relative luminance ${luminance}).`);
  return luminance;
};

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
const lightLuminance=await assertLightGround(page,'System mode resolved to Light');

await toggle.click();
assert.equal(await page.locator('html').getAttribute('data-fmb-theme-mode'),'light','First appearance cycle must select Light.');
assert.equal(await page.evaluate(()=>localStorage.getItem('fmbThemeModeV1')),'light','Light mode must persist.');

await toggle.click();
assert.equal(await page.locator('html').getAttribute('data-fmb-theme-mode'),'dark','Second appearance cycle must select Dark.');
assert.equal(await page.locator('html').getAttribute('data-fmb-theme'),'dark','Dark mode must resolve immediately.');
assert.equal(await page.evaluate(()=>localStorage.getItem('fmbThemeModeV1')),'dark','Dark mode must persist.');
await page.waitForFunction(()=>{const p=getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g);if(!p)return false;const c=v=>{const n=Number(v)/255;return n<=.03928?n/12.92:((n+.055)/1.055)**2.4};return .2126*c(p[0])+.7152*c(p[1])+.0722*c(p[2])<.06},null,{timeout:1500});
const darkLuminance=await assertDarkGround(page,'Dark mode');
assert(lightLuminance-darkLuminance>.5,`Light and Dark must paint clearly distinct grounds (${lightLuminance} vs ${darkLuminance}).`);

await page.reload({waitUntil:'domcontentloaded'});
await page.locator('[data-fmb-theme-control]').waitFor({state:'visible'});
assert.equal(await page.locator('html').getAttribute('data-fmb-theme-mode'),'dark','Persisted Dark mode must survive reload.');
assert.equal((await page.locator('[data-fmb-theme-label]').first().textContent())?.trim(),'Dark','Reloaded desktop control must reflect Dark mode.');
await assertDarkGround(page,'Persisted Dark mode after reload');
await desktop.close();

const mobile=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',colorScheme:'dark'});
const mobilePage=await mobile.newPage();
await mobilePage.route('https://**/*',route=>route.abort());
response=await mobilePage.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
assert(response?.ok(),`Mobile Home returned ${response?.status()}`);
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme-mode'),'system','Fresh mobile context must default to System.');
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme'),'dark','System mode should resolve to the mobile context dark preference.');
await assertDarkGround(mobilePage,'Mobile System mode resolved to Dark');

await mobilePage.locator('[data-fmb-dock-menu]').click();
const appearance=mobilePage.locator('[data-fmb-theme-menu]');
await appearance.waitFor({state:'visible'});

// The mobile Appearance control is a binary Light/Dark switch. It previously
// cycled System -> Light -> Dark and this suite asserted only its label text.
// Those two label assertions were insufficient in a specific way: a control
// reading "System" tells the reader nothing about which appearance is actually
// on screen, so the old test passed while the row displayed "System" against a
// fully dark page. What replaces them is stronger -- the switch must report the
// theme in force, expose real switch semantics to assistive technology, meet
// the frozen 44px target, and be operable from the keyboard. System itself is
// still supported and still the default; the assertions above (line 69) that a
// fresh context boots into System and follows the device are unchanged.
assert.equal(await appearance.getAttribute('role'),'switch','Appearance must expose switch semantics.');
assert.equal(await appearance.getAttribute('aria-checked'),'true','Switch must read checked while Dark is the theme actually in force.');
assert.equal((await appearance.locator('[data-fmb-theme-label]').textContent())?.trim(),'Dark','Switch must report the active appearance, not the stored mode.');
assert((await appearance.getAttribute('aria-label'))?.trim(),'Switch must carry an accessible name.');
const box=await appearance.boundingBox();
assert(box.height>=44,`Appearance switch must meet the 44px touch target (measured ${box.height}).`);

await appearance.click();
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme-mode'),'light','Switching off must select Light explicitly, resolving System rather than leaving it.');
assert.equal(await appearance.getAttribute('aria-checked'),'false','Switch must read unchecked in Light.');
assert.equal((await appearance.locator('[data-fmb-theme-label]').textContent())?.trim(),'Light','Switch label must follow the theme.');
await mobilePage.waitForFunction(()=>{const p=getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g);if(!p)return false;const c=v=>{const n=Number(v)/255;return n<=.03928?n/12.92:((n+.055)/1.055)**2.4};return .2126*c(p[0])+.7152*c(p[1])+.0722*c(p[2])>.6},null,{timeout:1500});
await assertLightGround(mobilePage,'Mobile Light mode');

// Light must theme the COMPLETE app -- masthead, product rail and dock included,
// not only the reading surfaces. An earlier version of this assertion had it
// backwards: it required the dock to STAY newsroom-black in Light, on a reading
// of the approved composition's "newsroom-black sticky header" as a constant.
// It is not a constant. It describes the Dark composition. Light is the same
// publication designed for daylight, and app chrome that stayed black around a
// light page is precisely the defect -- so the dock and header are now asserted
// to turn light, and the identity is carried by the wordmark, the red period,
// the red active state and the type instead.
const shellPaint=async(page)=>page.evaluate(()=>{
  const lum=(v)=>{const p=String(v).match(/[\d.]+/g);if(!p||Number(p[3])===0)return null;const c=x=>{const n=Number(x)/255;return n<=.03928?n/12.92:((n+.055)/1.055)**2.4};return .2126*c(p[0])+.7152*c(p[1])+.0722*c(p[2])};
  const bg=(sel)=>{const el=document.querySelector(sel);return el?lum(getComputedStyle(el).backgroundColor):null};
  const ink=(sel)=>{const el=document.querySelector(sel);return el?lum(getComputedStyle(el).color):null};
  const raw=(sel,prop)=>{const el=document.querySelector(sel);return el?getComputedStyle(el)[prop]:null};
  return {
    header:bg('.fmb-mobile-shell-head'),
    dock:bg('.fmb-editorial-mobile-dock'), body:bg('body'),
    section:bg('.fmb-app-section'), row:bg('.fmb-app-story-row'),
    menuSheet:bg('.fmb-app-action-panel'),
    wordmarkInk:ink('.fmb-mobile-shell-copy strong'),
    dockMenuInk:ink('[data-fmb-dock-menu]'),
    dockInactiveInk:ink('.fmb-editorial-mobile-dock a:not([aria-current])'),
    dockActiveRaw:raw('.fmb-editorial-mobile-dock a[aria-current="page"]','color'),
    dotRaw:raw('.fmb-mobile-brand-dot','color'),
  };
});
const isRed=(v)=>{const p=String(v).match(/[\d.]+/g);return !!p&&Number(p[0])>150&&Number(p[0])-Number(p[1])>80&&Number(p[0])-Number(p[2])>80};

// The section rail and the app-bar hamburger used to be measured here too.
// Both are gone -- they duplicated the dock -- and because every check in this
// file is guarded with `!== null`, leaving them listed would have turned four
// paint assertions into silent no-ops rather than failures. They are replaced by
// the controls that actually ship: the dock, and the dock's Menu button.
const lit=await shellPaint(mobilePage);
assert.equal(await mobilePage.locator('.fmb-mobile-product-rail,[data-fmb-shell-menu]').count(),0,'The retired section rail and app-bar hamburger must stay removed.');
for(const part of ['header','dock','body','wordmarkInk','dockMenuInk','dockInactiveInk'])
  assert(lit[part]!==null,`Light appearance could not measure ${part}; the selector matched nothing, so its assertion would have been skipped.`);
for(const part of ['header','dock','body','section','row'])
  if(lit[part]!==null)assert(lit[part]>.5,`Light appearance must paint the ${part} light; it measured ${lit[part]}.`);
for(const part of ['wordmarkInk','dockMenuInk','dockInactiveInk'])
  if(lit[part]!==null)assert(lit[part]<.3,`Light appearance needs dark ink on ${part}; it measured ${lit[part]}.`);
assert(isRed(lit.dockActiveRaw),`Light dock active state must be FMB red, got ${lit.dockActiveRaw}.`);
assert(isRed(lit.dotRaw),`The FMB NEWS. period must stay red in Light, got ${lit.dotRaw}.`);

// Keyboard operability, and persistence across reload and route navigation.
await appearance.focus();
await mobilePage.keyboard.press('Space');
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme-mode'),'dark','Switch must be keyboard operable.');
assert.equal(await mobilePage.evaluate(()=>localStorage.getItem('fmbThemeModeV1')),'dark','Switch choice must persist.');
await mobilePage.reload({waitUntil:'domcontentloaded'});
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme'),'dark','Switch choice must survive reload.');
await mobilePage.goto(`${base}/news/world/`,{waitUntil:'domcontentloaded'});
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme'),'dark','Switch choice must survive route navigation.');

// Dark keeps the newsroom-black chrome. This is the other half of the contract:
// Light must go light, and Dark must not drift light with it.
const drk=await shellPaint(mobilePage);
for(const part of ['header','dock','body'])
  if(drk[part]!==null)assert(drk[part]<.1,`Dark appearance must keep the ${part} newsroom-black; it measured ${drk[part]}.`);
for(const part of ['wordmarkInk','dockMenuInk','dockInactiveInk'])
  if(drk[part]!==null)assert(drk[part]>.4,`Dark appearance needs light ink on ${part}; it measured ${drk[part]}.`);
assert(isRed(drk.dotRaw),`The FMB NEWS. period must stay red in Dark, got ${drk.dotRaw}.`);

// Geometry must be identical in both appearances -- the correction repaints the
// chrome and moves nothing.
const geom=async(page)=>page.evaluate(()=>{
  const box=(sel)=>{const el=document.querySelector(sel);if(!el)return null;const r=el.getBoundingClientRect();return [Math.round(r.x),Math.round(r.width),Math.round(r.height)].join('/')};
  return {header:box('.fmb-mobile-shell-head'),dock:box('.fmb-editorial-mobile-dock'),doc:Math.round(document.documentElement.scrollHeight),
    overflow:Math.max(0,document.documentElement.scrollWidth-window.innerWidth)};
});
// Both sides are measured the same way, after the same settle. Measuring one
// side mid-load reported a 21px document difference that does not exist.
const settle=async()=>{await mobilePage.waitForLoadState('load');await mobilePage.waitForTimeout(900)};
await settle();
const darkGeom=await geom(mobilePage);
await mobilePage.evaluate(()=>{try{localStorage.setItem('fmbThemeModeV1','light')}catch{}});
await mobilePage.reload({waitUntil:'load'});
await settle();
const lightGeom=await geom(mobilePage);
for(const k of ['header','dock','doc'])
  assert.equal(lightGeom[k],darkGeom[k],`${k} geometry must be identical in Light and Dark (${lightGeom[k]} vs ${darkGeom[k]}).`);
assert.equal(lightGeom.overflow,0,`Light appearance must not overflow horizontally (${lightGeom.overflow}px).`);
assert.equal(darkGeom.overflow,0,`Dark appearance must not overflow horizontally (${darkGeom.overflow}px).`);
await mobile.close();

await browser.close();
console.log('FMB News appearance browser QA passed: System follows device preference, Light/Dark paint correctly, persistence survives reload, and the mobile menu exposes Appearance.');
