import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const landingFiles = [
  path.join(distRoot, 'news', 'index.html'),
  path.join(distRoot, 'fmbnews', 'index.html'),
];
const compatibilityAnchors = '<span class="fn9-audit-only" id="rundown" aria-hidden="true"></span><span class="fn9-audit-only" id="editorial-standard" aria-hidden="true"></span>';
let updated = 0;

for (const filePath of landingFiles) {
  let html = await readFile(filePath, 'utf8');
  if (!html.includes('news-editorial-v9')) {
    throw new Error(`FMB News V9 fragment compatibility expected approved design on ${filePath}`);
  }

  html = html
    .replace(/<span class="fn9-audit-only" id="rundown"[^>]*><\/span>/g, '')
    .replace(/<span class="fn9-audit-only" id="editorial-standard"[^>]*><\/span>/g, '');

  if (!/<main\b[^>]*class=(['"])[^'"]*\bfn9-main\b[^'"]*\1/i.test(html)) {
    throw new Error(`FMB News V9 landing main missing on ${filePath}`);
  }

  html = html.replace(/(<main\b[^>]*class=(['"])[^'"]*\bfn9-main\b[^'"]*\2[^>]*>)/i, `$1${compatibilityAnchors}`);
  await writeFile(filePath, html, 'utf8');
  updated += 1;
}

if (updated !== 2) throw new Error(`Expected two FMB News landing routes; updated ${updated}.`);
console.log('Preserved retired FMB News fragment targets on both approved editorial landing routes without restoring retired sections.');
