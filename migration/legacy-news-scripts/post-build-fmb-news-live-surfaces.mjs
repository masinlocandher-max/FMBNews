import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import './post-build-fmb-news-ai-francine-august-8.mjs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');

const reports = [
  {
    href: '/news/francine-marie-bautista-ai-photography-creative-skill/',
    canonical: 'https://www.francinemariebautista.com/news/francine-marie-bautista-ai-photography-creative-skill/',
    title: 'Using AI Does Not Make You Less of a Photographer: Francine Marie Bautista on Skill, Tools and Creative Judgment',
  },
  {
    href: '/news/francine-marie-bautista-pax-silica-terms-must-be-clear/',
    canonical: 'https://www.francinemariebautista.com/news/francine-marie-bautista-pax-silica-terms-must-be-clear/',
    title: 'Francine Marie Bautista on Pax Silica: “Terms Must Be Clear. Questions Must Be Answered.”',
  },
  {
    href: '/news/francine-marie-bautista-ai-literacy-minimize-risks/',
    canonical: 'https://www.francinemariebautista.com/news/francine-marie-bautista-ai-literacy-minimize-risks/',
    title: 'AI Has Risks. Francine Marie Bautista Says the Answer Is to Learn How to Use It Properly',
  },
  {
    href: '/news/world-bank-philippines-growth-forecast-2026/',
    canonical: 'https://www.francinemariebautista.com/news/world-bank-philippines-growth-forecast-2026/',
    title: 'World Bank Holds Philippine Growth Forecast at 3.7% as Recovery Risks Persist',
  },
  {
    href: '/news/measles-rubella-vaccination-august-2026-fmb-news-1pm/',
    canonical: 'https://www.francinemariebautista.com/news/measles-rubella-vaccination-august-2026-fmb-news-1pm/',
    title: 'August Measles-Rubella Vaccination Drive Targets Young Children',
  },
  {
    href: '/news/fmb-news-hourly-briefing-august-5-2026-noon/',
    canonical: 'https://www.francinemariebautista.com/news/fmb-news-hourly-briefing-august-5-2026-noon/',
    title: 'FMB News Hourly Briefing: Space, Technology, Markets and Sport',
  },
  {
    href: '/news/spent-falcon-9-stage-lunar-impact-august-5-2026/',
    canonical: 'https://www.francinemariebautista.com/news/spent-falcon-9-stage-lunar-impact-august-5-2026/',
    title: 'Spent Falcon 9 Stage Expected to Strike the Moon',
  },
  {
    href: '/news/un-security-council-second-secretary-general-poll-august-21/',
    canonical: 'https://www.francinemariebautista.com/news/un-security-council-second-secretary-general-poll-august-21/',
    title: 'UN Security Council Targets August 21 for Second Secretary-General Poll',
  },
  {
    href: '/news/italy-heat-alert-system-27-cities-public-health-august-2026/',
    canonical: 'https://www.francinemariebautista.com/news/italy-heat-alert-system-27-cities-public-health-august-2026/',
    title: 'Italy’s 27-City Heat Alert System Puts Public Health at the Center',
  },
  {
    href: '/news/psa-july-2026-inflation-briefing-august-5/',
    canonical: 'https://www.francinemariebautista.com/news/psa-july-2026-inflation-briefing-august-5/',
    title: 'PSA Holds Briefing on July 2026 Inflation',
  },
];

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function replaceMeta(html, kind, key, value) {
  const pattern = new RegExp(`<meta\\s+${kind}=["']${key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}["']\\s+content=["'][^"']*["']\\s*\\/?\\s*>`, 'i');
  const tag = `<meta ${kind}="${key}" content="${esc(value)}">`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `${tag}</head>`);
}

function currentCollectionSchema() {
  return `<script type="application/ld+json" data-fmb-news-current-collection>${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://www.francinemariebautista.com/fmbnews/#page',
    url: 'https://www.francinemariebautista.com/fmbnews/',
    name: 'FMB News',
    description: 'FMB News gathers the latest reports, makes them clear, and explains why they matter to Filipinos.',
    inLanguage: 'en-PH',
    dateModified: '2026-08-08T22:09:00+08:00',
    mainEntity: { '@id': 'https://www.francinemariebautista.com/fmbnews/#august-5-2026-timeline' },
    hasPart: reports.map((report) => ({
      '@type': 'NewsArticle',
      url: report.canonical,
      headline: report.title,
    })),
  })}</script>`;
}

