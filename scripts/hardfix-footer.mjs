import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');

async function walk(dir){
  const out=[];let entries=[];
  try{entries=await readdir(dir,{withFileTypes:true})}catch{return out}
  for(const entry of entries){
    const target=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(target));
    else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(target);
  }
  return out;
}

function canonicalFooter(){
  return `<footer class="footer fmb-news-footer"><div class="shell footer-grid fmb-news-footer-grid"><div class="fmb-news-footer-brand"><a class="fmb-news-footer-lockup" href="/news/" aria-label="Filipino Media Bulletin"><img class="fmb-news-footer-emblem" src="/assets/images/brand/fmb-bulletin-emblem.svg" alt="" width="48" height="48" loading="lazy" decoding="async"><div><div class="footer-publication-title">Filipino Media Bulletin</div><div class="footer-publication-kicker">Information with Purpose</div></div></a><p class="fmb-news-footer-copy">Verified facts, visible sources, meaningful context, and clear explanations for Filipino readers.</p></div><nav aria-label="FMB publications"><h3>Publications</h3><a href="/news/archive/">FMB News</a><a href="/news/world/">FMB Worldwide</a><a href="/news/explainer/">FMB Explainer</a><a href="/news/fact-check/">FMB Fact Check</a><a href="/news/fmb-brief/">FMB Daily Brief</a></nav><nav aria-label="FMB newsroom resources"><h3>Newsroom</h3><a href="/news/about/">About</a><a href="/news/search/">Search</a><a href="/news/submit/">Submit a Story</a><a href="/news/about/#standards">Corrections</a><a href="mailto:withlovefmb@gmail.com?subject=FMB%20News%20Contact">Contact</a></nav></div><div class="shell footer-bottom"><span>© 2026 Filipino Media Bulletin. All rights reserved.</span><span>FMB News · Philippines</span></div></footer>`;
}

function ensureCss(html){
  if(html.includes('/assets/css/fmb-news-footer.css')||html.includes('/news/assets/css/fmb-news-footer.css'))return html;
  return html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-footer.css?v=20260904-footer-lock"></head>');
}

function replaceFooter(html){
  const approved=canonicalFooter();
  const stripped=html.replace(/<footer\b[\s\S]*?<\/footer>/gi,'');
  if(stripped.includes('</body>'))return stripped.replace('</body>',`${approved}</body>`);
  return `${stripped}${approved}`;
}

const pages=await walk(newsRoot);let changed=0;
for(const file of pages){
  let html=await readFile(file,'utf8');
  const before=html;
  html=ensureCss(replaceFooter(html));
  if(html!==before){await writeFile(file,html,'utf8');changed++}
}

console.log(`Unified FMB News footer across ${changed} pages: one Filipino Media Bulletin lockup, all five editorial products, newsroom-only utilities, no ecosystem destinations, no fake social links, and no duplicate footer forms.`);
