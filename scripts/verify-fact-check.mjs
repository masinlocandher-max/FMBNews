// FMB Fact Check release gate.
//
// This previously asserted mostly shape: exactly 123 items, fixed rating tallies,
// and that the name of the source publication never appeared. None of that tests
// whether a published fact check is true, evidenced, or FMB's own work — and the
// last of those was CI enforcing the removal of attribution.
//
// It now enforces the editorial contract: nothing carries an FMB rating in
// public without the records that rating rests on.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFile(path.join(root, rel), 'utf8');
const must = (value, message) => { if (!value) throw new Error(message); };

const RATINGS = new Set(['TRUE', 'VERIFIED FACT', 'MISLEADING', 'FALSE']);
const CANONICAL = 'https://www.francinemariebautista.com/news/fact-check/';
const factRoot = path.join(root, 'dist', 'news', 'fact-check');

const held = JSON.parse(await read('content/fact-check/HELD.json'));
const index = JSON.parse(await read('dist/news/assets/data/fmb-fact-check/index.json'));

must(held.total === held.published + held.held, `Fact Check ledger does not balance: ${held.total} vs ${held.published}+${held.held}`);
must(held.published === index.length, `Published index (${index.length}) disagrees with the ledger (${held.published})`);
for (const item of held.items) must(Array.isArray(item.reasons) && item.reasons.length, `Held item ${item.slug} records no reason`);

