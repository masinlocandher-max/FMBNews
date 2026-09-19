import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist', 'news');

async function walk(dir) {
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

const replacements = [
  [/News and Information<br>with Purpose\.?/gi, 'www.francinemariebautista.com/news'],
  [/News and Information with Purpose\.?/gi, 'www.francinemariebautista.com/news'],
  [/Information with Purpose\.?/gi, 'www.francinemariebautista.com/news'],
];

let changed = 0;
for (const file of await walk(root)) {
  const source = await readFile(file, 'utf8');
  let html = source;
  for (const [pattern, value] of replacements) html = html.replace(pattern, value);
  if (html !== source) {
    await writeFile(file, html, 'utf8');
    changed += 1;
  }
}

console.log(`Current FMB News branding enforced across ${changed} generated HTML pages.`);
