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

// Archive and structured news articles are rendered independently from the
// publication homepage. The canonical home is authored later by exactly one
// renderer, so no legacy homepage is generated and then overwritten.
await import('./render-news-routes.mjs');
await import('./render-fmb-explained.mjs');
await import('./fix-explainer-original-chronology.mjs');

// One renderer owns the shared newsroom masthead, product navigation, final
// moving-headline ticker, single PHT clock process, utility chrome, and footer.
const { renderNetworkShell } = await import('./render-network-shell.mjs');
await renderNetworkShell();

// Product image designation: real supplied photos stay primary. Explainers with
// no photo use only the approved Explainer fallback; generated generic art is
// not allowed to substitute for it.
await import('./hardfix-designated-fallbacks.mjs');

// Editorial publication rule: every Article/NewsArticle route gets an actual
// content image plus social-image metadata before the page can be published.
await import('./hardfix-all-article-images.mjs');

// Generic newsroom integrity runs before the purpose-built homepage renderer.
// It creates Search/Submit and repairs cross-route copy/navigation, but it must
// not get the final word on the publication landing's editorial information
// architecture.
await import('./hardfix-newsroom-audit.mjs');
await import('./hardfix-late-newsroom-shell.mjs');

// The canonical homepage renderer is the sole owner of /news/index.html. It
// runs after the generic audit so News/Worldwide/Sports and Entertainment are
// source-owned decisions rather than late hardfix output.
await import('./render-home-experience.mjs');

// Sports is an editorial desk, not a sixth product. Generate a real category
// destination from published Sports-tagged inventory. When inventory is empty,
// the route states that explicitly instead of borrowing unrelated stories.
await import('./render-sports.mjs');

// Generate Fact Check before the universal mobile/PWA passes so all new pages
// receive the same shared newsroom runtime, accessibility and QA contract.
await import('./render-fmb-fact-check.mjs');
await import('./hardfix-fact-check-qa.mjs');

// Re-run the same canonical shell after every route exists. The renderer is
// idempotent and preserves the purpose-built publication landing mast/footer.
await renderNetworkShell();

// Normalize article publication/modification metadata, JSON-LD, and visible
// update transparency without changing the visual system.
await import('./hardfix-editorial-production.mjs');

// Apply the universal responsive/PWA/personalization system after every newsroom
// page exists, including search, submission and Fact Check routes. This pass
// already bundles the full mobile CSS system and injects the shared runtimes on
// every built index page, so no late compatibility injector is required.
await import('./hardfix-mobile-first-site.mjs');

// Reassert the canonical publication shell directly after the route-wide mobile
// pass. This gives Search, Submit and every late/partial route the same final
// masthead, five-product navigation, ticker/PHT clock, newsletter runtime and
// footer without mutating authored mobile-home JavaScript at build time.
await renderNetworkShell();

// Public-web discovery pass. It leaves presentation untouched while exposing
// canonical identity, trust policies, snippet/image directives, and normalized
// publisher/author structured data.
await import('./hardfix-ai-discovery.mjs');

// Final visual authority: restrained matte-glass FMB News identity, shared
// contrast, About-page readability, and persistent System/Light/Dark appearance.
await import('./apply-brand-system.mjs');

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

console.log('Built Filipino Media Bulletin with one canonical homepage renderer; five official editorial products: FMB News, FMB Worldwide, FMB Explainer, FMB Fact Check, and FMB Daily Brief; News/Worldwide/Sports editorial desks; localized visual assets; product-designated fallback imagery; guaranteed article imagery; personalization/PWA support; live utilities; newsroom search and intake; canonical sitemap and RSS distribution; a sealed active crossword runtime; explicit editorial trust surfaces; normalized search/AI discovery metadata; one PHT ticker/clock shell; a matte-glass System/Light/Dark brand system; readable trust pages; and no duplicate legacy homepage generation.');
