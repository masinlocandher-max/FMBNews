import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFile(path.join(root,rel),'utf8');
const must=(value,message)=>{if(!value)throw new Error(`Approved editorial design verification failed: ${message}`)};

for(const rel of [
  'docs/fmb-news-approved-editorial-design.md','CLAUDE.md','scripts/render-home-experience.mjs','scripts/apply-brand-system.mjs','scripts/hardfix-mobile-first-site.mjs',
  'public/assets/css/fmb-news-editorial-reference-v2.css','public/assets/css/fmb-news-mobile-navigation-lock.css','public/assets/js/fmb-news-mobile-global.js',
  'dist/news/index.html','dist/news/assets/css/fmb-news-editorial-reference-v2.css','dist/news/assets/css/fmb-news-mobile-navigation-lock.css','dist/news/assets/js/fmb-news-mobile-global.js'
])await access(path.join(root,rel));

const doc=await read('docs/fmb-news-approved-editorial-design.md');
const claude=await read('CLAUDE.md');
const renderer=await read('scripts/render-home-experience.mjs');
const brand=await read('scripts/apply-brand-system.mjs');
const mobilePass=await read('scripts/hardfix-mobile-first-site.mjs');
const desktop=await read('public/assets/css/fmb-news-editorial-reference-v2.css');
const mobile=await read('public/assets/css/fmb-news-mobile-navigation-lock.css');
const mobileJs=await read('public/assets/js/fmb-news-mobile-global.js');
const builtHome=await read('dist/news/index.html');

must(doc.includes('warm ivory editorial paper')&&doc.includes('fixed safe-area-aware dock'),'design contract no longer describes the approved desktop/mobile composition');
must(claude.includes('docs/fmb-news-approved-editorial-design.md'),'future-agent takeover notes no longer point to the approved design contract');

for(const token of ['--fmb-red:#D71920','--fmb-paper:#F5F3EF','--fmb-dark:#0A0A0A','.fmb-editorial-wordmark','.editorial-top-grid','.editorial-side-rail','.network-products','.founder-card','.daily-brief-signup'])must(desktop.includes(token),`desktop reference lost ${token}`);
for(const forbidden of ['#630661','#f2d17a'])must(!desktop.includes(forbidden),`desktop final authority contains superseded accent ${forbidden}`);

for(const token of ['--fmb-mobile-black:#0A0A0A','--fmb-mobile-red:#D71920','.fmb-editorial-mobile-dock','env(safe-area-inset-bottom)','fmb-editorial-mobile-lead-image','fmb-editorial-mobile-rail-item'])must(mobile.includes(token),`mobile final authority lost ${token}`);
for(const forbidden of ['#630661','#f2d17a'])must(!mobile.includes(forbidden),`mobile final authority contains superseded accent ${forbidden}`);

for(const token of ['fmb-editorial-wordmark','FMB NEWS<span class="dot">.</span>','data-fmb-editorial-lead','fmb-editorial-mobile-rail','publishedStories()'])must(renderer.includes(token),`Home renderer lost ${token}`);
must(renderer.includes('imageFor(lead)'),'mobile lead must use a real current published-story image');

must(brand.includes("assetVersion('css/fmb-news-editorial-reference-v2.css')"),'approved desktop reference is not content-hashed');
must(brand.includes('ensureEditorialReference'),'brand system no longer installs the approved desktop reference');
must(brand.indexOf('ensureHomeV2(html, relativePath)')<brand.indexOf('ensureEditorialReference(html, relativePath)'),'approved reference must remain the final Home design layer');

must(mobilePass.includes("'fmb-news-mobile-navigation-lock.css'"),'approved mobile authority is missing from the mobile bundle');
const orderBlock=mobilePass.slice(mobilePass.indexOf('const MOBILE_SYSTEM_SHEETS'),mobilePass.indexOf('const MOBILE_SYSTEM_FILE'));
must(orderBlock.lastIndexOf("'fmb-news-mobile-navigation-lock.css'")>orderBlock.lastIndexOf("'fmb-news-mobile-all-screens.css'"),'mobile navigation lock must stay last in the authored mobile cascade');

for(const token of ['fmb-editorial-mobile-dock','Home','World','Sports','Briefing','Menu','data-fmb-dock-menu'])must(mobileJs.includes(token),`approved mobile shell lost ${token}`);
must(!mobileJs.includes('fmb-approved-bottom-nav'),'retired bottom navigation returned alongside the approved dock');

must((builtHome.match(/class="fmb-editorial-wordmark"/g)||[]).length===1,'built Home must expose exactly one approved FMB NEWS. editorial wordmark');
must((builtHome.match(/class="fmb-editorial-mobile-dock"/g)||[]).length===0,'mobile dock must be generated once at runtime, not duplicated in static Home HTML');
must(/fmb-news-editorial-reference-v2\.css\?v=[0-9a-f]{10}\b/.test(builtHome),'built Home is not using a content-versioned approved editorial reference');

console.log('Approved editorial design contract passed: one warm-ivory/black/red desktop authority, one black/red safe-area mobile authority, real-story Home data, one runtime editorial dock, cache-safe assets, and future-agent instructions locked to the approved design.');
