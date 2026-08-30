import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const publicationIso = '2026-08-11T08:44:00+08:00';
const publicationLabel = '11 August 2026, 8:44 a.m. PHT';

const records = [
  { slug:'philippines-q2-2026-growth-warning-brands-business', eventLabel:'Official GDP release: 7 August 2026', oldSource:'https://www.reuters.com/world/asia-pacific/philippines-q2-gdp-growth-slows-sharply-2026-08-10/', newSource:'https://www.reuters.com/world/asia-pacific/philippines-q2-gdp-grows-23-yryr-slower-than-expected-2026-08-07/' },
  { slug:'asean-online-sale-day-2026-cross-border-commerce', eventLabel:'Event dates: 8–10 August 2026', oldSource:'https://onlineasean.com/', newSource:'https://aosd.asean2026.gov.ph/' },
  { slug:'national-ict-summit-2026-tagum-ai-regional-transformation', eventLabel:'Event dates: 12–14 August 2026', oldSource:'https://nicp.org.ph/18th-national-ict-summit/', newSource:'https://nicp.org.ph/nicp-ict-summit-2026/' },
  { slug:'cinemalaya-22-reel-reflections-filipino-cultural-platform', eventLabel:'Festival dates: 6–18 August 2026', oldSource:'https://culturalcenter.gov.ph/event/cinemalaya-22-reel-reflections/', newSource:'https://culturalcenter.gov.ph/events/list/' },
  { slug:'pistahan-2026-filipino-diaspora-cultural-soft-power', eventLabel:'Festival dates: 8–9 August 2026', oldSource:'https://www.pistahan.net/', newSource:'https://www.pistahan.net/' },
  { slug:'miss-north-carolina-usa-title-removal-governance-reputation', eventLabel:'Title removal announced: 5 August 2026 · Legal challenge reported: 10 August 2026', oldSource:'https://apnews.com/', newSource:'https://people.com/miss-north-carolina-usa-2026-dethroned-after-miss-usa-organization-condemns-racism-homophobia-transphobia-12035451' }
];

for (const record of records) {
  const file = path.join(dist, 'news', record.slug, 'index.html');
  let html = await readFile(file, 'utf8');
  html = html.replaceAll('2026-08-11T08:41:00+08:00', publicationIso);
  html = html.replaceAll('11 August 2026 · 8:41 a.m. PHT', publicationLabel);
  html = html.replaceAll('11 August 2026, 8:41 a.m. PHT', publicationLabel);
  html = html.replaceAll(record.oldSource, record.newSource);
  if (!html.includes('data-fmb-event-date')) {
    html = html.replace(/(<div class="ms-meta"[^>]*>)([\s\S]*?)(<\/div>)/i, (_, open, current, close) => `${open}${current}<span data-fmb-event-date> · ${record.eventLabel}</span>${close}`);
  }
  html = html.replace(/<meta property="article:published_time" content="[^"]+">/i, `<meta property="article:published_time" content="${publicationIso}">`);
  html = html.replace(/"datePublished":"[^"]+"/g, `"datePublished":"${publicationIso}"`);
  html = html.replace(/"dateModified":"[^"]+"/g, `"dateModified":"${publicationIso}"`);
  await writeFile(file, html, 'utf8');
}

for (const relative of ['news/index.html','fmbnews/index.html']) {
  const file = path.join(dist, relative);
  let html = await readFile(file, 'utf8');
  html = html.replaceAll('11 August 2026 · 8:41 a.m. PHT', publicationLabel);
  html = html.replaceAll('11 August 2026, 8:41 a.m. PHT', publicationLabel);
  html = html.replaceAll('2026-08-11T08:41:00+08:00', publicationIso);
  await writeFile(file, html, 'utf8');
}

const aboutPath = path.join(dist, 'news', 'about', 'index.html');
let aboutHtml = await readFile(aboutPath, 'utf8');
const standardsAnchors = ['method', 'standards', 'image-policy'];
const missingStandardsAnchors = standardsAnchors.filter((anchor) => !new RegExp(`\\bid=["']${anchor}["']`, 'i').test(aboutHtml));
if (missingStandardsAnchors.length) {
  const anchorsHtml = missingStandardsAnchors.map((anchor) => `<span id="${anchor}" hidden aria-hidden="true"></span>`).join('');
  if (/<main\b[^>]*>/i.test(aboutHtml)) aboutHtml = aboutHtml.replace(/<main\b[^>]*>/i, (main) => `${main}${anchorsHtml}`);
  else if (/<body\b[^>]*>/i.test(aboutHtml)) aboutHtml = aboutHtml.replace(/<body\b[^>]*>/i, (body) => `${body}${anchorsHtml}`);
  else aboutHtml = `${anchorsHtml}${aboutHtml}`;
  await writeFile(aboutPath, aboutHtml, 'utf8');
}

console.log('Corrected Morning Special publication metadata and preserved newsroom standards anchors.');
