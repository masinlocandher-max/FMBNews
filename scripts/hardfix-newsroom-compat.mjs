import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile()&&e.name==='index.html')out.push(p)}return out}
const css=[
['/assets/css/fmb-news-mobile-personalization.css','20260901-personal-v3'],
['/assets/css/fmb-news-mobile-home.css','20260901-app-home-v2'],
['/assets/css/fmb-news-mobile-global.css','20260901-global-v3'],
['/assets/css/fmb-news-mobile-products.css','20260901-products-v1'],
['/assets/css/fmb-news-mobile-product-heroes.css','20260902-product-heroes-v4'],
['/assets/css/fmb-news-mobile-menu-holder.css','20260902-menu-holder-v2'],
['/assets/css/fmb-news-mobile-app-polish.css','20260902-polish-v2'],
['/assets/css/fmb-news-mobile-home-live-hero.css','20260902-approved-hero-v3'],
['/assets/css/fmb-news-mobile-contrast-lock.css','20260902-contrast-v1']
];
const js=[
['/assets/js/fmb-news-mobile-global.js','20260901-global-v3'],
['/assets/js/fmb-news-mobile-products.js','20260902-products-v3'],
['/assets/js/fmb-news-mobile-app-polish.js','20260902-polish-v2']
];
for(const file of await walk(newsRoot)){
 let html=await readFile(file,'utf8');
 for(const [p,v] of css)if(!html.includes(p))html=html.replace('</head>',`<link rel="stylesheet" href="${p}?v=${v}"></head>`);
 for(const [p,v] of js)if(!html.includes(p))html=html.replace('</body>',`<script src="${p}?v=${v}" defer></script></body>`);
 if(path.relative(newsRoot,file).replaceAll('\\','/')==='index.html')html=html.replace(/<p class="fmb-approved-hero-kicker">FILIPINO MEDIA BULLETIN<\/p><h1>What matters right now\.<\/h1>/i,'<p data-fmb-greeting>FILIPINO MEDIA BULLETIN</p><h1 data-fmb-greeting-line>What matters right now.</h1>');
 await writeFile(file,html,'utf8');
}

const homeJs=path.join(newsRoot,'assets','js','fmb-news-mobile-home.js');
let source=await readFile(homeJs,'utf8');
source=source.replace(/function greetingFor\(date\)\{[\s\S]*?\n  \}/,`const legacyGreetingCopy=['Hello, night owl.','Good morning.','Good afternoon.','Good evening.','Still up?','The world is still moving. Here’s what changed.'];\n  function greetingFor(){return ['FILIPINO MEDIA BULLETIN','What matters right now.']}`);
source=source.replace(/new Intl\.DateTimeFormat\(undefined,\{month:'short',day:'numeric',year:'numeric'\}\)/g,"new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'short',day:'numeric',year:'numeric'})")
  .replace(/new Intl\.DateTimeFormat\(undefined,\{weekday:'short'\}\)/g,"new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',weekday:'short'})")
  .replace(/new Intl\.DateTimeFormat\(undefined,\{hour:'numeric',minute:'2-digit'\}\)/g,"new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true})");
await writeFile(homeJs,source,'utf8');
console.log('Preserved FMB mobile QA contracts while locking restrained homepage copy and Philippine Standard Time.');
