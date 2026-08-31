import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const resolve=(...parts)=>path.join(root,...parts);

const required=[
  'site/index.html','site/fmb-brief/index.html','site/fmb-brief/live/index.html','site/world/index.html','site/world/live/index.html','site/read/index.html',
  'public/assets/css/fmb-news-reference.css','public/assets/css/fmb-news-reference-final.css','public/assets/css/fmb-news-network-hardfix.css','public/assets/css/fmb-news-ticker-hardfix.css','public/assets/css/fmb-news-product-identity.css','public/assets/css/fmb-news-landing-hardfix.css',
  'public/assets/images/brand/fmb-bulletin-emblem.svg','public/assets/js/fmb-news-cms.js','content/news/articles',
  'scripts/render-metallic-reference.mjs','scripts/hardfix-metallic-network.mjs','scripts/hardfix-ticker.mjs','scripts/hardfix-product-identity.mjs','scripts/hardfix-publication-landing.mjs',
  'src/worker.js','wrangler.jsonc',
  'dist/news/index.html','dist/news/archive/index.html','dist/news/world/index.html','dist/news/world/live/index.html','dist/news/fmb-brief/index.html','dist/news/fmb-brief/live/index.html','dist/news/about/index.html','dist/news/read/index.html',
  'dist/news/assets/css/fmb-news-reference-final.css','dist/news/assets/css/fmb-news-network-hardfix.css','dist/news/assets/css/fmb-news-ticker-hardfix.css','dist/news/assets/css/fmb-news-product-identity.css','dist/news/assets/css/fmb-news-landing-hardfix.css','dist/news/assets/images/brand/fmb-bulletin-emblem.svg'
];
for(const rel of required) await access(resolve(rel));

try{await access(resolve('vercel.json'));throw new Error('FMBNews must not contain a Vercel deployment configuration')}catch(error){if(error?.code!=='ENOENT'&&/must not contain/.test(error?.message||''))throw error}

const worker=await readFile(resolve('src/worker.js'),'utf8');
const wrangler=await readFile(resolve('wrangler.jsonc'),'utf8');
const cms=await readFile(resolve('public/assets/js/fmb-news-cms.js'),'utf8');
if(!worker.includes("url.pathname === '/news'")||!worker.includes("url.pathname.startsWith('/news/')"))throw new Error('Cloudflare Worker is not enforcing the /news path boundary');
if(!wrangler.includes('www.francinemariebautista.com/news*')||!wrangler.includes('francinemariebautista.com/news*'))throw new Error('Cloudflare routes are missing canonical /news boundaries');
if(!cms.includes('news_articles')||!cms.includes('news_editions')||!cms.includes('news_edition_entries'))throw new Error('CMS client is not wired to expected newsroom tables');

const metallicCss=(await readFile(resolve('dist/news/assets/css/fmb-news-reference-final.css'),'utf8')).toLowerCase();
for(const color of ['#210529','#5b1768','#a77ab0','#6b2875','#3b0b48','#1f0528'])if(!metallicCss.includes(color))throw new Error(`Approved metallic palette missing ${color}`);
if(!metallicCss.includes('linear-gradient(108deg'))throw new Error('Approved metallic gradient is missing');