const rendered = (await readdir(factRoot, { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name);
const cleared = new Set(index.map(a => a.slug));
for (const slug of rendered) must(cleared.has(slug), `${slug} has a public page but is not in the cleared index`);
must(rendered.length === index.length, `${rendered.length} rendered pages vs ${index.length} cleared items`);

const archive = await read('dist/news/fact-check/index.html');
must(archive.includes('fmb-fact-check-route'), 'Fact Check archive lost its route identity');
must(archive.includes(`<link rel="canonical" href="${CANONICAL}"`), 'Fact Check archive canonical is wrong');
for (const label of RATINGS) must(archive.includes(label), `Fact Check archive missing ${label} tag`);
const advertised = archive.match(/id="fcCount">(\d+) fact checks/);
must(advertised && Number(advertised[1]) === index.length, `Archive advertises ${advertised?.[1]} checks but publishes ${index.length}`);
if (!index.length) must(/No fact checks are published yet/.test(archive), 'An empty Fact Check archive must say so plainly');

// The held queue must be disclosed to readers whenever it exists -- not only
// when nothing is published.
//
// This is the regression it exists to catch, and it had already happened. The
// disclosure was written as an EMPTY STATE, rendered only when zero checks were
// published, and publish-current-fact-checks.mjs then stripped it outright when
// it added the current checks. The moment the desk published its first three,
// the page stopped mentioning the 123 drafted checks waiting on verification.
// Nothing failed. The archive still said "3 fact checks", the ledger still said
// 123 held, and a reader had no way to learn the queue existed.
//
// The count is asserted against the ledger, not merely present, because a note
// that survives while quietly going stale would be worse than none: it would be
// the desk publishing a number it no longer believes.
const disclosed = archive.match(/<div class="fc-held-note" data-fmb-held="(\d+)"/);
if (held.held > 0) {
  must(disclosed, `${held.held} Fact Check(s) are held, but the archive discloses no held queue to readers.`);
  must(
    Number(disclosed[1]) === held.held,
    `Fact Check archive discloses ${disclosed[1]} held check(s) but the ledger records ${held.held}.`
  );
  // Tested against the note's VISIBLE TEXT, with the opening tag and every
  // other tag removed first. An earlier draft of this check ran the regex over
  // the whole element, which `data-fmb-held="123"` satisfied all by itself -- so
  // it passed a note whose prose had been scrubbed of the number entirely. The
  // attribute is for machines; this asserts the reader is told.
  const noteProse = archive.match(/<div class="fc-held-note"[\s\S]*?<\/div>/)[0]
    .replace(/<[^>]*>/g, ' ');
  must(
    new RegExp(`\\b${held.held}\\b`).test(noteProse),
    `The held-queue disclosure carries ${held.held} as data but never shows the number to the reader.`
  );
} else {
  must(!disclosed, 'The archive discloses a held queue while the ledger records none held.');
}
must(!/does not reproduce or link the source publication/i.test(archive), 'Fact Check must not publish a note admitting it withholds its source');

const seenClaims = new Map();
for (const item of index) {
  const where = item.slug;
  const html = await read(`dist/news/fact-check/${item.slug}/index.html`);
  const record = JSON.parse(await read(`content/fact-check/evidence/${item.slug}.json`));

  must(RATINGS.has(item.rating), `${where}: rating "${item.rating}" is not an approved FMB rating`);
  must(item.title && item.title.trim().length > 8, `${where}: no usable headline`);

  const claim = html.match(/<div class="fc-claim"><strong>Claim:<\/strong>([\s\S]*?)<\/div>/)?.[1]?.replace(/<[^>]*>/g, '').trim();
  must(claim && claim.length > 12, `${where}: published page carries no claim`);
  const verdict = html.match(/<h2>The FMB verdict<\/h2>([\s\S]*?)<\/section>/)?.[1]?.replace(/<[^>]*>/g, '').trim();
  must(verdict && verdict.length > 12, `${where}: published page carries no verdict`);
  must(claim !== verdict, `${where}: claim and verdict are the same text`);

  const key = claim.toLowerCase().replace(/\s+/g, ' ').trim();
  if (seenClaims.has(key)) must(seenClaims.get(key).rating === item.rating,
    `${where}: same claim as ${seenClaims.get(key).slug} but rated ${item.rating} vs ${seenClaims.get(key).rating}`);
  seenClaims.set(key, item);

  const evidence = Array.isArray(record.evidence) ? record.evidence : [];
  const primary = evidence.filter(e => e && e.kind === 'primary' && /^https?:\/\//i.test(String(e.url || '')));
  must(primary.length, `${where}: published with no primary evidence`);
  must(/^https?:\/\//i.test(String(record.claimSource?.url || '')), `${where}: published with no archived claim source`);
  must(record.ratingReachedBy === 'FMB', `${where}: rating was not reached by FMB`);
  must(record.rating === item.rating, `${where}: evidence record says ${record.rating}, page says ${item.rating}`);
  if (record.derivedFrom) must(html.includes(String(record.derivedFrom.publisher || '')),
    `${where}: derived from ${record.derivedFrom.publisher} but the page does not attribute it`);

  for (const e of primary) must(html.includes(e.url) || html.includes(String(e.title || '')),
    `${where}: primary evidence "${e.title || e.url}" was lost during rendering`);

  const exact = /^\d{4}-\d{2}-\d{2}$/.test(item.period);
  if (!exact) must(html.includes(item.period), `${where}: approximate period "${item.period}" was rendered as a false exact date`);

  must(html.includes(`<link rel="canonical" href="${CANONICAL}${item.slug}/"`), `${where}: canonical URL is wrong`);
  must(/<meta name="description" content="[^"]{20,}"/.test(html), `${where}: no meta description`);
  must(/<meta property="og:image" content="https:\/\/[^"]+"/.test(html), `${where}: no social image`);
  must(html.includes('fmb-fact-check-route'), `${where}: Fact Check route identity missing`);
  must(html.includes('fmb-news-mobile-global.js'), `${where}: mobile identity missing`);

  must(!/A circulating post, video, quote, or report claims that/i.test(html),
    `${where}: publishes the generated placeholder claim instead of the real one`);
}

console.log(
  `FMB Fact Check gate passed: ${held.total} items in the corpus, ${index.length} published with primary evidence ` +
  `attached and FMB-reached ratings, ${held.held} held pending verification and disclosed as held on the archive.`
);
