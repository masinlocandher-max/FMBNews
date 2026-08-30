import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const newsRoot = path.join(repositoryRoot, 'dist', 'news');
const genericVisualPattern = /newsroom-editorial-fallback\.svg/i;

async function listHtml(directory) {
  const files = [];
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return files;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listHtml(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function removeGenericVisuals(html) {
  let output = html
    .replace(/<style\b[^>]*id=["']fmb-news-image-fallback-surface["'][^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<figure\b[^>]*>[\s\S]*?newsroom-editorial-fallback\.svg[\s\S]*?<\/figure>\s*/gi, '')
    .replace(/<(?:img|source)\b[^>]*newsroom-editorial-fallback\.svg[^>]*>\s*/gi, '')
    .replace(/<meta\b[^>]*content=["'][^"']*newsroom-editorial-fallback\.svg[^"']*["'][^>]*>\s*/gi, '');

  output = output.replace(/<img\b[^>]*>/gi, (tag) => (
    genericVisualPattern.test(tag)
      ? ''
      : tag.replace(/\s+onerror=(["'])(?:(?!\1)[\s\S])*?newsroom-editorial-fallback(?:(?!\1)[\s\S])*?\1/gi, '')
  ));
  return output;
}

const htmlFiles = await listHtml(newsRoot);
let changedFiles = 0;
let removedReferences = 0;

for (const file of htmlFiles) {
  const before = await readFile(file, 'utf8');
  const beforeCount = (before.match(/newsroom-editorial-fallback\.svg/gi) || []).length;
  const after = removeGenericVisuals(before);
  const afterCount = (after.match(/newsroom-editorial-fallback\.svg/gi) || []).length;
  removedReferences += Math.max(0, beforeCount - afterCount);
  if (after !== before) {
    await writeFile(file, after, 'utf8');
    changedFiles += 1;
  }
}

console.log('FMB News image policy removed ' + removedReferences + ' generic visual reference(s) across ' + changedFiles + ' page(s).');
