// Contact page for /news/contact/.
// Uses only channels already published elsewhere on FMB News (About/footer):
// withlovefmb@gmail.com and facebook.com/Binibiningfmb. No new emails or phones.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const ORIGIN = 'https://www.francinemariebautista.com';

const esc = (value = '') => String(value)
  .replaceAll('&', '&').replaceAll('<', '<').replaceAll('>', '>')
  .replaceAll('"', '"').replaceAll("'", '&#39;');

const iaCss = await readFile(path.join(newsRoot, 'assets', 'css', 'fmb-news-editorial-ia.css'));
const iaHref = `/assets/css/fmb-news-editorial-ia.css?v=${createHash('sha256').update(iaCss).digest('hex').slice(0, 10)}`;

const CONTACT = '<a href="mailto:withlovefmb@gmail.com">withlovefmb@gmail.com</a>';
const LEGAL_DATES = `<p class="fmb-legal-dates"><span>Effective: September 15, 2026</span> <span>Last updated: October 5, 2026</span></p>`;

const slug = 'contact';
const h1 = 'Contact';
const title = 'Contact | FMB News · Filipino Media Bulletin';
const description = 'How to reach FMB News for general inquiries, corrections, news tips, and advertising or partnership questions.';
const lede = 'Use the channels below. The same email and Facebook Page are listed on the About page and in the site footer.';
const sections = [
  ['General inquiries',
    '<p>For general questions about FMB News, write to ' + CONTACT + '.</p>',
    '<p>You can also reach the newsroom through the official Facebook Page: <a href="https://www.facebook.com/Binibiningfmb" target="_blank" rel="noopener noreferrer">facebook.com/Binibiningfmb</a>.</p>'],
  ['Corrections',
    `<p>If you believe a report is inaccurate, send a correction request to <a href="mailto:withlovefmb@gmail.com?subject=FMB%20News%20Correction">withlovefmb@gmail.com</a>. Include the story URL, the statement in question, and supporting evidence when available.</p>`,
    `<p>How corrections are handled is set out in the <a href="/news/corrections/">corrections policy</a> and the <a href="/news/editorial-standards/">editorial standards</a>.</p>`],
  ['News tips',
    `<p>For a news tip, email <a href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">withlovefmb@gmail.com</a>. Use the same address linked as Submit a Story in the footer.</p>`],
  ['Advertising and partnerships',
    '<p>For advertising or partnership inquiries with FMB News, write to ' + CONTACT + '. Rates and packages are provided on request.</p>'],
];

const body = `
    <div class="fmb-sec-shell">
      <p class="fmb-sec-kicker">${esc('FMB News · Filipino Media Bulletin')}</p>
      <h1>${h1}</h1>
      <div class="fmb-sec-rule" aria-hidden="true"></div>
      <p class="fmb-sec-lede">${lede}</p>
      <div class="fmb-legal">
        ${LEGAL_DATES}
        ${sections.map(([heading, ...paras]) => `<section aria-labelledby="${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}"><h2 id="${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${esc(heading)}</h2>${paras.join('')}</section>`).join('')}
      </div>
    </div>`;

const ld = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: h1,
  url: `${ORIGIN}/news/${slug}/`,
  description,
  inLanguage: 'en-PH',
  isPartOf: { '@type': 'WebSite', name: 'FMB News', url: `${ORIGIN}/news/` },
  publisher: { '@type': 'NewsMediaOrganization', name: 'FMB News', alternateName: 'Filipino Media Bulletin', url: `${ORIGIN}/news/` },
};

const html = `<!doctype html>
<html lang="en-PH">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
  <link rel="canonical" href="${ORIGIN}/news/${slug}/">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${ORIGIN}/news/${slug}/">
  <meta property="og:site_name" content="FMB News">
  <meta property="og:image" content="${ORIGIN}/news/assets/images/brand/fmb-bulletin-emblem.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${ORIGIN}/news/assets/images/brand/fmb-bulletin-emblem.svg">
  <link rel="stylesheet" href="${iaHref}">
  <script type="application/ld+json">${JSON.stringify(ld).replaceAll('<', '\\u003c')}</script>
</head>
<body class="fmb-news-route fmb-${slug}-page">
  <main class="fmb-sec">${body}</main>
</body>
</html>`;

const dir = path.join(newsRoot, slug);
await mkdir(dir, { recursive: true });
await writeFile(path.join(dir, 'index.html'), html, 'utf8');
console.log('Rendered /news/contact/.');
