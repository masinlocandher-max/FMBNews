import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolve = (...parts) => path.join(root, ...parts);

const required = [
  'site/index.html','site/fmb-brief/index.html','site/fmb-brief/live/index.html','site/world/index.html','site/world/live/index.html','site/read/index.html',
  'public/assets/css/fmb-news-final.css','public/assets/css/fmb-news-cms.css','public/assets/css/fmb-news-reference.css','public/assets/css/fmb-news-reference-polish.css','public/assets/css/fmb-news-reference-hardfix.css','public/assets/css/fmb-news-reference-final.css','public/assets/css/fmb-news-network-hardfix.css','public/assets/css/fmb-news-ticker-hardfix.css','public/assets/css/fmb-news-product-identity.css',
  'public/assets/js/fmb-news-approved.js','public/assets/js/fmb-news-cms.js','content/news/articles',
  'scripts/render-metallic-reference.mjs','scripts/hardfix-metallic-network.mjs','scripts/hardfix-ticker.mjs','scripts/hardfix-product-identity.mjs','src/worker.js','wrangler.jsonc',
  'dist/news/index.html','dist/news/archive/index.html','dist/news/world/index.html','dist/news/world/live/index.html','dist/news/fmb-brief/index.html','dist/news/fmb-brief/live/index.html','dist/news/about/index.html','dist/news/read/index.html',
  'dist/news/assets/js/fmb-news-cms.js','dist/news/assets/css/fmb-news-reference.css','dist/news/assets/css/fmb-news-reference-final.css','dist/news/assets/css/fmb-news-network-hardfix.css','dist/news/assets/css/fmb-news-ticker-hardfix.css','dist/news/assets/css/fmb-news-product-identity.css'
];
for (const rel of required) await access(resolve(rel));

try { await access(resolve('vercel.json')); throw new Error('FMBNews must not contain a Vercel deployment configuration'); }
catch (error) { if (error?.code !== 'ENOENT' && /must not contain/.test(error?.message || '')) throw error; }

const home=await readFile(resolve('site/index.html'),'utf8');
const brief=await readFile(resolve('site/fmb-brief/index.html'),'utf8');
const world=await readFile(resolve('site/world/index.html'),'utf8');
const reader=await readFile(resolve('site/read/index.html'),'utf8');
const liveWorld=await readFile(resolve('site/world/live/index.html'),'utf8');
const liveBrief=await readFile(resolve('site/fmb-brief/live/index.html'),'utf8');
const cms=await readFile(resolve('public/assets/js/fmb-news-cms.js'),'utf8');
const worker=await readFile(resolve('src/worker.js'),'utf8');
const wrangler=await readFile(resolve('wrangler.jsonc'),'utf8');
const builtHome=await readFile(resolve('dist/news/index.html'),'utf8');
const builtWorld=await readFile(resolve('dist/news/world/index.html'),'utf8');
const builtWorldLive=await readFile(resolve('dist/news/world/live/index.html'),'utf8');
const builtBrief=await readFile(resolve('dist/news/fmb-brief/index.html'),'utf8');
const builtBriefLive=await readFile(resolve('dist/news/fmb-brief/live/index.html'),'utf8');
const builtAbout=await readFile(resolve('dist/news/about/index.html'),'utf8');
const builtReader=await readFile(resolve('dist/news/read/index.html'),'utf8');
const metallicCss=await readFile(resolve('dist/news/assets/css/fmb-news-reference-final.css'),'utf8');
const networkCss=await readFile(resolve('dist/news/assets/css/fmb-news-network-hardfix.css'),'utf8');