const builtHome=await readFile(resolve('dist/news/index.html'),'utf8');
for(const signal of [
  '<title>Filipino Media Bulletin | Trusted News. Meaningful Perspectives.</title>',
  'fmb-network-landing','class="publication-emblem"','/news/assets/images/brand/fmb-bulletin-emblem.svg','class="publication-wordmark"','aria-label="Filipino Media Bulletin"',
  'class="network-hero"','Trusted News.','Meaningful Perspectives.','class="network-products"','<h2>FMB News</h2>','<h2>FMB Worldwide</h2>','<h2>FMB Daily Brief</h2>',
  'Philippine news, explained.','The world, made relevant.','Explore FMB News','Explore FMB Worldwide','Subscribe Now','id="fmb-daily-brief-signup"','Subscribe to our daily newsletter',
  '/news/assets/css/fmb-news-landing-hardfix.css','<div class="footer-publication-title">Filipino Media Bulletin</div>'
]) if(!builtHome.includes(signal))throw new Error(`Approved Filipino Media Bulletin landing regression: missing ${signal}`);
for(const obsolete of ['class="shell home-hero"','class="lead-grid"','class="brief-promo"','class="network-intro"','One publication. Three focused products.','Clear reporting without the noise.','Verified first','Context included','Useful by design','Philippines · Explainers · Overviews','World · Explainers · Overviews'])if(builtHome.includes(obsolete))throw new Error(`Retired landing block or copy returned: ${obsolete}`);
const landingForms=(builtHome.match(/data-fmb-newsletter-form/g)||[]).length;
if(landingForms!==1)throw new Error(`Landing page must contain exactly one Daily Brief subscription form; found ${landingForms}`);
const footerStart=builtHome.indexOf('<footer class="footer');
if(footerStart<0)throw new Error('Landing footer missing');
if(builtHome.slice(footerStart).includes('data-fmb-newsletter-form'))throw new Error('Landing footer duplicates the Daily Brief subscription form');
if(builtHome.includes('/news/news/assets/'))throw new Error('Landing contains double-scoped asset path');

function assertCommon(label,html,expected=[]){
  const common=['fmb-ref','class="headline-ticker"','<div class="footer-publication-title">Filipino Media Bulletin</div>','/news/assets/css/fmb-news-reference-final.css','/news/assets/css/fmb-news-network-hardfix.css','/news/assets/css/fmb-news-ticker-hardfix.css','/news/assets/css/fmb-news-product-identity.css'];
  for(const signal of [...common,...expected])if(!html.includes(signal))throw new Error(`${label} regression: missing ${signal}`);
  if(html.includes('>FMB Brief</a>'))throw new Error(`${label} still exposes obsolete FMB Brief label`);
  const footerIndex=html.indexOf('<footer class="footer');
  if(footerIndex>=0&&html.slice(footerIndex).includes('data-fmb-newsletter-form'))throw new Error(`${label} footer contains redundant newsletter subscription form`);
  if(html.includes('/news/news/assets/'))throw new Error(`${label} contains double-scoped asset path`);
}

const builtArchive=await readFile(resolve('dist/news/archive/index.html'),'utf8');
const builtWorld=await readFile(resolve('dist/news/world/index.html'),'utf8');
const builtWorldLive=await readFile(resolve('dist/news/world/live/index.html'),'utf8');
const builtBrief=await readFile(resolve('dist/news/fmb-brief/index.html'),'utf8');
const builtBriefLive=await readFile(resolve('dist/news/fmb-brief/live/index.html'),'utf8');
const builtAbout=await readFile(resolve('dist/news/about/index.html'),'utf8');
const builtReader=await readFile(resolve('dist/news/read/index.html'),'utf8');
assertCommon('FMB News archive',builtArchive,['aria-label="FMB News"','fmb-news-route','aria-current="page">FMB News']);
assertCommon('FMB Worldwide landing',builtWorld,['aria-label="FMB Worldwide"','fmb-worldwide-route','aria-current="page">FMB Worldwide']);
assertCommon('FMB Worldwide live',builtWorldLive,['data-cms-edition="worldwide"','aria-label="FMB Worldwide"','fmb-worldwide-route']);
assertCommon('FMB Daily Brief archive',builtBrief,['aria-label="FMB Daily Brief"','fmb-daily-brief-route','<div class="product-descriptor">Daily Newsletter</div>','aria-current="page">FMB Daily Brief']);
assertCommon('FMB Daily Brief live',builtBriefLive,['data-cms-edition="brief"','aria-label="FMB Daily Brief"','fmb-daily-brief-route','Daily Newsletter']);
assertCommon('About',builtAbout,['aria-current="page">About']);
assertCommon('CMS reader',builtReader,['data-cms-article','aria-label="FMB News"']);

