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

await mobilePage.locator('[data-fmb-shell-menu]').click();
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

// Light must repaint the reading shell, not just the body ground -- a page that
// swapped its body colour while its sections and story rows stayed dark is the
// defect this asserts against. Measured on the surfaces a reader actually reads
// against, rather than on the body alone as this suite previously did.
//
// The dock is deliberately excluded. It is newsroom-black in both appearances
// by design: the approved composition specifies black app chrome as a constant,
// not as a dark-mode treatment, so it is asserted to STAY black rather than to
// turn light. An earlier version of this assertion demanded the dock go light
// and would have forced a change to frozen mobile composition.
const shellLum=async(page)=>page.evaluate(()=>{
  const lum=(el)=>{const p=getComputedStyle(el).backgroundColor.match(/[\d.]+/g);if(!p||Number(p[3])===0)return null;const c=v=>{const n=Number(v)/255;return n<=.03928?n/12.92:((n+.055)/1.055)**2.4};return .2126*c(p[0])+.7152*c(p[1])+.0722*c(p[2])};
  const out={};
  for(const [k,sel] of [['body','body'],['section','.fmb-app-section'],['row','.fmb-app-story-row'],['dock','.fmb-editorial-mobile-dock']]){
    const el=document.querySelector(sel);out[k]=el?lum(el):null;
  }
  return out;
});
const litShell=await shellLum(mobilePage);
for(const part of ['body','section','row'])
  if(litShell[part]!==null)assert(litShell[part]>.5,`Light mode must repaint the ${part}, which measured ${litShell[part]}.`);
assert(litShell.dock===null||litShell.dock<.1,`The dock is approved newsroom-black chrome in both appearances; it measured ${litShell.dock} in Light.`);

// Keyboard operability, and persistence across reload and route navigation.
await appearance.focus();
await mobilePage.keyboard.press('Space');
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme-mode'),'dark','Switch must be keyboard operable.');
assert.equal(await mobilePage.evaluate(()=>localStorage.getItem('fmbThemeModeV1')),'dark','Switch choice must persist.');
await mobilePage.reload({waitUntil:'domcontentloaded'});
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme'),'dark','Switch choice must survive reload.');
await mobilePage.goto(`${base}/news/world/`,{waitUntil:'domcontentloaded'});
assert.equal(await mobilePage.locator('html').getAttribute('data-fmb-theme'),'dark','Switch choice must survive route navigation.');
await mobile.close();

await browser.close();
console.log('FMB News appearance browser QA passed: System follows device preference, Light/Dark paint correctly, persistence survives reload, and the mobile menu exposes Appearance.');
