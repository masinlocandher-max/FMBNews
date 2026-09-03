import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
// The mobile system used to ship as many separate stylesheets, injected here
// one after another so they always landed as one contiguous, ordered block in
// <head>. Concatenating them in that same order is cascade-identical by
// construction — the browser sees the identical declaration sequence — while
// leaving one authoritative network request to reason about. None of them
// contains @import or @charset, the only at-rules whose meaning depends on file
// position.
//
// The authored files stay separate on disk: they are the editable sources, and
// the verifiers assert against them.
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
const mobileSystemCss=`<link rel="stylesheet" href="/assets/css/${MOBILE_SYSTEM_FILE}?v=${mobileSystemVersion}">`;

const personalizationJs='<script src="/assets/js/fmb-news-mobile-personalization.js?v=20260901-personal-v2" defer></script>';
const premiumJs='<script src="/assets/js/fmb-news-mobile-premium.js?v=20260901-premium-v2" defer></script>';
const mobileHomeJs='<script src="/assets/js/fmb-news-mobile-home.js?v=20260902-approved-home-v4" defer></script>';
const mobileLiveFeedJs='<script src="/assets/js/fmb-news-mobile-live-feed.js?v=20260902-live-feed-v2" defer></script>';
const mobileGlobalJs='<script src="/assets/js/fmb-news-mobile-global.js?v=20260901-global-v3&build=right-menu-v3" defer></script>';
const mobileProductsJs='<script src="/assets/js/fmb-news-mobile-products.js?v=20260902-products-v3" defer></script>';
const mobilePolishJs='<script src="/assets/js/fmb-news-mobile-app-polish.js?v=20260902-polish-v2" defer></script>';
const mobileFinalTweaksJs='<script src="/assets/js/fmb-news-mobile-final-tweaks.js?v=20260902-final-tweaks-v1" defer></script>';
const pwaJs='<script src="/assets/js/fmb-news-pwa.js?v=20260902-pwa-v1&build=menu-install-v2" defer></script>';
const pwaMeta='<link rel="manifest" href="/news/manifest.webmanifest"><link rel="apple-touch-icon" href="/news/assets/images/icon-transparent.png"><meta name="application-name" content="FMB News"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="FMB News"><meta name="format-detection" content="telephone=no"><meta name="theme-color" content="#220d50">';

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
async function apply(target){
  const info=await stat(target);
  if(info.isDirectory()){for(const entry of await readdir(target))await apply(path.join(target,entry));return}
  if(path.basename(target)!=='index.html')return;
  let html=await readFile(target,'utf8');
  html=removeBottomNav(html);html=addBodyClass(html);html=normalizeProductNavigation(html);
  html=useMobileSystemStylesheet(html);
  if(!html.includes('/news/manifest.webmanifest'))html=html.replace('</head>',`${pwaMeta}</head>`);else if(!html.includes('apple-touch-icon'))html=html.replace('</head>',`<link rel="apple-touch-icon" href="/news/assets/images/icon-transparent.png"></head>`);
  html=upsertJs(html,'/assets/js/fmb-news-mobile-personalization.js',personalizationJs,'20260901-personal-v2');
  html=upsertJs(html,'/assets/js/fmb-news-mobile-premium.js',premiumJs,'20260901-premium-v2');
  html=upsertJs(html,'/assets/js/fmb-news-mobile-home.js',mobileHomeJs,'20260902-approved-home-v4');
  html=upsertJs(html,'/assets/js/fmb-news-mobile-live-feed.js',mobileLiveFeedJs,'20260902-live-feed-v2');
  html=upsertJs(html,'/assets/js/fmb-news-mobile-global.js',mobileGlobalJs,'20260901-global-v3&build=right-menu-v3');
  html=upsertJs(html,'/assets/js/fmb-news-mobile-products.js',mobileProductsJs,'20260902-products-v3');
  html=upsertJs(html,'/assets/js/fmb-news-mobile-app-polish.js',mobilePolishJs,'20260902-polish-v2');
  html=upsertJs(html,'/assets/js/fmb-news-mobile-final-tweaks.js',mobileFinalTweaksJs,'20260902-final-tweaks-v1');
  html=upsertJs(html,'/assets/js/fmb-news-pwa.js',pwaJs,'20260902-pwa-v1&build=menu-install-v2');
  await writeFile(target,html,'utf8');
}
await apply(newsRoot);
console.log('Applied the unified Filipino Media Bulletin mobile system with sticky centered FMB identity, right-side hamburger, five-product icon rail, Home Headlines inside the sticky shell, current cinematic hero, rotating slogan, live date/time, metallic violet/purple final material polish, all-screen mobile spacing, live Supabase Latest feed, installable PWA runtime, and no duplicate hero or legacy bottom navigation.');