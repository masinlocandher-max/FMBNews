import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block'});
const page=await context.newPage();
await page.route('https://**/*',route=>route.abort());

try{
  const response=await page.goto(`${base}/news/crossword/`,{waitUntil:'domcontentloaded'});
  assert(response?.ok(),`Read Between the Headlines returned ${response?.status()}`);

  await page.locator('[data-rbt-start]').waitFor({state:'visible'});
  assert((await page.locator('body').innerText()).includes('Read Between'),'Game title must be visible on the entry screen.');
  assert((await page.locator('body').innerText()).includes('Thirty questions'),'Entry screen must disclose the 30-question format.');

  const startButton=page.locator('[data-rbt-start-button]');
  await startButton.click();
  const entryError=(await page.locator('[data-rbt-player-error]').innerText()).trim();
  assert(entryError.includes('Name and a valid email are required'),'Game must require name and a valid email before starting.');

  await page.locator('[data-rbt-player]').fill('FMB QA Player');
  await page.locator('[data-rbt-email]').fill('qa@example.com');
  await startButton.click();
  await page.locator('[data-rbt-game]').waitFor({state:'visible'});
  await page.locator('[data-rbt-question-no]').waitFor({state:'visible'});

  const timer=page.locator('[data-rbt-timer-display]');
  const initialTimer=Number((await timer.innerText()).trim());
  assert(initialTimer>0&&initialTimer<=30,`Question timer must begin at no more than 30 seconds; got ${initialTimer}.`);
  await page.waitForTimeout(1100);
  const laterTimer=Number((await timer.innerText()).trim());
  assert(laterTimer<=initialTimer&&laterTimer>=0,'Question timer must count down while the player is deciding.');

  let options=page.locator('.rbt-option');
  for(let attempt=0;attempt<10&&await options.count()===0;attempt++){
    await page.locator('[data-rbt-skip]').click();
    await page.waitForTimeout(720);
    options=page.locator('.rbt-option');
  }
  const optionCount=await options.count();
  assert(optionCount===2||optionCount===4,`Expected a True/False or four-choice question; got ${optionCount} options.`);

  const firstOption=options.first();
  const geometry=await firstOption.evaluate((el)=>{
    const choice=getComputedStyle(el);
    const marker=getComputedStyle(el,'::before');
    const questionEl=document.querySelector('.rbt-question-chamber');
    const question=questionEl?getComputedStyle(questionEl):null;
    return {
      choiceRadius:choice.borderRadius,
      choiceClip:choice.clipPath,
      choiceBackdrop:choice.backdropFilter||choice.webkitBackdropFilter||'',
      markerRadius:marker.borderRadius,
      markerClip:marker.clipPath,
      questionRadius:question?.borderRadius||'',
      questionClip:question?.clipPath||'',
      questionBackdrop:question?.backdropFilter||question?.webkitBackdropFilter||'',
    };
  });
  assert(parseFloat(geometry.choiceRadius)>=16,`Answer choices must be rounded; got ${geometry.choiceRadius}.`);
  assert(geometry.choiceClip==='none',`Answer choices must not use sharp clipped geometry; got ${geometry.choiceClip}.`);
  assert(geometry.choiceBackdrop.includes('blur'),'Answer choices must retain frosted-glass blur.');
  assert(geometry.markerRadius==='50%',`A/B/C/D marker must be circular; got ${geometry.markerRadius}.`);
  assert(geometry.markerClip==='none',`A/B/C/D marker must not use clipped geometry; got ${geometry.markerClip}.`);
  assert(parseFloat(geometry.questionRadius)>=20,`Question panel must be rounded; got ${geometry.questionRadius}.`);
  assert(geometry.questionClip==='none',`Question panel must not use sharp clipped geometry; got ${geometry.questionClip}.`);
  assert(geometry.questionBackdrop.includes('blur'),'Question panel must retain frosted-glass blur.');

  const label=await firstOption.getAttribute('data-option-label');
  assert(['A','B','C','D'].includes(label),'Answer choice must have a visible A/B/C/D marker label.');

  const lockButton=page.locator('[data-rbt-submit]');
  assert.equal(await lockButton.isDisabled(),true,'Lock Answer must stay disabled until a choice is selected.');
  await firstOption.click();
  assert.equal(await firstOption.getAttribute('data-selected'),'true','Tapped answer must enter the selected/armed state.');
  assert.equal(await lockButton.isDisabled(),false,'Selecting an answer must enable Lock Answer.');

  await lockButton.click();
  const resolved=page.locator('.rbt-option[data-chosen="correct"],.rbt-option[data-chosen="wrong"]');
  await resolved.first().waitFor({state:'visible',timeout:1200});
  assert.equal(await resolved.count(),1,'Only the committed answer may receive a resolved state; unchosen answers must not reveal correctness.');

  const viewport=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  assert(viewport.scrollWidth<=viewport.clientWidth+2,`Game must not overflow horizontally on iPhone 13 (${viewport.scrollWidth}px > ${viewport.clientWidth}px).`);

  const js=await page.request.get(`${base}/news/assets/js/fmb-news-read-between-headlines.js`);
  assert(js.ok(),'Built Read Between the Headlines runtime is missing.');
  const source=await js.text();
  for(const token of [
    "POINTS_PER_CORRECT=10",
    "QUESTION_SECONDS=30",
    "questions.length!==30",
    "The correct answer stays hidden.",
    "visibilitychange",
    "pagehide",
    "beforeunload",
    "Name and a valid email are required",
  ]) assert(source.includes(token),`Game runtime missing required integrity contract: ${token}`);

  console.log('Read Between the Headlines QA passed: player gate, 30-second countdown, rounded frosted UI, circular metallic answer markers, select-then-lock interaction, mobile fit, and hidden-answer integrity are intact.');
}finally{
  await browser.close();
}