function replaceVisibleTicker(html, routeName) {
  const tickerStart = html.indexOf('<div class="fmb-news-ticker"');
  const tickerEnd = html.indexOf('<span class="fmb-news-time"', tickerStart);
  if (tickerStart < 0 || tickerEnd <= tickerStart) {
    throw new Error(`${routeName} is missing the visible headline ticker`);
  }

  const anchors = reports.map((report) => `<a href="${esc(report.href)}">${esc(report.title)}</a>`).join('');
  const groups = [
    `<div class="fmb-news-ticker-group">${anchors}</div>`,
    `<div class="fmb-news-ticker-group" aria-hidden="true">${anchors}</div>`,
  ];
  let groupIndex = 0;
  const ticker = html.slice(tickerStart, tickerEnd).replace(
    /<div class="fmb-news-ticker-group"(?: aria-hidden="true")?>[\s\S]*?<\/div>/g,
    () => groups[groupIndex++] ?? '',
  );
  if (groupIndex < 2) throw new Error(`${routeName} ticker did not expose two replaceable headline groups`);
  return `${html.slice(0, tickerStart)}${ticker}${html.slice(tickerEnd)}`;
}

function removeStaleSchemas(html) {
  let cleaned = html.replace(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    (script) => script.includes('/fmbnews/#stories') ? '' : script,
  );
  cleaned = cleaned.replace(
    /<script\b[^>]*data-fmb-news-complete-archive[^>]*>[\s\S]*?<\/script>\s*/gi,
    '',
  );
  cleaned = cleaned.replace(
    /<script\b[^>]*data-fmb-news-current-collection[^>]*>[\s\S]*?<\/script>\s*/gi,
    '',
  );
  return cleaned;
}

function verify(html, routeName) {
  if (html.includes('/fmbnews/#stories')) throw new Error(`${routeName} still contains the stale stories schema`);
  if (html.includes('data-fmb-news-complete-archive')) throw new Error(`${routeName} still contains the stale incomplete archive schema`);
  if (!html.includes('data-fmb-news-current-collection')) throw new Error(`${routeName} is missing the current collection schema`);
  if (!html.includes('data-fmb-news-august-5-timeline')) throw new Error(`${routeName} is missing the authoritative August 5 timeline schema`);

  const tickerStart = html.indexOf('<div class="fmb-news-ticker"');
  const tickerEnd = html.indexOf('<span class="fmb-news-time"', tickerStart);
  const ticker = html.slice(tickerStart, tickerEnd);
  let previous = -1;
  for (const report of reports) {
    const position = ticker.indexOf(`href="${report.href}"`);
    if (position < 0) throw new Error(`${routeName} ticker is missing ${report.href}`);
    if (position <= previous) throw new Error(`${routeName} ticker is out of chronological order at ${report.href}`);
    previous = position;
  }

  const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] || '';
  const twitterImage = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)?.[1] || '';
  if (!ogImage.includes('/assets/images/fmb-approved/fmb-news-official-transparent.webp')) {
    throw new Error(`${routeName} has the wrong Open Graph image: ${ogImage}`);
  }
  if (!twitterImage.includes('/assets/images/fmb-approved/fmb-news-official-transparent.webp')) {
    throw new Error(`${routeName} has the wrong Twitter image: ${twitterImage}`);
  }
}

for (const relative of ['news/index.html', 'fmbnews/index.html']) {
  const file = path.join(dist, relative);
  const routeName = `/${relative.replace('/index.html', '')}`;
  let html = await readFile(file, 'utf8');

  html = removeStaleSchemas(html);
  html = replaceVisibleTicker(html, routeName);
  html = replaceMeta(html, 'property', 'og:image', 'https://www.francinemariebautista.com/assets/images/fmb-approved/fmb-news-official-transparent.webp');
  html = replaceMeta(html, 'property', 'og:image:secure_url', 'https://www.francinemariebautista.com/assets/images/fmb-approved/fmb-news-official-transparent.webp');
  html = replaceMeta(html, 'property', 'og:image:type', 'image/webp');
  html = replaceMeta(html, 'property', 'og:image:width', '909');
  html = replaceMeta(html, 'property', 'og:image:height', '210');
  html = replaceMeta(html, 'property', 'og:image:alt', 'FMB News');
  html = replaceMeta(html, 'name', 'twitter:image', 'https://www.francinemariebautista.com/assets/images/fmb-approved/fmb-news-official-transparent.webp');
  html = replaceMeta(html, 'name', 'twitter:image:alt', 'FMB News');
  html = html.replace('</head>', `${currentCollectionSchema()}</head>`);

  verify(html, routeName);
  await writeFile(file, html, 'utf8');
  console.log(`Aligned the live ticker, social preview and structured data with the August 8 AI interview series in ${relative}.`);
}
