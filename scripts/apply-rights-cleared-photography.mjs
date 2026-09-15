// Put the newsroom's cleared photographs onto the articles they belong to.
//
// This runs before hardfix-all-article-images.mjs on purpose. That script
// guarantees every article carries *something*, falling back to a designated
// product placeholder; this one gives an article its real photograph first, so
// the placeholder only ever fires where no cleared photograph exists.
//
// The credit line is not decoration and is not optional. Every photograph in
// the ledger is used under a licence -- CC BY, CC BY-SA, or public domain --
// and the attribution licences require the creator and the licence to travel
// with the image. The caption is carried through verbatim for the same reason:
// several of these are archival file photographs, and the newsroom's captions
// say so explicitly ("It illustrates monsoon flood risk and does not depict the
// August 30, 2026 flooding"). Dropping that caption would turn a legitimate
// file photo into a false claim about the event being reported.

import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const ledgerPath = path.join(root, 'content', 'news', 'rights-cleared-image-overrides.json');
const localDir = path.join(newsRoot, 'assets', 'images', 'rights-cleared');

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const exists = async (file) => { try { await access(file); return true; } catch { return false; } };

const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));

let applied = 0;
const missingRoute = [];
const notLocalized = [];

for (const [slug, entry] of Object.entries(ledger)) {
  const page = path.join(newsRoot, slug, 'index.html');
  if (!await exists(page)) { missingRoute.push(slug); continue; }

  let file = '';
  for (const ext of ['jpg', 'png', 'webp']) {
    if (await exists(path.join(localDir, `${slug}.${ext}`))) { file = `${slug}.${ext}`; break; }
  }
  if (!file) { notLocalized.push(slug); continue; }

  const src = `/assets/images/rights-cleared/${file}`;
  const figure = `<figure class="article-figure fmb-rights-cleared-figure">`
    + `<img src="${src}" alt="${esc(entry.alt)}" fetchpriority="high" decoding="async">`
    + `<figcaption>${esc(entry.caption)}<br><em>${esc(entry.credit)}</em></figcaption>`
    + `</figure>`;

  let html = await readFile(page, 'utf8');
  const existing = /<figure\b[^>]*class="[^"]*article-figure[^"]*"[\s\S]*?<\/figure>/i;
  if (existing.test(html)) {
    html = html.replace(existing, figure);
  } else {
    const h1 = /<h1\b[^>]*>[\s\S]*?<\/h1>/i;
    if (!h1.test(html)) continue;
    html = html.replace(h1, (match) => `${match}${figure}`);
  }

  await writeFile(page, html, 'utf8');
  applied += 1;
}

// A ledger entry whose article does not exist is a content error worth saying
// out loud: somebody cleared a photograph for a story that never shipped, or
// the slug drifted. It is reported, not thrown, so it cannot wedge a build.
if (missingRoute.length) {
  console.warn(`  Rights-cleared ledger names ${missingRoute.length} slug(s) with no article route: ${missingRoute.join(', ')}`);
}
if (notLocalized.length) {
  throw new Error(`Rights-cleared photographs were never localized for: ${notLocalized.join(', ')}. Run fetch-rights-cleared-photography.mjs before this step.`);
}

console.log(`Rights-cleared photography applied to ${applied} article route(s), each with its recorded caption, creator and licence credit.`);
