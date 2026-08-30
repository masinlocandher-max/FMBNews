import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FMBNEWS_QA_URL || 'http://127.0.0.1:4173';
const evidenceDir = path.resolve(process.env.FMBNEWS_QA_EVIDENCE || 'fmbnews-logo-variants-evidence');
const colorLogo = '/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp';
const whiteLogo = '/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp';
const expectedEmail = 'withlovefmb@gmail.com';

await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = {
  baseUrl,
  checks: {},
  screenshots: [],
  console: [],
};

function requireCheck(name, value, details = value) {
  results.checks[name] = { passed: Boolean(value), details };
  if (!value) throw new Error(`FMB News supplied-logo browser check failed: ${name} (${JSON.stringify(details)})`);
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(1200);
}

function watchConsole(page, label) {
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') {
      results.console.push({ page: label, type: message.type(), text: message.text() });
    }
  });
  page.on('pageerror', error => results.console.push({ page: label, type: 'pageerror', text: error.message }));
}

async function takeScreenshot(page, name, options = {}) {
  const target = path.join(evidenceDir, name);
  await page.screenshot({ path: target, ...options });
  results.screenshots.push(name);
}

const visibleState = () => {
  const isVisible = element => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && Number(style.opacity) > 0
      && rect.width > 0
      && rect.height > 0;
  };

  const light = document.querySelector('[data-fmb-news-logo-light]');
  const dark = document.querySelector('[data-fmb-news-logo-dark]');
  const footer = dark?.closest('footer') || document.querySelector('.fn11-footer');
  const submit = document.querySelector('[data-fmb-story-submission]');
  const submitIcon = submit?.querySelector('svg');
  const submitIconRect = submitIcon?.getBoundingClientRect();
  const submitIconStyle = submitIcon ? getComputedStyle(submitIcon) : null;

  return {
    lightCount: document.querySelectorAll('[data-fmb-news-logo-light]').length,
    darkCount: document.querySelectorAll('[data-fmb-news-logo-dark]').length,
    lightVisible: isVisible(light),
    darkVisible: isVisible(dark),
    lightLoaded: Boolean(light?.complete && light.naturalWidth > 0 && light.naturalHeight > 0),
    darkLoaded: Boolean(dark?.complete && dark.naturalWidth > 0 && dark.naturalHeight > 0),
    lightSrc: light?.getAttribute('src') || '',
    darkSrc: dark?.getAttribute('src') || '',
    lightFilter: light ? getComputedStyle(light).filter : '',
    darkFilter: dark ? getComputedStyle(dark).filter : '',
    visibleMastheadChildren: [...(light?.closest('[data-fmb-news-logo]')?.children || [])].filter(isVisible).length,
    footerBackground: footer ? getComputedStyle(footer).backgroundColor : '',
    submitHref: submit?.getAttribute('href') || '',
    submitText: submit?.textContent?.replace(/\s+/g, ' ').trim() || '',
    submitIconWidth: submitIconRect?.width || 0,
    submitIconHeight: submitIconRect?.height || 0,
    submitIconFill: submitIconStyle?.fill || '',
    submitIconStroke: submitIconStyle?.stroke || '',
    watchLiveVisible: [...document.querySelectorAll('a,button')].some(element => isVisible(element) && /watch\s+live/i.test(element.textContent || '')),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
};

