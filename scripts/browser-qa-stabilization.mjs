import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});

async function makeContext(options={}){
  const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',...options});
  const page=await context.newPage();
  await page.route('https://**/*',route=>route.abort());
  return{context,page};
}

async function assertPersistentShell(page,path){
  const response=await page.goto(`${base}${path}`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`${path} returned ${response?.status()}`);
  const shell=page.locator('.fmb-mobile-app-shell');
  await shell.waitFor({state:'visible'});
  const dock=page.locator('.fmb-editorial-mobile-dock');
  await dock.waitFor({state:'visible'});
  const geometry=await page.evaluate(()=>{
    const shell=document.querySelector('.fmb-mobile-app-shell');
    const search=document.querySelector('.fmb-mobile-shell-search');
    const brand=document.querySelector('.fmb-mobile-shell-brand');
    const dock=document.querySelector('.fmb-editorial-mobile-dock');
    const sr=search?.getBoundingClientRect(),br=brand?.getBoundingClientRect(),dr=dock?.getBoundingClientRect();
    return{
      shellPosition:shell?getComputedStyle(shell).position:'',shellTop:shell?getComputedStyle(shell).top:'',
      searchCenter:sr?sr.left+sr.width/2:-999,brandCenter:br?br.left+br.width/2:999,
      viewport:innerWidth,
      // The app bar used to carry a hamburger on the left and a section rail
      // below. Both duplicated the dock, so both are gone; what is asserted now
      // is that they have not come back and that the wordmark still centres
      // without the left-hand control that used to balance it.
      appBarControls:[...document.querySelectorAll('.fmb-mobile-shell-head a,.fmb-mobile-shell-head button')].length,
      retiredNav:document.querySelectorAll('.fmb-mobile-product-rail,.fmb-approved-bottom-nav,[data-fmb-shell-menu]').length,
      dockPosition:dock?getComputedStyle(dock).position:'',dockBottom:dr?Math.abs(innerHeight-dr.bottom):999,dockItems:dock?.children.length||0
    };
  });
  assert.equal(geometry.shellPosition,'sticky',`${path} FMB shell must stay sticky.`);
  assert.equal(geometry.shellTop,'0px',`${path} FMB shell must pin to the top.`);
  assert.equal(geometry.appBarControls,2,`${path} app bar must carry exactly the wordmark and search; found ${geometry.appBarControls} controls.`);
  assert.equal(geometry.retiredNav,0,`${path} must not restore the section rail, the retired dock or the app-bar hamburger.`);
  assert(Math.abs(geometry.brandCenter-geometry.viewport/2)<=12,`${path} FMB NEWS. wordmark is not centered.`);
  assert(geometry.searchCenter>geometry.viewport*.75,`${path} search must stay on the right.`);
  assert.equal(geometry.dockPosition,'fixed',`${path} editorial bottom dock must be fixed.`);
  assert(geometry.dockBottom<=2,`${path} editorial bottom dock must touch the viewport bottom.`);
  assert.equal(geometry.dockItems,5,`${path} editorial bottom dock must expose Home, World, Sports, Briefing and Menu.`);

  await page.evaluate(()=>scrollTo(0,Math.min(420,document.documentElement.scrollHeight-innerHeight)));
  await page.waitForTimeout(80);
  const pinned=await shell.evaluate(el=>el.getBoundingClientRect().top);
  assert(Math.abs(pinned)<=1,`${path} FMB shell stopped pinning after scroll (${pinned}px).`);

  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.body.style.scrollBehavior='auto';
    scrollTo(0,0);
  });
  await page.waitForFunction(()=>Math.abs(scrollY)<=1);
}

