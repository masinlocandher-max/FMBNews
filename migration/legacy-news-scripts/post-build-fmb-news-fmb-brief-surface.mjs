import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const latestBriefRoute = '/news/fmb-brief-august-20-2026/';
const briefArchiveRoute = '/news/fmb-brief/';
const briefHero = '/assets/images/news/brief/fmb-brief-2026-08-20-hero.webp';
const latestTitle = 'Robots rally, school safety moves to the national agenda, and energy risk travels through prices.';
const latestDeck = 'China robotics, Philippine school safety, Hormuz, U.S. bond markets, Korea diplomacy, Gaza accountability and the startup signals worth watching.';

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

const feature = `<section class="special"><div class="section"><div class="section-head"><div><div class="eyebrow">Daily newsletter</div><h2>FMB Brief</h2></div><a href="${briefArchiveRoute}">All editions →</a></div><div class="edition-feature"><a class="edition-cover" href="${latestBriefRoute}"><img src="${briefHero}" alt="FMB Brief editorial image for August 20, 2026" width="1200" height="630" loading="eager" decoding="async" fetchpriority="high"></a><div class="edition-feature-copy"><div class="edition-date">FMB Brief · August 20, 2026</div><h3>${latestTitle}</h3><p>${latestDeck}</p><a class="button" href="${latestBriefRoute}">Read today’s brief →</a></div></div></div></section>`;

function updateLanding(html, label) {
  html = html
    .replaceAll('/news/morning-special/', briefArchiveRoute)
    .replaceAll('Morning Special', 'FMB Brief')
    .replaceAll('Daily magazine edition', 'Daily newsletter')
    .replace('including a complete FMB Brief daily magazine edition.', 'including the separate FMB Brief daily newsletter.');

  const start = html.indexOf('<section class="special">');
  if (start >= 0) {
    const boundary = '</section><section class="section">';
    const end = html.indexOf(boundary, start);
    if (end < 0) throw new Error(`${label}: could not locate the end of the legacy daily-edition feature`);
    html = html.slice(0, start) + feature + html.slice(end + '</section>'.length);
  }

  const failures = [];
  if (!html.includes(briefArchiveRoute)) failures.push('FMB Brief archive link missing');
  if (!html.includes(latestBriefRoute)) failures.push('latest FMB Brief link missing');
  if (!/FMB Brief/i.test(html)) failures.push('FMB Brief identity missing');
  if (/Morning Special/i.test(html)) failures.push('legacy Morning Special wording remains');
  if (failures.length) throw new Error(`${label}: ${failures.join('; ')}`);
  return html;
}

if (!(await exists(path.join(dist, briefHero.slice(1))))) {
  throw new Error(`FMB Brief landing hero is missing: ${briefHero}`);
}

let updated = 0;
for (const relative of ['news/index.html', 'fmbnews/index.html']) {
  const file = path.join(dist, relative);
  if (!(await exists(file))) continue;
  const html = await readFile(file, 'utf8');
  await writeFile(file, updateLanding(html, relative), 'utf8');
  updated += 1;
}
if (!updated) throw new Error('No FMB News landing page was available for final Brief surface update.');
console.log(`Finalized FMB Brief navigation and August 20 newsletter feature on ${updated} FMB News landing page(s).`);
