import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');

async function htmlFiles(directory) {
  const out = [];
  let entries = [];
  try { entries = await readdir(directory, { withFileTypes: true }); } catch (error) {
    if (error?.code === 'ENOENT') return out;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

let repaired = 0;
for (const file of await htmlFiles(newsRoot)) {
  const relative = path.relative(newsRoot, file).replaceAll(path.sep, '/');
  if (!relative.startsWith('fmb-brief-') || relative === 'fmb-brief/index.html') continue;

  let html = await readFile(file, 'utf8');
  html = html.replace(/<figure\b[\s\S]*?<\/figure>/gi, (figure) => {
    if (!/fmb-news-editorial-fallback|newsroom-editorial-fallback/i.test(figure)) return figure;
    if (/EDITORIAL FALLBACK/i.test(figure)) return figure;
    const next = figure.replace(
      /(<figcaption\b[^>]*class=(['"])[^'"]*brief-credit[^'"]*\2[^>]*>)/i,
      '$1<strong>EDITORIAL FALLBACK — source image unavailable in the production build.</strong> ',
    );
    if (next !== figure) repaired += 1;
    return next;
  });
  await writeFile(file, html, 'utf8');
}

console.log(`FMB Brief final fallback-label guard repaired ${repaired} fallback caption(s) after image localization.`);