import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FMBNEWS_QA_URL || 'http://127.0.0.1:4173';
const evidenceDir = path.resolve(process.env.FMBNEWS_QA_EVIDENCE || 'fmbnews-v15-evidence');
const expectedNavigation = ['Home', 'Latest', 'National', 'World', 'Business', 'Lifestyle', 'About'];
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = { baseUrl, checks: {}, screenshots: [] };

function check(name, passed, details = passed) {
  results.checks[name] = { passed: Boolean(passed), details };
  if (!passed) throw new Error(`FMB News V15 browser check failed: ${name} (${JSON.stringify(details)})`);
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(1600);
}

async function shot(page, name, fullPage = false) {
  await page.screenshot({ path: path.join(evidenceDir, name), fullPage });
  results.screenshots.push(name);
}

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await desktop.goto(`${baseUrl}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await settle(desktop);

  const landing = await desktop.evaluate((expected) => {
    const visible = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
    };
    const logo = document.querySelector('[data-fmb-news-logo] img.fn15-official-logo');
    const nav = document.querySelector('.fn14-desktop-nav');
    const labels = [...(nav?.querySelectorAll('a') || [])].map(link => link.textContent.trim());
    const time = document.querySelector('[data-philippine-time]');
    return {
      exactLogoVisible: visible(logo),
      exactLogoLoaded: Boolean(logo?.complete && logo.naturalWidth > 0),
      exactLogoSrc: logo?.getAttribute('src') || '',
      recreatedLogoAbsent: !document.querySelector('.fn14-reference-logo'),
      navigationExact: JSON.stringify(labels) === JSON.stringify(expected),
      watchLive: visible(document.querySelector('.fn14-watch-live')),
      hero: visible(document.querySelector('[data-fmb-news-power-hero]')),
      timeText: time?.textContent?.trim() || '',
      archiveCards: new Set([...document.querySelectorAll('.fn9-report-grid a[href^="/news/"]')].map(link => link.getAttribute('href'))).size,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  }, expectedNavigation);

  check('exact official image logo is visible', landing.exactLogoVisible && landing.exactLogoLoaded && /fmb-news-official-transparent\.webp$/i.test(landing.exactLogoSrc), landing);
  check('recreated logo is removed', landing.recreatedLogoAbsent, landing);
  check('desktop navigation remains exact', landing.navigationExact, landing);
  check('Watch Live remains visible', landing.watchLive, landing);
  check('landing hero remains visible', landing.hero, landing);
  check('Philippine time is visible without loading text', landing.timeText && !/Loading/i.test(landing.timeText) && /PHT|Philippine/i.test(landing.timeText), landing.timeText);
  check('existing archive remains present', landing.archiveCards >= 6, landing.archiveCards);
  check('desktop has no horizontal overflow', landing.overflow <= 1, landing.overflow);
  await shot(desktop, 'fmbnews-v15-landing-desktop.png');

  const article = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await article.goto(`${baseUrl}/news/tropical-depression-luis-northern-luzon-august-3-2026/`, { waitUntil: 'domcontentloaded' });
  await settle(article);

  const story = await article.evaluate(() => {
    const visible = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
    };
    const logo = document.querySelector('[data-fmb-news-logo] img.fn15-official-logo');
    const share = document.querySelector('.fn10-share-bar');
    const time = document.querySelector('[data-philippine-time]');
    return {
      logoVisible: visible(logo) && Boolean(logo?.complete && logo.naturalWidth > 0),
      recreatedLogoAbsent: !document.querySelector('.fn14-reference-logo'),
      shareBars: document.querySelectorAll('.fn10-share-bar').length,
      legacyShareButtons: document.querySelectorAll('[data-news-share]').length,
      shareEnhanced: Boolean(share?.matches('[data-fmb-share-ready]')),
      facebook: share?.querySelector('[data-fmb-share-destination="facebook"]')?.getAttribute('href') || '',
      x: share?.querySelector('[data-fmb-share-destination="x"]')?.getAttribute('href') || '',
      linkedIn: share?.querySelector('[data-fmb-share-destination="linkedin"]')?.getAttribute('href') || '',
      nativeShare: Boolean(share?.querySelector('[data-fmb-share-native]')),
      timeText: time?.textContent?.trim() || '',
      body: Boolean(document.querySelector('.nc-story-body')),
      image: Boolean(document.querySelector('.nc-story-media img')?.complete && document.querySelector('.nc-story-media img')?.naturalWidth > 0),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  check('exact logo is visible on article pages', story.logoVisible && story.recreatedLogoAbsent, story);
  check('article contains one share section only', story.shareBars === 1 && story.legacyShareButtons === 0, story);
  check('share section is functional', story.shareEnhanced && story.nativeShare, story);
  check('Facebook sharing is linked', /facebook\.com\/sharer/i.test(story.facebook), story.facebook);
  check('X sharing is linked', /twitter\.com\/intent\/tweet/i.test(story.x), story.x);
  check('LinkedIn sharing is linked', /linkedin\.com\/sharing\/share-offsite/i.test(story.linkedIn), story.linkedIn);
  check('article Philippine time is visible', story.timeText && !/Loading/i.test(story.timeText) && /PHT|Philippine/i.test(story.timeText), story.timeText);
  check('article content remains intact', story.body && story.image, story);
  check('mobile article has no horizontal overflow', story.overflow <= 1, story.overflow);
  await shot(article, 'fmbnews-v15-article-mobile.png');

  await desktop.close();
  await article.close();
} finally {
  await writeFile(path.join(evidenceDir, 'fmbnews-v15-browser-qa.json'), JSON.stringify(results, null, 2));
  await browser.close();
}

console.log(`FMB News V15 exact-logo, single-share, and PHT QA passed ${Object.keys(results.checks).length} browser checks.`);
