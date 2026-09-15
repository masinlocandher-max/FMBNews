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

// The newsroom's rights-cleared photograph ledger, copied local for the same
// reason: production pages must serve the publication's own files, never a
// third-party host.
await import('./fetch-rights-cleared-photography.mjs');

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

// A story that the newsroom cleared a photograph for gets that photograph,
// with its caption, creator and licence. This runs first so the guaranteed-image
// rule below only ever falls back where no cleared photograph exists.
await import('./apply-rights-cleared-photography.mjs');

// Editorial publication rule: every Article/NewsArticle route gets an actual
// content image plus social-image metadata before the page can be published.
await import('./hardfix-all-article-images.mjs');

// Generic newsroom integrity runs before the purpose-built homepage renderer.
// It creates Search/Submit and repairs cross-route copy/navigation, but it must
// not get the final word on the publication landing's editorial information
// architecture.
await import('./hardfix-newsroom-audit.mjs');
await import('./hardfix-late-newsroom-shell.mjs');

// Sports is an editorial desk, not a sixth product. Generate a real category
// destination from published Sports-tagged inventory. When inventory is empty,
// the route states that explicitly instead of borrowing unrelated stories.
await import('./render-sports.mjs');

// Founder and Entertainment. Both were referenced by the publication but had no
// route and returned 404. Rendered here, before the newsroom audit, mobile and
// brand passes, so they inherit the shared shell, navigation, footer, theme and
// mobile system rather than carrying a private copy of the chrome.
await import('./render-publication-sections.mjs');

// Generate Fact Check before the universal mobile/PWA passes so all new pages
// receive the same shared newsroom runtime, accessibility and QA contract.
await import('./render-fmb-fact-check.mjs');

// Publish the independently verified current Fact Checks without rewriting the
// sealed 123-item historical draft corpus. Each current item still has to pass
// the same evidence contract before a public page is generated.
await import('./publish-current-fact-checks.mjs');

// Every published article must carry a real, rights-cleared photograph. Current
// Fact Checks are rendered after the general photo pass, so their licensed
// contextual photography is localized and inserted here before Fact Check QA.
await import('./apply-current-fact-check-photography.mjs');
await import('./hardfix-fact-check-qa.mjs');

// The canonical homepage renderer is the sole owner of /news/index.html. It
// runs after the generic audit so News/Worldwide/Sports and Entertainment are
// source-owned decisions rather than late hardfix output.
await import('./render-home-experience.mjs');


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

// Bring every remaining third-party photograph onto FMB News's own domain. The
// rights-cleared ledger is already localized above; this catches photographs
// that live in the article record instead, which were still being hotlinked
// from Wikimedia on 66 published pages. It runs before the discovery pass so
// og:image and structured data pick up the local URL, and it is fail-soft: an
// unreachable photograph keeps the URL it has today rather than failing a
// build and blocking the newsroom from publishing.
await import('./localize-article-photography.mjs');

// Public-web discovery pass. It leaves presentation untouched while exposing
// canonical identity, trust policies, snippet/image directives, and normalized
// publisher/author structured data.
await import('./hardfix-ai-discovery.mjs');

// FMB Worldwide archive SEO. This adds truthful restoration dates, edition
// coverage, archive/stories ItemLists, breadcrumbs and social-card metadata
// without pretending the September 5-14 backfills were published historically.
await import('./hardfix-worldwide-seo.mjs');

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
