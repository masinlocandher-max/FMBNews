import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
// The mobile system ships as one content-versioned bundle while authored
// source files remain separate and ordered here. The final navigation lock
// intentionally owns the black/ivory/red editorial shell and bottom dock.
const MOBILE_SYSTEM_SHEETS=[
  'fmb-news-mobile-first-site.css',
  'fmb-news-mobile-personalization.css',
  'fmb-news-mobile-premium.css',
  'fmb-news-mobile-home.css',
  'fmb-news-mobile-global.css',
  'fmb-news-mobile-products.css',
  'fmb-news-mobile-app-polish.css',
  'fmb-news-mobile-home-live-hero.css',
  'fmb-news-mobile-home-motion.css',
  'fmb-news-mobile-contrast-lock.css',
  'fmb-news-mobile-product-heroes.css',
  'fmb-news-mobile-menu-holder.css',
  'fmb-news-mobile-final-tweaks.css',
  'fmb-news-mobile-approved-home.css',
  'fmb-news-mobile-material-polish.css',
  'fmb-news-mobile-all-screens.css',
  'fmb-news-mobile-navigation-lock.css',
];
const MOBILE_SYSTEM_FILE='fmb-news-mobile-system.css';
const cssDir=path.join(newsRoot,'assets','css');

let bundle='';
for(const name of MOBILE_SYSTEM_SHEETS){
  const text=await readFile(path.join(cssDir,name),'utf8');
  if(/@import|@charset/i.test(text))throw new Error(`${name} contains @import/@charset and cannot be concatenated safely`);
  bundle+=`/* ===== ${name} ===== */\n${text}\n`;
}
const mobileSystemVersion=createHash('sha256').update(bundle).digest('hex').slice(0,10);
await writeFile(path.join(cssDir,MOBILE_SYSTEM_FILE),bundle,'utf8');

// Stamp the service worker's cache version from the same content hash that
// versions the mobile bundle. sw.js shipped a hand-maintained literal that
// never changed between builds, so its activate handler never purged anything
// and the runtime cache kept serving hand-versioned legacy assets to returning
// readers. Deriving it here means every build that changes the mobile system
// rotates the caches exactly once, on activate, with no hand-editing.
const swPath=path.join(newsRoot,'sw.js');
const swSource=await readFile(swPath,'utf8');
if(!swSource.includes('__FMB_BUILD_VERSION__'))throw new Error('site/sw.js no longer carries the __FMB_BUILD_VERSION__ stamp; the cache version would silently stop rotating.');
await writeFile(swPath,swSource.replaceAll('__FMB_BUILD_VERSION__',mobileSystemVersion),'utf8');
const mobileSystemCss=`<link rel="stylesheet" href="/assets/css/${MOBILE_SYSTEM_FILE}?v=${mobileSystemVersion}">`;

// The mobile runtime scripts are content-versioned from the files themselves,
// the way the CSS bundle above already is.
//
// They used to carry hand-maintained literals -- '20260914-editorial-shell-v4'
// and friends. That is the same defect this file already documents for sw.js:
// the token only changes when somebody remembers to change it, so an edit to
// the shell runtime ships to the CDN under a URL returning readers have already
// cached, and they keep running the old script. Removing the app-bar hamburger
// and the duplicated section rail is exactly such an edit, and it would have
// gone out invisible to every reader who had visited before.
//
// Hashing the file means the URL changes when, and only when, the file does.
const jsDir=path.join(newsRoot,'assets','js');
const jsVersions=new Map();
async function versionedJs(name,extra=''){
  const hash=createHash('sha256').update(await readFile(path.join(jsDir,name))).digest('hex').slice(0,10);
  const version=`${hash}${extra}`;
  jsVersions.set(`/assets/js/${name}`,version);
  return `<script src="/assets/js/${name}?v=${version}" defer></script>`;
}
const personalizationJs=await versionedJs('fmb-news-mobile-personalization.js');
const premiumJs=await versionedJs('fmb-news-mobile-premium.js');
const mobileHomeJs=await versionedJs('fmb-news-mobile-home.js');
const mobileLiveFeedJs=await versionedJs('fmb-news-mobile-live-feed.js');
const mobileGlobalJs=await versionedJs('fmb-news-mobile-global.js');
const mobileProductsJs=await versionedJs('fmb-news-mobile-products.js');
const mobilePolishJs=await versionedJs('fmb-news-mobile-app-polish.js');
const mobileFinalTweaksJs=await versionedJs('fmb-news-mobile-final-tweaks.js');
// The PWA script keeps its extra build key; only the version half is hashed.
const pwaJs=await versionedJs('fmb-news-pwa.js','&build=menu-install-v2');
const pwaMeta='<link rel="manifest" href="/news/manifest.webmanifest"><link rel="apple-touch-icon" href="/news/assets/images/icon-transparent.png"><meta name="application-name" content="FMB News"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="FMB News"><meta name="format-detection" content="telephone=no"><meta name="theme-color" content="#0A0A0A">';

