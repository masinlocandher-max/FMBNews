import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const strip = (value = '') => String(value)
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#0?39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/\s+/g, ' ')
  .trim();

function latestBriefFromArchive(html) {
  const start = html.search(/<a\b[^>]*class=["'][^"']*brief-issue[^"']*["'][^>]*>/i);
  if (start < 0) throw new Error('FMB Brief archive has no visible issue entry.');
  const end = html.indexOf('</a>', start);
  if (end < 0) throw new Error('FMB Brief archive first issue entry is malformed.');
  const entry = html.slice(start, end + 4);
  const href = entry.match(/\bhref=["']([^"']+)["']/i)?.[1] || '';
  const date = strip(entry.match(/<time\b[^>]*>([\s\S]*?)<\/time>/i)?.[1] || '');
  const title = strip(entry.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || '');
  const deck = strip(entry.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
  const image = entry.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const alt = entry.match(/<img\b[^>]*\balt=["']([^"']*)["'][^>]*>/i)?.[1] || title;
  if (!href || !date || !title || !deck || !image) throw new Error('Latest FMB Brief archive entry is incomplete.');
  return { href, date, title, deck, image, alt };
}

async function visibleCreditFor(route) {
  const file = path.join(dist, route.replace(/^\//, ''), 'index.html');
  const html = await readFile(file, 'utf8');
  return html.match(/<figcaption\b[^>]*class=["'][^"']*brief-credit[^"']*["'][^>]*>([\s\S]*?)<\/figcaption>/i)?.[1]?.trim() || '';
}

function patchShell(html) {
  html = html.replace(
    /<a class="brand" href="\/news\/">FMB News<small>[\s\S]*?<\/small><\/a>/i,
    '<a class="brand" href="/news/">FMB News<small>Filipino Media Bulletin</small></a>',
  );
  html = html.replace(
    /<a class="brand" href="\/news\/">FMB News<\/a>/i,
    '<a class="brand" href="/news/">FMB News<small>Filipino Media Bulletin</small></a>',
  );
  html = html.replace(
    /<a class="([^"]*)" href="\/news\/morning-special\/">Morning Special<\/a>/gi,
    '<a class="$1" href="/news/fmb-brief/">FMB Brief</a>',
  );
  html = html
    .replaceAll('/news/morning-special/', '/news/fmb-brief/')
    .replaceAll('Morning Special', 'FMB Brief')
    .replaceAll('Daily magazine edition', 'Daily newsletter');
  html = html.replace(
    '.brand small{display:inline;margin-left:16px;',
    '.brand small{display:block;margin:4px 0 0;',
  );
  html = html.replace(
    /FMB News presents current Philippine and global reports in clear chronological order, including a complete FMB Brief daily magazine edition\./gi,
    'FMB News presents current Philippine and global reporting in clear chronological order, with FMB Brief published separately as the daily newsletter.',
  );
  html = html.replace(
    /FMB Brief remains a separate full-edition archive\./gi,
    'FMB Brief remains a separate daily newsletter archive.',
  );
  return html;
}

function briefFeature(issue, creditHtml) {
  return `<section class="special" data-fmb-brief-feature><div class="section"><div class="section-head"><div><div class="eyebrow">Daily newsletter · Separate from News</div><h2>FMB Brief</h2></div><a href="/news/fmb-brief/">All briefs →</a></div><div class="edition-feature"><a class="edition-cover" href="${esc(issue.href)}"><img src="${esc(issue.image)}" alt="${esc(strip(issue.alt))}" loading="eager" decoding="async" fetchpriority="high"></a><div class="edition-feature-copy"><div class="edition-date">FMB Brief · ${esc(issue.date)}</div><h3>${esc(issue.title)}</h3><p>${esc(issue.deck)}</p><a class="button" href="${esc(issue.href)}">Read today’s brief →</a></div></div>${creditHtml ? `<div class="special-credit">${creditHtml}</div>` : ''}</div></section>`;
}

function installBriefFeature(html, feature) {
  const start = html.indexOf('<section class="special">');
  if (start >= 0) {
    const nextSection = html.indexOf('<section class="section">', start + 1);
    if (nextSection > start) return html.slice(0, start) + feature + html.slice(nextSection);
  }

  const moreReports = html.search(/<section\b[^>]*class=["'][^"']*section[^"']*["'][^>]*>\s*<div\b[^>]*class=["'][^"']*section-head[^"']*["'][^>]*>\s*<h2[^>]*>More Reports<\/h2>/i);
  if (moreReports >= 0) return html.slice(0, moreReports) + feature + html.slice(moreReports);

  const mainEnd = html.lastIndexOf('</main>');
  if (mainEnd >= 0) return html.slice(0, mainEnd) + feature + html.slice(mainEnd);

  throw new Error('Canonical FMB News homepage has no safe insertion point for the FMB Brief feature.');
}

function ensureIdentity(html) {
  if (/Filipino Media Bulletin/i.test(html)) return html;
  const brand = html.match(/<a\b[^>]*href=["']\/news\/["'][^>]*>\s*FMB News\s*<\/a>/i)?.[0];
  if (brand) return html.replace(brand, brand.replace(/<\/a>$/i, '<small>Filipino Media Bulletin</small></a>'));
  return html.replace(/(<body\b[^>]*>)/i, '$1<span class="fmb-publisher-identity" hidden>FMB News · Filipino Media Bulletin</span>');
}

function patchHomepage(html, issue, creditHtml) {
  html = ensureIdentity(patchShell(html));
  const feature = briefFeature(issue, creditHtml);
  if (html.includes('data-fmb-brief-feature')) {
    const start = html.indexOf('<section class="special" data-fmb-brief-feature>');
    const nextSection = html.indexOf('<section class="section">', start + 1);
    if (nextSection > start) html = html.slice(0, start) + feature + html.slice(nextSection);
  } else {
    html = installBriefFeature(html, feature);
  }
  if (!html.includes('.special-credit{')) {
    html = html.replace('</style>', '.special-credit{margin-top:10px;color:#d4c9d7;font-size:.7rem;line-height:1.45}.special-credit a{color:#fff}</style>');
  }
  return html;
}

const briefArchiveFile = path.join(newsRoot, 'fmb-brief', 'index.html');
const briefArchive = await readFile(briefArchiveFile, 'utf8');
const latestBrief = latestBriefFromArchive(briefArchive);
const creditHtml = await visibleCreditFor(latestBrief.href);

const homepageFile = path.join(newsRoot, 'index.html');
let homepage = await readFile(homepageFile, 'utf8');
homepage = patchHomepage(homepage, latestBrief, creditHtml);
await writeFile(homepageFile, homepage, 'utf8');

// Keep the compatibility landing byte-synchronized with the canonical News
// page until the canonical namespace cleanup runs later in the pipeline.
const aliasFile = path.join(dist, 'fmbnews', 'index.html');
const alias = homepage;
await writeFile(aliasFile, alias, 'utf8');

const archiveFile = path.join(newsRoot, 'archive', 'index.html');
let archive = ensureIdentity(patchShell(await readFile(archiveFile, 'utf8')));
await writeFile(archiveFile, archive, 'utf8');

for (const [label, html] of [['homepage', homepage], ['alias', alias], ['archive', archive]]) {
  if (/Morning Special/i.test(html)) throw new Error(`${label}: legacy Morning Special wording remains after final public-surface lock.`);
  if (!/Filipino Media Bulletin/i.test(html)) throw new Error(`${label}: Filipino Media Bulletin identity is missing.`);
  if (!/\/news\/fmb-brief\//i.test(html)) throw new Error(`${label}: FMB Brief navigation is missing.`);
}
if (!homepage.includes(`href="${latestBrief.href}"`)) throw new Error('Homepage does not feature the newest FMB Brief issue.');
if (!homepage.includes('Daily newsletter · Separate from News')) throw new Error('Homepage does not explain that FMB Brief is separate from News.');

console.log(`Final FMB News public surface locked to Filipino Media Bulletin identity and newest FMB Brief (${latestBrief.date}).`);
