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
  const dock=page.locator('.fmb-mobile-bottom-nav');
  await dock.waitFor({state:'visible'});

  const geometry=await page.evaluate(()=>{
    const shell=document.querySelector('.fmb-mobile-app-shell');
    const head=document.querySelector('.fmb-mobile-shell-head');
    const search=document.querySelector('.fmb-mobile-shell-actions a[aria-label="Search FMB News"]');
    const brand=document.querySelector('.fmb-mobile-shell-brand');
    const theme=document.querySelector('[data-fmb-mobile-theme]');
    const menu=document.querySelector('[data-fmb-shell-menu]');
    const dock=document.querySelector('.fmb-mobile-bottom-nav');
    const hr=head?.getBoundingClientRect(),sr=search?.getBoundingClientRect(),br=brand?.getBoundingClientRect(),tr=theme?.getBoundingClientRect(),mr=menu?.getBoundingClientRect(),dr=dock?.getBoundingClientRect();
    return{
      shellPosition:shell?getComputedStyle(shell).position:'',shellTop:shell?getComputedStyle(shell).top:'',
      headLeft:hr?.left??999,headRight:hr?.right??-999,
      brandLeft:br?.left??999,brandRight:br?.right??999,
      searchLeft:sr?.left??-999,themeLeft:tr?.left??-999,menuLeft:mr?.left??-999,
      dockPosition:dock?getComputedStyle(dock).position:'',dockBottom:dr?innerHeight-dr.bottom:999,dockWidth:dr?.width??0,
      viewport:innerWidth,
      railIcons:document.querySelectorAll('.fmb-mobile-product-rail svg').length,
      railLabels:[...document.querySelectorAll('.fmb-mobile-product-rail>a')].map(a=>(a.textContent||'').trim()),
      dockLabels:[...document.querySelectorAll('.fmb-mobile-bottom-nav :is(a,button) span')].map(n=>(n.textContent||'').trim())
    };
  });

  assert.equal(geometry.shellPosition,'sticky',`${path} FMB shell must stay sticky.`);
  assert.equal(geometry.shellTop,'0px',`${path} FMB shell must pin to the top.`);
  assert(geometry.brandLeft>=8&&geometry.brandRight<geometry.viewport*.6,`${path} FMB masthead must stay left-aligned.`);
  assert(geometry.searchLeft>geometry.brandRight,`${path} Search must live to the right of the FMB identity.`);
  assert(geometry.themeLeft>geometry.searchLeft,`${path} Theme must follow Search.`);
  assert(geometry.menuLeft>geometry.themeLeft,`${path} Menu must be the right-most header utility.`);
  assert.equal(geometry.railIcons,0,`${path} category rail should be editorial text, not the retired five-icon product rail.`);
  assert.deepEqual(geometry.railLabels,['News','World','Sports','Briefing','Fact Check','Explainers','Entertainment'],`${path} category rail drifted.`);
  assert.equal(geometry.dockPosition,'fixed',`${path} approved five-item bottom navigation must be fixed.`);
  assert(geometry.dockBottom>=0&&geometry.dockBottom<=30,`${path} mobile dock is detached from the safe bottom edge (${geometry.dockBottom}px).`);
  assert(geometry.dockWidth>=geometry.viewport-40,`${path} mobile dock is unexpectedly narrow (${geometry.dockWidth}px).`);
  assert.deepEqual(geometry.dockLabels,['Home','World','Sports','Briefing','Menu'],`${path} bottom navigation drifted.`);

  await page.evaluate(()=>scrollTo(0,Math.min(420,document.documentElement.scrollHeight-innerHeight)));
  await page.waitForTimeout(80);
  const pinned=await shell.evaluate(el=>el.getBoundingClientRect().top);
  assert(Math.abs(pinned)<=1,`${path} FMB shell stopped pinning after scroll (${pinned}px).`);
  const dockStillPinned=await dock.evaluate(el=>innerHeight-el.getBoundingClientRect().bottom);
  assert(dockStillPinned>=0&&dockStillPinned<=30,`${path} bottom navigation stopped pinning after scroll (${dockStillPinned}px).`);

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
  assert.equal(await page.locator('.fmb-approved-bottom-nav').count(),0,'Retired bottom navigation implementation must not return.');
  assert.equal(await page.locator('.fmb-mobile-bottom-nav').count(),1,'Approved editorial bottom navigation must exist exactly once.');
  assert.equal(await page.locator('[data-fmb-install-app]').count(),0,'PWA runtime must not build a floating Add to Home Screen button.');

  const inlinePresentation=await page.evaluate(()=>({
    head:document.querySelector('.fmb-mobile-shell-head')?.getAttribute('style')||'',
    active:document.querySelector('.fmb-mobile-product-rail a[aria-current="page"]')?.getAttribute('style')||'',
    ticker:document.querySelector('.fmb-app-top-ticker .fmb-approved-hero-ticker-track')?.getAttribute('style')||''
  }));
  for(const[key,value]of Object.entries(inlinePresentation))assert.equal(value,'',`${key} must not carry inline presentation styles: ${value}`);

  await page.waitForFunction(()=>{
    const actual=(document.querySelector('[data-fmb-local-time]')?.textContent||'').trim();
    const expected=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date())+' PHT';
    return actual===expected;
  },null,{timeout:2500});
  const pht=await page.evaluate(()=>{
    const expected=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date())+' PHT';
    return{expected,actual:(document.querySelector('[data-fmb-local-time]')?.textContent||'').trim()};
  });
  assert.equal(pht.actual,pht.expected,`Home clock must stay in Philippine Standard Time even for a New York device (${pht.actual} vs ${pht.expected}).`);

  const tickerGeometry=await page.evaluate(()=>{
    const shell=document.querySelector('.fmb-mobile-app-shell');
    const ticker=document.querySelector('.fmb-app-top-ticker');
    const hero=document.querySelector('.fmb-app-brand-hero');
    if(!shell||!ticker||!hero)throw new Error('Home sticky shell/ticker/editorial intro structure missing.');
    const s=shell.getBoundingClientRect(),t=ticker.getBoundingClientRect(),h=hero.getBoundingClientRect();
    return{insideShell:ticker.parentElement===shell,position:getComputedStyle(ticker).position,shellBottom:s.bottom,tickerBottom:t.bottom,heroTop:h.top};
  });
  assert.equal(tickerGeometry.insideShell,true,'Home Latest rail must be a direct child of the sticky FMB shell.');
  assert.equal(tickerGeometry.position,'relative','Home Latest rail must stay in normal flow inside the sticky FMB shell.');
  assert(Math.abs(tickerGeometry.tickerBottom-tickerGeometry.shellBottom)<=1,'Home Latest rail must end at the bottom of the sticky FMB shell.');
  assert(tickerGeometry.tickerBottom<=tickerGeometry.heroTop+1,`Home Latest rail must not overlap the editorial intro (${(tickerGeometry.tickerBottom-tickerGeometry.heroTop).toFixed(1)}px overlap).`);

  const menu=page.locator('[data-fmb-shell-menu]');
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
  assert.equal(await page.locator('.fmb-menu-group-label').filter({hasText:'Entertainment'}).count(),1,'Menu must group Horoscope and Crossword under Entertainment.');
  assert.equal(await page.locator('.fmb-app-action-list a[href="/news/horoscope/"]').count(),1,'Entertainment menu must contain Horoscope.');
  assert.equal(await page.locator('.fmb-app-action-list a[href="/news/crossword/"]').count(),1,'Entertainment menu must contain Crossword.');
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'detached'});
  assert(await menu.evaluate(el=>document.activeElement===el),'Closing the menu with Escape must restore focus to its opener.');

  const theme=page.locator('[data-fmb-mobile-theme]');
  await theme.waitFor({state:'visible'});
  const before=await page.locator('html').getAttribute('data-fmb-theme-mode');
  await theme.click();
  const after=await page.locator('html').getAttribute('data-fmb-theme-mode');
  assert.notEqual(after,before,'Header appearance control must cycle the theme.');

  await assertPersistentShell(page,'/news/world/');
  assert.equal(await page.locator('.fmb-mobile-bottom-nav a[href="/news/world/"]').getAttribute('aria-current'),'page','World bottom-navigation state must activate on World.');
  await assertPersistentShell(page,'/news/sports/');
  assert.equal(await page.locator('.fmb-mobile-bottom-nav a[href="/news/sports/"]').getAttribute('aria-current'),'page','Sports bottom-navigation state must activate on Sports.');
  await assertPersistentShell(page,'/news/fmb-brief/');
  assert.equal(await page.locator('.fmb-mobile-bottom-nav a[href="/news/fmb-brief/"]').getAttribute('aria-current'),'page','Briefing bottom-navigation state must activate on Daily Briefing.');
  await context.close();
}

{
  const{context,page}=await makeContext({reducedMotion:'reduce'});
  const response=await page.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`Reduced-motion Home returned ${response?.status()}`);
  await page.locator('[data-fmb-mobile-home]').waitFor({state:'visible'});
  const animation=await page.locator('.fmb-app-top-ticker .fmb-approved-hero-ticker-track').evaluate(el=>getComputedStyle(el).animationName);
  assert.equal(animation,'none',`Ticker animation must stop for reduced motion; got ${animation}.`);
  const prefers=await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  assert.equal(prefers,true,'Reduced-motion browser context was not honored.');
  await context.close();
}

await browser.close();
console.log('Mobile stabilization browser QA passed: left FMB masthead, Search/Theme/Menu utilities, editorial category rail, approved five-item bottom navigation, PHT authority, accessible menu focus, Entertainment grouping, route-active states, and reduced motion.');