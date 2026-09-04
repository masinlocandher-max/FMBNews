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

// Published article records are authoritative. Preserve existing hand-built
// routes, render any missing published story pages, and always rebuild the
// newest-first /news/archive/ index from the same records.
await import('./render-published-news-records.mjs');

await import('./render-metallic-reference.mjs');
await import('./render-fmb-explained.mjs');
await import('./fix-explainer-original-chronology.mjs');
await import('./hardfix-metallic-network.mjs');
await import('./hardfix-product-identity.mjs');

// Product image designation: real supplied photos stay primary. Explainers with
// no photo use only the approved Explainer fallback; generated generic art is
// not allowed to substitute for it.
await import('./hardfix-designated-fallbacks.mjs');

// Hard editorial rule: every Article/NewsArticle route gets an actual content
// image plus social-image metadata before the page can be published. Missing
// images use the fallback assigned to that editorial product.
await import('./hardfix-all-article-images.mjs');

// Desktop /news/ remains the Filipino Media Bulletin publication landing.
await import('./hardfix-publication-landing.mjs');

// The same /news/ URL gets a dedicated phone-only app home generated from
// current published FMB News article data. Desktop keeps the publication landing.
await import('./hardfix-mobile-app-home.mjs');

// Final newsroom integrity pass creates search/submit utility pages and applies
// the newsroom-level copy/navigation rules.
await import('./hardfix-newsroom-audit.mjs');
await import('./hardfix-late-newsroom-shell.mjs');

// Generate Fact Check before the universal mobile/PWA passes so all 124 new
// pages receive the same shared newsroom runtime, accessibility and QA contract.
await import('./render-fmb-fact-check.mjs');
await import('./hardfix-fact-check-qa.mjs');

// Normalize FMB News article publication/modification metadata, article JSON-LD,
// and reader-visible update transparency. This is an editorial production pass
// only; it intentionally does not alter the frozen visual system.
await import('./hardfix-editorial-production.mjs');

// Apply the universal responsive/PWA/personalization system only after every
// newsroom page exists, including late-generated search, submission and Fact
// Check routes.
await import('./hardfix-mobile-first-site.mjs');

// Normalize the ticker after all pages exist so every surface receives one PHT
// clock and the same network headline bar.
await import('./hardfix-ticker.mjs');
await import('./hardfix-newsroom-compat.mjs');

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

// Generate discovery surfaces from the final deployable newsroom only after all
// routes, canonical URLs, article metadata and scoped asset paths have settled.
// This creates the canonical sitemap, the rolling 48-hour Google News sitemap,
// the newest-first RSS feed, and RSS autodiscovery without changing page design.
await import('./generate-news-distribution.mjs');

// The active crossword intentionally ships no answer key, and scripts/verify.mjs
// asserts that secure contract directly. The build used to rewrite verify.mjs on
// disk here to install those assertions, which made `npm run build` mutate its
// own source tree and fail on the second consecutive run — the legacy block it
// searched for was already gone. The assertions now live in verify.mjs itself.

console.log('Built Filipino Media Bulletin with five official editorial products: FMB News, FMB Worldwide, FMB Explainer, FMB Fact Check, and FMB Daily Brief; plus localized visual assets, product-designated fallback imagery, guaranteed article imagery, personalization/PWA support, live utilities, newsroom search and intake, canonical sitemap and RSS distribution, a sealed active crossword runtime, and no fixed bottom navigation.');
