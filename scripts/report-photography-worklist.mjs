// Print the articles still waiting on a photograph, newest first.
//
// The photography gate says how many articles lack a photograph. This says
// which ones, in the order worth doing: newest first, because those are the
// stories a reader actually lands on, and a photograph on a story from last
// week is worth more than one on a story from June.
//
// Each row carries what somebody needs to clear a file without opening the
// article: the slug the ledger is keyed on, the date, and the headline.
//
// Sourcing rule, for whoever works this list:
//
//   Image search with the Creative Commons usage-rights filter is a way to
//   FIND candidates, never a clearance. The filter reports what the hosting
//   page claims. Open the file on its own source -- Wikimedia Commons, Flickr,
//   Openverse, a government archive -- read the licence there, and record that
//   page as sourceUrl. verify-article-photography.mjs refuses any other host.
//
//   A file photograph is fine and normal, but the caption must say so when the
//   picture does not show the event being reported. The ledger already does
//   this well: "It does not depict the August 2026 collapse."
//
// Usage: npm run photo:worklist [-- --limit 40] [-- --bucket news]

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const limit = Number(arg('limit', 40));
const onlyBucket = arg('bucket', '');

const PLACEHOLDER = /fmb-news-fallback-|fmb-explainer-fallback|fmb-daily-brief-mug|fmb-news-editorial-fallback|newsroom-editorial-fallback|fmb-news-official|fmbandco-primary|fmb-news-(?:primary|outline|white)|logo/i;
const isArticle = (html) => html.includes('class="article-grid"')
  || /["']@type["']\s*:\s*["'](?:NewsArticle|Article)["']/i.test(html);
const strip = (v = '') => String(v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const rows = [];

async function scan(target) {
  const info = await stat(target);
  if (info.isDirectory()) {
    for (const entry of await readdir(target)) await scan(path.join(target, entry));
    return;
  }
  if (path.basename(target) !== 'index.html') return;
  const html = await readFile(target, 'utf8');
  if (!isArticle(html)) return;

  const sources = [...html.matchAll(/<img\b[^>]*src=["']([^"']+)["']/gi)]
    .map((m) => m[1]).filter((s) => s.includes('/assets/images/'));
  if (sources.some((s) => /\.(webp|jpe?g|png)(\?|$)/i.test(s) && !PLACEHOLDER.test(s))) return;

  const rel = path.relative(newsRoot, path.dirname(target)).replaceAll('\\', '/');
  const bucket = rel.startsWith('explainer/') ? 'explainer'
    : /^fmb-brief/.test(rel) ? 'brief'
    : rel.startsWith('fact-check') ? 'fact-check' : 'news';
  if (onlyBucket && bucket !== onlyBucket) return;

  const published = html.match(/datetime=["'](\d{4}-\d{2}-\d{2})/)?.[1]
    || html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/)?.[1] || '';
  rows.push({ bucket, slug: rel, date: published, title: strip(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]) });
}

await scan(newsRoot);
rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

console.log(`\nFMB News — articles awaiting a photograph: ${rows.length}${onlyBucket ? ` (${onlyBucket})` : ''}`);
console.log(`Showing the ${Math.min(limit, rows.length)} most recent. Clear these into content/news/rights-cleared-image-overrides.json.\n`);
for (const r of rows.slice(0, limit)) {
  console.log(`${(r.date || '----------').padEnd(11)} ${r.bucket.padEnd(9)} ${r.slug}`);
  console.log(`            ${r.title}\n`);
}
if (rows.length > limit) console.log(`… and ${rows.length - limit} more. Re-run with --limit ${rows.length} for the full list.\n`);
