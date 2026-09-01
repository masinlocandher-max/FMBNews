import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const mobileFirstAsset='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-first-site.css?v=20260901-site-v1">';
const personalizationCss='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-personalization.css?v=20260901-personal-v2">';
const personalizationJs='<script src="/assets/js/fmb-news-mobile-personalization.js?v=20260901-personal-v2" defer></script>';
const pwaMeta='<link rel="manifest" href="/news/manifest.webmanifest"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="FMB News"><meta name="theme-color" content="#2b1235">';

function addBodyClass(html){if(/<body\b[^>]*class=["'][^"']*\bfmb-mobile-first\b/i.test(html))return html;if(/<body\b[^>]*class=["']/i.test(html))return html.replace(/<body\b([^>]*?)class=(["'])([^"']*)\2/i,(_m,b,q,c)=>`<body${b}class=${q}${c} fmb-mobile-first${q}`);return html.replace(/<body\b([^>]*)>/i,'<body$1 class="fmb-mobile-first">')}
function removeBottomNav(html){return html.replace(/<nav\b[^>]*class=["'][^"']*\bnc-mobile-dock\b[^"']*["'][^>]*>[\s\S]*?<\/nav>\s*/gi,'').replace(/<nav\b[^>]*class=["'][^"']*\bfmb-app-dock\b[^"']*["'][^>]*>[\s\S]*?<\/nav>\s*/gi,'').replace(/<nav\b[^>]*aria-label=["']Mobile news navigation["'][^>]*>[\s\S]*?<\/nav>\s*/gi,'')}
function normalizeProductNavigation(html){
  html=html.replace(/FMB Brief/g,'FMB Daily Brief');
  return html.replace(/<nav\b([^>]*class=["'][^"']*(?:desktop-nav|mobile-nav|publication-nav)[^"']*["'][^>]*)>([\s\S]*?)<\/nav>/gi,(whole,attrs,inner)=>{
    if(inner.includes('/news/explainer/'))return whole;
    const world=/(<a\b[^>]*href=["']\/news\/world\/?["'][^>]*>[\s\S]*?<\/a>)/i;
    if(world.test(inner))inner=inner.replace(world,'$1<a href="/news/explainer/">FMB Explainer</a>');
    else inner=`<a href="/news/explainer/">FMB Explainer</a>${inner}`;
    return `<nav${attrs}>${inner}</nav>`;
  });
}
async function apply(target){const info=await stat(target);if(info.isDirectory()){for(const entry of await readdir(target))await apply(path.join(target,entry));return}if(path.basename(target)!=='index.html')return;let html=await readFile(target,'utf8');html=removeBottomNav(html);html=addBodyClass(html);html=normalizeProductNavigation(html);if(!html.includes('/assets/css/fmb-news-mobile-first-site.css'))html=html.replace('</head>',`${mobileFirstAsset}</head>`);if(!html.includes('/assets/css/fmb-news-mobile-personalization.css'))html=html.replace('</head>',`${personalizationCss}</head>`);else html=html.replace(/fmb-news-mobile-personalization\.css\?v=[^"']+/g,'fmb-news-mobile-personalization.css?v=20260901-personal-v2');if(!html.includes('/news/manifest.webmanifest'))html=html.replace('</head>',`${pwaMeta}</head>`);if(!html.includes('/assets/js/fmb-news-mobile-personalization.js'))html=html.replace('</body>',`${personalizationJs}</body>`);else html=html.replace(/fmb-news-mobile-personalization\.js\?v=[^"']+/g,'fmb-news-mobile-personalization.js?v=20260901-personal-v2');await writeFile(target,html,'utf8')}
await apply(newsRoot);
console.log('Applied desktop-preserving responsive system with the four official FMB products, mobile email personalization, push/PWA support, and no fixed bottom navigation.');
