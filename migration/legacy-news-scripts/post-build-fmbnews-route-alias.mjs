import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const source = path.join(dist, 'news', 'index.html');
const aliasDir = path.join(dist, 'fmbnews');
const alias = path.join(aliasDir, 'index.html');

await import('./post-build-fmb-news-august-6-briefing.mjs');

async function htmlFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

await mkdir(aliasDir, { recursive: true });
const html = await readFile(source, 'utf8');
await writeFile(alias, html, 'utf8');

let changed = 0;
for (const file of await htmlFiles(dist)) {
  const before = await readFile(file, 'utf8');
  const after = before
    .replaceAll('href="/fmbnews/"', 'href="/news/"')
    .replaceAll("href='/fmbnews/'", "href='/news/'");
  if (after !== before) {
    await writeFile(file, after, 'utf8');
    changed += 1;
  }
}

console.log(`Restored /fmbnews/ alias and repaired ${changed} legacy links.`);