if (!home.includes('FMB Brief') || !home.includes('FMB Worldwide')) throw new Error('Homepage source is missing legacy product routes');
if (!brief.includes('FMB Brief')) throw new Error('FMB Daily Brief source route is invalid');
if (!world.includes('FMB Worldwide')) throw new Error('FMB Worldwide index is invalid');
if (!reader.includes('data-cms-article')) throw new Error('CMS article reader mount is missing');
if (!liveWorld.includes('data-cms-edition="worldwide"')) throw new Error('Live FMB Worldwide mount is missing');
if (!liveBrief.includes('data-cms-edition="brief"')) throw new Error('Live FMB Daily Brief mount is missing');
if (!cms.includes('news_articles') || !cms.includes('news_editions') || !cms.includes('news_edition_entries')) throw new Error('CMS client is not wired to expected newsroom tables');
if (!worker.includes("url.pathname === '/news'") || !worker.includes("url.pathname.startsWith('/news/')")) throw new Error('Cloudflare Worker is not enforcing /news boundary');
if (!wrangler.includes('www.francinemariebautista.com/news*') || !wrangler.includes('francinemariebautista.com/news*')) throw new Error('Cloudflare route configuration is missing canonical /news routes');

for (const signal of ['fmb-ref','class="product-wordmark"','class="shell home-hero"','The news that matters. Made clear for Filipinos.','/news/assets/css/fmb-news-reference.css','/news/assets/css/fmb-news-reference-final.css','/news/assets/css/fmb-news-network-hardfix.css','/news/assets/css/fmb-news-ticker-hardfix.css','/news/assets/css/fmb-news-product-identity.css','class="lead-grid"','class="brief-promo"','class="more-list"','Filipino Media Bulletin']) {
  if (!builtHome.includes(signal)) throw new Error(`Metallic FMB News regression: homepage missing ${signal}`);
}
const palette=['#210529','#5b1768','#a77ab0','#6b2875','#3b0b48','#1f0528'];
const normalized=metallicCss.toLowerCase();
if (!normalized.includes('linear-gradient(108deg') || !palette.every(c=>normalized.includes(c))) throw new Error('Approved metallic gradient is missing');
if (!networkCss.includes('FMB News network hard fix') || !networkCss.includes('.fmb-ref .world-hero') || !networkCss.includes('.fmb-ref .brief-archive-hero')) throw new Error('Metallic network stylesheet incomplete');

function assertNetworkPage(label,html,expected=[]){
  const req=['fmb-ref','class="headline-ticker"','class="product-wordmark"','class="nav"','footer-publication-title','Filipino Media Bulletin','/news/assets/css/fmb-news-reference-final.css','/news/assets/css/fmb-news-network-hardfix.css','/news/assets/css/fmb-news-ticker-hardfix.css','/news/assets/css/fmb-news-product-identity.css'];
  for(const signal of [...req,...expected]) if(!html.includes(signal)) throw new Error(`${label} regression: missing ${signal}`);
}

assertNetworkPage('FMB Worldwide landing',builtWorld,['FMB Worldwide','fmb-worldwide-route','aria-current="page">FMB Worldwide']);
assertNetworkPage('FMB Worldwide live',builtWorldLive,['data-cms-edition="worldwide"','FMB Worldwide','fmb-worldwide-route','aria-current="page">FMB Worldwide']);
assertNetworkPage('FMB Daily Brief archive',builtBrief,['FMB Daily Brief','fmb-daily-brief-route','aria-current="page">FMB Daily Brief']);
assertNetworkPage('FMB Daily Brief live',builtBriefLive,['data-cms-edition="brief"','FMB Daily Brief','fmb-daily-brief-route','aria-current="page">FMB Daily Brief']);
assertNetworkPage('About FMB News',builtAbout,['FMB News','aria-current="page">About']);
assertNetworkPage('CMS reader',builtReader,['FMB News','data-cms-article']);

