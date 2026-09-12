import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const resolve=(...parts)=>path.join(root,...parts);

for(const rel of [
  'public/assets/images/brand/fmb-bulletin-emblem.svg',
  'dist/news/assets/images/brand/fmb-bulletin-emblem.svg',
  'public/assets/css/fmb-news-product-identity.css',
  'dist/news/assets/css/fmb-news-product-identity.css',
  'public/assets/css/fmb-news-publication-landing.css',
  'dist/news/assets/css/fmb-news-publication-landing.css',
  'public/assets/css/fmb-news-editorial-ia.css',
  'dist/news/assets/css/fmb-news-editorial-ia.css',
  'dist/news/sports/index.html',
])await access(resolve(rel));

const productCss=await readFile(resolve('dist/news/assets/css/fmb-news-product-identity.css'),'utf8');
const landingCss=await readFile(resolve('dist/news/assets/css/fmb-news-publication-landing.css'),'utf8');
const iaCss=await readFile(resolve('dist/news/assets/css/fmb-news-editorial-ia.css'),'utf8');
const emblem=await readFile(resolve('dist/news/assets/images/brand/fmb-bulletin-emblem.svg'),'utf8');

if(!productCss.includes('Bodoni Moda')||!productCss.includes('Manrope'))throw new Error('FMB typography regression: approved editorial display or UI font missing');
if(!productCss.includes('--fmb-display')||!productCss.includes('--fmb-ui'))throw new Error('FMB typography regression: shared font variables missing');
if(!emblem.includes('<svg')||!emblem.includes('Filipino Media Bulletin emblem')||!emblem.includes('fill-rule="evenodd"'))throw new Error('Bulletin emblem asset is invalid');
for(const signal of ['--landing-violet:#220D50','--landing-plum:#630661','--landing-peach:#F9AB60','.network-hero-art{display:none!important}','.network-products','.network-product:nth-child(4)','.daily-brief-signup','.publication-footer'])if(!landingCss.includes(signal))throw new Error(`Landing visual-system regression: missing ${signal}`);
for(const signal of ['.editorial-desks','.editorial-desk-grid','.publication-menu-panel','body.fmb-sports-page','.sports-empty','.sports-story-grid'])if(!iaCss.includes(signal))throw new Error(`Editorial IA stylesheet regression: missing ${signal}`);
if(landingCss.includes('--landing-burgundy')||landingCss.includes('#c69a3b'))throw new Error('Legacy burgundy/gold landing palette returned to the canonical publication stylesheet');
if(landingCss.includes('commons.wikimedia.org')||landingCss.includes('Special:Redirect'))throw new Error('Canonical publication landing must not depend on remote hero artwork');
if(landingCss.includes('/news/news/assets/')||iaCss.includes('/news/news/assets/'))throw new Error('Landing asset is double-scoped');

