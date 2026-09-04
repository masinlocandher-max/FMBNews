// Smoke tests for the reader features and the Fact Check desk, at both widths.
//
// Crossword and Horoscope are reader/lifestyle features inside the publication,
// not additional top-level publications: they must render and work, but must not
// appear in the five-product rail.
//
// Fact Check is one of the five official products. Its landing must render even
// when nothing is published — an empty desk has to say so, not advertise checks
// it is holding back.

import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base = process.env.FMB_QA_BASE_URL || 'http://127.0.0.1:4173';
const PRODUCTS = ['FMB News', 'FMB Worldwide', 'FMB Explainer', 'FMB Fact Check', 'FMB Daily Brief'];
const browser = await chromium.launch({ headless: true });

for (const [label, opts] of [['phone', { ...devices['iPhone 13'] }], ['desktop', { viewport: { width: 1280, height: 900 } }]]) {
  const context = await browser.newContext({ ...opts, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.route('https://**/*', r => r.abort());

  for (const route of ['/news/crossword/', '/news/horoscope/', '/news/fact-check/']) {
    const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
    assert(response?.ok(), `${label} ${route} returned ${response?.status()}`);
    await page.waitForTimeout(700);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 1, `${label} ${route} has ${overflow}px horizontal overflow`);
    assert(await page.locator('h1').first().isVisible(), `${label} ${route} has no visible heading`);
    assert(await page.locator('a[href^="/news/"]').count() > 0, `${label} ${route} has no internal links`);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href').catch(() => null);
    assert(canonical && canonical.startsWith('https://www.francinemariebautista.com/news/'),
      `${label} ${route} canonical is wrong: ${canonical}`);

    // Crossword and Horoscope stay features, not products.
    if (label === 'phone') {
      const rail = await page.locator('.fmb-mobile-product-rail>a').allTextContents();
      if (rail.length) assert.deepEqual(rail.map(v => v.trim()), PRODUCTS,
        `${label} ${route} product rail drifted — Crossword/Horoscope must stay features`);
    }
  }

  // The active crossword must never hand the browser an answer key.
  await page.goto(`${base}/news/crossword/`, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const leak = await page.evaluate(async () => {
    const grid = document.querySelector('.fmb-crossword-grid, .fmb-crossword-board');
    const layout = await fetch('/news/assets/data/fmb-crossword-current.json').then(r => r.json()).catch(() => null);
    return {
      hasGrid: !!grid,
      layoutHasAnswers: layout ? /"answer"/i.test(JSON.stringify(layout)) : null,
      domHasAnswers: /data-answer|data-solution/i.test(document.documentElement.outerHTML),
    };
  });
  assert(leak.hasGrid, `${label} crossword grid did not render`);
  assert(leak.layoutHasAnswers === false, `${label} active crossword layout ships answer values`);
  assert(!leak.domHasAnswers, `${label} active crossword exposes answers in the DOM`);

  // An empty Fact Check desk must say so rather than advertise held drafts.
  await page.goto(`${base}/news/fact-check/`, { waitUntil: 'domcontentloaded' });
  const fc = await page.evaluate(() => ({
    cards: document.querySelectorAll('.fc-card').length,
    count: (document.querySelector('#fcCount')?.textContent || '').trim(),
    empty: /No fact checks are published yet/i.test(document.body.textContent || ''),
  }));
  assert(fc.count.startsWith(String(fc.cards)), `${label} Fact Check advertises "${fc.count}" but renders ${fc.cards} cards`);
  if (fc.cards === 0) assert(fc.empty, `${label} empty Fact Check desk must explain itself`);

  await context.close();
}

await browser.close();
console.log('Feature-route smoke tests passed: /news/crossword/, /news/horoscope/, /news/fact-check/ render at phone and desktop widths, the crossword ships no answer key, and the Fact Check desk states its true published count.');
