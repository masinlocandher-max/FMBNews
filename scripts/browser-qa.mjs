import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block'});
const page=await context.newPage();

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
  const activeTab=page.locator('.fmb-mobile-product-rail a[aria-current="page"]');
  await activeTab.waitFor({state:'visible'});
  const activeStyle=await activeTab.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}));
  assert.equal(activeStyle.background,'rgb(255, 255, 255)',`${path} active product toggle must be white`);
  assert.equal(activeStyle.color,'rgb(43, 18, 53)',`${path} active product toggle text must be deep plum`);
  const duplicateRails=await page.evaluate(()=>[...document.querySelectorAll('nav')].filter(nav=>{
    if(nav.classList.contains('fmb-mobile-product-rail')||nav.closest('footer'))return false;
    const rect=nav.getBoundingClientRect();
    if(nav.getClientRects().length===0||rect.width<2||rect.height<2)return false;
    const style=getComputedStyle(nav);if(style.visibility==='hidden'||style.opacity==='0')return false;
    const hrefs=[...nav.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')||'');
    const hits=[hrefs.some(h=>/^\/news\/?(?:$|[?#])/.test(h)||h.startsWith('/news/archive')),hrefs.some(h=>h.startsWith('/news/world')),hrefs.some(h=>h.startsWith('/news/explainer')),hrefs.some(h=>h.startsWith('/news/fmb-brief'))].filter(Boolean).length;
    return hits>=3;
  }).length);
  assert.equal(duplicateRails,0,`${path} exposes a rendered duplicate legacy product navigation`);
  assert.equal(await page.locator('.fmb-global-week-actions:visible').count(),0,`${path} must not expose Horoscope/Crossword as top chrome`);
  assert.equal(await page.locator('.fmb-global-mobile-utility:visible').count(),0,`${path} must not expose the old utility strip`);
  const shellBox=await page.locator('.fmb-mobile-app-shell').boundingBox();
  assert(shellBox&&shellBox.height<=112,`${path} mobile chrome is too tall (${shellBox?.height}px)`);
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
await assertImage('[data-fmb-approved-hero]','Approved FMB Philippines newsroom hero failed to render.');
await assertImage('[data-fmb-approved-mug]','Approved Daily Brief mug failed to render.');
const heroBox=await page.locator('.fmb-app-brand-hero').boundingBox();
assert(heroBox&&heroBox.width>=389,`Home hero is not full bleed (${heroBox?.width}px)`);
assert(heroBox&&heroBox.height>=245&&heroBox.height<=300,`Home approved hero height is out of control (${heroBox?.height}px)`);
assert.equal(await page.locator('.fmb-app-brand-hero').evaluate(el=>getComputedStyle(el).borderRadius),'0px','Home hero must not look like an attached rounded card.');
await page.locator('.fmb-approved-hero-copy').waitFor({state:'visible'});
await page.locator('.fmb-approved-hero-ticker').waitFor({state:'visible'});
await page.locator('.fmb-hero-live-overlay').waitFor({state:'visible'});
await page.locator('.fmb-hero-readable-shade').waitFor({state:'visible'});
assert.equal(await page.locator('.fmb-hero-greeting:visible').count(),0,'Legacy giant greeting overlay must stay removed.');
assert.equal(await page.locator('.fmb-approved-hero-label:visible').count(),0,'Home must not show a label/CTA above the greeting.');
assert.equal((await page.locator('.fmb-approved-hero-ticker>strong').textContent())?.trim(),'HEADLINES','Home moving news bar must say HEADLINES.');
const ctas=await page.locator('.fmb-approved-hero-cta>*').allTextContents();
assert.deepEqual(ctas.map(v=>v.trim()),['Read the Latest','Customize'],'Home hero CTA labels drifted.');
const timeSize=await page.locator('.fmb-hero-clock [data-fmb-local-time]').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
const weatherSize=await page.locator('.fmb-hero-weather-copy>[data-fmb-weather]').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
const greetingSize=await page.locator('[data-fmb-greeting-line]').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
assert(timeSize>=9&&timeSize<=12,`Home utility time should stay small (${timeSize}px)`);
assert(weatherSize>=12&&weatherSize<=15,`Home utility weather should stay small (${weatherSize}px)`);
assert(greetingSize>=24&&greetingSize<=32,`Home editorial greeting headline is out of range (${greetingSize}px)`);
assert((await page.locator('[data-fmb-greeting]').textContent()||'').trim().length>4,'Home contextual greeting is missing.');
assert((await page.locator('[data-fmb-greeting-line]').textContent()||'').trim().length>10,'Home greeting quote is missing.');
const layers=await page.evaluate(()=>{
  const copy=document.querySelector('.fmb-approved-hero-copy')?.getBoundingClientRect();
  const ticker=document.querySelector('.fmb-approved-hero-ticker')?.getBoundingClientRect();
  const utility=document.querySelector('.fmb-hero-live-overlay')?.getBoundingClientRect();
  return{copyBottom:copy?.bottom,tickerTop:ticker?.top,tickerBottom:ticker?.bottom,utilityTop:utility?.top};
});
assert(layers.copyBottom<=layers.tickerTop+2,'Home hero copy collides with ticker.');
assert(layers.tickerBottom<=layers.utilityTop+2,'Home ticker collides with date/weather utility.');
await assertReadable('.fmb-app-lead h2','Home lead headline is not readable.');

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

await open('/news/archive/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'archive','Archive route art direction missing.');
await page.locator('.fmb-archive-signature').waitFor({state:'visible'});
await assertReadable('.fmb-archive-signature h1','Archive signature is unreadable.');
assert((await page.locator('.archive-row img').count())>0,'Archive must remain image-led.');

await open('/news/world/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'world','Worldwide route art direction missing.');
await page.locator('.fmb-product-signal.fmb-world-signal').waitFor({state:'visible'});
await assertReadable('.world-hero h1','Worldwide headline is unreadable.');
await assertReadable('.world-hero p','Worldwide deck is unreadable.');
const sharedHero=await heroMetrics('.world-hero','.world-hero .shell','.world-hero h1','.world-hero p','.world-rule');
assert.equal(sharedHero.height,300,'Worldwide hero must define the shared 300px product canvas.');
assert((await page.locator('.country-card').count())>=1,'Worldwide cards missing.');
await assertContrast('.country-card h3',4.5,'Worldwide card headline is low contrast');

await open('/news/explainer/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'explainer','Explainer route art direction missing.');
await page.locator('.fmb-product-signal.fmb-explainer-signal').waitFor({state:'visible'});
assert.equal(await page.locator('.fmb-explainer-mark:visible').count(),0,'Explainer must not show the old 206 hero badge.');
assert(!(await page.locator('.explainer-hero').innerText()).includes('206'),'Explainer hero must not expose the 206 badge text.');
await page.locator('.explainer-rule').waitFor({state:'visible'});
assert.equal((await page.locator('.explainer-hero h1').textContent())?.trim(),'FMB Explainer','FMB Explainer product name drifted.');
await assertReadable('.explainer-hero p','Explainer introduction is unreadable.');
assertSameHero(await heroMetrics('.explainer-hero','.explainer-hero .shell','.explainer-hero h1','.explainer-hero p','.explainer-rule'),sharedHero,'Explainer');
await page.locator('#fmbExplainedSearch').waitFor({state:'visible'});
await assertContrast('.explainer-card h2',4.5,'Explainer card heading is low contrast');

await open('/news/fmb-brief/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'brief','Daily Brief route art direction missing.');
await page.locator('.fmb-product-signal.fmb-brief-signal').waitFor({state:'visible'});
assert.equal(await page.locator('.fmb-brief-signature-visual:visible').count(),0,'Daily Brief must not show a floating mug in the hero.');
await page.locator('.brief-rule').waitFor({state:'visible'});
await assertReadable('.brief-archive-hero h1','Daily Brief heading is unreadable.');
assertSameHero(await heroMetrics('.brief-archive-hero','.brief-archive-hero .brief-shell','.brief-archive-hero h1','.brief-archive-hero p','.brief-rule'),sharedHero,'Daily Brief');
assert((await page.locator('.brief-issue').count())>=1,'Daily Brief editions missing.');
await assertContrast('.brief-issue h2',4.5,'Daily Brief issue headline is low contrast');

await open('/news/horoscope/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'horoscope','Horoscope route art direction missing.');
await page.locator('.fmb-horoscope-constellation').waitFor({state:'visible'});
assert((await page.locator('[data-zodiac-grid] button').count())===12,'Horoscope must show all 12 zodiac signs.');
assert((await page.locator('body').innerText()).includes('Hindi hawak ng mga bituin ang ating kapalaran, meron tayong freewill gamitin natin'),'Horoscope free-will header missing.');
await page.locator('button[data-sign="Pisces"]').click();
assert.equal(await page.evaluate(()=>localStorage.getItem('fmbZodiacV1')),'Pisces','Horoscope preference did not persist.');
assert.equal((await page.locator('[data-horoscope-reading] h2').textContent())?.trim(),'Pisces','Horoscope reading did not update.');
await assertContrast('.fmb-horoscope-section p',4.5,'Horoscope reading text is low contrast');

await open('/news/crossword/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'crossword','Crossword route art direction missing.');
assert.equal(await page.locator('.fmb-crossword-count:visible').count(),0,'Crossword numeric hero count must stay removed.');
await page.locator('.fmb-crossword-visual').waitFor({state:'visible'});
assert.equal(await page.locator('.fmb-crossword-visual i').count(),9,'Crossword decorative grid must remain intact.');
await page.locator('[data-cw-grid]').waitFor({state:'visible'});
assert((await page.locator('[data-cw-grid] input').count())>0,'Crossword has no playable cells.');
const crosswordText=await page.locator('body').innerText();
for(const forbidden of ['Reveal Letter','Reveal Word','Reveal Puzzle'])assert(!crosswordText.includes(forbidden),`Crossword exposes forbidden control: ${forbidden}`);
assert(crosswordText.includes('The complete answer key is released only when the next weekly crossword goes live'),'Weekly crossword answer-release policy missing.');
await assertContrast('.fmb-clue button',4.5,'Crossword clue text is not readable');
await assertContrast('.fmb-clue-group h2',4.5,'Crossword clue heading is not readable');
await assertContrast('.fmb-crossword-status',4.5,'Crossword status text is not readable');
await assertContrast('.fmb-cell input',7,'Crossword cell letters are not high contrast');
await assertContrast('.fmb-news-context p',4.5,'Crossword context text is not readable');
await assertContrast('.fmb-answer-release p',4.5,'Crossword answer-policy text is not readable');

await open('/news/about/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'about','About route art direction missing.');
await page.locator('.fmb-about-fmb-mark').waitFor({state:'visible'});
await assertReadable('.fmb-about-hero h1','About manifesto headline is unreadable.');

await open('/news/explainer/leptospirosis-after-flood-resilience-metro-manila/');
assert.equal(await page.locator('body').getAttribute('data-fmb-route'),'explainer','Explainer article must stay in the Explainer product family.');
await page.locator('article.article').waitFor({state:'visible'});
await page.locator('.fmb-mobile-reader-actions').waitFor({state:'visible'});
await page.locator('.fmb-reading-progress').waitFor({state:'visible'});
await assertReadable('article.article h1','Article headline is unreadable.');
await assertContrast('article.article p',4.5,'Article body text is low contrast');
await page.locator('[data-fmb-reader-save]').click();
const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fmbSavedStoriesV1')||'[]'));
assert(saved.some(item=>item.path.includes('/news/explainer/leptospirosis-after-flood-resilience-metro-manila/')),'Reader Save did not persist the article.');
assert.equal(await page.locator('meta[property="og:type"]').getAttribute('content'),'article','Open Graph article metadata missing.');
const structured=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
assert.equal(structured['@type'],'Article','FMB Explainer structured data is not Article.');
assert(structured.datePublished,'FMB Explainer structured data is missing the publication timestamp.');

await browser.close();
console.log('Mobile browser QA passed: white active product toggle, approved Philippines newsroom hero with HEADLINES crawl and compact date/time/weather, exact Read the Latest / Customize CTAs, strict 300px shared Worldwide/Explainer/Daily Brief hero geometry, enhanced Crossword with no numeric hero count, explicit contrast checks, and dedicated Archive, Horoscope, About, and article experiences.');
