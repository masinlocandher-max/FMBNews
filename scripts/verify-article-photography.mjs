// FMB News article photography gate.
//
// Newsroom rule: a published article carries a real photograph. This file is
// that rule expressed as something the build can fail on, rather than as an
// instruction somebody has to remember.
//
// It enforces three things.
//
// 1. The ledger is complete. Every entry in
//    content/news/rights-cleared-image-overrides.json must name the file, the
//    page it came from, a creator-and-licence credit, alt text and a caption.
//    An uncredited photograph is not cleared, whatever the file is: the
//    attribution licences these are used under require the creator and the
//    licence to travel with the image, and alt text is what a reader using a
//    screen reader gets instead of the picture.
//
// 2. Cleared photographs actually reach their articles. The ledger sat unread
//    by the build for its entire existence -- fourteen cleared photographs, none
//    of them on a page. A count that can silently fall to zero is not a rule, so
//    the applied count is asserted directly.
//
// 3. Coverage only improves. Most of the corpus predates the rule, and a gate
//    that fails on all of it would simply be switched off. So the number of
//    published articles WITHOUT a photograph is pinned to a committed baseline
//    and may only go down. A new article without a photograph pushes the count
//    above its baseline and fails the build; clearing photographs for the
//    backlog lowers it, and the baseline is re-pinned. That makes the rule
//    binding on everything shipped from here on without pretending the backlog
//    is already done.
//
// The baseline is deliberately NOT auto-updated by this script. A gate that
// rewrites its own threshold on every run enforces nothing.

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const ledgerPath = path.join(root, 'content', 'news', 'rights-cleared-image-overrides.json');
const baselinePath = path.join(root, 'content', 'news', 'photography-coverage-baseline.json');

// Shared placeholders and brand marks. These are legitimate as a last resort --
// the newsroom's explicit fallback when no cleared asset exists -- but none of
// them is a photograph OF the story, so none counts as coverage.
const PLACEHOLDER = /fmb-explainer-fallback|fmb-daily-brief-mug|fmb-news-editorial-fallback|newsroom-editorial-fallback|fmb-news-official|fmbandco-primary|fmb-news-(?:primary|outline|white)|logo/i;

const isArticle = (html) => html.includes('class="article-grid"')
  || /["']@type["']\s*:\s*["'](?:NewsArticle|Article)["']/i.test(html);

const bucketOf = (rel) => rel.startsWith('explainer/') ? 'explainer'
  : /^fmb-brief/.test(rel) ? 'brief'
  : rel.startsWith('fact-check') ? 'fact-check'
  : 'news';

const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));

// --- 1. ledger completeness ------------------------------------------------
const REQUIRED = ['url', 'sourceUrl', 'credit', 'caption', 'alt'];
for (const [slug, entry] of Object.entries(ledger)) {
  for (const field of REQUIRED) {
    if (!entry?.[field] || !String(entry[field]).trim()) {
      throw new Error(`Rights-cleared ledger entry "${slug}" is missing ${field}. An uncredited photograph is not a cleared photograph.`);
    }
  }
  if (!/^https:\/\//i.test(entry.sourceUrl)) {
    throw new Error(`Rights-cleared ledger entry "${slug}" has no verifiable https source page.`);
  }
  // The credit has to name terms a reader can check, not just a photographer.
  // "public-domain" is spelled both ways across the ledger, so match either.
  if (!/(CC[ -]|public[ -]domain|CC0|government work)/i.test(entry.credit)) {
    throw new Error(`Rights-cleared ledger entry "${slug}" credit does not name a licence: ${entry.credit}`);
  }
}

// --- 2 & 3. what actually shipped ------------------------------------------
const counts = {};
let cleared = 0;

async function scan(target) {
  const info = await stat(target);
  if (info.isDirectory()) {
    for (const entry of await readdir(target)) await scan(path.join(target, entry));
    return;
  }
  if (path.basename(target) !== 'index.html') return;
  const html = await readFile(target, 'utf8');
  if (!isArticle(html)) return;

  const rel = path.relative(newsRoot, path.dirname(target)).replaceAll('\\', '/');
  const bucket = bucketOf(rel);
  counts[bucket] = counts[bucket] || { total: 0, without: 0 };
  counts[bucket].total += 1;

  if (html.includes('fmb-rights-cleared-figure')) cleared += 1;

  const sources = [...html.matchAll(/<img\b[^>]*src=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .filter((s) => s.includes('/assets/images/'));
  const hasPhotograph = sources.some((s) => /\.(webp|jpe?g|png)(\?|$)/i.test(s) && !PLACEHOLDER.test(s));
  if (!hasPhotograph) counts[bucket].without += 1;
}

await scan(newsRoot);

if (!Object.keys(counts).length) throw new Error('No FMB article routes were found while verifying article photography.');

const expectedCleared = Object.keys(ledger).length;
if (cleared === 0) {
  throw new Error(`The rights-cleared ledger holds ${expectedCleared} photograph(s) but none reached an article. The ledger is not wired into the build.`);
}

const regressions = [];
for (const [bucket, { total, without }] of Object.entries(counts)) {
  const cap = baseline[bucket];
  if (cap === undefined) {
    throw new Error(`Article bucket "${bucket}" has no committed photography baseline. Add one to ${path.relative(root, baselinePath)}.`);
  }
  if (without > cap) {
    regressions.push(`${bucket}: ${without} of ${total} articles carry no photograph, above the committed baseline of ${cap}`);
  }
}
if (regressions.length) {
  throw new Error(`Article photography regressed -- a published article shipped without a photograph:\n  ${regressions.join('\n  ')}\n`
    + 'Add the photograph to content/news/rights-cleared-image-overrides.json with its source, creator, licence, caption and alt text.');
}

const summary = Object.entries(counts)
  .map(([b, v]) => `${b} ${v.total - v.without}/${v.total}`)
  .join(', ');
console.log(`Article photography gate passed: ${cleared} rights-cleared photograph(s) applied with creator and licence credit; coverage ${summary}; no bucket regressed past its committed baseline.`);
