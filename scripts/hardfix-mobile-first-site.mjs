import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const mobileFirstAsset='<link rel="stylesheet" href="/assets/css/fmb-news-mobile-first-site.css?v=20260901-site-v1">';

const appOnlyPatterns=[
  /<link[^>]+rel=["']manifest["'][^>]+href=["'][^"']*manifest\.webmanifest[^"']*["'][^>]*>\s*/gi,
  /<meta[^>]+name=["']mobile-web-app-capable["'][^>]*>\s*/gi,
  /<meta[^>]+name=["']apple-mobile-web-app-capable["'][^>]*>\s*/gi,
  /<meta[^>]+name=["']apple-mobile-web-app-status-bar-style["'][^>]*>\s*/gi,
  /<meta[^>]+name=["']apple-mobile-web-app-title["'][^>]*>\s*/gi,
  /<link[^>]+href=["'][^"']*fmb-news-mobile-app\.css[^"']*["'][^>]*>\s*/gi,
  /<link[^>]+href=["'][^"']*fmb-news-mobile-image-quality\.css[^"']*["'][^>]*>\s*/gi,
  /<link[^>]+href=["'][^"']*fmb-news-mobile-readability\.css[^"']*["'][^>]*>\s*/gi,
  /<script[^>]+src=["'][^"']*fmb-news-mobile-app\.js[^"']*["'][^>]*><\/script>\s*/gi,
  /<script[^>]+src=["'][^"']*fmb-news-mobile-image-quality\.js[^"']*["'][^>]*><\/script>\s*/gi
];

function addBodyClass(html){
  if(/<body\b[^>]*class=["'][^"']*\bfmb-mobile-first\b/i.test(html)) return html;
  if(/<body\b[^>]*class=["']/i.test(html)){
    return html.replace(/<body\b([^>]*?)class=(["'])([^"']*)\2/i,(_m,before,quote,classes)=>`<body${before}class=${quote}${classes} fmb-mobile-first${quote}`);
  }
  return html.replace(/<body\b([^>]*)>/i,'<body$1 class="fmb-mobile-first">');
}

function removeBottomNav(html){
  return html
    .replace(/<nav\b[^>]*class=["'][^"']*\bnc-mobile-dock\b[^"']*["'][^>]*>[\s\S]*?<\/nav>\s*/gi,'')
    .replace(/<nav\b[^>]*class=["'][^"']*\bfmb-app-dock\b[^"']*["'][^>]*>[\s\S]*?<\/nav>\s*/gi,'')
    .replace(/<nav\b[^>]*aria-label=["']Mobile news navigation["'][^>]*>[\s\S]*?<\/nav>\s*/gi,'');
}

async function apply(target){
  const info=await stat(target);
  if(info.isDirectory()){
    for(const entry of await readdir(target)) await apply(path.join(target,entry));
    return;
  }
  if(path.basename(target)!=='index.html') return;

  let html=await readFile(target,'utf8');
  for(const pattern of appOnlyPatterns) html=html.replace(pattern,'');
  html=removeBottomNav(html);
  html=addBodyClass(html);

  if(!html.includes('/assets/css/fmb-news-mobile-first-site.css')){
    html=html.replace('</head>',`${mobileFirstAsset}</head>`);
  }else{
    html=html.replace(/fmb-news-mobile-first-site\.css\?v=[^"']+/g,'fmb-news-mobile-first-site.css?v=20260901-site-v1');
  }

  await writeFile(target,html,'utf8');
}

await apply(newsRoot);
console.log('Applied one mobile-first website system to every /news/ page and removed fixed bottom/app navigation.');
