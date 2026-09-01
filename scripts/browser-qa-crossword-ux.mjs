import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base=process.env.FMB_QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block'});
const page=await context.newPage();
await page.route('https://**/*',route=>route.abort());

const response=await page.goto(`${base}/news/crossword/`,{waitUntil:'domcontentloaded'});
assert(response?.ok(),`Crossword returned ${response?.status()}`);
await page.locator('[data-cw-grid]').waitFor({state:'visible'});
await page.locator('.fmb-crossword-save-gate').waitFor({state:'visible'});

const gateText=(await page.locator('.fmb-crossword-save-panel').innerText()).replace(/\s+/g,' ').trim();
assert(gateText.includes('Register or sign in to save your crossword progress.'),'Anonymous crossword must explain registration-to-save.');
assert(gateText.includes('will be lost when you close, refresh, or leave this page'),'Anonymous crossword must explicitly warn that progress is temporary.');

const firstInput=page.locator('[data-cw-grid] input').first();
assert.equal(await firstInput.isDisabled(),true,'Crossword should wait for a persistence choice before accepting input.');
await page.locator('[data-cw-continue]').click();
await page.locator('.fmb-crossword-save-gate').waitFor({state:'detached'});
assert.equal(await firstInput.isDisabled(),false,'Continue without saving must unlock the crossword.');
assert((await page.locator('.fmb-crossword-persistence').innerText()).includes('Guest mode'),'Guest mode must remain visibly disclosed.');

await firstInput.click();
await page.locator('.fmb-crossword-clue-popover').waitFor({state:'visible'});
const clueTitle=(await page.locator('[data-cw-active-title]').innerText()).trim();
const clueText=(await page.locator('[data-cw-active-text]').innerText()).trim();
assert(/\d+\s+(across|down)/i.test(clueTitle),`Clicking a crossword cell must show clue number and direction; got "${clueTitle}".`);
assert(clueText.length>12,'Clicking a crossword cell must show the clue text.');
await page.locator('[data-cw-clue-close]').click();
assert.equal(await page.locator('.fmb-crossword-clue-popover').isHidden(),true,'Clue close icon must dismiss the active clue panel.');

await firstInput.fill('A');
const guestPuzzleKeys=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('fmb-current-events-2026-09-01-v2')));
assert.equal(guestPuzzleKeys.length,0,'Guest crossword must not create persistent puzzle memory.');

await page.reload({waitUntil:'domcontentloaded'});
await page.locator('.fmb-crossword-save-gate').waitFor({state:'visible'});
await page.locator('[data-cw-continue]').click();
const restored=(await page.locator('[data-cw-grid] input').first().inputValue()).trim();
assert.equal(restored,'','Guest crossword progress must be lost after reload.');

const js=await page.request.get(`${base}/news/assets/js/fmb-news-weekly-crossword.js`);
assert(js.ok(),'Built crossword runtime is missing.');
const source=await js.text();
for(const token of ['news_crossword_progress','on_conflict=user_id,puzzle_id','scheduleSave','Save your crossword progress','Continue without saving','fmb-crossword-clue-popover'])assert(source.includes(token),`Crossword account-save runtime missing ${token}`);

await browser.close();
console.log('Crossword UX QA passed: account save contract is present, anonymous progress is non-persistent, and tapping a cell opens a closeable active clue panel.');