async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile()&&e.name.endsWith('.html'))out.push(p)}return out}
function expected(rel){const p=rel.replaceAll('\\','/').toLowerCase();if(p==='index.html')return{title:'Filipino Media Bulletin',cls:'fmb-network-landing',kind:'landing'};if(p.startsWith('world/'))return{title:'FMB Worldwide',cls:'fmb-worldwide-route',kind:'world'};if(p.startsWith('explainer/'))return{title:'FMB Explainer',cls:'fmb-explainer-route',kind:'explainer'};if(p.startsWith('fact-check/'))return{title:'FMB Fact Check',cls:'fmb-fact-check-route',kind:'factcheck'};if(p.startsWith('fmb-brief/')||/^fmb-brief-[^/]+\//.test(p))return{title:'FMB Daily Brief',cls:'fmb-daily-brief-route',kind:'brief'};return{title:'FMB News',cls:'fmb-news-route',kind:p.startsWith('sports/')?'sports':'news'}}

const pages=await walk(newsRoot);let checked=0;
for(const file of pages){
  const rel=path.relative(newsRoot,file);const exp=expected(rel);const html=await readFile(file,'utf8');checked++;
  if(!html.includes(exp.cls))throw new Error(`${rel}: missing ${exp.cls}`);
  if(!html.includes(`aria-label="${exp.title}"`))throw new Error(`${rel}: mast title is not exactly ${exp.title}`);
  if(html.includes('/news/news/assets/'))throw new Error(`${rel}: double-scoped asset path remains`);
  if(exp.kind==='landing'){
    for(const signal of [
      '/news/assets/css/fmb-news-publication-landing.css',
      '/news/assets/css/fmb-news-editorial-ia.css',
      'class="publication-emblem"',
      '/news/assets/images/brand/fmb-bulletin-emblem.svg',
      'class="publication-wordmark"',
      'Filipino Media Bulletin</strong>',
      'News. Worldwide. Sports.',
      'href="/news/sports/">Sports</a>',
      '<summary>Entertainment</summary>',
      'href="/news/horoscope/">Weekly Horoscope</a>',
      'href="/news/crossword/">FMB Crossword</a>',
      '<h2>FMB News</h2>',
      '<h2>FMB Worldwide</h2>',
      '<h2>FMB Explainer</h2>',
      '<h2>FMB Fact Check</h2>',
      '<h2>FMB Daily Brief</h2>',
      'Explore FMB News',
      'Explore Worldwide',
      'Open FMB Explainer',
      'Open Fact Check',
      'Get the Daily Brief',
    ])if(!html.includes(signal))throw new Error(`${rel}: editorial landing content missing ${signal}`);
    if(html.includes('fmb-news-landing-hardfix.css'))throw new Error(`${rel}: legacy landing hardfix is still referenced by the canonical homepage`);
    if(html.includes('Four editorial products')||html.includes('Four distinct editorial products'))throw new Error(`${rel}: obsolete four-product copy remains`);
    if((html.match(/class="network-product /g)||[]).length!==5)throw new Error(`${rel}: landing must expose exactly five editorial product cards`);
    if((html.match(/class="editorial-desk /g)||[]).length!==3)throw new Error(`${rel}: landing must expose exactly three editorial desks`);
    if((html.match(/data-fmb-newsletter-form/g)||[]).length!==1)throw new Error(`${rel}: landing must contain exactly one Daily Brief email form`);
  }
  if(exp.kind==='sports'){
    for(const signal of ['<h1 id="sports-title">Sports</h1>','FMB News · Editorial Desk','/news/assets/css/fmb-news-editorial-ia.css','No Sports report is published yet.'])if(!html.includes(signal))throw new Error(`${rel}: Sports desk contract missing ${signal}`);
    if(html.includes('class="sports-story"')&&!html.includes('SPORTS'))throw new Error(`${rel}: Sports story inventory is not labeled as Sports`);
  }
  if(exp.kind==='brief'){if(!html.includes('<span class="product-name">Daily Brief</span>'))throw new Error(`${rel}: Daily Brief title is not exact`);if(!html.includes('<div class="product-descriptor">Daily Newsletter</div>'))throw new Error(`${rel}: Daily Newsletter descriptor missing`)}
  if(exp.kind==='world'&&!html.includes('<span class="product-name">Worldwide</span>'))throw new Error(`${rel}: Worldwide title is not exact`);
  if(exp.kind==='explainer'&&!html.includes('<span class="product-name">Explainer</span>'))throw new Error(`${rel}: Explainer title is not exact`);
  if(exp.kind==='factcheck'&&!html.includes('FMB Fact Check'))throw new Error(`${rel}: Fact Check product identity is missing`);
  if((exp.kind==='news'||exp.kind==='sports')&&!html.includes('<span class="product-name">News</span>'))throw new Error(`${rel}: News title is not exact`);
  if(!html.includes('<div class="footer-publication-title">Filipino Media Bulletin</div>'))throw new Error(`${rel}: footer publication is not Filipino Media Bulletin`);
  if(html.includes('>FMB Brief</a>'))throw new Error(`${rel}: obsolete visible FMB Brief label remains`);
  if(html.includes('>FMB Explained</a>'))throw new Error(`${rel}: obsolete visible FMB Explained label remains`);
  if(!html.includes('/news/explainer/'))throw new Error(`${rel}: FMB Explainer is missing from product navigation`);
  if(!html.includes('/news/fact-check/'))throw new Error(`${rel}: FMB Fact Check is missing from product navigation`);
  const footer=html.slice(html.indexOf('<footer class="footer'));if(footer.includes('data-fmb-newsletter-form'))throw new Error(`${rel}: footer contains redundant newsletter form`);
}
console.log(`Product identity verification passed across ${checked} pages: News/Worldwide/Sports desk IA, canonical five-product Filipino Media Bulletin identity, Entertainment grouping, real Sports route, and non-redundant footer.`);
