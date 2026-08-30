import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const roots = [path.join(distRoot, 'news'), path.join(distRoot, 'fmbnews')];

async function walkHtml(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walkHtml(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

const files = [...new Set((await Promise.all(roots.map(walkHtml))).flat())];
let guarded = 0;

for (const filePath of files) {
  if (/[\\/]about[\\/]index\.html$/i.test(filePath)) continue;
  const html = await readFile(filePath, 'utf8');
  if (!html.includes('fn7-about-page')) continue;

  const next = html.replaceAll('fn7-about-page', 'fn7-compat-route-token');
  await writeFile(filePath, next, 'utf8');
  guarded += 1;
}

if (!guarded) throw new Error('FMB News V9 route guard did not find compatibility selectors to neutralize.');
console.log(`Fully isolated About-page compatibility selectors on ${guarded} non-About FMB News route(s) before the approved editorial transform.`);
