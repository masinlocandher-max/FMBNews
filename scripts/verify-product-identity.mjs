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
  'public/assets/css/fmb-news-landing-hardfix.css',
  'dist/news/assets/css/fmb-news-landing-hardfix.css'
]) await access(resolve(rel));

const productCss=await readFile(resolve('dist/news/assets/css/fmb-news-product-identity.css'),'utf8');
const landingCss=await readFile(resolve('dist/news/assets/css/fmb-news-landing-hardfix.css'),'utf8');
const emblem=await readFile(resolve('dist/news/assets/images/brand/fmb-bulletin-emblem.svg'),'utf8');
if(!productCss.includes('Bodoni Moda')||!productCss.includes('Manrope'))throw new Error('FMB typography regression: approved editorial display or UI font missing');
if(!productCss.includes('--fmb-display')||!productCss.includes('--fmb-ui'))throw new Error('FMB typography regression: shared font variables missing');
if(!emblem.includes('<svg')||!emblem.includes('Filipino Media Bulletin emblem')||!emblem.includes('fill-rule="evenodd"'))throw new Error('Bulletin emblem asset is invalid');
for(const signal of ['--landing-burgundy','#c69a3b','.network-hero','.network-product-icon','.daily-brief-signup','.publication-footer'])if(!landingCss.includes(signal))throw new Error(`Landing visual-system regression: missing ${signal}`);
if(landingCss.includes('/news/news/assets/'))throw new Error('Landing asset is double-scoped');

async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile()&&e.name.endsWith('.html'))out.push(p)}return out}

function expected(rel){
  const p=rel.replaceAll('\\','/').toLowerCase();
  if(p==='index.html')return{title:'Filipino Media Bulletin',cls:'fmb-network-landing',kind:'landing'};
  if(p.startsWith('world/'))return{title:'FMB Worldwide',cls:'fmb-worldwide-route',kind:'world'};
  if(p.startsWith('explainer/'))return{title:'FMB Explained',cls:'fmb-explainer-route',kind:'explainer'};
  if(p.startsWith('fmb-brief/')||/^fmb-brief-[^/]+\//.test(p))return{title:'FMB Daily Brief',cls:'fmb-daily-brief-route',kind:'brief'};
  return{title:'FMB News',cls:'fmb-news-route',kind:'news'};
}

const pages=await walk(newsRoot);let checked=0;
for(const file of pages){
  const rel=path.relative(newsRoot,file);const exp=expected(rel);const html=await readFile(file,'utf8');checked++;
  if(!html.includes(exp.cls))throw new Error(`${rel}: missing ${exp.cls}`);
  if(!html.includes(`aria-label="${exp.title}"`))throw new Error(`${rel}: mast title is not exactly ${exp.title}`);
  if(html.includes('/news/news/assets/'))throw new Error(`${rel}: double-scoped asset path remains`);

  if(exp.kind==='landing'){
    if(!html.includes('class="publication-emblem"'))throw new Error(`${rel}: publication emblem missing`);
    if(!html.includes('/news/assets/images/brand/fmb-bulletin-emblem.svg'))throw new Error(`${rel}: publication emblem path missing`);
    if(!html.includes('class="publication-wordmark"'))throw new Error(`${rel}: publication wordmark missing`);
    if(!html.includes('Filipino Media Bulletin</strong>'))throw new Error(`${rel}: publication title is not exact`);
    if((html.match(/data-fmb-newsletter-form/g)||[]).length!==1)throw new Error(`${rel}: landing must contain exactly one Daily Brief email form`);
    for(const signal of ['Trusted News.','Meaningful Perspectives.','<h2>FMB News</h2>','<h2>FMB Worldwide</h2>','<h2>FMB Explained</h2>','<h2>FMB Daily Brief</h2>','Explore FMB News','Explore Worldwide','Open FMB Explained','Continue with Email']){
      if(!html.includes(signal))throw new Error(`${rel}: approved landing content missing ${signal}`);
    }
    for(const retired of ['One publication. Three focused products.','Clear reporting without the noise.','Verified first','Context included','Useful by design','Philippines · Explainers · Overviews','World · Explainers · Overviews','FMB Explainer']){
      if(html.includes(retired))throw new Error(`${rel}: retired landing copy remains: ${retired}`);
    }
  }
  if(exp.kind==='brief'){
    if(!html.includes('<span class="product-name">Daily Brief</span>'))throw new Error(`${rel}: Daily Brief title is not exact`);
    if(!html.includes('<div class="product-descriptor">Daily Newsletter</div>'))throw new Error(`${rel}: Daily Newsletter descriptor missing`);
  }
  if(exp.kind==='world'&&!html.includes('<span class="product-name">Worldwide</span>'))throw new Error(`${rel}: Worldwide title is not exact`);
  if(exp.kind==='explainer'&&!html.includes('<span class="product-name">Explained</span>'))throw new Error(`${rel}: Explained title is not exact`);
  if(exp.kind==='news'&&!html.includes('<span class="product-name">News</span>'))throw new Error(`${rel}: News title is not exact`);

  if(!html.includes('<div class="footer-publication-title">Filipino Media Bulletin</div>'))throw new Error(`${rel}: footer publication is not Filipino Media Bulletin`);
  if(html.includes('>FMB Brief</a>'))throw new Error(`${rel}: obsolete visible FMB Brief label remains`);
  if(html.includes('>FMB Explainer</a>'))throw new Error(`${rel}: obsolete visible FMB Explainer label remains`);
  if(!html.includes('/news/explainer/'))throw new Error(`${rel}: FMB Explained is missing from product navigation`);
  const footer=html.slice(html.indexOf('<footer class="footer'));
  if(footer.includes('data-fmb-newsletter-form'))throw new Error(`${rel}: footer contains redundant newsletter form`);
}
console.log(`Product identity verification passed across ${checked} pages: Filipino Media Bulletin with FMB News, FMB Worldwide, FMB Explained, FMB Daily Brief, and non-redundant footer.`);
