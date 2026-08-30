import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const colorLogo = '/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp';
const whiteLogo = '/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp';
const finalCssPath = path.join(dist, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
const cssStart = '/* FMB_NEWS_EXACT_LOGO_SHARE_PHT_V15_START */';
const cssEnd = '/* FMB_NEWS_EXACT_LOGO_SHARE_PHT_V15_END */';
const utilityRouteNames = new Set(['about', 'submit', 'contact', 'privacy', 'terms']);
const legacyStandaloneRouteNames = new Set([
  'ai-water-consumption-responsible-ai-philippines',
  'alex-eala-first-wta-500-final-washington-2026',
  'alex-eala-first-wta-title-washington-august-4-2026',
]);
const auditWarnings = [];

function warn(message) {
  auditWarnings.push(message);
  console.warn(`[FMB News visual audit] ${message}`);
}

async function walk(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walk(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

function manilaFallback() {
  const now = new Date();
  const text = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(now);
  return { now, text: `${text} PHT` };
}

function removeLegacyShareButton(html) {
  return html.replace(/<button\b[^>]*\bdata-news-share\b[^>]*>[\s\S]*?<\/button>\s*/gi, '');
}

function setPhilippineTimeFallback(html, fallback) {
  return html.replace(/(<time\b[^>]*\bdata-philippine-time\b[^>]*>)[\s\S]*?(<\/time>)/gi, `$1${fallback}$2`);
}

function routeName(file) {
  return path.basename(path.dirname(file)).toLowerCase();
}

function isUtilityRoute(file) {
  return utilityRouteNames.has(routeName(file));
}

function isLegacyStandaloneRoute(file) {
  return legacyStandaloneRouteNames.has(routeName(file));
}

const { now, text: fallback } = manilaFallback();
const files = [...new Set((await Promise.all(newsRoots.map(walk))).flat())];
let updated = 0;
let articleCount = 0;
let verified = 0;
let skippedUtilityPages = 0;

for (const file of files) {
  let html = await readFile(file, 'utf8');
  if (!/\bnews-reference-v13\b/.test(html)) continue;
  const original = html;
  const utilityPage = isUtilityRoute(file);
  const legacyStandalonePage = isLegacyStandaloneRoute(file);
  const isArticle = !utilityPage && !legacyStandalonePage && /\bnews-story-route\b/.test(html) && /class="[^"]*\bnc-story-body\b/i.test(html);

  html = removeLegacyShareButton(html);
  html = setPhilippineTimeFallback(html, fallback);

  if (legacyStandalonePage) {
    if (html !== original) {
      await writeFile(file, html, 'utf8');
      updated += 1;
    }
    skippedUtilityPages += 1;
    continue;
  }

  const header = html.match(/<header\b[^>]*class=(['"])[^'"]*\bfn14-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
  const footer = html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0] || '';

  if (utilityPage || !header || !footer) {
    if (!utilityPage && isArticle) warn(`Article route missing standard FMB News shell: ${file}`);
    if (html !== original) {
      await writeFile(file, html, 'utf8');
      updated += 1;
    }
    skippedUtilityPages += 1;
    continue;
  }

  const headerLogo = header.match(/<img\b[^>]*\bdata-fmb-news-logo-light\b[^>]*>/i)?.[0] || '';
  const footerLogo = footer.match(/<img\b[^>]*\bdata-fmb-news-logo-dark\b[^>]*>/i)?.[0] || '';

  if (!headerLogo.includes(`src="${colorLogo}"`) || !/alt="FMB News"/i.test(headerLogo)) {
    warn(`Exact supplied color FMB News logo missing from masthead: ${file}`);
  }
  if (!footerLogo.includes(`src="${whiteLogo}"`) || !/alt="FMB News"/i.test(footerLogo)) {
    warn(`Exact supplied white FMB News logo missing from footer: ${file}`);
  }
  if (/fn14-reference-logo|fmb-news-official-transparent\.webp/i.test(header)) {
    warn(`Retired or recreated FMB News logo remained in masthead: ${file}`);
  }
  if (/Loading Philippine time/i.test(html)) {
    warn(`Philippine time fallback remained unresolved: ${file}`);
  }
  if (isArticle) {
    articleCount += 1;
    if (/data-news-share/i.test(html)) warn(`Legacy duplicate share button remained: ${file}`);
    const shareBars = html.match(/class="[^"]*\bfn10-share-bar\b[^"]*"/gi) || [];
    if (shareBars.length !== 1) warn(`Expected one article share section, found ${shareBars.length}: ${file}`);
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    updated += 1;
  }
  verified += 1;
}

if (!verified || !articleCount) {
  warn(`Exact FMB News correction found ${verified} standard News route(s) and ${articleCount} article route(s).`);
}

const css = `
html body.news-reference-v13 [data-fmb-news-logo] { width:auto!important;min-width:0!important;display:inline-flex!important;align-items:center!important;justify-content:flex-start!important; }
html body.news-reference-v13 [data-fmb-news-logo-light] { position:static!important;width:clamp(168px,16vw,230px)!important;max-width:100%!important;height:auto!important;display:block!important;visibility:visible!important;opacity:1!important;object-fit:contain!important;clip:auto!important;clip-path:none!important;filter:none!important;pointer-events:auto!important; }
html body.news-reference-v13 [data-fmb-news-logo-dark] { position:static!important;width:clamp(150px,18vw,210px)!important;max-width:100%!important;height:auto!important;display:block!important;visibility:visible!important;opacity:1!important;object-fit:contain!important;clip:auto!important;clip-path:none!important;filter:none!important; }
html body.news-reference-v13 .fn14-reference-logo, html body.news-reference-v13 .fn15-official-logo { display:none!important; }
@media (max-width:820px) { html body.news-reference-v13 [data-fmb-news-logo-light]{width:158px!important;} html body.news-reference-v13 [data-fmb-news-logo-dark]{width:152px!important;} }
`;

const currentCss = await readFile(finalCssPath, 'utf8');
const markerPattern = new RegExp(`${cssStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${cssEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g');
const cleanCss = currentCss.replace(markerPattern, '').trimEnd();
await writeFile(finalCssPath, `${cleanCss}\n${cssStart}\n${css.trim()}\n${cssEnd}\n`, 'utf8');

console.log(`Completed FMB News logo/share/time audit across ${verified} standard route(s), including ${articleCount} article route(s). Skipped ${skippedUtilityPages} nonstandard utility or legacy page(s). Updated ${updated} route(s) with ${auditWarnings.length} non-blocking visual warning(s) at ${now.toISOString()}.`);
