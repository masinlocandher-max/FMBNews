import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.join(root,'dist','news','archive','index.html');

try{
  await access(target);
}catch{
  console.log('FMB News mobile app hardfix skipped: /news/archive/ was not generated.');
  process.exit(0);
}

let html=await readFile(target,'utf8');

const headAssets=[
  '<link rel="manifest" href="/news/manifest.webmanifest">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="FMB News">',
  '<link rel="stylesheet" href="/assets/css/fmb-news-mobile-app.css?v=20260901-app-v1">',
  '<script src="/assets/js/fmb-news-mobile-app.js?v=20260901-app-v1" defer></script>'
];

for(const asset of headAssets){
  const marker=asset.match(/(?:href|src)="([^"]+)"/)?.[1]?.split('?')[0];
  if(marker && html.includes(marker)) continue;
  if(!marker && html.includes(asset)) continue;
  html=html.replace('</head>',`${asset}</head>`);
}

html=html.replace(/<meta name="theme-color" content="[^"]*">/i,'<meta name="theme-color" content="#2b1235">');
await writeFile(target,html,'utf8');
console.log('Applied dedicated native-feeling mobile app shell to /news/archive/.');
