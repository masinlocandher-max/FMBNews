import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cap, tag, walk, articleRecords, landingRecords, merge, chronological, assertChronological, logo } from './fmbnews-clean-lib.mjs';
import { shell, foot, runtime, head, landingPage, aboutPage, redirectPage } from './fmbnews-clean-render.mjs';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const dist=path.join(root,'dist');
const news=path.join(dist,'news');
const fmb=path.join(dist,'fmbnews');
function mainLandmark(main){return main.replace(/<main\b([^>]*)>/i,(whole,attrs='')=>{attrs=attrs.replace(/\s+id=(['"])[^'"]*\1/i,'');return `<main id="main"${attrs}>`})}
function cleanArticle(html,route,publishedAt='',attachedImage=''){
  const rawMain=html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0];
  if(!rawMain)return html;
  const brokenCognitaImage='/assets/images/cognita/ads/cognita-brand-banner.webp';
  const cognitaFallback='/assets/images/news/cognita-filipino-centered-education.svg';
  const main=mainLandmark(rawMain).replaceAll(brokenCognitaImage,cognitaFallback);
  const title=cap(html,/<title>([\s\S]*?)<\/title>/i)||cap(main,/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const description=tag(html,/<meta\b[^>]*name=(['"])description\1[^>]*>/i,'content')||cap(main,/<p\b[^>]*class=(['"])[^'"]*\bnc-article-deck\b[^'"]*\1[^>]*>([\s\S]*?)<\/p>/i);
  const canonical=tag(html,/<link\b[^>]*rel=(['"])canonical\1[^>]*>/i,'href')||`https://www.francinemariebautista.com${route}`;
  const rawImage=attachedImage||tag(html,/<meta\b[^>]*property=(['"])og:image\1[^>]*>/i,'content')||tag(main,/<img\b[^>]*>/i,'src')||'';
  const image=rawImage.replace(brokenCognitaImage,cognitaFallback);
  const sourcePublished=tag(html,/<meta\b[^>]*property=(['"])article:published_time\1[^>]*>/i,'content')||publishedAt;
  const sourceUpdated=tag(html,/<meta\b[^>]*property=(['"])article:modified_time\1[^>]*>/i,'content');
  const imageAlt=tag(html,/<meta\b[^>]*property=(['"])og:image:alt\1[^>]*>/i,'content')||tag(main,/<img\b[^>]*>/i,'alt')||'FMB News';
  const imageWidth=tag(html,/<meta\b[^>]*property=(['"])og:image:width\1[^>]*>/i,'content');
  const imageHeight=tag(html,/<meta\b[^>]*property=(['"])og:image:height\1[^>]*>/i,'content');
  const structuredData=[...html.matchAll(/<script\b[^>]*type=(['"])application\/ld\+json\1[^>]*>[\s\S]*?<\/script>/gi)].map(match=>match[0]).join('');
  return `<!doctype html><html lang="en-PH">${head(title,description,canonical,image,'article',sourcePublished,{updatedAt:sourceUpdated,imageAlt,imageWidth,imageHeight,structuredData})}<body id="top" class="fmb-news-clean fmb-news-article news-story-route">${shell()}${main.replaceAll('href="/news/"','href="/fmbnews/"')}${foot()}${runtime()}</body></html>`;
}
await mkdir(path.join(dist,'assets','css'),{recursive:true});
await writeFile(path.join(dist,'assets','css','fmbnews-clean-v1.css'),await readFile(path.join(root,'apps','withlovefmb','assets','css','fmbnews-clean-v1.css'),'utf8'),'utf8');
const old=await readFile(path.join(news,'index.html'),'utf8');
const records=chronological(merge(await articleRecords(news),landingRecords(old)));
assertChronological(records,'FMB News clean recovery');
if(records.length<6)throw new Error('FMB News recovery could not find enough published reports.');
await mkdir(fmb,{recursive:true});
const landing=landingPage(records).replace('<span id="rundown" hidden></span>', '<span id="rundown" hidden></span><span id="latest-reports" hidden></span>');
await writeFile(path.join(fmb,'index.html'),landing,'utf8');
await mkdir(path.join(fmb,'about'),{recursive:true});
await writeFile(path.join(fmb,'about','index.html'),aboutPage(),'utf8');
const alias=landing.replace('content="index,follow,max-image-preview:large"','content="noindex,follow"').replace('<body class="fmb-news-clean fmb-news-landing">','<body class="fmb-news-clean fmb-news-landing"><script>location.replace("/fmbnews/");</script>');
await writeFile(path.join(news,'index.html'),alias,'utf8');
await mkdir(path.join(news,'about'),{recursive:true});
const aboutAlias=redirectPage('/fmbnews/about/').replace('<meta name="robots"','<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="FMB News has moved to its canonical About page."><meta name="robots"');
await writeFile(path.join(news,'about','index.html'),aboutAlias,'utf8');
let count=0;
const recordsByRoute=new Map(records.map(record=>[record.route,record]));
for(const file of await walk(news)){
  if(file===path.join(news,'index.html')||file===path.join(news,'about','index.html'))continue;
  const rel=path.relative(news,file).split(path.sep).join('/');
  if(!rel.endsWith('/index.html'))continue;
  const route=`/news/${rel.replace(/index\.html$/,'')}`;
  const record=recordsByRoute.get(route);
  if(!record)continue;
  const before=await readFile(file,'utf8');
  const after=cleanArticle(before,route,record.publishedAt,record.image);
  if(after!==before){await writeFile(file,after,'utf8');count++}
}
const final=await readFile(path.join(fmb,'index.html'),'utf8');
if((final.match(/class="fnc-header"/g)||[]).length!==1||(final.match(/class="fnc-footer"/g)||[]).length!==1||/fmb-shell-header|fmb-shell-footer|fmb-news-livebar|fmb-news-channel-command/.test(final)||!final.includes(`data-published-at="${records[0].publishedAt}"`))throw new Error('FMB News clean recovery validation failed.');
console.log(`Recovered FMB News with one canonical newsroom, ${records.length} image-backed reports and ${count} clean article pages; final route withholding runs after all article processors.`);
