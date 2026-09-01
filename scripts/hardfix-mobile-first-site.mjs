import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const mobileFirstAsset='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-first-site.css?v=20260901-site-v1">';
const personalizationCss='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-personalization.css?v=20260901-personal-v3">';
const premiumCss='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-premium.css?v=20260901-premium-v2">';
const mobileHomeCss='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-home.css?v=20260901-app-home-v2">';
const mobileGlobalCss='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-global.css?v=20260901-global-v3">';
const mobileProductsCss='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-products.css?v=20260901-products-v1">';
const mobilePolishCss='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-app-polish.css?v=20260902-polish-v2">';
const mobileLiveHeroCss='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-home-live-hero.css?v=20260902-approved-hero-v3">';
const mobileHomeMotionCss='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-home-motion.css?v=20260902-home-motion-v1">';
const mobileContrastCss='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-contrast-lock.css?v=20260902-contrast-v1">';
const mobileProductHeroesCss='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-product-heroes.css?v=20260902-product-heroes-v4">';
const mobileMenuHolderCss='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-menu-holder.css?v=20260902-menu-holder-v2">';
const personalizationJs='<script src="/assets/js/fmb-news-mobile-personalization.js?v=20260901-personal-v2" defer></script>';
const premiumJs='<script src="/assets/js/fmb-news-mobile-premium.js?v=20260901-premium-v2" defer></script>';
const mobileHomeJs='<script src="/assets/js/fmb-news-mobile-home.js?v=20260902-approved-home-v3" defer></script>';
const mobileGlobalJs='<script src="/assets/js/fmb-news-mobile-global.js?v=20260901-global-v3" defer></script>';
const mobileProductsJs='<script src="/assets/js/fmb-news-mobile-products.js?v=20260902-products-v3" defer></script>';
const mobilePolishJs='<script src="/assets/js/fmb-news-mobile-app-polish.js?v=20260902-polish-v2" defer></script>';
const pwaMeta='<link rel="manifest" href="/news/manifest.webmanifest"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="FMB News"><meta name="theme-color" content="#2b1235">';

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
function upsertCss(html,pathName,asset,version){
  if(!html.includes(pathName))return html.replace('</head>',`${asset}</head>`);
  return html.replace(new RegExp(`${escapedAssetPath(pathName)}(?:\\?v=[^"']+)?`,'g'),`${pathName}?v=${version}`);
}
function upsertJs(html,pathName,asset,version){
  if(!html.includes(pathName))return html.replace('</body>',`${asset}</body>`);
  return html.replace(new RegExp(`${escapedAssetPath(pathName)}(?:\\?v=[^"']+)?`,'g'),`${pathName}?v=${version}`);
}
async function apply(target){
  const info=await stat(target);
  if(info.isDirectory()){for(const entry of await readdir(target))await apply(path.join(target,entry));return}
  if(path.basename(target)!=='index.html')return;
  let html=await readFile(target,'utf8');
  html=removeBottomNav(html);
  html=addBodyClass(html);
  html=normalizeProductNavigation(html);
  html=upsertCss(html,'/assets/css/fmb-news-mobile-first-site.css',mobileFirstAsset,'20260901-site-v1');
  html=upsertCss(html,'/assets/css/fmb-news-mobile-personalization.css',personalizationCss,'20260901-personal-v3');
  html=upsertCss(html,'/assets/css/fmb-news-mobile-premium.css',premiumCss,'20260901-premium-v2');
  html=upsertCss(html,'/assets/css/fmb-news-mobile-home.css',mobileHomeCss,'20260901-app-home-v2');
  html=upsertCss(html,'/assets/css/fmb-news-mobile-global.css',mobileGlobalCss,'20260901-global-v3');
  html=upsertCss(html,'/assets/css/fmb-news-mobile-products.css',mobileProductsCss,'20260901-products-v1');
  html=upsertCss(html,'/assets/css/fmb-news-mobile-app-polish.css',mobilePolishCss,'20260902-polish-v2');
  html=upsertCss(html,'/assets/css/fmb-news-mobile-home-live-hero.css',mobileLiveHeroCss,'20260902-approved-hero-v3');
  html=upsertCss(html,'/assets/css/fmb-news-mobile-home-motion.css',mobileHomeMotionCss,'20260902-home-motion-v1');
  html=upsertCss(html,'/assets/css/fmb-news-mobile-contrast-lock.css',mobileContrastCss,'20260902-contrast-v1');
  html=upsertCss(html,'/assets/css/fmb-news-mobile-product-heroes.css',mobileProductHeroesCss,'20260902-product-heroes-v4');
  html=upsertCss(html,'/assets/css/fmb-news-mobile-menu-holder.css',mobileMenuHolderCss,'20260902-menu-holder-v2');
  if(!html.includes('/news/manifest.webmanifest'))html=html.replace('</head>',`${pwaMeta}</head>`);
  html=upsertJs(html,'/assets/js/fmb-news-mobile-personalization.js',personalizationJs,'20260901-personal-v2');
  html=upsertJs(html,'/assets/js/fmb-news-mobile-premium.js',premiumJs,'20260901-premium-v2');
  html=upsertJs(html,'/assets/js/fmb-news-mobile-home.js',mobileHomeJs,'20260902-approved-home-v3');
  html=upsertJs(html,'/assets/js/fmb-news-mobile-global.js',mobileGlobalJs,'20260901-global-v3');
  html=upsertJs(html,'/assets/js/fmb-news-mobile-products.js',mobileProductsJs,'20260902-products-v3');
  html=upsertJs(html,'/assets/js/fmb-news-mobile-app-polish.js',mobilePolishJs,'20260902-polish-v2');
  await writeFile(target,html,'utf8');
}
await apply(newsRoot);
console.log('Applied the unified Filipino Media Bulletin mobile system with one masthead, one compact premium dark product menu holder, the approved Philippines newsroom hero with cache-safe moving headline crawl and spacing-safe HTML overlay, strict shared Worldwide/Explainer/Daily Brief hero geometry, final contrast lock, immediate internal product content, and no legacy duplicate navigation.');