{
  const{context,page}=await makeContext({timezoneId:'America/New_York',reducedMotion:'no-preference'});
  await assertPersistentShell(page,'/news/');
  await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});

  assert.equal(await page.locator('.fmb-mobile-shell-head [data-fmb-shell-account]').count(),0,'Home shell must not build a standalone account button.');
  assert.equal(await page.locator('.fmb-approved-bottom-nav').count(),0,'Retired pre-redesign bottom navigation must not return.');
  assert.equal(await page.locator('.fmb-editorial-mobile-dock').count(),1,'New editorial bottom dock must be built exactly once.');
  assert.equal(await page.locator('[data-fmb-install-app]').count(),0,'PWA runtime must not build a floating Add to Home Screen button.');

  const dockLabels=(await page.locator('.fmb-editorial-mobile-dock>*').allTextContents()).map(v=>v.trim());
  assert.deepEqual(dockLabels,['Home','World','Sports','Briefing','Menu'],'Editorial bottom dock labels drifted.');

  const inlinePresentation=await page.evaluate(()=>({
    head:document.querySelector('.fmb-mobile-shell-head')?.getAttribute('style')||'',
    active:document.querySelector('.fmb-editorial-mobile-dock a[aria-current="page"]')?.getAttribute('style')||'',
    ticker:document.querySelector('.fmb-app-top-ticker .fmb-approved-hero-ticker-track')?.getAttribute('style')||''
  }));
  for(const[key,value]of Object.entries(inlinePresentation))assert.equal(value,'',`${key} must not carry inline presentation styles: ${value}`);

  // The contract is that the Home clock shows the correct Philippine time on a
  // device that is not in the Philippines. That is what is asserted.
  //
  // It used to be asserted as string equality against a time computed at the
  // moment of the check, inside a 2500ms window. Two things were wrong with
  // that. The page renders minute resolution and re-ticks every second, so if
  // the minute rolled over between the page's tick and the test's own
  // Intl.format the two strings differed while the clock was perfectly correct
  // -- a race against a clock boundary, not a defect. And the window was spent
  // waiting for the runtime to overwrite a WRONG time that the build had baked
  // into the HTML; that baking is now gone, so the element starts as "--:--"
  // and the only thing to wait for is the runtime taking ownership.
  //
  // So: wait for a real PHT time to appear, then assert it is within a minute of
  // Philippine time. That is stricter about what "correct" means -- a clock an
  // hour off in either direction fails, where a timezone bug producing the
  // right minute in the wrong hour would still be caught -- and immune to the
  // boundary race.
  await page.waitForFunction(
    () => /^\d{1,2}:\d{2}\s?(AM|PM)\sPHT$/i.test((document.querySelector('[data-fmb-local-time]')?.textContent||'').trim()),
    null, {timeout:15000}
  );
  const pht=await page.evaluate(()=>{
    const shown=(document.querySelector('[data-fmb-local-time]')?.textContent||'').trim();
    const parts=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true}).formatToParts(new Date());
    const get=t=>Number(parts.find(p=>p.type===t)?.value);
    const ampm=(parts.find(p=>p.type==='dayPeriod')?.value||'').toUpperCase();
    let h=get('hour')%12; if(ampm.startsWith('P'))h+=12;
    const nowMinutes=h*60+get('minute');
    const m=shown.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)/i);
    let sh=m?Number(m[1])%12:NaN; if(m&&/p/i.test(m[3]))sh+=12;
    const shownMinutes=m?sh*60+Number(m[2]):NaN;
    let drift=Math.abs(shownMinutes-nowMinutes);
    if(drift>720)drift=1440-drift;           // across midnight
    return {shown,drift};
  });
  assert(Number.isFinite(pht.drift)&&pht.drift<=1,
    `Home clock must stay in Philippine Standard Time even for a New York device (showed ${pht.shown}, ${pht.drift} minutes from Manila).`);

  const tickerGeometry=await page.evaluate(()=>{
    const shell=document.querySelector('.fmb-mobile-app-shell');
    const ticker=document.querySelector('.fmb-app-top-ticker');
    const hero=document.querySelector('.fmb-app-brand-hero');
    if(!shell||!ticker||!hero)throw new Error('Home sticky shell/ticker/hero structure missing.');
    const s=shell.getBoundingClientRect(),t=ticker.getBoundingClientRect(),h=hero.getBoundingClientRect();
    return{insideShell:ticker.parentElement===shell,position:getComputedStyle(ticker).position,shellBottom:s.bottom,tickerBottom:t.bottom,heroTop:h.top};
  });
  assert.equal(tickerGeometry.insideShell,true,'Home Headlines ticker must be a direct child of the sticky FMB shell.');
  assert.equal(tickerGeometry.position,'relative','Home Headlines ticker must stay in normal flow inside the sticky FMB shell.');
  assert(Math.abs(tickerGeometry.tickerBottom-tickerGeometry.shellBottom)<=1,'Home Headlines must end at the bottom of the sticky FMB shell.');
  assert(tickerGeometry.tickerBottom<=tickerGeometry.heroTop+1,`Home Headlines must not overlap the story hero (${(tickerGeometry.tickerBottom-tickerGeometry.heroTop).toFixed(1)}px overlap).`);

  const menu=page.locator('[data-fmb-dock-menu]');
  await menu.focus();
  await menu.click();
  const dialog=page.locator('.fmb-app-action-panel[role="dialog"]');
  await dialog.waitFor({state:'visible'});
  assert(await page.evaluate(()=>Boolean(document.querySelector('.fmb-app-action-panel')?.contains(document.activeElement))),'Opening the menu must move focus inside the dialog.');
  const profile=page.locator('[data-fmb-open-account]');
  await profile.waitFor({state:'visible'});
  assert.equal(await profile.locator('svg').count(),1,'Your FMB profile icon must live inside the menu.');
  assert.equal((await profile.textContent())?.includes('Your FMB'),true,'Menu must expose Your FMB.');
  assert.equal(await page.locator('[data-fmb-install]').count(),1,'Add to Home Screen must live inside the menu.');
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'detached'});
  assert(await menu.evaluate(el=>document.activeElement===el),'Closing the menu with Escape must restore focus to its opener.');

  const dockMenu=page.locator('[data-fmb-dock-menu]');
  await dockMenu.click();
  await dialog.waitFor({state:'visible'});
  assert((await dialog.locator('h2').textContent())?.includes('More from FMB News'),'Dock Menu must open the same FMB action sheet.');
  await page.keyboard.press('Escape');

  await assertPersistentShell(page,'/news/world/');
  assert.equal(await page.locator('[data-fmb-shell-account]').count(),0,'Worldwide must not restore a standalone profile icon.');
  await context.close();
}

{
  const{context,page}=await makeContext({reducedMotion:'reduce'});
  const response=await page.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`Reduced-motion Home returned ${response?.status()}`);
  await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});
  const animation=await page.locator('.fmb-app-top-ticker .fmb-approved-hero-ticker-track').evaluate(el=>getComputedStyle(el).animationName);
  assert.equal(animation,'none',`Ticker animation must stop for reduced motion; got ${animation}.`);
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true,'Reduced-motion browser context was not honored.');
  await context.close();
}

await browser.close();
console.log('Mobile stabilization browser QA passed: sticky FMB NEWS. shell, a wordmark-and-search app bar with no hamburger or section rail duplicating it, the persistent five-item editorial dock as the single primary navigation, PHT authority, accessible menu focus, and reduced motion.');