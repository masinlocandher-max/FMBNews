import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist','news');
const required=async relative=>readFile(path.join(dist,relative),'utf8');

const manifest=JSON.parse(await required('manifest.webmanifest'));
if(manifest.id!=='/news/')throw new Error('PWA manifest id must be /news/.');
if(manifest.scope!=='/news/')throw new Error('PWA scope must be /news/.');
if(!String(manifest.start_url||'').startsWith('/news/'))throw new Error('PWA start_url must stay inside /news/.');
if(manifest.display!=='standalone')throw new Error('PWA display must be standalone.');
if(!Array.isArray(manifest.icons)||manifest.icons.length<2)throw new Error('PWA manifest needs app icons.');
if(!manifest.icons.some(icon=>String(icon.sizes).includes('192x192')))throw new Error('PWA manifest needs a 192x192 icon declaration.');
if(!manifest.icons.some(icon=>String(icon.sizes).includes('512x512')))throw new Error('PWA manifest needs a 512x512 icon declaration.');

const home=await required('index.html');
if(!home.includes('/news/manifest.webmanifest'))throw new Error('FMB News home is missing the manifest link.');
if(!home.includes('apple-touch-icon'))throw new Error('FMB News home is missing apple-touch-icon metadata.');
if(!home.includes('/assets/js/fmb-news-pwa.js'))throw new Error('FMB News home is missing the PWA runtime.');

const worker=await required('sw.js');
for(const needle of ['self.addEventListener(\'fetch\'','/news/offline/','self.addEventListener(\'push\''])if(!worker.includes(needle))throw new Error(`Service worker missing ${needle}`);

const offline=await required('offline/index.html');
if(!offline.includes('You’re offline.'))throw new Error('Offline fallback page is incomplete.');

const runtime=await required('assets/js/fmb-news-pwa.js');
for(const needle of ['beforeinstallprompt','navigator.serviceWorker.register','Add to Home Screen','display-mode: standalone'])if(!runtime.includes(needle))throw new Error(`PWA runtime missing ${needle}`);

console.log('FMB News PWA installability, standalone mode, iOS home-screen metadata, service worker and offline fallback verified.');
