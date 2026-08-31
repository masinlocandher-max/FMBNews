import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');

async function walk(dir){const out=[];let entries=[];try{entries=await readdir(dir,{withFileTypes:true})}catch{return out}for(const e of entries){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile()&&e.name.endsWith('.html'))out.push(p)}return out}

function identity(rel){
  const p=rel.replaceAll('\\','/').toLowerCase();
  if(p.startsWith('world/')) return {title:'FMB Worldwide',cls:'fmb-worldwide-route'};
  if(p.startsWith('fmb-brief/')||/^fmb-brief-[^/]+\//.test(p)) return {title:'FMB Daily Brief',cls:'fmb-daily-brief-route'};
  return {title:'FMB News',cls:'fmb-news-route'};
}

function mastTitle(title){
  const rest=title.replace(/^FMB\s+/,'');
  return `<a class="product-wordmark" href="/news/" aria-label="${title}"><span class="product-fmb">FMB</span><span class="product-name">${rest}</span></a>`;
}

function applyBodyClass(html,cls){
  return html.replace(/<body\s+class="([^"]*)"/i,(_m,c)=>{const set=new Set(c.split(/\s+/).filter(Boolean));['fmb-news-route','fmb-daily-brief-route','fmb-worldwide-route'].forEach(x=>set.delete(x));set.add(cls);return `<body class="${[...set].join(' ')}"`;});
}

function applyMast(html,title){
  return html.replace(/<header class="mast"><div class="shell">[\s\S]*?<\/div><\/header>/i,`<header class="mast"><div class="shell">${mastTitle(title)}</div></header>`);
}

function applyNav(html){
  return html.replace(/>FMB Brief<\/a>/g,'>FMB Daily Brief</a>');
}

function applyFooter(html){
  const marker='<footer class="footer">';
  const start=html.indexOf(marker); if(start<0) return html;
  const end=html.indexOf('</footer>',start); if(end<0) return html;
  const current=html.slice(start,end+9);
  let next=current;
  next=next.replace(/<a class="brand-wordmark brand-wordmark-footer"[\s\S]*?<\/a><div class="brand-subtitle brand-subtitle-footer">[\s\S]*?<\/div>/i,'<div class="footer-publication-title">Filipino Media Bulletin</div><div class="footer-publication-kicker">FMB News Network</div>');
  next=next.replace(/>FMB Brief<\/a>/g,'>FMB Daily Brief</a>');
  next=next.replace(/© 2026 FMB News\. All rights reserved\./g,'© 2026 Filipino Media Bulletin. All rights reserved.');
  return html.slice(0,start)+next+html.slice(end+9);
}

function ensureCss(html){return html.includes('/assets/css/fmb-news-product-identity.css')?html:html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-product-identity.css?v=20260831-product-lock"></head>')}

const pages=await walk(newsRoot);let changed=0;
for(const file of pages){const rel=path.relative(newsRoot,file);const id=identity(rel);let html=await readFile(file,'utf8');const before=html;html=ensureCss(html);html=applyBodyClass(html,id.cls);html=applyMast(html,id.title);html=applyNav(html);html=applyFooter(html);if(html!==before){await writeFile(file,html,'utf8');changed++}}
console.log(`Product identity hard fix applied to ${changed} pages: FMB News, FMB Daily Brief, FMB Worldwide; footer locked to Filipino Media Bulletin.`);
