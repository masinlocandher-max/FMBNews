import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const fmbNewsRoot = path.join(distRoot, 'fmbnews');
const cssSourceRoot = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css');
const jsSourceRoot = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'js');
const sourceCssPath = path.join(cssSourceRoot, 'fmbnews-corporate-recovery.css');
const editorialCssPath = path.join(cssSourceRoot, 'fmbnews-editorial-v5.css');
const editorialPolishCssPath = path.join(cssSourceRoot, 'fmbnews-editorial-v5-polish.css');
const mobileCssPath = path.join(cssSourceRoot, 'fmbnews-mobile-v6.css');
const categoriesCssPath = path.join(cssSourceRoot, 'fmbnews-categories-v1.css');
const categoriesJsPath = path.join(jsSourceRoot, 'fmbnews-categories-v1.js');
const mediaCssPath = path.join(cssSourceRoot, 'fmbnews-media-v1.css');
const mediaJsPath = path.join(jsSourceRoot, 'fmbnews-media-v1.js');
const sitewideCssPath = path.join(distRoot, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
const distMobileCssPath = path.join(distRoot, 'assets', 'css', 'fmbnews-mobile-v6.css');
const distCategoriesCssPath = path.join(distRoot, 'assets', 'css', 'fmbnews-categories-v1.css');
const distCategoriesJsPath = path.join(distRoot, 'assets', 'js', 'fmbnews-categories-v1.js');
const distMediaCssPath = path.join(distRoot, 'assets', 'css', 'fmbnews-media-v1.css');
const distMediaJsPath = path.join(distRoot, 'assets', 'js', 'fmbnews-media-v1.js');
const markerStart = '/* FMB_NEWS_CORPORATE_RECOVERY_START */';
const markerEnd = '/* FMB_NEWS_CORPORATE_RECOVERY_END */';
const sitewideVersion = '20260803-news-editorial-v6';
const mobileVersion = '20260803-mobile-v6';
const categoriesVersion = '20260803-categories-v1';
const mediaVersion = '20260803-media-v1';
const categories = [
  ['money', 'Money'],
  ['tech', 'Tech'],
  ['lifestyle', 'Lifestyle'],
  ['politics', 'Politics'],
  ['culture', 'Culture'],
  ['environment', 'Environment'],
  ['health', 'Health'],
];

async function walkHtml(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walkHtml(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

function categoryLinks() {
  return categories
    .map(([slug, label]) => `<a href="/news/?category=${slug}#rundown" data-news-category-link="${slug}">${label}</a>`)
    .join('');
}

function replaceCategoryNavigation(html) {
  const links = categoryLinks();
  const siteNav = `<nav class="nc-site-links" id="newsNav" aria-label="News categories">${links}</nav>`;
  const topicRail = `<nav class="nc-topic-rail" aria-label="News categories"><div class="wrap">${links}</div></nav>`;
  const menuButton = '<button class="nc-menu-toggle" type="button" data-news-menu aria-label="Open news menu" aria-expanded="false" aria-controls="newsNav"><span></span><span></span></button>';
  const headerPattern = /<header\b[^>]*class=(['"])[^'"]*\bnc-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i;

  if (!headerPattern.test(html)) {
    const compatibilityNavigation = `<div data-fmb-legacy-category-hooks hidden aria-hidden="true">${siteNav}${topicRail}</div>`;
    return html.replace(/<body\b[^>]*>/i, (body) => `${body}${compatibilityNavigation}`);
  }

  let next = html.replace(headerPattern, (header) => {
    if (/\bnc-site-links\b/i.test(header)) {
      return header.replace(
        /<nav\b[^>]*class=(['"])[^'"]*\bnc-site-links\b[^'"]*\1[^>]*>[\s\S]*?<\/nav>/i,
        siteNav,
      );
    }

    const addition = `${siteNav}${/\bnc-menu-toggle\b/i.test(header) ? '' : menuButton}`;
    const injected = header.replace(/<\/div>\s*<\/header>\s*$/i, `${addition}</div></header>`);
    return injected === header ? header.replace(/<\/header>\s*$/i, `${addition}</header>`) : injected;
  });

  if (/<nav\b[^>]*class=(['"])[^'"]*\bnc-topic-rail\b[^'"]*\1/i.test(next)) {
    next = next.replace(
      /<nav\b[^>]*class=(['"])[^'"]*\bnc-topic-rail\b[^'"]*\1[^>]*>[\s\S]*?<\/nav>/i,
      topicRail,
    );
  } else {
    next = next.replace(headerPattern, (header) => `${header}${topicRail}`);
  }

  return next;
}

const [corporateCss, editorialCss, editorialPolishCss, mobileCss, categoriesCss, categoriesJs, mediaCss, mediaJs, sitewideCss] = await Promise.all([
  readFile(sourceCssPath, 'utf8'),
  readFile(editorialCssPath, 'utf8'),
  readFile(editorialPolishCssPath, 'utf8'),
  readFile(mobileCssPath, 'utf8'),
  readFile(categoriesCssPath, 'utf8'),
  readFile(categoriesJsPath, 'utf8'),
  readFile(mediaCssPath, 'utf8'),
  readFile(mediaJsPath, 'utf8'),
  readFile(sitewideCssPath, 'utf8'),
]);

const cleanSitewideCss = sitewideCss.replace(
  new RegExp(`${markerStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g'),
  '',
);

await Promise.all([
  mkdir(path.dirname(distMobileCssPath), { recursive: true }),
  mkdir(path.dirname(distCategoriesJsPath), { recursive: true }),
]);
await Promise.all([
  writeFile(
    sitewideCssPath,
    `${cleanSitewideCss.trimEnd()}\n\n${markerStart}\n${corporateCss.trim()}\n\n${editorialCss.trim()}\n\n${editorialPolishCss.trim()}\n${markerEnd}\n`,
    'utf8',
  ),
  writeFile(distMobileCssPath, `${mobileCss.trim()}\n`, 'utf8'),
  writeFile(distCategoriesCssPath, `${categoriesCss.trim()}\n`, 'utf8'),
  writeFile(distCategoriesJsPath, `${categoriesJs.trim()}\n`, 'utf8'),
  writeFile(distMediaCssPath, `${mediaCss.trim()}\n`, 'utf8'),
  writeFile(distMediaJsPath, `${mediaJs.trim()}\n`, 'utf8'),
]);

const newsFiles = [...new Set([
  ...await walkHtml(newsRoot),
  ...await walkHtml(fmbNewsRoot),
])];

const mobileLink = `<link rel="stylesheet" href="/assets/css/fmbnews-mobile-v6.css?v=${mobileVersion}" data-fmb-news-mobile-v6>`;
const categoriesLink = `<link rel="stylesheet" href="/assets/css/fmbnews-categories-v1.css?v=${categoriesVersion}" data-fmb-news-categories-css>`;
const mediaLink = `<link rel="stylesheet" href="/assets/css/fmbnews-media-v1.css?v=${mediaVersion}" data-fmb-news-media-css>`;
const categoriesScript = `<script defer src="/assets/js/fmbnews-categories-v1.js?v=${categoriesVersion}" data-fmb-news-categories></script>`;
const mediaScript = `<script defer src="/assets/js/fmbnews-media-v1.js?v=${mediaVersion}" data-fmb-news-media></script>`;
let verifiedCount = 0;
let updatedCount = 0;

for (const filePath of newsFiles) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-(?:route|story-route)\b/.test(html) && !/\bnews-channel-v4\b/.test(html)) continue;
  if (!/fmb-sitewide-visual-fixes\.css/i.test(html)) {
    throw new Error(`FMB News corporate recovery requires the final sitewide stylesheet: ${filePath}`);
  }
  if (!/\bnews-editorial-v5\b/.test(html)) {
    throw new Error(`FMB News Editorial V5 class is missing from generated route: ${filePath}`);
  }

  const original = html;
  html = replaceCategoryNavigation(html)
    .replace(
      /fmb-sitewide-visual-fixes\.css(?:\?v=[^"'<>\s]*)?/gi,
      `fmb-sitewide-visual-fixes.css?v=${sitewideVersion}`,
    )
    .replace(/<link\b[^>]*data-fmb-news-mobile-v6[^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*data-fmb-news-categories-css[^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*data-fmb-news-media-css[^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*data-fmb-news-categories[^>]*>\s*<\/script>\s*/gi, '')
    .replace(/<script\b[^>]*data-fmb-news-media[^>]*>\s*<\/script>\s*/gi, '')
    .replace(/<script\b[^>]*src=(['"])\/assets\/js\/az-assistant\.js[^'"]*\1[^>]*>\s*<\/script>\s*/gi, '')
    .replace(/<\/head>/i, `${mobileLink}${categoriesLink}${mediaLink}</head>`)
    .replace(/<\/body>/i, `${categoriesScript}${mediaScript}</body>`);

  if (!html.includes(`fmb-sitewide-visual-fixes.css?v=${sitewideVersion}`)) {
    throw new Error(`FMB News cache-busted sitewide stylesheet is missing: ${filePath}`);
  }
  if (!html.includes('data-fmb-news-mobile-v6')) {
    throw new Error(`FMB News mobile V6 stylesheet is missing: ${filePath}`);
  }
  if (!html.includes('data-fmb-news-categories-css') || !html.includes('data-fmb-news-categories')) {
    throw new Error(`FMB News category system is missing: ${filePath}`);
  }
  if (!html.includes('data-fmb-news-media-css') || !html.includes('data-fmb-news-media')) {
    throw new Error(`FMB News adaptive photo system is missing: ${filePath}`);
  }
  if (!/data-news-category-link="money"/.test(html) || !/data-news-category-link="health"/.test(html)) {
    throw new Error(`FMB News category navigation is incomplete: ${filePath}`);
  }
  if (!/\/assets\/js\/fmb-unified-system\.js/i.test(html)) {
    throw new Error(`FMB News must retain the unified public-site system: ${filePath}`);
  }
  if (/\/assets\/js\/az-assistant\.js/i.test(html)) {
    throw new Error(`FMB News must not directly load the Reception Desk bundle: ${filePath}`);
  }

  if (html !== original) {
    await writeFile(filePath, html, 'utf8');
    updatedCount += 1;
  }
  verifiedCount += 1;
}

if (!verifiedCount) {
  throw new Error('FMB News corporate recovery could not find generated News pages.');
}

console.log(`Appended the corporate base, Editorial V5 design and final decluttering layer to the sitewide stylesheet for ${verifiedCount} generated page(s); added seven functional categories, adaptive portrait/landscape media and mobile-hardened ${updatedCount} route(s).`);
