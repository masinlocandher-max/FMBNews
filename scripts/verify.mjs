import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'site/index.html',
  'site/world/index.html',
  'site/world/august-29-2026/index.html',
  'site/world/august-30-2026/index.html',
  'public/assets/css/fmb-news-final.css',
  'public/assets/js/fmb-news-approved.js',
  'content/news/articles'
];
for (const rel of required) await access(path.join(root, rel));
const home = await readFile(path.join(root, 'site/index.html'), 'utf8');
const world = await readFile(path.join(root, 'site/world/index.html'), 'utf8');
if (!home.includes('FMB Brief') || !home.includes('FMB Worldwide')) throw new Error('Homepage products missing');
if (!world.includes('FMB Worldwide') || !world.includes('august-29-2026') || !world.includes('august-30-2026')) throw new Error('Worldwide/archive coverage missing');
console.log('FMBNews standalone source verification passed.');
