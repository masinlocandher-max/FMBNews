import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.FMB_QA_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [390, 700, 1024, 1440]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      // External services are not required to render or navigate the static newsroom.
      await page.route('https://**/*', route => route.abort());
      try {
        assert((await page.goto(`${base}/news/`))?.ok());
        await page.locator('[data-fmb-theme-control]').first().waitFor({state: 'attached'});
        assert.equal(await page.locator('html').getAttribute('data-fmb-theme'), theme);
        const phone = width < 700;
        assert.equal(await page.locator('.fmbv2-home').isVisible(), !phone);
        assert.equal(await page.locator('[data-fmb-mobile-home]').isVisible(), phone);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Home overflow at ${width}/${theme}`);
        if (!phone) {
          assert.equal(await page.locator('.fmbv2-lead').count(), 1);
          assert.equal(await page.locator('.fmbv2-sub').count(), 2);
          assert.equal(await page.locator('.fmbv2-card').count(), 6);
          const lead = page.locator('.fmbv2-lead');
          const headline = await lead.locator('h1').innerText();
          const href = await lead.getAttribute('href');
          await lead.click();
          assert.equal(new URL(page.url()).pathname, href);
          assert((await page.locator('body').innerText()).includes(headline));
          await page.goto(`${base}/news/`);
          await page.getByRole('link', { name: 'About the founder', exact: true }).click();
          assert.equal(new URL(page.url()).pathname, '/news/founder/');
          assert((await page.locator('main').innerText()).includes('Francine Marie Bautista'));
          await page.goto(`${base}/news/`);
          await page.getByRole('link', { name: 'Open Entertainment', exact: true }).click();
          assert.equal(new URL(page.url()).pathname, '/news/entertainment/');
        }
        for (const route of ['founder', 'entertainment']) {
          assert((await page.goto(`${base}/news/${route}/`))?.ok());
          assert(await page.locator('main').isVisible());
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} overflow at ${width}/${theme}`);
        }
        assert.deepEqual(errors, [], `Runtime errors at ${width}/${theme}`);
        console.log(`V2 Home, Founder and Entertainment passed at ${width}px / ${theme}.`);
      } finally { await context.close(); }
    }
  }
} finally { await browser.close(); }
