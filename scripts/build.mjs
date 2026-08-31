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

// The approved metallic newspaper renderer is authoritative for homepage,
// archive and structured article pages.
await import('./render-metallic-reference.mjs');

// The network hard fix runs after every route has been copied/rendered.
// It owns the shared mast, navigation, footer, metallic CSS stack and body
// identity for every built HTML page, including FMB Worldwide, FMB Brief,
// About and CMS live/read routes. No route is allowed to keep an orphan shell.
await import('./hardfix-metallic-network.mjs');

// Final shared-header pass. This deliberately runs after both renderers so
// every route gets exactly one fixed PHT clock, moving headlines without
// duplicate timestamps, and the same premium ticker typography.
await import('./hardfix-ticker.mjs');

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
console.log('Built self-contained FMB News application with one locked metallic network system and one normalized premium headline ticker across all routes.');
