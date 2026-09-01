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

await import('./render-metallic-reference.mjs');
await import('./hardfix-metallic-network.mjs');
await import('./hardfix-ticker.mjs');
await import('./hardfix-product-identity.mjs');

// The root /news/ page is the Filipino Media Bulletin publication landing,
// not a duplicate FMB News feed. This pass keeps the three products distinct
// and gives FMB Daily Brief exactly one landing-page subscription CTA.
await import('./hardfix-publication-landing.mjs');

// Mobile is the source of truth across the entire publication. Apply this last
// so every generated page, including legacy articles, uses the same website
// navigation and responsive system. No route gets a separate app-only shell.
await import('./hardfix-mobile-first-site.mjs');

const textExtensions = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.svg']);

async function rewriteAssetPaths(target) {
  const info = await stat(target);
  if (info.isDirectory()) {
    for (const entry of await readdir(target)) await rewriteAssetPaths(path.join(target, entry));
    return;
  }
  if (!textExtensions.has(path.extname(target).toLowerCase())) return;
  const source = await readFile(target, 'utf8');
  // Scope root assets once. Existing /news/assets/ references must remain untouched.
  const scoped = source.replace(/(?<!\/news)\/assets\//g, '/news/assets/');
  if (scoped !== source) await writeFile(target, scoped, 'utf8');
}

await rewriteAssetPaths(newsRoot);
console.log('Built Filipino Media Bulletin with one universal mobile-first website system, no fixed bottom navigation, idempotent /news asset scoping, distinct FMB News/FMB Worldwide/FMB Daily Brief products, and one Daily Brief subscription CTA.');
