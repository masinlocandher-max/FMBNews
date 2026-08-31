import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');

async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile()&&e.name.endsWith('.html'))out.push(p)}return out}

function expected(rel){
  const p=rel.replaceAll('\\','/').toLowerCase();
  if(p==='index.html')return{title:'Filipino Media Bulletin',cls:'fmb-network-landing',kind:'landing'};
  if(p.startsWith('world/'))return{title:'FMB Worldwide',cls:'fmb-worldwide-route',kind:'world'};
  if(p.startsWith('fmb-brief/')||/^fmb-brief-[^/]+\//.test(p))return{title:'FMB Daily Brief',cls:'fmb-daily-brief-route',kind:'brief'};
  return{title:'FMB News',cls:'fmb-news-route',kind:'news'};
}

const pages=await walk(newsRoot);let checked=0;
for(const file of pages){
  const rel=path.relative(newsRoot,file);const exp=expected(rel);const html=await readFile(file,'utf8');checked++;
  if(!html.includes(exp.cls))throw new Error(`${rel}: missing ${exp.cls}`);
  if(!html.includes(`aria-label="${exp.title}"`))throw new Error(`${rel}: mast title is not exactly ${exp.title}`);

  if(exp.kind==='landing'){
    if(!html.includes('class="publication-wordmark"'))throw new Error(`${rel}: publication wordmark missing`);
    if(!html.includes('>Filipino Media Bulletin</a>'))throw new Error(`${rel}: publication title is not exact`);
    if((html.match(/data-fmb-newsletter-form/g)||[]).length!==1)throw new Error(`${rel}: landing must contain exactly one Daily Brief subscription form`);
  }
  if(exp.kind==='brief'){
    if(!html.includes('<span class="product-name">Daily Brief</span>'))throw new Error(`${rel}: Daily Brief title is not exact`);
    if(!html.includes('<div class="product-descriptor">Daily Newsletter</div>'))throw new Error(`${rel}: Daily Newsletter descriptor missing`);
  }
  if(exp.kind==='world'&&!html.includes('<span class="product-name">Worldwide</span>'))throw new Error(`${rel}: Worldwide title is not exact`);
  if(exp.kind==='news'&&!html.includes('<span class="product-name">News</span>'))throw new Error(`${rel}: News title is not exact`);

  if(!html.includes('<div class="footer-publication-title">Filipino Media Bulletin</div>'))throw new Error(`${rel}: footer publication is not Filipino Media Bulletin`);
  if(html.includes('>FMB Brief</a>'))throw new Error(`${rel}: obsolete visible FMB Brief label remains`);
  const footer=html.slice(html.indexOf('<footer class="footer">'));
  if(footer.includes('data-fmb-newsletter-form'))throw new Error(`${rel}: footer contains redundant newsletter form`);
}
console.log(`Product identity verification passed across ${checked} pages: Filipino Media Bulletin landing, FMB News, FMB Worldwide, FMB Daily Brief (Daily Newsletter), and simplified Filipino Media Bulletin footer.`);
