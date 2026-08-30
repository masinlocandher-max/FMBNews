import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve(new URL('../dist/', import.meta.url).pathname);
const newsroom = path.join(dist, 'fmbnews', 'index.html');
const failures = [];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(target);
  }
  return files;
}

function destination(value) {
  const url = new URL(value, 'https://www.francinemariebautista.com');
  let target = path.join(dist, decodeURIComponent(url.pathname));
  if (url.pathname.endsWith('/')) target = path.join(target, 'index.html');
  return { target, hash: decodeURIComponent(url.hash.slice(1)) };
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

const files = [...await walk(path.join(dist, 'fmbnews')), ...await walk(path.join(dist, 'news'))];
const htmlByFile = new Map();
for (const file of files) htmlByFile.set(file, await readFile(file, 'utf8'));

for (const [file, html] of htmlByFile) {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  const ids = [...html.matchAll(/\bid=(['"])(.*?)\1/gi)].map((match) => match[2]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) failures.push(`${relative}: duplicate IDs ${duplicates.join(', ')}`);

  for (const match of html.matchAll(/\bhref=(['"])(.*?)\1/gi)) {
    const href = match[2];
    if (!href || /^(?:mailto:|tel:|https?:\/\/|data:|javascript:)/i.test(href)) continue;
    if (href.startsWith('#')) {
      if (href !== '#' && !ids.includes(decodeURIComponent(href.slice(1)))) failures.push(`${relative}: missing local fragment ${href}`);
      continue;
    }
    const { target, hash } = destination(href);
    if (!await exists(target)) {
      failures.push(`${relative}: missing target ${href}`);
      continue;
    }
    if (hash && target.endsWith('.html')) {
      const targetHtml = htmlByFile.get(target) || await readFile(target, 'utf8');
      if (!new RegExp(`\\bid=(['"])${hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`).test(targetHtml)) failures.push(`${relative}: missing target fragment ${href}`);
    }
  }

  for (const match of html.matchAll(/\bsrc=(['"])(\/[^'"]+)\1/gi)) {
    const src = match[2].split(/[?#]/)[0];
    const target = path.join(dist, decodeURIComponent(src));
    if (!await exists(target)) failures.push(`${relative}: missing local asset ${src}`);
  }

  for (const button of html.matchAll(/<button\b([^>]*)>/gi)) {
    if (!/\btype=(['"])button\1/i.test(button[1])) failures.push(`${relative}: button is missing type="button"`);
  }
}

const landing = await readFile(newsroom, 'utf8');
const primary = landing.match(/<div class="fnc-nav-links">([\s\S]*?)<\/div>/i)?.[1] || '';
for (const label of ['Latest reports', 'About FMB News', 'Editorial standards', 'Corrections', 'Contact']) {
  if (!primary.includes(`>${label}</a>`)) failures.push(`fmbnews/index.html: primary menu is missing ${label}`);
}
for (const category of ['all', 'national', 'world', 'business', 'technology', 'culture', 'environment', 'health']) {
  if (!landing.includes(`data-fnc-filter="${category}"`)) failures.push(`fmbnews/index.html: filter is missing ${category}`);
  if (!landing.includes(`data-fnc-drawer-category="${category}"`)) failures.push(`fmbnews/index.html: drawer category is missing ${category}`);
}
if (!landing.includes('81 reports accessible')) failures.push('fmbnews/index.html: expected 81 accessible reports');
if (!landing.includes('/assets/images/news/fmb-news-white-transparent-2026.webp')) failures.push('fmbnews/index.html: white footer identity missing');

if (failures.length) throw new Error(`FMB News route and control audit failed:\n- ${failures.join('\n- ')}`);
console.log(`FMB News route and control audit passed ${files.length} generated pages with all local targets, fragments, assets, menu controls, and categories present.`);
