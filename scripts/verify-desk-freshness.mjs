// Is the publication still publishing?
//
// Nothing in this repository asked that question, and it cost the newsroom two
// blackouts that nobody caught.
//
// FMB Worldwide published daily from September 1 to September 4, then stopped.
// Eleven days later, on September 16, Septembers 5 through 15 were committed in
// one batch of backfills. For those eleven days the desk presented a September 4
// edition as the current one, the ticker offered September 4 headlines as
// LATEST, and every gate in this repository reported green: the routes all
// existed, the canonical URLs all resolved, the images all had alt text, the
// sitemap was exact. A site can be perfectly well-formed and completely out of
// date, and none of the other twenty-odd checks can tell the difference.
//
// It happened again straight after the backfill, which is what makes this worth
// a gate rather than a note: the newest edition is still September 15.
//
// There is no scheduled automation in .github/workflows -- no cron anywhere --
// so publishing is entirely manual. That is a legitimate way to run a small
// newsroom. It is not a legitimate way to run one with no alarm on it.
//
// WHAT THIS DOES NOT DO: it does not check that the journalism is good, or that
// a desk published something worth reading. It checks the one thing a machine
// can honestly check -- that the newest item is not older than the desk's own
// declared cadence -- and it says the age out loud on every build so the number
// is never a surprise.
//
// THE FIX FOR A FAILURE HERE IS TO PUBLISH. The threshold in
// content/news/desk-freshness-policy.json describes the cadence the newsroom
// intends to keep. Raising it to clear a red build converts a real editorial
// problem into a passing test, which is precisely the move the photography
// baseline rule in CLAUDE.md exists to forbid, for the same reason.

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolve = (...p) => path.join(root, ...p);

const MONTHS = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

// Manila time. A desk publishes on Philippine days, so its age is measured in
// them; using UTC would report the wrong number for several hours every day.
const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;
const phtDayStart = (ms) => Math.floor((ms + PHT_OFFSET_MS) / 86400000);
const NOW = Date.now();
const ageInDays = (ms) => phtDayStart(NOW) - phtDayStart(ms);

function dateFromSlug(slug) {
  const m = slug.match(/([a-z]+)-(\d{1,2})-(\d{4})$/i);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (month === undefined) return null;
  // Noon PHT, so a slug never lands on the wrong side of a day boundary.
  return Date.UTC(Number(m[3]), month, Number(m[2]), 4, 0, 0);
}

async function newestFromDirs(dir, match) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return null; }
  let best = null;
  for (const entry of entries) {
    if (!entry.isDirectory() || !match.test(entry.name)) continue;
    const when = dateFromSlug(entry.name);
    if (when === null) continue;
    if (!best || when > best.when) best = { name: entry.name, when };
  }
  return best;
}

async function newestPublishedArticle(dir) {
  let best = null;
  const walk = async (d) => {
    for (const entry of await readdir(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) { await walk(full); continue; }
      if (!entry.name.endsWith('.json')) continue;
      try {
        const story = JSON.parse(await readFile(full, 'utf8'));
        if (story.status !== 'published' || !story.publishedAt) continue;
        const when = Date.parse(story.publishedAt);
        if (!Number.isFinite(when)) continue;
        if (!best || when > best.when) best = { name: story.slug || entry.name, when };
      } catch { /* a malformed record is the editorial verifier's business, not this one's */ }
    }
  };
  try { await stat(dir); } catch { return null; }
  await walk(dir);
  return best;
}

const policy = JSON.parse(await readFile(resolve('content/news/desk-freshness-policy.json'), 'utf8'));

const DESKS = [
  {
    key: 'worldwide',
    label: 'FMB Worldwide',
    find: () => newestFromDirs(resolve('dist/news/world'), /^[a-z]+-\d{1,2}-\d{4}$/i),
  },
  {
    key: 'daily-brief',
    label: 'FMB Daily Brief',
    find: () => newestFromDirs(resolve('dist/news'), /^fmb-brief-[a-z]+-\d{1,2}-\d{4}$/i),
  },
  {
    key: 'news',
    label: 'FMB News',
    find: () => newestPublishedArticle(resolve('content/news/articles')),
  },
];

const rows = [];
const stale = [];
const missing = [];

for (const desk of DESKS) {
  const limit = policy.maxAgeDays?.[desk.key];
  if (!Number.isFinite(limit)) {
    missing.push(`${desk.label} has no maxAgeDays entry in desk-freshness-policy.json`);
    continue;
  }
  const newest = await desk.find();
  if (!newest) {
    stale.push(`${desk.label}: no dated item found at all`);
    continue;
  }
  const age = ageInDays(newest.when);
  rows.push({ label: desk.label, name: newest.name, age, limit });
  if (age > limit) stale.push(`${desk.label}: newest is ${newest.name}, ${age} days old (cadence allows ${limit})`);
}

for (const row of rows) {
  const flag = row.age > row.limit ? '  <-- STALE' : '';
  console.log(`  ${row.label.padEnd(16)} newest ${String(row.name).padEnd(26)} ${String(row.age).padStart(3)}d  (limit ${row.limit}d)${flag}`);
}

// A desk listed in the policy but not measured here would pass silently
// forever, which is the same class of hole this file exists to close.
if (missing.length) throw new Error(`Desk freshness policy is incomplete:\n  ${missing.join('\n  ')}`);
for (const key of Object.keys(policy.maxAgeDays || {})) {
  if (!DESKS.some((d) => d.key === key)) {
    throw new Error(`desk-freshness-policy.json declares "${key}", which nothing in verify-desk-freshness.mjs measures.`);
  }
}

if (stale.length) {
  throw new Error(
    `${stale.length} FMB desk(s) have stopped publishing:\n  ${stale.join('\n  ')}\n\n`
    + '  The site is presenting these as current. Publish the missing editions.\n'
    + '  Do NOT raise maxAgeDays in content/news/desk-freshness-policy.json to clear this:\n'
    + '  that turns a newsroom that has gone quiet into a build that says it has not.',
  );
}

console.log(`Desk freshness verified: ${rows.length} desk(s) publishing within their declared cadence.`);
