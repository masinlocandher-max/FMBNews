import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { heldNote, HELD_NOTE_PATTERN } from './lib/fact-check-held-note.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const factRoot = path.join(newsRoot, 'fact-check');
const dataPath = path.join(newsRoot, 'assets', 'data', 'fmb-fact-check', 'index.json');
const currentPath = path.join(root, 'content', 'fact-check', 'current.json');
const evidenceRoot = path.join(root, 'content', 'fact-check', 'evidence');
const ledgerPath = path.join(root, 'content', 'fact-check', 'HELD.json');
const origin = 'https://www.francinemariebautista.com';

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const ratingMeta = {
  'TRUE': { cls: 'true', shape: '<circle cx="32" cy="32" r="25"/><path d="m19 32 9 9 18-20"/>' },
  'VERIFIED FACT': { cls: 'fact', shape: '<path d="M32 6 52 15v14c0 14-8 23-20 29C20 52 12 43 12 29V15z"/><path d="m21 32 8 8 15-17"/>' },
  'MISLEADING': { cls: 'misleading', shape: '<path d="M32 7 57 54H7z"/><path d="M32 20v18"/><circle cx="32" cy="46" r="2"/>' },
  'FALSE': { cls: 'false', shape: '<circle cx="32" cy="32" r="25"/><path d="m22 22 20 20M42 22 22 42"/>' }
};

function ratingBadge(rating, large = false) {
  const meta = ratingMeta[rating];
  if (!meta) throw new Error(`Unsupported Fact Check rating: ${rating}`);
  return `<span class="fc-badge fc-${meta.cls}${large ? ' is-large' : ''}" aria-label="Rating: ${esc(rating)}"><svg viewBox="0 0 64 64" aria-hidden="true">${meta.shape}</svg><span>${esc(rating)}</span></span>`;
}

function dateLabel(period) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric'
  }).format(new Date(`${period}T12:00:00+08:00`));
}

function nav() {
  return `<header class="masthead"><div class="shell mast-row"><a class="brand" href="/news/"><img src="/assets/images/brand/fmb-bulletin-emblem.svg" alt="Filipino Media Bulletin"></a><nav class="desktop-nav" aria-label="Filipino Media Bulletin"><a href="/news/archive/">FMB News</a><a href="/news/world/">FMB Worldwide</a><a href="/news/explainer/">FMB Explainer</a><a href="/news/fact-check/" aria-current="page">FMB Fact Check</a><a href="/news/fmb-brief/">FMB Daily Brief</a><a href="/news/about/">About</a></nav></div></header>`;
}

function footer() {
  return `<footer class="footer"><div class="shell footer-bottom"><span>© 2026 Filipino Media Bulletin.</span><span>FMB Fact Check · Evidence over virality</span></div></footer>`;
}

function head(title, desc, canonical) {
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="article"><meta property="og:site_name" content="Filipino Media Bulletin"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}"><link rel="stylesheet" href="/assets/css/fmb-news-final.css?v=20260902"><link rel="stylesheet" href="/assets/css/fmb-news-mobile-global.css?v=20260902"><link rel="stylesheet" href="/assets/css/fmb-news-mobile-products.css?v=20260902"><link rel="stylesheet" href="/assets/css/fmb-news-mobile-menu-holder.css?v=20260902"><link rel="stylesheet" href="/assets/css/fmb-news-mobile-app-polish.css?v=20260902"><link rel="stylesheet" href="/assets/css/fmb-fact-check.css?v=20260902">`;
}

