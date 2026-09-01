import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const targets=['search/index.html','submit/index.html'];

const mast='<header class="mast"><div class="shell"><a class="product-wordmark" href="/news/" aria-label="FMB News"><span class="product-fmb">FMB</span><span class="product-name">News</span></a></div></header>';
const nav='<nav class="nav" aria-label="Filipino Media Bulletin"><div class="shell"><a href="/news/archive/">FMB News</a><a href="/news/world/">FMB Worldwide</a><a href="/news/explainer/">FMB Explainer</a><a href="/news/fmb-brief/">FMB Daily Brief</a><a href="/news/about/">About</a><a class="submit" href="/news/submit/">Submit a Story</a><a class="search" href="/news/search/" aria-label="Search FMB News"><span>Search</span></a></div></nav>';
const footer='<footer class="footer"><div class="shell footer-grid"><div><div class="footer-publication-title">Filipino Media Bulletin</div><div class="footer-publication-kicker">Information with Purpose</div><p>Verified reporting, useful context, and clear explanations for Filipino readers.</p><a href="/news/about/"><strong>About Filipino Media Bulletin →</strong></a></div><div><h3>Publications</h3><a href="/news/archive/">FMB News</a><a href="/news/world/">FMB Worldwide</a><a href="/news/explainer/">FMB Explainer</a><a href="/news/fmb-brief/">FMB Daily Brief</a></div><div><h3>Resources</h3><a href="/news/about/">About</a><a href="/news/submit/">Submit a Story</a><a href="/news/about/#standards">Corrections Policy</a><a href="/privacy/">Privacy Policy</a></div></div><div class="shell footer-bottom">© 2026 Filipino Media Bulletin. All rights reserved.</div></footer>';

function ensureBodyClass(html){
  if(/<body\s+class="[^"]*fmb-news-route/i.test(html))return html;
  if(/<body\s+class="([^"]*)"/i.test(html))return html.replace(/<body\s+class="([^"]*)"/i,(_m,c)=>`<body class="${`${c} fmb-news-route`.trim()}"`);
  return html.replace(/<body(\s*>)/i,'<body class="fmb-news-route"$1');
}
function ensureIdentityCss(html){
  if(html.includes('/assets/css/fmb-news-product-identity.css'))return html;
  return html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-product-identity.css?v=20260831-product-lock"></head>');
}
function ensureShell(html){
  if(!html.includes('aria-label="FMB News"'))html=html.replace(/<main\b/i,`${mast}${nav}<main`);
  if(!html.includes('<div class="footer-publication-title">Filipino Media Bulletin</div>'))html=html.replace('</body>',`${footer}</body>`);
  return html;
}

let changed=0;
for(const rel of targets){
  const file=path.join(newsRoot,rel);
  try{await access(file)}catch{continue}
  let html=await readFile(file,'utf8');
  const before=html;
  html=ensureIdentityCss(ensureBodyClass(html));
  html=ensureShell(html);
  if(html!==before){await writeFile(file,html,'utf8');changed++}
}
console.log(`Late newsroom shell applied to ${changed} utility pages: FMB News identity, product navigation, and Filipino Media Bulletin footer.`);