const validSubmitIcon = state => state.submitIconWidth >= 14
  && state.submitIconWidth <= 24
  && state.submitIconHeight >= 14
  && state.submitIconHeight <= 24
  && state.submitIconFill === 'none'
  && state.submitIconStroke !== 'none';

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  watchConsole(desktop, 'desktop landing');
  await desktop.goto(`${baseUrl}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await settle(desktop);

  const desktopHeader = await desktop.evaluate(visibleState);
  requireCheck('desktop has one supplied light logo', desktopHeader.lightCount === 1, desktopHeader);
  requireCheck('desktop light logo is visible and loaded', desktopHeader.lightVisible && desktopHeader.lightLoaded, desktopHeader);
  requireCheck('desktop light logo uses exact color asset', desktopHeader.lightSrc === colorLogo && desktopHeader.lightFilter === 'none', desktopHeader);
  requireCheck('desktop masthead has no duplicate visible mark', desktopHeader.visibleMastheadChildren === 1, desktopHeader.visibleMastheadChildren);
  requireCheck('desktop story submission email is present', desktopHeader.submitHref.startsWith(`mailto:${expectedEmail}`) && /submit your story/i.test(desktopHeader.submitText), desktopHeader);
  requireCheck('desktop submission icon is a small stroked envelope', validSubmitIcon(desktopHeader), desktopHeader);
  requireCheck('desktop has no Watch Live control', !desktopHeader.watchLiveVisible, desktopHeader.watchLiveVisible);
  requireCheck('desktop has no horizontal overflow', desktopHeader.overflow <= 1, desktopHeader.overflow);
  await takeScreenshot(desktop, 'fmbnews-logo-desktop-first-view.png');

  const searchButton = desktop.locator('[data-fn9-search-open]').first();
  if (await searchButton.count()) {
    await searchButton.click();
    await desktop.waitForTimeout(200);
    const searchOpen = await desktop.locator('[data-fn9-search-panel]').evaluate(element => element.hidden === false);
    requireCheck('desktop search interaction opens', searchOpen, searchOpen);
    await desktop.keyboard.press('Escape');
  }

  const viewAll = desktop.locator('[data-fn9-view-all]').first();
  if (await viewAll.count()) {
    await viewAll.click();
    await desktop.waitForTimeout(250);
  }
  const archiveState = await desktop.evaluate(() => {
    const links = [...document.querySelectorAll('.fn9-report-grid a[href^="/news/"]')]
      .map(link => link.getAttribute('href'))
      .filter(Boolean);
    return {
      uniqueRoutes: new Set(links).size,
      expanded: document.querySelector('[data-fn9-view-all]')?.getAttribute('aria-expanded') || '',
    };
  });
  requireCheck('complete article archive remains available', archiveState.uniqueRoutes >= 50, archiveState);

  const footerLogo = desktop.locator('[data-fmb-news-logo-dark]').first();
  await footerLogo.scrollIntoViewIfNeeded();
  await desktop.waitForTimeout(250);
  const desktopFooter = await desktop.evaluate(visibleState);
  requireCheck('desktop has one supplied dark logo', desktopFooter.darkCount === 1, desktopFooter);
  requireCheck('desktop dark logo is visible and loaded', desktopFooter.darkVisible && desktopFooter.darkLoaded, desktopFooter);
  requireCheck('desktop dark logo uses exact white asset', desktopFooter.darkSrc === whiteLogo && desktopFooter.darkFilter === 'none', desktopFooter);
  await footerLogo.screenshot({ path: path.join(evidenceDir, 'fmbnews-logo-desktop-footer.png') });
  results.screenshots.push('fmbnews-logo-desktop-footer.png');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  watchConsole(mobile, 'mobile landing');
  await mobile.goto(`${baseUrl}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await settle(mobile);
  const mobileHeader = await mobile.evaluate(visibleState);
  requireCheck('mobile supplied light logo is visible and loaded', mobileHeader.lightVisible && mobileHeader.lightLoaded && mobileHeader.lightSrc === colorLogo, mobileHeader);
  requireCheck('mobile has no duplicate visible mark', mobileHeader.visibleMastheadChildren === 1, mobileHeader.visibleMastheadChildren);
  requireCheck('mobile has no horizontal overflow', mobileHeader.overflow <= 1, mobileHeader.overflow);
  await takeScreenshot(mobile, 'fmbnews-logo-mobile-first-view.png');

  const menuButton = mobile.locator('[data-fn11-menu-toggle]').first();
  await menuButton.click();
  await mobile.waitForTimeout(200);
  const menuState = await mobile.evaluate(email => {
    const panel = document.querySelector('[data-fn11-menu-panel]');
    const submission = panel?.querySelector('[data-fmb-story-submission]');
    const icon = submission?.querySelector('svg');
    const iconRect = icon?.getBoundingClientRect();
    const iconStyle = icon ? getComputedStyle(icon) : null;
    return {
      open: panel?.hidden === false,
      expanded: document.querySelector('[data-fn11-menu-toggle]')?.getAttribute('aria-expanded'),
      submissionHref: submission?.getAttribute('href') || '',
      submitIconWidth: iconRect?.width || 0,
      submitIconHeight: iconRect?.height || 0,
      submitIconFill: iconStyle?.fill || '',
      submitIconStroke: iconStyle?.stroke || '',
    };
  }, expectedEmail);
  requireCheck('mobile menu opens', menuState.open && menuState.expanded === 'true', menuState);
  requireCheck('mobile menu contains story submission email', menuState.submissionHref.startsWith(`mailto:${expectedEmail}`), menuState);
  requireCheck('mobile menu submission icon is a small stroked envelope', validSubmitIcon(menuState), menuState);
  await takeScreenshot(mobile, 'fmbnews-logo-mobile-menu.png');
  await mobile.keyboard.press('Escape');

  await mobile.locator('[data-fmb-news-logo-dark]').first().scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(250);
  const mobileFooter = await mobile.evaluate(visibleState);
  requireCheck('mobile supplied white footer logo is visible and loaded', mobileFooter.darkVisible && mobileFooter.darkLoaded && mobileFooter.darkSrc === whiteLogo, mobileFooter);
  await mobile.locator('[data-fmb-news-logo-dark]').first().screenshot({ path: path.join(evidenceDir, 'fmbnews-logo-mobile-footer.png') });
  results.screenshots.push('fmbnews-logo-mobile-footer.png');

  const article = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  watchConsole(article, 'mobile article');
  await article.goto(`${baseUrl}/news/tropical-depression-luis-northern-luzon-august-3-2026/`, { waitUntil: 'domcontentloaded' });
  await settle(article);
  const articleState = await article.evaluate(() => {
    const image = document.querySelector('.nc-story-media img, article img');
    const shareIcons = document.querySelectorAll('[data-fmb-share-ready] svg, [data-fmb-share-story] svg, .fn13-share-actions svg').length;
    return {
      lightSrc: document.querySelector('[data-fmb-news-logo-light]')?.getAttribute('src') || '',
      lightLoaded: Boolean(document.querySelector('[data-fmb-news-logo-light]')?.complete && document.querySelector('[data-fmb-news-logo-light]')?.naturalWidth > 0),
      imageLoaded: Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0),
      shareIcons,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  requireCheck('article uses supplied color masthead logo', articleState.lightLoaded && articleState.lightSrc === colorLogo, articleState);
  requireCheck('article retains a working photo', articleState.imageLoaded, articleState);
  requireCheck('article retains icon-based sharing', articleState.shareIcons >= 4, articleState.shareIcons);
  requireCheck('article has no horizontal overflow', articleState.overflow <= 1, articleState.overflow);
  await takeScreenshot(article, 'fmbnews-logo-mobile-article.png');

  requireCheck('no relevant browser console errors', results.console.length === 0, results.console);
} finally {
  await writeFile(path.join(evidenceDir, 'report.json'), JSON.stringify(results, null, 2));
  await browser.close();
}

console.log(`FMB News supplied-logo browser QA passed with ${Object.keys(results.checks).length} checks.`);