const designArticlePath=resolve('dist/news/zambales-flood-control-damage-569-million-august-30-2026/index.html');
await access(designArticlePath);
const designArticle=await readFile(designArticlePath,'utf8');
for(const signal of ['class="article-grid"','class="article-figure"','class="related"','class="lens"','class="sources"','/news/assets/css/fmb-news-reference-final.css','/news/assets/css/fmb-news-network-hardfix.css','FMB News','Filipino Media Bulletin']) if(!designArticle.includes(signal)) throw new Error(`Article template missing ${signal}`);
if(designArticle.includes('[object Object]')) throw new Error('Article byline rendered invalid object text');

const worldEntries=await readdir(resolve('site/world'),{withFileTypes:true});
const worldEditions=worldEntries.filter(e=>e.isDirectory()&&/^[a-z]+-\d{1,2}-\d{4}$/i.test(e.name)).map(e=>e.name);
if(!worldEditions.length) throw new Error('No dated FMB Worldwide edition found');
for(const edition of worldEditions){await access(resolve('site/world',edition,'index.html'));const built=await readFile(resolve('dist/news/world',edition,'index.html'),'utf8');assertNetworkPage(`FMB Worldwide ${edition}`,built,['FMB Worldwide','fmb-worldwide-route','aria-current="page">FMB Worldwide']);}

const siteEntries=await readdir(resolve('site'),{withFileTypes:true});
const briefEditions=siteEntries.filter(e=>e.isDirectory()&&/^fmb-brief-.+/i.test(e.name)).map(e=>e.name);
if(!briefEditions.length) throw new Error('No dated FMB Daily Brief edition found');
for(const edition of briefEditions){await access(resolve('site',edition,'index.html'));const built=await readFile(resolve('dist/news',edition,'index.html'),'utf8');assertNetworkPage(`FMB Daily Brief ${edition}`,built,['FMB Daily Brief','fmb-daily-brief-route','aria-current="page">FMB Daily Brief']);}

const articleDays=(await readdir(resolve('content/news/articles'),{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>e.name);
if(!articleDays.length) throw new Error('Structured FMB News article archive is empty');

const forbidden=['FMB'+'-Ecosystem','apps/'+'withlovefmb/'];
const scanRoots=['README.md','.github','docs','scripts','public','site','src','wrangler.jsonc','package.json'];
async function scan(target){let info;try{info=await stat(target)}catch{return}if(info.isDirectory()){for(const e of await readdir(target))await scan(path.join(target,e));return}if(!/\.(?:md|mjs|js|jsonc?|html|css|yml|yaml|txt)$/i.test(target))return;const text=await readFile(target,'utf8');for(const needle of forbidden)if(text.includes(needle))throw new Error(`Standalone dependency violation: ${needle} found in ${path.relative(root,target)}`)}

let htmlPagesChecked=0;
async function scanBuiltAssets(target){const info=await stat(target);if(info.isDirectory()){for(const e of await readdir(target))await scanBuiltAssets(path.join(target,e));return}if(!/\.(?:html|css|js|mjs|json|xml|txt|svg)$/i.test(target))return;const text=await readFile(target,'utf8');if(/(?<!\/news)\/assets\//.test(text))throw new Error(`Unscoped root asset in ${path.relative(root,target)}`);if(target.endsWith('.html')){htmlPagesChecked++;for(const signal of ['fmb-ref','/news/assets/css/fmb-news-network-hardfix.css','/news/assets/css/fmb-news-ticker-hardfix.css','/news/assets/css/fmb-news-product-identity.css','footer-publication-title','Filipino Media Bulletin'])if(!text.includes(signal))throw new Error(`Global network identity missing ${signal} in ${path.relative(root,target)}`);}}
for(const rel of scanRoots)await scan(resolve(rel));
await scanBuiltAssets(resolve('dist/news'));
console.log(`FMBNews verification passed: ${htmlPagesChecked} pages locked to FMB News / FMB Daily Brief / FMB Worldwide with Filipino Media Bulletin footer; ${articleDays.length} article date folders, ${briefEditions.length} Daily Brief editions, ${worldEditions.length} Worldwide editions.`);
