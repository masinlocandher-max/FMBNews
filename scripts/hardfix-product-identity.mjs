import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');

async function walk(dir){const out=[];let entries=[];try{entries=await readdir(dir,{withFileTypes:true})}catch{return out}for(const e of entries){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile()&&e.name.endsWith('.html'))out.push(p)}return out}

function identity(rel){
  const p=rel.replaceAll('\\','/').toLowerCase();
  if(p.startsWith('world/')) return {title:'FMB Worldwide',cls:'fmb-worldwide-route',descriptor:'',active:'FMB Worldwide'};
  if(p.startsWith('explainer/')) return {title:'FMB Explained',cls:'fmb-explainer-route',descriptor:'',active:'FMB Explained'};
  if(p.startsWith('fmb-brief/')||/^fmb-brief-[^/]+\//.test(p)) return {title:'FMB Daily Brief',cls:'fmb-daily-brief-route',descriptor:'Daily Newsletter',active:'FMB Daily Brief'};
  if(p.startsWith('archive/')) return {title:'FMB News',cls:'fmb-news-route',descriptor:'',active:'FMB News'};
  if(p.startsWith('about/')) return {title:'FMB News',cls:'fmb-news-route',descriptor:'',active:'About'};
  if(p==='index.html') return {title:'FMB News',cls:'fmb-news-route',descriptor:'',active:''};
  return {title:'FMB News',cls:'fmb-news-route',descriptor:'',active:''};
}

function mastTitle(id){
  const rest=id.title.replace(/^FMB\s+/,'');
  const descriptor=id.descriptor?`<div class="product-descriptor">${id.descriptor}</div>`:'';
  return `<a class="product-wordmark" href="/news/" aria-label="${id.title}"><span class="product-fmb">FMB</span><span class="product-name">${rest}</span></a>${descriptor}`;
}

function applyBodyClass(html,cls){
  return html.replace(/<body\s+class="([^"]*)"/i,(_m,c)=>{const set=new Set(c.split(/\s+/).filter(Boolean));['fmb-news-route','fmb-daily-brief-route','fmb-worldwide-route','fmb-explainer-route','fmb-network-landing'].forEach(x=>set.delete(x));set.add(cls);return `<body class="${[...set].join(' ')}"`;});
}

function applyMast(html,id){
  return html.replace(/<header class="mast"><div class="shell">[\s\S]*?<\/div><\/header>/i,`<header class="mast"><div class="shell">${mastTitle(id)}</div></header>`);
}

function canonicalNav(active){
  const items=[['FMB News','/news/archive/'],['FMB Worldwide','/news/world/'],['FMB Explained','/news/explainer/'],['FMB Daily Brief','/news/fmb-brief/'],['About','/news/about/']];
  const links=items.map(([label,href])=>`<a href="${href}"${active===label?' aria-current="page"':''}>${label}</a>`).join('');
  return `<nav class="nav" aria-label="Filipino Media Bulletin"><div class="shell">${links}<a class="submit" href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit a Story</a><a class="search" href="/news/archive/" aria-label="Search FMB News"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg><span>Search</span></a></div></nav>`;
}

function applyNav(html,active){
  return html.replace(/<nav class="nav"[\s\S]*?<\/nav>/i,canonicalNav(active));
}

function canonicalFooter(){
  return `<footer class="footer"><div class="shell footer-grid"><div><div class="footer-publication-title">Filipino Media Bulletin</div><div class="footer-publication-kicker">Information with Purpose</div><p>Verified reporting, useful context, and clear explanations for Filipino readers.</p><a href="/news/about/"><strong>About Filipino Media Bulletin →</strong></a><div class="footer-socials" aria-label="Filipino Media Bulletin social links"><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a><a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X">×</a><a href="mailto:withlovefmb@gmail.com" aria-label="Email Filipino Media Bulletin">✉</a></div></div><div><h3>Publications</h3><a href="/news/archive/">FMB News</a><a href="/news/world/">FMB Worldwide</a><a href="/news/explainer/">FMB Explained</a><a href="/news/fmb-brief/">FMB Daily Brief</a></div><div><h3>Resources</h3><a href="/news/about/">About</a><a href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit a Story</a><a href="/news/about/#standards">Corrections Policy</a><a href="/privacy/">Privacy Policy</a></div></div><div class="shell footer-bottom">© 2026 Filipino Media Bulletin. All rights reserved.</div></footer>`;
}

function applyFooter(html){
  const approved=canonicalFooter();
  if(/<footer class="(?:footer|brief-footer|fnc-footer)"/i.test(html)) return html.replace(/<footer class="(?:footer|brief-footer|fnc-footer)"[\s\S]*?<\/footer>/i,approved);
  return html.replace('</body>',`${approved}</body>`);
}

function normalizeLegacyProductName(html){
  return html.replaceAll('FMB Brief','FMB Daily Brief').replaceAll('FMB Explainer','FMB Explained');
}

function ensureCss(html){return html.includes('/assets/css/fmb-news-product-identity.css')?html:html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-product-identity.css?v=20260831-product-lock"></head>')}

const pages=await walk(newsRoot);let changed=0;
for(const file of pages){const rel=path.relative(newsRoot,file);const id=identity(rel);let html=await readFile(file,'utf8');const before=html;html=ensureCss(html);html=normalizeLegacyProductName(html);html=applyBodyClass(html,id.cls);html=applyMast(html,id);html=applyNav(html,id.active);html=applyFooter(html);if(html!==before){await writeFile(file,html,'utf8');changed++}}
console.log(`Product identity hard fix applied to ${changed} pages: FMB News, FMB Worldwide, FMB Explained, FMB Daily Brief; Filipino Media Bulletin footer simplified with no duplicate subscription form.`);
