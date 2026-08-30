import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');

async function htmlFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

let changedFiles = 0;
let changedLinks = 0;
for (const file of await htmlFiles(dist)) {
  const before = await readFile(file, 'utf8');
  let after = before;
  after = after.replace(/href=(['"])\/fmbnews\/(?!\1)([^'"#?][^'"]*)\1/gi, (match, quote, rest) => {
    changedLinks += 1;
    return `href=${quote}/news/${rest}${quote}`;
  });
  after = after.replace(/href=(['"])https:\/\/(?:www\.)?francinemariebautista\.com\/fmbnews\/(?!\1)([^'"#?][^'"]*)\1/gi, (match, quote, rest) => {
    changedLinks += 1;
    return `href=${quote}https://www.francinemariebautista.com/news/${rest}${quote}`;
  });
  if (after !== before) {
    await writeFile(file, after, 'utf8');
    changedFiles += 1;
  }
}

console.log(`Final FMB News link normalization repaired ${changedLinks} article link(s) across ${changedFiles} HTML file(s).`);
