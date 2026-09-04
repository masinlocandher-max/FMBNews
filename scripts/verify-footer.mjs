import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');

await access(path.join(newsRoot,'assets','css','fmb-news-footer.css'));
await access(path.join(newsRoot,'assets','images','brand','fmb-bulletin-emblem.svg'));

async function walk(dir){
  const out=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const target=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(target));
    else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(target);
  }
  return out;
}

const requiredLinks=[
  '/news/archive/',
  '/news/world/',
  '/news/explainer/',
  '/news/fact-check/',
  '/news/fmb-brief/',
  '/news/about/',
  '/news/search/',
  '/news/submit/',
  '/news/about/#standards',
];

const pages=await walk(newsRoot);let checked=0;
for(const file of pages){
  const rel=path.relative(newsRoot,file).replaceAll('\\','/');
  const html=await readFile(file,'utf8');
  checked++;
  const footers=html.match(/<footer\b[^>]*class=["'][^"']*fmb-news-footer[^"']*["'][^>]*>/gi)||[];
  if(footers.length!==1)throw new Error(`${rel}: expected exactly one consolidated FMB News footer, found ${footers.length}`);
  const start=html.indexOf('<footer');
  const end=html.indexOf('</footer>',start);
  if(start<0||end<0)throw new Error(`${rel}: footer markup is incomplete`);
  const footer=html.slice(start,end+9);
  if(!footer.includes('<div class="footer-publication-title">Filipino Media Bulletin</div>'))throw new Error(`${rel}: footer publication title missing`);
  if(!footer.includes('Information with Purpose'))throw new Error(`${rel}: footer publication kicker missing`);
  if(!footer.includes('/news/assets/images/brand/fmb-bulletin-emblem.svg'))throw new Error(`${rel}: footer emblem is not locally scoped`);
  if(!html.includes('/news/assets/css/fmb-news-footer.css'))throw new Error(`${rel}: footer stylesheet is missing`);
  for(const href of requiredLinks)if(!footer.includes(`href="${href}"`))throw new Error(`${rel}: footer missing ${href}`);
  if(footer.includes('facebook.com/')||footer.includes('x.com/'))throw new Error(`${rel}: footer contains generic social destination`);
  if(footer.includes('data-fmb-newsletter-form'))throw new Error(`${rel}: footer contains a redundant newsletter form`);
  if(/href=["']\/(?!news\/)/i.test(footer))throw new Error(`${rel}: footer leaks to a non-news first-party route`);
}

console.log(`Footer verification passed across ${checked} newsroom pages: one local FMB emblem, all five editorial products, newsroom-only utility links, and no ecosystem leakage, fake social links, or duplicate subscription form.`);