const designArticlePath=resolve('dist/news/zambales-flood-control-damage-569-million-august-30-2026/index.html');
await access(designArticlePath);
const article=await readFile(designArticlePath,'utf8');
assertCommon('FMB News article',article,['class="article-grid"','class="article-figure"','class="related"','class="lens"','class="sources"','aria-label="FMB News"']);
if(article.includes('[object Object]'))throw new Error('Article byline rendered invalid object text');

const worldEntries=await readdir(resolve('site/world'),{withFileTypes:true});
const worldEditions=worldEntries.filter(e=>e.isDirectory()&&/^[a-z]+-\d{1,2}-\d{4}$/i.test(e.name)).map(e=>e.name);
if(!worldEditions.length)throw new Error('No dated FMB Worldwide edition found');
for(const edition of worldEditions){const built=await readFile(resolve('dist/news/world',edition,'index.html'),'utf8');assertCommon(`FMB Worldwide ${edition}`,built,['aria-label="FMB Worldwide"','fmb-worldwide-route']);}

const siteEntries=await readdir(resolve('site'),{withFileTypes:true});
const briefEditions=siteEntries.filter(e=>e.isDirectory()&&/^fmb-brief-.+/i.test(e.name)).map(e=>e.name);
if(!briefEditions.length)throw new Error('No dated FMB Daily Brief edition found');
for(const edition of briefEditions){const built=await readFile(resolve('dist/news',edition,'index.html'),'utf8');assertCommon(`FMB Daily Brief ${edition}`,built,['aria-label="FMB Daily Brief"','fmb-daily-brief-route','Daily Newsletter']);}

const articleDays=(await readdir(resolve('content/news/articles'),{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>e.name);
if(!articleDays.length)throw new Error('Structured FMB News article archive is empty');

const forbidden=['FMB'+'-Ecosystem','apps/'+'withlovefmb/'];
const scanRoots=['README.md','.github','docs','scripts','public','site','src','wrangler.jsonc','package.json'];
async function scanSource(target){let info;try{info=await stat(target)}catch{return}if(info.isDirectory()){for(const e of await readdir(target))await scanSource(path.join(target,e));return}if(!/\.(?:md|mjs|js|jsonc?|html|css|yml|yaml|txt)$/i.test(target))return;const text=await readFile(target,'utf8');for(const needle of forbidden)if(text.includes(needle))throw new Error(`Standalone dependency violation: ${needle} in ${path.relative(root,target)}`)}

let htmlPagesChecked=0;
async function scanBuilt(target){const info=await stat(target);if(info.isDirectory()){for(const e of await readdir(target))await scanBuilt(path.join(target,e));return}if(!/\.(?:html|css|js|mjs|json|xml|txt|svg)$/i.test(target))return;const text=await readFile(target,'utf8');if(/(?<!\/news)\/assets\//.test(text))throw new Error(`Unscoped root asset in ${path.relative(root,target)}`);if(text.includes('/news/news/assets/'))throw new Error(`Double-scoped asset in ${path.relative(root,target)}`);if(target.endsWith('.html')){htmlPagesChecked++;for(const signal of ['fmb-ref','/news/assets/css/fmb-news-network-hardfix.css','/news/assets/css/fmb-news-ticker-hardfix.css','<div class="footer-publication-title">Filipino Media Bulletin</div>'])if(!text.includes(signal))throw new Error(`Global network identity missing ${signal} in ${path.relative(root,target)}`);}}
for(const rel of scanRoots)await scanSource(resolve(rel));
await scanBuilt(resolve('dist/news'));

console.log(`FMBNews verification passed: approved Build Web Apps landing is locked; ${htmlPagesChecked} pages retain shared network chrome; ${articleDays.length} article date folders, ${briefEditions.length} Daily Brief editions, ${worldEditions.length} Worldwide editions.`);
