// Two destinations the publication referenced but never had.
//
// /news/founder/ and /news/entertainment/ both returned 404. Founder is a
// transparency surface: who stands behind the reporting, stated plainly. It
// carries no portrait, because no approved portrait exists and inventing one —
// stock, generated, or borrowed — would be the opposite of a transparency page.
// A typographic placeholder holds the slot and says so.
//
// Entertainment is the home for the two reader features. Horoscope and Crossword
// are features inside the publication, not top-level publications, so they live
// here and stay out of the five-product rail.
//
// Both are rendered before the newsroom audit, mobile system and brand passes,
// so they inherit the shared shell, navigation, footer, theme and mobile system
// exactly like every other route rather than carrying a private copy.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const ORIGIN = 'https://www.francinemariebautista.com';

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

// Content-hashed, for the same reason the appearance layer is: a hand-typed ?v=
// that someone forgets to bump ships a stale stylesheet past a passing gate.
const iaCss = await readFile(path.join(newsRoot, 'assets', 'css', 'fmb-news-editorial-ia.css'));
const iaHref = `/assets/css/fmb-news-editorial-ia.css?v=${createHash('sha256').update(iaCss).digest('hex').slice(0, 10)}`;

function page({ slug, title, description, ld, body }) {
  return `<!doctype html>
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
}

/* ------------------------------------------------------------------ founder */
const FOUNDER_NAME = 'Francine Marie Bautista';
const founderBody = `
    <div class="fmb-sec-shell">
      <p class="fmb-sec-kicker">FMB News · Filipino Media Bulletin</p>
      <h1>The Founder</h1>
      <div class="fmb-sec-rule" aria-hidden="true"></div>
      <div class="fmb-founder-grid">
        <figure class="fmb-founder-portrait">
          <div class="fmb-founder-placeholder" role="img" aria-label="Portrait of ${esc(FOUNDER_NAME)} is not yet published">
            <b>FMB</b><span>Approved portrait pending</span>
          </div>
          <figcaption>An approved portrait of the founder has not been supplied. FMB News does not publish stock or generated likenesses of real people, so this slot stays empty until a real photograph is provided.</figcaption>
        </figure>
        <div class="fmb-founder-body">
          <p class="fmb-founder-name"><span rel="author">${esc(FOUNDER_NAME)}</span></p>
          <p class="fmb-founder-role">Founder, FMB News · Filipino Media Bulletin</p>
          <p>FMB News was founded by ${esc(FOUNDER_NAME)} around a simple editorial principle: important information should become easier to understand without losing its evidence, context, uncertainty, or consequence.</p>
          <p>That principle is why the newsroom publishes the way it does. Every report is built to answer the same four questions in order — what happened, what the context is, why it matters, and what readers should watch next — so that a reader finishes a story knowing both what is established and what is still open.</p>
          <p>It is also why the sourcing is visible rather than implied. Where a claim rests on a record, the record is named. Where something is unresolved, the reporting says so instead of rounding it into certainty.</p>
          <ul class="fmb-founder-principles">
            <li><b>Evidence first</b> Claims are measured against primary records before they are published.</li>
            <li><b>Context always</b> A development is reported alongside what produced it.</li>
            <li><b>Filipino relevance</b> Coverage is chosen and framed for the readers it serves.</li>
            <li><b>Clear uncertainty</b> What is not yet known is stated, not smoothed over.</li>
          </ul>
          <p>FMB News publishes its full editorial standards, correction practice and image-sourcing rules on the <a href="/news/about/">About FMB News</a> page.</p>
        </div>
      </div>
    </div>`;

const founder = page({
  slug: 'founder',
  title: 'The Founder | FMB News · Filipino Media Bulletin',
  description: 'FMB News was founded by Francine Marie Bautista around one editorial principle: important information should become easier to understand without losing its evidence, context, uncertainty or consequence.',
  ld: {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${ORIGIN}/news/founder/`,
    inLanguage: 'en-PH',
    mainEntity: {
      '@type': 'Person',
      name: FOUNDER_NAME,
      jobTitle: 'Founder',
      worksFor: { '@type': 'NewsMediaOrganization', name: 'FMB News', alternateName: 'Filipino Media Bulletin', url: `${ORIGIN}/news/` },
    },
    isPartOf: { '@type': 'WebSite', name: 'FMB News', url: `${ORIGIN}/news/` },
  },
  body: founderBody,
});

/* ------------------------------------------------------------ entertainment */
const features = [
  { href: '/news/horoscope/', kicker: 'Weekly · Every Sunday', title: 'Weekly Horoscope', copy: 'All twelve signs, read for the week ahead, with free will kept firmly in the reader\u2019s hands.', go: 'Read this week' },
  { href: '/news/crossword/', kicker: 'Weekly · Current events', title: 'FMB Crossword', copy: 'A current-affairs puzzle built from the week\u2019s reporting. The answer key stays sealed until the next edition goes live.', go: 'Play the puzzle' },
];
const entertainmentBody = `
    <div class="fmb-sec-shell">
      <p class="fmb-sec-kicker">FMB News · Filipino Media Bulletin</p>
      <h1>Entertainment</h1>
      <div class="fmb-sec-rule" aria-hidden="true"></div>
      <p class="fmb-sec-lede">The lighter side of the bulletin. These are reader features rather than news desks, published on their own weekly rhythm and held to the same standards of accuracy and clarity as the reporting.</p>
      <div class="fmb-ent-grid" style="margin-top:var(--fmbv2-space-8)">
        ${features.map(f => `<a class="fmb-ent-card" href="${f.href}"><em>${esc(f.kicker)}</em><h2>${esc(f.title)}</h2><p>${esc(f.copy)}</p><span data-go>${esc(f.go)} &rsaquo;</span></a>`).join('')}
      </div>
    </div>`;

const entertainment = page({
  slug: 'entertainment',
  title: 'Entertainment | FMB News · Filipino Media Bulletin',
  description: 'Reader features from FMB News: the Weekly Horoscope published every Sunday, and the FMB Crossword built from the week\u2019s current-affairs reporting.',
  ld: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Entertainment | FMB News',
    url: `${ORIGIN}/news/entertainment/`,
    description: 'Reader features from FMB News: Weekly Horoscope and the FMB Crossword.',
    inLanguage: 'en-PH',
    isPartOf: { '@type': 'WebSite', name: 'FMB News', url: `${ORIGIN}/news/` },
    hasPart: features.map(f => ({ '@type': 'WebPage', name: f.title, url: `${ORIGIN}${f.href}` })),
  },
  body: entertainmentBody,
});

for (const [slug, html] of [['founder', founder], ['entertainment', entertainment]]) {
  const dir = path.join(newsRoot, slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), html, 'utf8');
}
console.log('Rendered /news/founder/ (transparency, portrait slot held open) and /news/entertainment/ (Horoscope and Crossword as reader features, not products).');
