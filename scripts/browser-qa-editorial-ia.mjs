import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',timezoneId:'Asia/Manila'});
const page=await context.newPage();
await page.route('https://**/*',route=>route.abort());

const homeResponse=await page.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
assert(homeResponse?.ok(),`Desktop Home returned ${homeResponse?.status()}`);
await page.locator('.network-home').waitFor({state:'visible'});

const deskLinks=await page.locator('.editorial-desk').evaluateAll(nodes=>nodes.map(node=>({
  title:(node.querySelector('.editorial-desk-top strong')?.textContent||'').trim(),
  href:node.getAttribute('href')||''
})));
assert.deepEqual(deskLinks,[
  {title:'News',href:'/news/archive/'},
  {title:'Worldwide',href:'/news/world/'},
  {title:'Sports',href:'/news/sports/'},
],'Desktop landing must expose exactly News, Worldwide and Sports as direct editorial desks.');

const navState=await page.evaluate(()=>{
  const nav=document.querySelector('.publication-nav');
  if(!nav)throw new Error('Publication navigation missing');
  const rect=nav.getBoundingClientRect();
  return{
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    left:rect.left,
    right:rect.right,
    viewport:innerWidth,
    direct:Array.from(nav.children).filter(node=>node.tagName==='A').map(node=>({text:(node.textContent||'').trim(),href:node.getAttribute('href')||''}))
  };
});
assert(navState.overflow<=1,`Desktop landing has ${navState.overflow}px horizontal overflow.`);
assert(navState.left>=-1&&navState.right<=navState.viewport+1,`Publication navigation escapes viewport (${navState.left.toFixed(1)}–${navState.right.toFixed(1)} of ${navState.viewport}).`);
for(const item of [
  ['News','/news/archive/'],['Worldwide','/news/world/'],['Sports','/news/sports/'],
  ['Daily Brief','/news/fmb-brief/'],['Fact Check','/news/fact-check/'],['Explainer','/news/explainer/'],['About','/news/about/']
])assert(navState.direct.some(link=>link.text===item[0]&&link.href===item[1]),`Publication navigation missing ${item[0]} → ${item[1]}`);
assert(navState.direct.some(link=>link.href==='/news/search/'),'Desktop publication search control must open the real Search route.');

const entertainment=page.locator('.publication-menu');
assert.equal(await entertainment.count(),1,'Entertainment must be one grouped desktop menu.');
await entertainment.locator('summary').click();
assert(await entertainment.evaluate(node=>node.hasAttribute('open')),'Entertainment menu did not open.');
for(const [label,href] of [['Weekly Horoscope','/news/horoscope/'],['FMB Crossword','/news/crossword/']]){
  const link=entertainment.locator(`a[href="${href}"]`);
  assert.equal(await link.count(),1,`Entertainment must contain ${label}.`);
  assert(await link.isVisible(),`${label} must be visible when Entertainment is open.`);
}
assert.equal(await page.locator('.publication-nav > a[href="/news/horoscope/"]').count(),0,'Horoscope must not be a top-level publication nav item.');
assert.equal(await page.locator('.publication-nav > a[href="/news/crossword/"]').count(),0,'Crossword must not be a top-level publication nav item.');

const sportsResponse=await page.goto(`${base}/news/sports/`,{waitUntil:'domcontentloaded'});
assert(sportsResponse?.ok(),`Sports route returned ${sportsResponse?.status()}`);
await page.locator('#sports-title').waitFor({state:'visible'});
const sportsState=await page.evaluate(()=>({
  title:(document.querySelector('#sports-title')?.textContent||'').trim(),
  stories:document.querySelectorAll('.sports-story').length,
  empty:Boolean(document.querySelector('.sports-empty')),
  overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
}));
assert.equal(sportsState.title,'Sports','Sports route heading changed unexpectedly.');
assert(sportsState.stories>0||sportsState.empty,'Sports route must show real Sports inventory or one explicit empty state.');
assert(!(sportsState.stories>0&&sportsState.empty),'Sports route cannot show inventory and empty state simultaneously.');
assert(sportsState.overflow<=1,`Sports route has ${sportsState.overflow}px horizontal overflow.`);

await context.close();
await browser.close();
console.log(`Desktop editorial IA QA passed: three direct desks, grouped Entertainment, bounded navigation, real Search target, and Sports route (${sportsState.stories} stories${sportsState.empty?', empty state':''}).`);
