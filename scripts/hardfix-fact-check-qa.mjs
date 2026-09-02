import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const factRoot=path.join(newsRoot,'fact-check');
const cssPath=path.join(newsRoot,'assets','css','fmb-fact-check.css');
const imageRoot=path.join(newsRoot,'assets','images','fact-check');

const ratingVisuals={
  true:{label:'TRUE',color:'#2fb344',shape:'<circle cx="32" cy="32" r="25"/><path d="m19 32 9 9 18-20"/>'},
  fact:{label:'VERIFIED FACT',color:'#1677c8',shape:'<path d="M32 6 52 15v14c0 14-8 23-20 29C20 52 12 43 12 29V15z"/><path d="m21 32 8 8 15-17"/>'},
  misleading:{label:'MISLEADING',color:'#ef9d00',shape:'<path d="M32 7 57 54H7z"/><path d="M32 20v18"/><circle cx="32" cy="46" r="2"/>'},
  false:{label:'FALSE',color:'#df2f2f',shape:'<circle cx="32" cy="32" r="25"/><path d="m22 22 20 20M42 22 22 42"/>'}
};

function svgFor({label,color,shape}){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="t d"><title id="t">FMB Fact Check: ${label}</title><desc id="d">Filipino Media Bulletin fact-check rating visual.</desc><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fafc"/><stop offset="1" stop-color="#edf1f5"/></linearGradient></defs><rect width="1200" height="675" fill="url(#bg)"/><g transform="translate(425 132) scale(5.5)" fill="${color}" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${shape}</g><text x="600" y="545" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="58" font-weight="800" letter-spacing="3" fill="${color}">${label}</text><text x="600" y="602" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="700" letter-spacing="5" fill="#4b4f56">FMB FACT CHECK</text></svg>`;
}

await mkdir(imageRoot,{recursive:true});
for(const [key,meta] of Object.entries(ratingVisuals))await writeFile(path.join(imageRoot,`${key}.svg`),svgFor(meta),'utf8');

async function walk(dir){
  const out=[];let entries=[];
  try{entries=await readdir(dir,{withFileTypes:true})}catch{return out}
  for(const e of entries){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile()&&e.name==='index.html')out.push(p)}
  return out;
}

const sharedCss=['fmb-news-mobile-global.css','fmb-news-mobile-products.css','fmb-news-mobile-menu-holder.css','fmb-news-mobile-app-polish.css'];
const sharedJs=['fmb-news-mobile-global.js','fmb-news-mobile-products.js'];
let normalized=0;
for(const file of await walk(factRoot)){
  let html=await readFile(file,'utf8');
  const rel=path.relative(factRoot,file).replaceAll('\\','/');

  // Remove hand-added shared mobile assets so the final newsroom compatibility
  // pass can inject the canonical versioned CSS/JS used by every other surface.
  for(const name of sharedCss)html=html.replace(new RegExp(`<link\\b[^>]*href=["'][^"']*${name}[^"']*["'][^>]*>`,`gi`),'');
  for(const name of sharedJs)html=html.replace(new RegExp(`<script\\b[^>]*src=["'][^"']*${name}[^"']*["'][^>]*><\\/script>`,`gi`),'');

  if(!/aria-label=["']FMB Fact Check["']/i.test(html)){
    html=html.replace(/<a class="brand" href="\/news\/">/i,'<a class="brand" href="/news/" aria-label="FMB Fact Check">');
  }
  if(!html.includes('footer-publication-title')){
    html=html.replace(/<footer class="footer"><div class="shell footer-bottom">/i,'<footer class="footer"><div class="shell"><div class="footer-publication-title">Filipino Media Bulletin</div><p>Information with Purpose.</p></div><div class="shell footer-bottom">');
  }

  html=html.replace(/This list identifies the records relevant to the claim\. FMB Fact Check does not reproduce or link the source publication used to identify the research lead\./gi,'This list identifies the records relevant to the claim. FMB Fact Check evaluates the claim against the relevant records and evidence available for editorial review.');

  if(rel==='index.html'){
    html=html.replace(/<meta property="og:type" content="article">/i,'<meta property="og:type" content="website">');
  }else{
    const hit=html.match(/fc-badge fc-(true|fact|misleading|false) is-large/i);
    const kind=hit?.[1]||'false';
    const meta=ratingVisuals[kind];
    const imagePath=`/assets/images/fact-check/${kind}.svg`;
    const imageUrl=`https://www.francinemariebautista.com/news${imagePath}`;
    if(!/<meta\b[^>]*property=["']og:image["']/i.test(html)){
      html=html.replace(/(<meta property="og:url" content="[^"]*">)/i,`$1<meta property="og:image" content="${imageUrl}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${imageUrl}">`);
    }
    if(!html.includes('article-hero-image')){
      const figure=`<figure class="article-hero-image"><img src="${imagePath}" alt="FMB Fact Check ${meta.label} rating"><figcaption>FMB Fact Check rating: ${meta.label}.</figcaption></figure>`;
      html=html.replace(/(<div class="fc-claim">[\s\S]*?<\/div>)/i,`$1${figure}`);
    }
  }

  await writeFile(file,html,'utf8');normalized++;
}

let css='';try{css=await readFile(cssPath,'utf8')}catch{}
if(!css.includes('.article-hero-image{')){
  css+=`\n.article-hero-image{margin:26px 0 8px;border-radius:20px;overflow:hidden;background:#f4f6f8;border:1px solid #e4e6e9}.article-hero-image img{display:block;width:100%;height:auto}.article-hero-image figcaption{padding:10px 14px;color:#777b82;font-size:12px;line-height:1.45}\n`;
  await writeFile(cssPath,css,'utf8');
}

console.log(`Normalized ${normalized} FMB Fact Check pages for newsroom QA, imagery, mobile compatibility, and source-independent public presentation.`);
