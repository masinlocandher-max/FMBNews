import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');

await rm(dist, { recursive: true, force: true });
await mkdir(newsRoot, { recursive: true });
await cp(path.join(root, 'site'), newsRoot, { recursive: true });
await cp(path.join(root, 'public', 'assets'), path.join(newsRoot, 'assets'), { recursive: true });

// The approved metallic newspaper renderer is authoritative for the core newsroom.
// Run it after static routes are copied so homepage/archive/article pages cannot drift
// back to a later experimental design during deployment.
await import('./render-metallic-reference.mjs');

const textExtensions = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.svg']);

async function rewriteAssetPaths(target) {
  const info = await stat(target);
  if (info.isDirectory()) {
    for (const entry of await readdir(target)) {
      await rewriteAssetPaths(path.join(target, entry));
    }
    return;
  }

  if (!textExtensions.has(path.extname(target).toLowerCase())) return;
  const source = await readFile(target, 'utf8');
  const scoped = source.replaceAll('/assets/', '/news/assets/');
  if (scoped !== source) await writeFile(target, scoped, 'utf8');
}

await rewriteAssetPaths(newsRoot);
console.log('Built self-contained FMB News application into dist/news with the metallic reference newsroom and scoped assets.');
