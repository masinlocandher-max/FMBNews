import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});

async function verifyFounder(context,label){
  const page=await context.newPage();
  await page.route('https://**/*',route=>route.abort());
  const response=await page.goto(`${base}/news/about/`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`${label} About returned ${response?.status()}`);
  const section=page.locator('[data-fmb-founder-section]');
  await section.waitFor({state:'visible'});
  const placeholder=section.locator('[data-fmb-founder-photo-placeholder]');
  await placeholder.waitFor({state:'visible'});
  assert.equal(await section.locator('img').count(),0,`${label} founder section must keep a placeholder until a real portrait is supplied.`);
  assert.equal((await section.locator('#founderTitle').textContent())?.trim(),'Francine Marie Bautista',`${label} founder title changed.`);
  const profile=section.locator('a.fmb-founder-profile-link');
  assert.equal(await profile.getAttribute('href'),'https://francinemariebautista.com/profile/',`${label} founder profile URL changed.`);
  assert.equal(await profile.getAttribute('rel'),'author',`${label} founder profile link must retain rel=author.`);
  const layout=await page.evaluate(()=>{
    const section=document.querySelector('[data-fmb-founder-section]');
    const placeholder=document.querySelector('[data-fmb-founder-photo-placeholder]');
    if(!section||!placeholder)throw new Error('Founder layout nodes missing');
    const s=section.getBoundingClientRect(),p=placeholder.getBoundingClientRect();
    return{
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      sectionWidth:s.width,sectionHeight:s.height,
      placeholderWidth:p.width,placeholderHeight:p.height,
      placeholderDisplay:getComputedStyle(placeholder).display
    };
  });
  assert(layout.overflow<=1,`${label} About has ${layout.overflow}px horizontal overflow.`);
  assert(layout.sectionWidth>0&&layout.sectionHeight>180,`${label} founder section collapsed.`);
  assert(layout.placeholderWidth>160&&layout.placeholderHeight>200,`${label} founder portrait placeholder is not visually substantial.`);
  assert.notEqual(layout.placeholderDisplay,'none',`${label} founder portrait placeholder is hidden.`);
  await page.close();
}

const desktop=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',timezoneId:'Asia/Manila'});
await verifyFounder(desktop,'Desktop');
await desktop.close();

const mobile=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',timezoneId:'Asia/Manila'});
await verifyFounder(mobile,'Mobile');
await mobile.close();

await browser.close();
console.log('Founder About QA passed on desktop and mobile: visible identity, canonical profile, explicit image-free portrait placeholder, and no horizontal overflow.');
