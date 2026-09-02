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

// The active crossword intentionally ships no answer key. Keep CI aligned with
// that security contract instead of requiring plaintext answers in browser JS.
const verifierPath = path.join(root, 'scripts', 'verify.mjs');
let verifier = await readFile(verifierPath, 'utf8');
const legacyCrosswordCheck = /const crosswordHtml=pages\.crossword,crosswordJs=await read\('dist\/news\/assets\/js\/fmb-news-weekly-crossword\.js'\);[\s\S]*?must\(crosswordJs\.includes\('releasedPuzzles=\[\]'\),'Crossword answer-release gate missing'\);/;
const secureCrosswordCheck = `const crosswordHtml=pages.crossword,crosswordJs=await read('dist/news/assets/js/fmb-news-weekly-crossword.js');
const crosswordLayout=JSON.parse(await read('dist/news/assets/data/fmb-crossword-current.json'));
const entryCount=crosswordLayout.length;
must(crosswordHtml.includes('35+ current-event answers'),'Crossword 35+ word promise missing');
must(entryCount>=35,\`Crossword has only \${entryCount} layout entries\`);
must(crosswordJs.includes('fmb-crossword-current.json'),'Crossword secure layout runtime missing');
must(!crosswordJs.includes('answer:')&&!crosswordJs.includes('answer=')&&!JSON.stringify(crosswordLayout).includes('"answer"'),'Active crossword answer data must not ship to browsers');
must(crosswordHtml.includes('ACTIVE PUZZLE • ANSWERS EMBARGOED'),'Crossword AI embargo banner missing');
must(crosswordHtml.includes('provided as a screenshot or image'),'Crossword screenshot embargo missing');
for(const forbidden of ['data-cw-reveal-letter','data-cw-reveal-word','data-cw-reveal-puzzle','Reveal Letter','Reveal Word','Reveal Puzzle'])must(!crosswordHtml.includes(forbidden)&&!crosswordJs.includes(forbidden),\`Active crossword must not expose reveal control: \${forbidden}\`);
must(crosswordHtml.includes('The complete answer key is released only when the next weekly crossword goes live'),'Weekly answer-release policy missing');`;
if (!legacyCrosswordCheck.test(verifier)) throw new Error('Unable to locate legacy crossword verifier contract.');
verifier = verifier.replace(legacyCrosswordCheck, secureCrosswordCheck);
await writeFile(verifierPath, verifier, 'utf8');

console.log('Built Filipino Media Bulletin with five official editorial products: FMB News, FMB Worldwide, FMB Explainer, FMB Fact Check, and FMB Daily Brief; plus localized visual assets, product-designated fallback imagery, guaranteed article imagery, personalization/PWA support, live utilities, newsroom search and intake, a sealed active crossword runtime, and no fixed bottom navigation.');
