import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const fallback='/assets/images/news/fmb-news-editorial-fallback.svg';

const esc=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const strip=value=>String(value||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const isArticle=html=>html.includes('class="article-grid"')||/property=["']og:type["'][^>]*content=["']article["']/i.test(html)||/content=["']article["'][^>]*property=["']og:type["']/i.test(html)||/["']@type["']\s*:\s*["'](?:NewsArticle|Article)["']/i.test(html);
const hasContentImage=html=>/class=["'][^"']*(?:article-figure|cms-article-image|explainer-article-image|article-hero-image)[^"']*["'][\s\S]*?<img\b[^>]*src=["'][^"']+/i.test(html)||/<article\b[\s\S]*?<img\b[^>]*src=["'][^"']+/i.test(html);

function articleTitle(html){
  const h1=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  return strip(h1)||'FMB News editorial visual';
}
function firstContentImage(html){
  const patterns=[
    /class=["'][^"']*(?:article-figure|cms-article-image|explainer-article-image|article-hero-image)[^"']*["'][\s\S]*?<img\b[^>]*src=["']([^"']+)/i,
    /<article\b[\s\S]*?<img\b[^>]*src=["']([^"']+)/i
  ];
  for(const pattern of patterns){const hit=html.match(pattern);if(hit?.[1])return hit[1]}
  return '';
}
function injectFigure(html,title){
  const figure=`<figure class="article-figure fmb-guaranteed-article-figure"><img src="${fallback}" alt="${esc(title)}" loading="eager" decoding="async"><figcaption>FMB News editorial visual</figcaption></figure>`;
  const h1=/<h1\b[^>]*>[\s\S]*?<\/h1>/i;
  if(h1.test(html))return html.replace(h1,match=>`${match}${figure}`);
  const article=/<article\b[^>]*>/i;
  if(article.test(html))return html.replace(article,match=>`${match}${figure}`);
  return html.replace(/<body\b[^>]*>/i,match=>`${match}${figure}`);
}
function upsertSocialImage(html,image){
  if(/<meta\b[^>]*property=["']og:image["']/i.test(html)){
    html=html.replace(/<meta\b([^>]*property=["']og:image["'][^>]*)>/i,tag=>/content=["'][^"']*["']/i.test(tag)?tag.replace(/content=["'][^"']*["']/i,`content="${image}"`):tag.replace(/>$/,` content="${image}">`));
  }else html=html.replace('</head>',`<meta property="og:image" content="${image}"></head>`);
  if(/<meta\b[^>]*name=["']twitter:image["']/i.test(html)){
    html=html.replace(/<meta\b([^>]*name=["']twitter:image["'][^>]*)>/i,tag=>/content=["'][^"']*["']/i.test(tag)?tag.replace(/content=["'][^"']*["']/i,`content="${image}"`):tag.replace(/>$/,` content="${image}">`));
  }else html=html.replace('</head>',`<meta name="twitter:image" content="${image}"></head>`);
  return html;
}

let articlePages=0,inserted=0,socialFixed=0;
async function scan(target){
  const info=await stat(target);
  if(info.isDirectory()){for(const entry of await readdir(target))await scan(path.join(target,entry));return}
  if(path.basename(target)!=='index.html')return;
  let html=await readFile(target,'utf8');
  if(!isArticle(html))return;
  articlePages++;
  const title=articleTitle(html);
  if(!hasContentImage(html)){html=injectFigure(html,title);inserted++}
  const image=firstContentImage(html)||fallback;
  const before=html;
  html=upsertSocialImage(html,image);
  if(html!==before)socialFixed++;
  await writeFile(target,html,'utf8');
}
await scan(newsRoot);
if(articlePages===0)throw new Error('No FMB article routes were found while enforcing article imagery.');
console.log(`Article image hard rule applied: ${articlePages} article routes checked, ${inserted} missing figures repaired, social image metadata normalized on ${socialFixed} routes.`);
