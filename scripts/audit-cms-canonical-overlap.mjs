// The one question Phase 2 cannot start without, as a command you can run.
//
// WHAT THIS RESOLVES
//
// The repository serves editorial content from two places, and the route
// namespaces are disjoint -- which is good, and was verified:
//
//   /news/<slug>/        static, built from content/news/articles/**.json
//   /news/read/<slug>/   live, served by the Worker from news_articles
//   /news/world/<date>/  static edition        | /news/world/live/       CMS
//   /news/fmb-brief-...  static edition        | /news/fmb-brief/live/   CMS
//
// `data-cms-article` appears on exactly one built page (/news/read/) and
// `data-cms-edition` on exactly two (the two /live/ routes), so no single URL
// is contested by both systems. A correction therefore has exactly ONE
// destination -- except in one case.
//
// THE ONE CASE
//
// src/worker.js canonicalArticleUrl() takes a row's `canonical_path` and, when
// it begins with `/news/`, emits it verbatim as the page's canonical URL. The
// resolved reader page is served `X-Robots-Tag: index, follow` (worker.js:259).
//
// So if a published news_articles row carries a canonical_path pointing at a
// STATIC route, that story has two live, indexable URLs that both declare the
// static one canonical:
//
//   * a correction written to the CMS row changes /news/read/<slug>/ only;
//   * a correction written to the JSON + rebuild changes /news/<slug>/ only;
//   * search engines are pointed at the static copy either way.
//
// A correction that lands in the copy nobody is directed to is worse than no
// automation, because it looks done. That is why correction propagation stays
// a human procedure until this returns zero rows.
//
// WHAT IT NEEDS
//
// SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. Nothing else. The publishable key
// reads published rows only, under the existing RLS, so this requires no
// elevated credential and cannot see drafts, review notes or subscribers.
//
// It is read-only: no DDL, no writes, and it is deliberately NOT part of
// `npm run verify`, because a build must not depend on a network round trip.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !KEY) {
  console.error(
    'Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY first (names are in .env.example).\n'
    + 'Both are browser-safe values that already ship in the client; no service-role key is needed or wanted here.',
  );
  process.exit(2);
}

// --- the static side, which can be established without the network ----------
const staticSlugs = new Set();
for (const day of await readdir(path.join(root, 'content/news/articles'))) {
  let files;
  try { files = await readdir(path.join(root, 'content/news/articles', day)); } catch { continue; }
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const story = JSON.parse(await readFile(path.join(root, 'content/news/articles', day, file), 'utf8'));
      if (story.status === 'published' && story.slug) staticSlugs.add(story.slug);
    } catch { /* malformed records are the editorial verifier's business */ }
  }
}

// --- the live side ----------------------------------------------------------
const endpoint = new URL(`${SUPABASE_URL}/rest/v1/news_articles`);
endpoint.searchParams.set('select', 'slug,canonical_path,status,updated_at');
endpoint.searchParams.set('status', 'eq.published');
const response = await fetch(endpoint, { headers: { apikey: KEY, Accept: 'application/json' } });
if (!response.ok) {
  console.error(`news_articles query failed: HTTP ${response.status}. ${await response.text()}`.slice(0, 400));
  process.exit(1);
}
const rows = await response.json();

// --- the two overlaps that matter ------------------------------------------
const canonicalPointsAtStatic = rows.filter((r) => {
  const p = String(r.canonical_path || '').trim();
  return p.startsWith('/news/') && !p.startsWith('/news/read/');
});
const slugExistsInBoth = rows.filter((r) => r.slug && staticSlugs.has(r.slug));

console.log(`Published CMS rows: ${rows.length}`);
console.log(`Published static article slugs: ${staticSlugs.size}`);
console.log('');
console.log(`A. Rows whose canonical_path points OUTSIDE /news/read/: ${canonicalPointsAtStatic.length}`);
for (const r of canonicalPointsAtStatic.slice(0, 25)) {
  console.log(`     ${r.slug}  ->  ${r.canonical_path}${staticSlugs.has(r.slug) ? '   [and a static route of this slug EXISTS]' : ''}`);
}
console.log('');
console.log(`B. Slugs present as BOTH a CMS row and a static article: ${slugExistsInBoth.length}`);
for (const r of slugExistsInBoth.slice(0, 25)) console.log(`     ${r.slug}`);

const clean = canonicalPointsAtStatic.length === 0 && slugExistsInBoth.length === 0;
console.log('');
if (clean) {
  console.log('RESULT: clean. The two systems do not contest any URL and no story has two live copies.');
  console.log('Every correction has exactly one destination, so correction propagation can be automated:');
  console.log('  a CMS story is corrected in news_articles; a static story is corrected in its JSON and rebuilt.');
  console.log('This is the Phase-2 prerequisite for automated correction propagation, and it is now met.');
} else {
  console.log('RESULT: overlap found. Each slug listed above is one editorial story with two live URLs.');
  console.log('Correction propagation must write BOTH copies, or the canonical one goes stale while still being');
  console.log('the one search engines are pointed at. Resolve the duplication before automating corrections:');
  console.log('  either retire the static copy, or stop the CMS row claiming a static canonical_path.');
}
process.exit(clean ? 0 : 3);