function articlePage(article, record) {
  const canonical = `${origin}/news/fact-check/${article.slug}/`;
  const desc = article.claim.replace(/\s+/g, ' ').slice(0, 200);
  const sections = article.sections.map(section => `<section><h2>${esc(section.heading)}</h2><p>${esc(section.body)}</p></section>`).join('');
  const evidence = record.evidence.map(item => `<li><strong>${esc(item.title)}</strong> — ${esc(item.publisher)}. <a href="${esc(item.url)}" rel="noopener noreferrer">Source record</a><br>${esc(item.supports || '')}</li>`).join('');
  const attribution = record.derivedFrom
    ? `<p class="fc-note"><strong>Research lead attribution:</strong> ${esc(record.derivedFrom.publisher)} documented the circulating claim. <a href="${esc(record.derivedFrom.url)}" rel="noopener noreferrer">See the documented research lead.</a> ${esc(record.derivedFrom.note || '')}</p>`
    : '';
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: desc,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection: 'FMB Fact Check',
    genre: 'Fact Check',
    author: { '@type': 'Organization', name: 'FMB Fact Check Editorial Team' },
    publisher: { '@type': 'Organization', name: 'Filipino Media Bulletin', url: `${origin}/news/` }
  };

  return `<!doctype html><html lang="en-PH"><head>${head(`${article.title} | FMB Fact Check`, desc, canonical)}<script type="application/ld+json">${JSON.stringify(structured).replaceAll('<', '\\u003c')}</script></head><body class="fmb-fact-check-route">${nav()}<main class="fc-article-wrap"><article class="fc-shell fc-article"><a class="fc-back" href="/news/fact-check/">← FMB Fact Check</a><div class="fc-article-meta"><div class="fc-date">${esc(dateLabel(article.period))}</div>${ratingBadge(article.rating, true)}</div><h1>${esc(article.title)}</h1><div class="fc-claim"><strong>Claim:</strong> ${esc(article.claim)}</div>${sections}<section class="fc-evidence"><h2>Sources and evidence</h2><p><strong>Claim source:</strong> <a href="${esc(record.claimSource.url)}" rel="noopener noreferrer">Documented circulating claim</a>. Captured ${esc(record.claimSource.capturedAt)}.</p><ul>${evidence}</ul>${attribution}<p class="fc-note">Rating reached independently by FMB after reviewing the evidence listed above. A rating describes the claim checked here; it is not a finding of criminal or civil liability.</p></section></article></main>${footer()}<script src="/assets/js/fmb-news-mobile-global.js?v=20260902" defer></script><script src="/assets/js/fmb-news-mobile-products.js?v=20260902" defer></script></body></html>`;
}

function card(article) {
  const search = `${article.title} ${article.claim} ${article.rating} ${article.period}`.toLowerCase();
  return `<a class="fc-card" href="/news/fact-check/${esc(article.slug)}/" data-rating="${esc(article.rating)}" data-search="${esc(search)}"><div class="fc-card-date">${esc(dateLabel(article.period))}</div><div><h2>${esc(article.title)}</h2><p>${esc(article.claim)}</p></div><div>${ratingBadge(article.rating)}<span class="fc-arrow" aria-hidden="true">›</span></div></a>`;
}

const current = JSON.parse(await readFile(currentPath, 'utf8'));
if (!Array.isArray(current) || !current.length) throw new Error('Current Fact Check inventory is empty.');