function addBodyClass(html){if(/<body\b[^>]*class=["'][^"']*\bfmb-mobile-first\b/i.test(html))return html;if(/<body\b[^>]*class=["']/i.test(html))return html.replace(/<body\b([^>]*?)class=(["'])([^"']*)\2/i,(_m,b,q,c)=>`<body${b}class=${q}${c} fmb-mobile-first${q}`);return html.replace(/<body\b([^>]*)>/i,'<body$1 class="fmb-mobile-first">')}
function removeBottomNav(html){return html.replace(/<nav\b[^>]*class=["'][^"']*\bnc-mobile-dock\b[^"']*["'][^>]*>[\s\S]*?<\/nav>\s*/gi,'').replace(/<nav\b[^>]*class=["'][^"']*\bfmb-app-dock\b[^"']*["'][^>]*>[\s\S]*?<\/nav>\s*/gi,'').replace(/<nav\b[^>]*aria-label=["']Mobile news navigation["'][^>]*>[\s\S]*?<\/nav>\s*/gi,'')}
function normalizeProductNavigation(html){
  html=html.replace(/FMB Brief/g,'FMB Daily Brief').replace(/FMB Explained/g,'FMB Explainer');
  return html.replace(/<nav\b([^>]*class=["'][^"']*(?:desktop-nav|mobile-nav|publication-nav)[^"']*["'][^>]*)>([\s\S]*?)<\/nav>/gi,(whole,attrs,inner)=>{
    if(inner.includes('/news/explainer/'))return whole;
    const world=/(<a\b[^>]*href=["']\/news\/world\/?["'][^>]*>[\s\S]*?<\/a>)/i;
    if(world.test(inner))inner=inner.replace(world,'$1<a href="/news/explainer/">FMB Explainer</a>');
    else inner=`<a href="/news/explainer/">FMB Explainer</a>${inner}`;
    return `<nav${attrs}>${inner}</nav>`;
  });
}
function escapedAssetPath(pathName){return pathName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function useMobileSystemStylesheet(html){
  for(const name of MOBILE_SYSTEM_SHEETS){
    html=html.replace(new RegExp(`<link\\b[^>]*href=["'][^"']*${escapedAssetPath(name)}(?:\\?[^"']*)?["'][^>]*>`,'gi'),'');
  }
  const existing=new RegExp(`<link\\b[^>]*href=["'][^"']*${escapedAssetPath(MOBILE_SYSTEM_FILE)}(?:\\?[^"']*)?["'][^>]*>`,'gi');
  if(existing.test(html))return html.replace(existing,mobileSystemCss);
  return html.replace('</head>',`${mobileSystemCss}</head>`);
}
function upsertJs(html,pathName,asset,version){if(!html.includes(pathName))return html.replace('</body>',`${asset}</body>`);return html.replace(new RegExp(`${escapedAssetPath(pathName)}(?:\\?v=[^"']+)?`,'g'),`${pathName}?v=${version}`)}
function normalizeThemeColor(html){
  if(/<meta name="theme-color"/i.test(html))return html.replace(/<meta name="theme-color" content="[^"]*">/i,'<meta name="theme-color" content="#0A0A0A">');
  return html.replace('</head>','<meta name="theme-color" content="#0A0A0A"></head>');
}
async function apply(target){
  const info=await stat(target);
  if(info.isDirectory()){for(const entry of await readdir(target))await apply(path.join(target,entry));return}
  if(path.basename(target)!=='index.html')return;
  let html=await readFile(target,'utf8');
  html=removeBottomNav(html);html=addBodyClass(html);html=normalizeProductNavigation(html);html=normalizeThemeColor(html);
  html=useMobileSystemStylesheet(html);
  if(!html.includes('/news/manifest.webmanifest'))html=html.replace('</head>',`${pwaMeta}</head>`);else if(!html.includes('apple-touch-icon'))html=html.replace('</head>',`<link rel="apple-touch-icon" href="/news/assets/images/icon-transparent.png"></head>`);
  // Each version comes from the hash computed above, so an existing tag is
  // rewritten to the current file's URL and a stale one cannot survive a build.
  for(const [pathName,asset] of [
    ['/assets/js/fmb-news-mobile-personalization.js',personalizationJs],
    ['/assets/js/fmb-news-mobile-premium.js',premiumJs],
    ['/assets/js/fmb-news-mobile-home.js',mobileHomeJs],
    ['/assets/js/fmb-news-mobile-live-feed.js',mobileLiveFeedJs],
    ['/assets/js/fmb-news-mobile-global.js',mobileGlobalJs],
    ['/assets/js/fmb-news-mobile-products.js',mobileProductsJs],
    ['/assets/js/fmb-news-mobile-app-polish.js',mobilePolishJs],
    ['/assets/js/fmb-news-mobile-final-tweaks.js',mobileFinalTweaksJs],
    ['/assets/js/fmb-news-pwa.js',pwaJs],
  ])html=upsertJs(html,pathName,asset,jsVersions.get(pathName));
  await writeFile(target,html,'utf8');
}
await apply(newsRoot);
console.log('Applied the unified FMB News mobile editorial system with newsroom-black masthead, signal-red section state, story-led Home, persistent five-item bottom dock, current PHT runtime, accessible action sheets, live feed, and installable PWA behavior.');