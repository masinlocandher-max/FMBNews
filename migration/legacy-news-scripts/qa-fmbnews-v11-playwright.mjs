import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FMBNEWS_QA_URL || 'http://127.0.0.1:4173';
const evidenceDir = path.resolve(process.env.FMBNEWS_QA_EVIDENCE || 'fmbnews-v11-evidence');
const minimumPublishedRoutes = 53;
const referenceNavigation = ['Home', 'Latest', 'National', 'World', 'Business', 'Lifestyle', 'About'];
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = { baseUrl, checks: {}, screenshots: [] };

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(1800);
}

async function screenshot(page, name, options = {}) {
  const filePath = path.join(evidenceDir, name);
  await page.screenshot({ path: filePath, ...options });
  results.screenshots.push(name);
}

function requireCheck(name, value, details = value) {
  results.checks[name] = { passed: Boolean(value), details };
  if (!value) throw new Error(`FMB News V11 browser check failed: ${name} (${JSON.stringify(details)})`);
}

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 1 });
  await desktop.goto(`${baseUrl}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await settle(desktop);

  const desktopState = await desktop.evaluate(() => {
    const visible = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const buttons = [...document.querySelectorAll('.fn12-site-header .fn11-icon-button')];
    const officialLogo = document.querySelector('[data-fmb-news-logo] .fn12-official-logo');
    const desktopNav = document.querySelector('.fn12-desktop-nav');
    const powerHero = document.querySelector('[data-fmb-news-power-hero]');
    const powerHeading = powerHero?.querySelector('h1');
    const legacyHero = document.querySelector('.fn9-hero');
    const legacyHeroImage = legacyHero?.querySelector('img');
    const legacyHeroHeading = legacyHero?.querySelector('h2');
    const ticker = document.querySelector('.fmb-news-ticker');
    const phTime = document.querySelector('[data-philippine-time]');
    const watchLive = document.querySelector('.fn13-watch-live');
    return {
      bodyClass: document.body.classList.contains('news-faithful-v11'),
      v12HeaderClass: document.body.classList.contains('news-header-v12'),
      v12LandingClass: document.body.classList.contains('news-landing-v12'),
      headerButtons: buttons.length,
      completeIcons: buttons.every(button => button.querySelector('svg[viewBox]') && button.querySelector('path, circle, rect')),
      officialLogoPresent: Boolean(officialLogo),
      officialLogoVisible: visible(officialLogo),
      officialLogoLoaded: Boolean(officialLogo?.complete && officialLogo.naturalWidth > 0 && officialLogo.naturalHeight > 0),
      officialLogoSrc: officialLogo?.getAttribute('src') || '',
      desktopNavVisible: visible(desktopNav),
      desktopNavLinks: desktopNav?.querySelectorAll('a').length || 0,
      desktopNavLabels: [...(desktopNav?.querySelectorAll('a') || [])].map(link => link.textContent?.trim() || ''),
      watchLiveVisible: visible(watchLive),
      watchLiveHref: watchLive?.getAttribute('href') || '',
      powerHeroVisible: visible(powerHero),
      powerHeroHeading: powerHeading?.textContent?.trim() || '',
      powerHeroFont: powerHeading ? getComputedStyle(powerHeading).fontFamily : '',
      powerHeroCtas: powerHero?.querySelectorAll('a[href]').length || 0,
      heroOrder: Boolean(powerHero && legacyHero && powerHero.getBoundingClientRect().top < legacyHero.getBoundingClientRect().top),
      upperCategoryHidden: !visible(document.querySelector('.fn9-category-nav')),
      publicationBarHidden: !visible(document.querySelector('.fn9-publication-bar')),
      tickerVisible: visible(ticker),
      phTimeVisible: visible(phTime) && !/Loading/i.test(phTime?.textContent || ''),
      legacyHeroImageLoaded: Boolean(legacyHeroImage?.complete && legacyHeroImage.naturalWidth > 0 && legacyHeroImage.naturalHeight > 0),
      legacyHeroFont: legacyHeroHeading ? getComputedStyle(legacyHeroHeading).fontFamily : '',
      bodyFont: getComputedStyle(document.body).fontFamily,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fakeAmpersand: Boolean(document.querySelector('.fn9-about-mark')),
    };
  });

  requireCheck('desktop V11 body retained', desktopState.bodyClass, desktopState);
  requireCheck('V12 masthead and landing layers active', desktopState.v12HeaderClass && desktopState.v12LandingClass, desktopState);
  requireCheck('exactly two header controls', desktopState.headerButtons === 2, desktopState.headerButtons);
  requireCheck('complete SVG header icons', desktopState.completeIcons, desktopState.completeIcons);
  requireCheck('official FMB News logo present and visible', desktopState.officialLogoPresent && desktopState.officialLogoVisible, desktopState);
  requireCheck('official FMB News logo loaded', desktopState.officialLogoLoaded, desktopState);
  requireCheck('official FMB News logo source', desktopState.officialLogoSrc === '/assets/images/fmb-approved/fmb-news-official-transparent.webp', desktopState.officialLogoSrc);
  requireCheck(
    'supplied seven-branch newsroom navigation visible',
    desktopState.desktopNavVisible
      && desktopState.desktopNavLinks === referenceNavigation.length
      && JSON.stringify(desktopState.desktopNavLabels) === JSON.stringify(referenceNavigation),
    desktopState,
  );
  requireCheck('Watch Live button visible and linked', desktopState.watchLiveVisible && /live_videos\/?$/i.test(desktopState.watchLiveHref), desktopState);
  requireCheck('powerful landing hero visible', desktopState.powerHeroVisible, desktopState);
  requireCheck('powerful landing hero message', desktopState.powerHeroHeading === 'Making every news clearer and sharper in a world full of info.', desktopState.powerHeroHeading);
  requireCheck('powerful landing hero actions', desktopState.powerHeroCtas >= 2, desktopState.powerHeroCtas);
  requireCheck('new hero appears before existing news', desktopState.heroOrder, desktopState.heroOrder);
  requireCheck('no redundant upper category menu', desktopState.upperCategoryHidden, desktopState.upperCategoryHidden);
  requireCheck('no redundant publication bar', desktopState.publicationBarHidden, desktopState.publicationBarHidden);
  requireCheck('moving headlines visible', desktopState.tickerVisible, desktopState.tickerVisible);
  requireCheck('Philippine time visible', desktopState.phTimeVisible, desktopState.phTimeVisible);
  requireCheck('existing lead story image retained', desktopState.legacyHeroImageLoaded, desktopState.legacyHeroImageLoaded);
  requireCheck('Manrope power hero heading', /Manrope/i.test(desktopState.powerHeroFont), desktopState.powerHeroFont);
  requireCheck('Cormorant existing story heading', /Cormorant Garamond/i.test(desktopState.legacyHeroFont), desktopState.legacyHeroFont);
  requireCheck('Manrope body', /Manrope/i.test(desktopState.bodyFont), desktopState.bodyFont);
  requireCheck('no desktop horizontal overflow', desktopState.overflow <= 1, desktopState.overflow);
  requireCheck('decorative ampersand removed', !desktopState.fakeAmpersand, desktopState.fakeAmpersand);

  await screenshot(desktop, 'fmbnews-v13-desktop-full.png', { fullPage: true });

  await desktop.locator('[data-fn9-search-open]').click();
  await desktop.waitForTimeout(200);
  const desktopSearchState = await desktop.evaluate(() => ({
    hidden: document.querySelector('[data-fn9-search-panel]')?.hidden,
    focused: document.activeElement?.matches('[data-fn9-search-input]') || false,
  }));
  requireCheck('desktop search opens and focuses input', desktopSearchState.hidden === false && desktopSearchState.focused, desktopSearchState);
  await desktop.keyboard.press('Escape');

  const about = desktop.locator('.fn9-about-card').first();
  await about.scrollIntoViewIfNeeded();
  await desktop.waitForTimeout(500);
  const portraitState = await desktop.evaluate(() => {
    const image = document.querySelector('[data-fmb-news-exact-portrait] img');
    return {
      src: image?.getAttribute('src') || '',
      loaded: Boolean(image?.complete && image.naturalWidth === 922 && image.naturalHeight === 1152),
      alt: image?.getAttribute('alt') || '',
      aboutDisplay: getComputedStyle(document.querySelector('.fn9-about-card')).display,
    };
  });
  requireCheck('approved exact portrait source', portraitState.src === '/assets/images/fmb-approved/francine-portrait-front.webp', portraitState);
  requireCheck('approved portrait loaded at expected dimensions', portraitState.loaded, portraitState);
  requireCheck('portrait has meaningful alt text', /Francine Marie Bautista/i.test(portraitState.alt), portraitState.alt);
  await about.screenshot({ path: path.join(evidenceDir, 'fmbnews-v13-about-desktop.png') });
  results.screenshots.push('fmbnews-v13-about-desktop.png');

  const footer = desktop.locator('.fn11-footer').first();
  await footer.scrollIntoViewIfNeeded();
  await desktop.waitForTimeout(350);
  const footerState = await desktop.evaluate(() => ({
    signal: Boolean(document.querySelector('.fn11-footer .fn11-signal-mark')),
    wordmark: Boolean(document.querySelector('.fn11-footer .fn11-wordmark')),
    socialIcons: document.querySelectorAll('.fn11-footer-socials a svg').length,
  }));
  requireCheck('footer signal logo retained', footerState.signal && footerState.wordmark, footerState);
  requireCheck('three complete footer social icons', footerState.socialIcons === 3, footerState.socialIcons);
  await footer.screenshot({ path: path.join(evidenceDir, 'fmbnews-v13-footer-desktop.png') });
  results.screenshots.push('fmbnews-v13-footer-desktop.png');

  await desktop.locator('[data-fn9-view-all]').click();
  await desktop.waitForTimeout(300);
  const archiveState = await desktop.evaluate(() => {
    const links = [...document.querySelectorAll('.fn9-report-grid a[href^="/news/"]')].map(link => link.getAttribute('href'));
    return {
      uniqueRoutes: new Set(links).size,
      expanded: document.querySelector('[data-fn9-view-all]')?.getAttribute('aria-expanded'),
      buttonText: document.querySelector('[data-fn9-view-all]')?.textContent?.trim() || '',
    };
  });
  requireCheck('complete published archive remains visible', archiveState.uniqueRoutes >= minimumPublishedRoutes, archiveState);
  requireCheck('archive expands', archiveState.expanded === 'true', archiveState);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto(`${baseUrl}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await settle(mobile);
  await screenshot(mobile, 'fmbnews-v13-mobile-first-view.png');

  const mobileState = await mobile.evaluate(() => {
    const visible = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const powerTitle = document.querySelector('[data-fmb-news-power-hero] h1');
    const titleRect = powerTitle?.getBoundingClientRect();
    const officialLogo = document.querySelector('[data-fmb-news-logo] .fn12-official-logo');
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      headerButtons: document.querySelectorAll('.fn12-site-header .fn11-icon-button').length,
      menuButtonVisible: visible(document.querySelector('[data-fn11-menu-toggle]')),
      desktopNavHidden: !visible(document.querySelector('.fn12-desktop-nav')),
      officialLogoVisible: visible(officialLogo) && Boolean(officialLogo?.complete && officialLogo.naturalWidth > 0),
      powerHeroVisible: visible(document.querySelector('[data-fmb-news-power-hero]')),
      powerTitleRect: titleRect ? { left: titleRect.left, right: titleRect.right, width: titleRect.width } : null,
      portraitExists: Boolean(document.querySelector('[data-fmb-news-exact-portrait] img')),
    };
  });
  requireCheck('no mobile horizontal overflow', mobileState.overflow <= 1, mobileState);
  requireCheck('two mobile header controls retained', mobileState.headerButtons === 2, mobileState.headerButtons);
  requireCheck('mobile menu control visible', mobileState.menuButtonVisible, mobileState);
  requireCheck('desktop navigation collapses on mobile', mobileState.desktopNavHidden, mobileState);
  requireCheck('official logo visible on mobile', mobileState.officialLogoVisible, mobileState);
  requireCheck('powerful hero visible on mobile', mobileState.powerHeroVisible, mobileState);
  requireCheck('mobile power headline inside viewport', mobileState.powerTitleRect && mobileState.powerTitleRect.left >= 0 && mobileState.powerTitleRect.right <= 390, mobileState.powerTitleRect);
  requireCheck('mobile portrait exists', mobileState.portraitExists, mobileState.portraitExists);

  await mobile.locator('[data-fn11-menu-toggle]').click();
  await mobile.waitForTimeout(250);
  const menuState = await mobile.evaluate(() => ({
    hidden: document.querySelector('[data-fn11-menu-panel]')?.hidden,
    expanded: document.querySelector('[data-fn11-menu-toggle]')?.getAttribute('aria-expanded'),
    links: document.querySelectorAll('[data-fn11-menu-panel] a').length,
  }));
  requireCheck('mobile menu opens', menuState.hidden === false && menuState.expanded === 'true', menuState);
  requireCheck('mobile menu has real destinations', menuState.links >= 10, menuState.links);
  await screenshot(mobile, 'fmbnews-v13-mobile-menu.png');
  await mobile.keyboard.press('Escape');
  requireCheck('mobile menu closes with Escape', await mobile.locator('[data-fn11-menu-panel]').evaluate(element => element.hidden), true);

  await mobile.locator('.fn9-about-card').scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(400);
  await mobile.locator('.fn9-about-card').screenshot({ path: path.join(evidenceDir, 'fmbnews-v13-about-mobile.png') });
  results.screenshots.push('fmbnews-v13-about-mobile.png');

  const article = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await article.goto(`${baseUrl}/news/tropical-depression-luis-northern-luzon-august-3-2026/`, { waitUntil: 'domcontentloaded' });
  await settle(article);
  const articleState = await article.evaluate(() => {
    const logo = document.querySelector('[data-fmb-news-logo] .fn12-official-logo');
    const articleTime = document.querySelector('[data-fmb-news-article-tools] [data-philippine-time]');
    return {
      v11: document.body.classList.contains('news-faithful-v11'),
      v12Header: document.body.classList.contains('news-header-v12'),
      controls: document.querySelectorAll('.fn12-site-header .fn11-icon-button').length,
      officialLogo: Boolean(logo?.complete && logo.naturalWidth > 0),
      footerLogo: Boolean(document.querySelector('.fn11-footer .fn11-wordmark')),
      articleImage: Boolean(document.querySelector('.nc-story-media img')?.naturalWidth),
      powerHeroAbsent: !document.querySelector('[data-fmb-news-power-hero]'),
      toolsPresent: Boolean(document.querySelector('[data-fmb-news-article-tools]')),
      sharePresent: Boolean(document.querySelector('[data-fmb-share-story]')),
      copyPresent: Boolean(document.querySelector('[data-fmb-copy-story]')),
      articleTimeVisible: Boolean(articleTime && !/Loading/i.test(articleTime.textContent || '')),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  requireCheck('article pages share fixed masthead system', articleState.v11 && articleState.v12Header && articleState.controls === 2 && articleState.officialLogo && articleState.footerLogo, articleState);
  requireCheck('power hero stays landing-only', articleState.powerHeroAbsent, articleState);
  requireCheck('article sharing controls present', articleState.toolsPresent && articleState.sharePresent && articleState.copyPresent, articleState);
  requireCheck('article Philippine time is live', articleState.articleTimeVisible, articleState);
  requireCheck('article media loads', articleState.articleImage, articleState.articleImage);
  requireCheck('article mobile no overflow', articleState.overflow <= 1, articleState.overflow);
  await screenshot(article, 'fmbnews-v13-article-mobile.png', { fullPage: false });

  await desktop.close();
  await mobile.close();
  await article.close();
} finally {
  await writeFile(path.join(evidenceDir, 'fmbnews-v11-browser-qa.json'), JSON.stringify(results, null, 2));
  await browser.close();
}

console.log(`FMB News V11 Playwright QA passed ${Object.keys(results.checks).length} browser checks.`);
