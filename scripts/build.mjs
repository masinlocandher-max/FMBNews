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
await import('./fix-explainer-original-chronology.mjs');
await import('./hardfix-metallic-network.mjs');
await import('./hardfix-product-identity.mjs');

// Product image designation: real supplied photos stay primary. Explainers with
// no photo use only the approved Explainer fallback; generated generic art is
// not allowed to substitute for it.
await import('./hardfix-designated-fallbacks.mjs');

// Editorial publication rule: every Article/NewsArticle route gets an actual
// content image plus social-image metadata before the page can be published.
await import('./hardfix-all-article-images.mjs');

// One canonical renderer owns the public /news/ experience across breakpoints.
// It writes the desktop Filipino Media Bulletin landing and the mobile app home
// together, eliminating order-dependent home-page post-processing.
await import('./render-home-experience.mjs');

// Final newsroom integrity pass creates search/submit utility pages and applies
// the newsroom-level copy/navigation rules.
await import('./hardfix-newsroom-audit.mjs');
await import('./hardfix-late-newsroom-shell.mjs');

// Generate Fact Check before the universal mobile/PWA passes so all new pages
// receive the same shared newsroom runtime, accessibility and QA contract.
await import('./render-fmb-fact-check.mjs');
await import('./hardfix-fact-check-qa.mjs');

// Normalize article publication/modification metadata, JSON-LD, and visible
// update transparency without changing the visual system.
await import('./hardfix-editorial-production.mjs');

// Apply the universal responsive/PWA/personalization system after every newsroom
// page exists, including search, submission and Fact Check routes.
await import('./hardfix-mobile-first-site.mjs');

// Normalize the ticker after all pages exist so every surface receives one PHT
// clock and the same network headline bar.
await import('./hardfix-ticker.mjs');
await import('./hardfix-newsroom-compat.mjs');

// Public-web discovery pass. It leaves presentation untouched while exposing
// canonical identity, trust policies, snippet/image directives, and normalized
// publisher/author structured data.
await import('./hardfix-ai-discovery.mjs');

// Final visual authority: restrained matte-glass FMB News identity across every
// generated route, with shared contrast and About-page readability rules.
await import('./hardfix-matte-news-system.mjs');

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

// Generate distribution surfaces from the final deployable newsroom only after
// routes, canonical URLs, article metadata and scoped asset paths have settled.
await import('./generate-news-distribution.mjs');

console.log('Built Filipino Media Bulletin with five official editorial products: FMB News, FMB Worldwide, FMB Explainer, FMB Fact Check, and FMB Daily Brief; plus localized visual assets, product-designated fallback imagery, guaranteed article imagery, personalization/PWA support, live utilities, newsroom search and intake, canonical sitemap and RSS distribution, a sealed active crossword runtime, explicit editorial trust surfaces, normalized search/AI discovery metadata, a universal matte FMB News masthead, readable trust pages, and no fixed bottom navigation.');
