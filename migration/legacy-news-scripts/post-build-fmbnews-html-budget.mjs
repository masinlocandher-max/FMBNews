import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const fmbNewsLandingPath = path.join(distRoot, 'fmbnews', 'index.html');

async function walkHtml(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

const files = [...await walkHtml(newsRoot), fmbNewsLandingPath];
let changed = 0;
for (const filePath of files) {
  const html = await readFile(filePath, 'utf8');
  const updated = html.replaceAll(' target="_blank" rel="noopener noreferrer">Source</a>', '>Source</a>');
  if (updated === html) continue;
  await writeFile(filePath, updated, 'utf8');
  changed += 1;
}

console.log(`Kept visible FMB News photo sources while reducing redundant link markup across ${changed} page(s).`);