const seen = new Set();
for (const article of current) {
  if (!article.id || !article.slug || !article.title || !article.claim || !article.period || !Number.isFinite(Date.parse(article.publishedAt)) || !ratingMeta[article.rating]) {
    throw new Error(`Current Fact Check item is incomplete: ${article.slug || article.title || article.id || 'unknown'}`);
  }
  if (seen.has(article.slug)) throw new Error(`Duplicate current Fact Check slug: ${article.slug}`);
  seen.add(article.slug);
  if (!Array.isArray(article.sections) || !article.sections.some(section => section.heading === 'The FMB verdict')) {
    throw new Error(`${article.slug}: missing The FMB verdict section`);
  }

  const record = JSON.parse(await readFile(path.join(evidenceRoot, `${article.slug}.json`), 'utf8'));
  const primary = Array.isArray(record.evidence) ? record.evidence.filter(item => item?.kind === 'primary' && /^https?:\/\//i.test(String(item.url || ''))) : [];
  if (record.slug !== article.slug) throw new Error(`${article.slug}: evidence slug mismatch`);
  if (record.rating !== article.rating || record.ratingReachedBy !== 'FMB') throw new Error(`${article.slug}: evidence rating contract failed`);
  if (!/^https?:\/\//i.test(String(record.claimSource?.url || ''))) throw new Error(`${article.slug}: missing claim source URL`);
  if (!primary.length) throw new Error(`${article.slug}: no primary evidence attached`);

  const dir = path.join(factRoot, article.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), articlePage(article, record), 'utf8');
}

let existingIndex = [];
try { existingIndex = JSON.parse(await readFile(dataPath, 'utf8')); } catch {}
const currentIndex = current.map(article => ({
  id: article.id,
  title: article.title,
  rating: article.rating,
  period: article.period,
  publishedAt: article.publishedAt,
  sortKey: article.publishedAt,
  slug: article.slug,
  url: `/news/fact-check/${article.slug}/`
}));
const merged = [...existingIndex.filter(item => !seen.has(item.slug)), ...currentIndex]
  .sort((a, b) => String(b.sortKey || b.period).localeCompare(String(a.sortKey || a.period)) || Number(a.id) - Number(b.id));
await mkdir(path.dirname(dataPath), { recursive: true });
await writeFile(dataPath, JSON.stringify(merged, null, 2), 'utf8');

const archivePath = path.join(factRoot, 'index.html');
let archive = await readFile(archivePath, 'utf8');
const newCards = current.map(card).join('');
archive = archive.replace('<div class="fc-list">', `<div class="fc-list">${newCards}`);
archive = archive.replace(/<div class="fc-empty">[\s\S]*?<\/div>/i, '');

// Rewrite the held-queue disclosure for the counts this page now shows; do NOT
// delete it. This line used to strip it, which is how the desk stopped telling
// readers that 123 drafted checks were waiting on verification the moment the
// first three published. The held queue is a standing editorial fact about this
// desk, not an empty state, and it is what makes the promise in the hero --
// "A check publishes only once FMB has attached the primary records it rests
// on" -- something a reader can see rather than take on trust.
const heldCount = Number(JSON.parse(await readFile(ledgerPath, 'utf8')).held || 0);
const note = heldNote(merged.length, heldCount);
if (HELD_NOTE_PATTERN.test(archive)) {
  archive = archive.replace(HELD_NOTE_PATTERN, note);
} else if (note) {
  // The renderer always emits the note while anything is held, so arriving here
  // means the markup moved. Fail rather than publish a page that quietly drops
  // the disclosure -- that silent drop is the entire defect this replaces.
  throw new Error('Fact Check archive is missing the held-queue disclosure; render-fmb-fact-check.mjs must emit it before this pass.');
}

archive = archive.replace(/id="fcCount">\d+ fact checks/i, `id="fcCount">${merged.length} fact checks`);
const counts = Object.fromEntries(Object.keys(ratingMeta).map(rating => [rating, merged.filter(item => item.rating === rating).length]));
archive = archive.replace(/<p class="fc-counts">[\s\S]*?<\/p>/i, `<p class="fc-counts">${counts.TRUE} TRUE · ${counts['VERIFIED FACT']} VERIFIED FACT · ${counts.MISLEADING} MISLEADING · ${counts.FALSE} FALSE</p>`);
await writeFile(archivePath, archive, 'utf8');

const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
ledger.generatedAt = new Date().toISOString().slice(0, 10);
ledger.total = Number(ledger.total || 0) + current.length;
ledger.published = Number(ledger.published || 0) + current.length;
await writeFile(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');

console.log(`Published ${current.length} verified current FMB Fact Check articles alongside ${existingIndex.length} cleared archive item(s).`);
