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

// Pull the exact approved Drive visuals into the deployable asset tree so
// production pages reference local /news/assets files instead of Drive URLs.
await import('./fetch-approved-mobile-assets.mjs');

await import('./render-metallic-reference.mjs');
await import('./render-fmb-explained.mjs');
await import('./hardfix-metallic-network.mjs');
await import('./hardfix-ticker.mjs');
await import('./hardfix-product-identity.mjs');

// Hard editorial rule: every Article/NewsArticle route gets an actual content
// image plus social-image metadata before the page can be published.
await import('./hardfix-all-article-images.mjs');

// Desktop /news/ remains the Filipino Media Bulletin publication landing.
await import('./hardfix-publication-landing.mjs');

// The same /news/ URL gets a dedicated phone-only app home generated from
// current published FMB News article data. Desktop keeps the publication landing.
await import('./hardfix-mobile-app-home.mjs');

// Apply the universal responsive/PWA/personalization system last.
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
  const scoped = source.replace(/(?<!\/news)\/assets\//g, '/news/assets/');
  if (scoped !== source) await writeFile(target, scoped, 'utf8');
}

await rewriteAssetPaths(newsRoot);
console.log('Built Filipino Media Bulletin with desktop publication landing plus a dedicated premium mobile app home, four official editorial products, localized approved visual assets, guaranteed imagery on every article route, long-form FMB Explainer routes, personalization/PWA support, live utilities, and no fixed bottom navigation.');
