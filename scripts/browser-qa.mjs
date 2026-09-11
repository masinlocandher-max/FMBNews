import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port=4173;
const server=spawn('python3',['-m','http.server',String(port),'--directory','dist'],{stdio:'inherit'});
const base=`http://127.0.0.1:${port}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(400);

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const page=await context.newPage();

async function open(path){
  await page.goto(`${base}${path}`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(220);
}

async function assertNoHorizontalOverflow(path){
  const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,bodyWidth:document.body.scrollWidth}));
  assert(metrics.scrollWidth<=metrics.clientWidth+1,`${path} horizontal overflow: ${JSON.stringify(metrics)}`);
  assert(metrics.bodyWidth<=metrics.clientWidth+1,`${path} body horizontal overflow: ${JSON.stringify(metrics)}`);
}

async function assertMobileShell(path){
  await page.locator('.fmb-mobile-app-shell').waitFor({state:'visible'});
  assert.equal(await page.locator('.fmb-mobile-app-shell').count(),1,`${path} duplicated mobile shell`);
  assert.equal(await page.locator('.fmb-mobile-product-rail').count(),1,`${path} duplicated product rail`);
  assert.equal(await page.locator('.fmb-mobile-product-rail>a').count(),5,`${path} mobile product rail must have five products`);
  assert.equal(await page.locator('[data-fmb-shell-menu]').count(),1,`${path} right-side menu trigger missing`);
  const shellBox=await page.locator('.fmb-mobile-app-shell').boundingBox();
  const viewport=page.viewportSize();
  assert(shellBox&&viewport&&shellBox.x>=-1&&shellBox.x+shellBox.width<=viewport.width+1,`${path} shell overflows viewport`);
  const menuBox=await page.locator('[data-fmb-shell-menu]').boundingBox();
  assert(menuBox&&menuBox.width>=40&&menuBox.height>=40,`${path} menu target is too small`);
  const bottomPinned=await page.evaluate(()=>[...document.querySelectorAll('nav,footer,div')].filter(el=>{
    const s=getComputedStyle(el);
    if(s.position!=='fixed'||s.display==='none'||s.visibility==='hidden')return false;
    if(el.getAttribute('role')==='dialog'||el.closest('[role="dialog"]'))return false;
    const r=el.getBoundingClientRect();
    return r.height>0&&r.height<=innerHeight*0.2&&r.top>=innerHeight*0.6&&r.bottom>=innerHeight-2&&r.width>=innerWidth*0.6;
  }).map(el=>el.className||el.tagName));
  assert.deepEqual(bottomPinned,[],`${path} pins chrome to the bottom of the viewport: ${bottomPinned.join(', ')}`);
  const shellLimit=path==='/news/'?150:112;
  assert(shellBox&&shellBox.height<=shellLimit,`${path} mobile chrome is too tall (${shellBox?.height}px)`);
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
  assert(info.visibility!=='hidden'&&info.opacity>.2&&info.color!=='rgba(0, 0, 0, 0)'&&info.fontSize>=8,message);
}

function channel(v){v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}
function luminance([r,g,b]){return .2126*channel(r)+.7152*channel(g)+.0722*channel(b)}
function ratio(a,b){const l1=luminance(a),l2=luminance(b);return(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)}
async function assertContrast(selector,min,message){
  const el=page.locator(selector).first();await el.waitFor({state:'visible'});
  const colors=await el.evaluate(node=>{
    const rgb=s=>{const m=String(s).match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);return m?[+m[1],+m[2],+m[3]]:null};
    const fg=rgb(getComputedStyle(node).color);let cur=node,bg=null;
    while(cur&&!bg){const s=getComputedStyle(cur),m=String(s.backgroundColor).match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)(?:[, /]+([\d.]+))?/);if(m&&Number(m[4]??1)>.2)bg=[+m[1],+m[2],+m[3]];cur=cur.parentElement}
    return{fg,bg:bg||[255,255,255]};
  });
  assert(colors.fg&&colors.bg,`${message}: colors could not be resolved`);
  const r=ratio(colors.fg,colors.bg);assert(r>=min,`${message}: contrast ${r.toFixed(2)} is below ${min}`);
}

async function heroMetrics(heroSelector,innerSelector,titleSelector,copySelector,ruleSelector){
  await page.locator(heroSelector).waitFor({state:'visible'});
  await page.locator('.fmb-product-signal').waitFor({state:'visible'});
  await page.locator(ruleSelector).waitFor({state:'visible'});
  return page.evaluate(({heroSelector,innerSelector,titleSelector,copySelector,ruleSelector})=>{
    const hero=document.querySelector(heroSelector),inner=document.querySelector(innerSelector),title=document.querySelector(titleSelector),copy=document.querySelector(copySelector),rule=document.querySelector(ruleSelector),signal=document.querySelector('.fmb-product-signal');
    if(!hero||!inner||!title||!copy||!rule||!signal)throw new Error('Hero structure missing');
    const hs=getComputedStyle(hero),is=getComputedStyle(inner),ts=getComputedStyle(title),ps=getComputedStyle(copy),rs=getComputedStyle(rule),ss=getComputedStyle(signal);
    return{
      height:Math.round(hero.getBoundingClientRect().height),
      paddingLeft:parseFloat(is.paddingLeft),paddingRight:parseFloat(is.paddingRight),paddingTop:parseFloat(is.paddingTop),paddingBottom:parseFloat(is.paddingBottom),
      titleSize:parseFloat(ts.fontSize),titleLine:parseFloat(ts.lineHeight),copySize:parseFloat(ps.fontSize),copyLine:parseFloat(ps.lineHeight),
      ruleRadius:rs.borderRadius,ruleMarginTop:parseFloat(rs.marginTop),signalGap:parseFloat(ss.columnGap||ss.gap),borderRadius:hs.borderRadius
    };
  },{heroSelector,innerSelector,titleSelector,copySelector,ruleSelector});
}
function assertSameHero(actual,expected,label){
  for(const key of ['height','paddingLeft','paddingRight','paddingTop','paddingBottom','titleSize','titleLine','copySize','copyLine','ruleMarginTop','signalGap'])assert(Math.abs(actual[key]-expected[key])<=1,`${label} hero ${key} drifted: ${actual[key]} vs ${expected[key]}`);
  assert.equal(actual.ruleRadius,expected.ruleRadius,`${label} hero capsule radius drifted`);
  assert.equal(actual.borderRadius,expected.borderRadius,`${label} hero outer radius drifted`);
}

await open('/news/');
await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});
assert.equal(await page.locator('.network-home').evaluate(el=>getComputedStyle(el).display),'none','Desktop publication home must be hidden on phone view.');
assert.equal(await page.locator('.fmb-mobile-app-shell').count(),1,'Mobile app shell duplicated on home.');
assert.equal(await page.locator('.fmb-app-story-list').count(),1,'Mobile story list missing.');
assert.equal(await page.locator('.fmb-mobile-product-rail svg').count(),5,'Approved icon product menu must show five icons.');
const legacyHero=page.locator('[data-fmb-approved-hero]');
assert.equal(await legacyHero.count(),1,'Legacy hero asset marker should remain available for metadata/recovery.');
assert.equal(await legacyHero.evaluate(el=>getComputedStyle(el).display),'none','Homepage hero image must stay visually removed in the matte FMB News design.');
assert.equal(await legacyHero.locator(':visible').count(),0,'Homepage hero image must not be visible.');
await assertImage('[data-fmb-approved-mug]','Approved Daily Brief mug failed to render.');
const heroBox=await page.locator('.fmb-app-brand-hero').boundingBox();
assert(heroBox&&heroBox.width>=389,`Home hero is not full bleed (${heroBox?.width}px)`);
assert(heroBox&&heroBox.height>=245&&heroBox.height<=300,`Home matte hero height is out of control (${heroBox?.height}px)`);
assert.equal(await page.locator('.fmb-app-brand-hero').evaluate(el=>getComputedStyle(el).borderRadius),'0px','Home hero must not look like an attached rounded card.');
await page.locator('.fmb-approved-hero-copy').waitFor({state:'visible'});
await page.locator('.fmb-app-top-ticker').waitFor({state:'visible'});
await page.locator('.fmb-hero-live-overlay').waitFor({state:'visible'});
await page.locator('.fmb-hero-readable-shade').waitFor({state:'visible'});
assert.equal(await page.locator('.fmb-approved-hero-ticker:visible').count(),1,'Home must expose exactly one moving HEADLINES/BREAKING ticker.');
assert.equal(await page.locator('.fmb-hero-greeting:visible').count(),0,'Legacy giant greeting overlay must stay removed.');
assert.equal(await page.locator('.fmb-approved-hero-label:visible').count(),0,'Home must not show a label/CTA above the greeting.');
assert.equal((await page.locator('.fmb-app-top-ticker>strong').textContent())?.trim(),'HEADLINES','Home moving news bar must say HEADLINES.');
const tickerBeforeHero=await page.evaluate(()=>{
  const ticker=document.querySelector('.fmb-app-top-ticker'),hero=document.querySelector('.fmb-app-brand-hero');
  return Boolean(ticker&&hero&&(ticker.compareDocumentPosition(hero)&Node.DOCUMENT_POSITION_FOLLOWING));
});
assert(tickerBeforeHero,'Approved HEADLINES ticker must sit between the product menu and matte hero.');
const ctas=await page.locator('.fmb-approved-hero-cta>*').allTextContents();
assert.deepEqual(ctas.map(v=>v.trim()),['Read the Latest','Customize'],'Home hero CTA labels drifted.');
const timeSize=await page.locator('.fmb-hero-clock [data-fmb-local-time]').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
const weatherSize=await page.locator('.fmb-hero-weather-copy>[data-fmb-weather]').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
assert(timeSize>=13,'Home live clock is too small.');
assert(weatherSize>=11,'Home weather text is too small.');
await assertReadable('.fmb-approved-hero-copy h1','Home hero headline is unreadable.');
await assertReadable('.fmb-approved-hero-deck','Home hero deck is unreadable.');
await assertMobileShell('/news/');
await assertNoHorizontalOverflow('/news/');

const routes=['/news/archive/','/news/world/','/news/explainer/','/news/fmb-brief/','/news/horoscope/','/news/crossword/','/news/about/'];
for(const route of routes){
  await open(route);
  await assertMobileShell(route);
  await assertNoHorizontalOverflow(route);
}

await open('/news/about/');
await assertReadable('.fmb-about-hero-copy h1','About hero heading is unreadable.');
await assertReadable('.fmb-about-hero-statement p','About hero statement is unreadable.');
await assertReadable('.fmb-about-purpose-copy p','About purpose text is unreadable.');
await assertReadable('.fmb-about-mv h2','About mission/vision heading is unreadable.');
await assertReadable('.fmb-about-mv>p:last-child','About mission/vision copy is unreadable.');
await assertReadable('.fmb-about-closing h2','About closing heading is unreadable.');
await assertNoHorizontalOverflow('/news/about/');

await browser.close();
server.kill('SIGTERM');
console.log('Mobile browser QA passed: image-free matte Home hero with retained overlays, compact FMB News shell, no horizontal overflow, and readable About/internal routes.');
