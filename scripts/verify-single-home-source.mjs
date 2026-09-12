import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFile(path.join(root,rel),'utf8');
const must=(value,message)=>{if(!value)throw new Error(`Single-home-source verification failed: ${message}`)};

for(const rel of ['scripts/build.mjs','scripts/render-news-routes.mjs','scripts/render-home-experience.mjs','dist/news/index.html','dist/news/archive/index.html'])await access(path.join(root,rel));

const build=await read('scripts/build.mjs');
const routes=await read('scripts/render-news-routes.mjs');
const homeRenderer=await read('scripts/render-home-experience.mjs');
const home=await read('dist/news/index.html');
const archive=await read('dist/news/archive/index.html');

must(build.includes("await import('./render-news-routes.mjs')"),'build does not use the focused archive/article renderer');
must(build.includes("await import('./render-home-experience.mjs')"),'build does not invoke the canonical homepage renderer');
must(!build.includes('render-metallic-reference.mjs'),'legacy all-in-one renderer returned to the build pipeline');
must(build.indexOf("render-news-routes.mjs")<build.indexOf("render-home-experience.mjs"),'route renderer must run before the canonical homepage renderer');

for(const token of ['async function article','async function archive','/news/archive/','structured article routes'])must(routes.includes(token),`focused route renderer missing ${token}`);
for(const banned of ['async function home(','writeRoute(\'/news/\'','heroPhoto=','heroSource=','briefPhoto='])must(!routes.includes(banned),`focused route renderer contains homepage-only code: ${banned}`);

for(const token of ['applyDesktopPublicationLanding','renderMobileHome','News. Worldwide. Sports.','data-fmb-mobile-home'])must(homeRenderer.includes(token),`canonical homepage renderer missing ${token}`);
for(const token of ['fmb-network-landing','News. Worldwide. Sports.','data-fmb-mobile-home','/news/sports/'])must(home.includes(token),`built canonical homepage missing ${token}`);
for(const token of ['fmb-news-route','Archive','/news/'])must(archive.includes(token),`archive route regression after renderer split: missing ${token}`);

console.log('Single-home-source verification passed: archive/articles render independently and /news/ is owned by the canonical home renderer only.');
