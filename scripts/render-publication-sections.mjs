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


/* -------------------------------------------------------------- legal pages */
// /privacy/ and /terms/ were linked from the footer of all 571 pages and both
// 404'd: the links pointed at the site root, which the Cloudflare worker does
// not serve -- it only answers /news/*. They are rendered here, under /news/,
// and the footer links are repointed to match.
//
// Every factual statement below was taken from the codebase rather than from a
// template. The audit behind it:
//
//   device storage   localStorage only, no cookies anywhere in the codebase:
//                    fmbThemeModeV1, fmbNewsPrefsV1, fmbSavedStoriesV1,
//                    fmbNewsEmailV1, fmbZodiacV1
//   sent to FMB      fmb_news_subscribers (Daily Brief email),
//                    auth/v1/otp (passwordless sign-in),
//                    news_push_subscriptions (endpoint, keys, platform, and
//                    the browser string truncated to 500 characters)
//   third parties    Supabase, Cloudflare, Google Fonts, Open-Meteo
//   location         navigator.geolocation, only on an explicit tap, with
//                    enableHighAccuracy:false
//   analytics        none -- no gtag, GTM, Meta pixel, Hotjar, Plausible,
//                    Matomo, Segment or Mixpanel appears anywhere
//
// The paragraphs that carry legal effect rather than describing observable
// behaviour are marked as pending the publisher's review, visibly on the page.
// A drafted policy that has not been reviewed should not read as if it has.

const LEGAL_REVIEW = `<p class="fmb-legal-status" role="note"><b>Status: draft pending review.</b> The technical descriptions on this page were taken directly from the FMB News codebase and are accurate as built. The clauses that carry legal effect have not yet been reviewed by the publisher or by counsel, and should be reviewed before this page is relied upon.</p>`;

const legalPage = ({ slug, h1, kicker, title, description, lede, sections }) => page({
  slug,
  title,
  description,
  ld: {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: h1,
    url: `${ORIGIN}/news/${slug}/`,
    description,
    inLanguage: 'en-PH',
    isPartOf: { '@type': 'WebSite', name: 'FMB News', url: `${ORIGIN}/news/` },
    publisher: { '@type': 'NewsMediaOrganization', name: 'FMB News', alternateName: 'Filipino Media Bulletin', url: `${ORIGIN}/news/` },
  },
  body: `
    <div class="fmb-sec-shell">
      <p class="fmb-sec-kicker">${esc(kicker)}</p>
      <h1>${h1}</h1>
      <div class="fmb-sec-rule" aria-hidden="true"></div>
      <p class="fmb-sec-lede">${lede}</p>
      <div class="fmb-legal">
        ${LEGAL_REVIEW}
        ${sections.map(([heading, ...paras]) => `<section aria-labelledby="${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}"><h2 id="${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${esc(heading)}</h2>${paras.join('')}</section>`).join('')}
      </div>
    </div>`,
});

const CONTACT = '<a href="mailto:withlovefmb@gmail.com">withlovefmb@gmail.com</a>';

const privacy = legalPage({
  slug: 'privacy',
  kicker: 'FMB News · Filipino Media Bulletin',
  h1: 'Privacy',
  title: 'Privacy | FMB News · Filipino Media Bulletin',
  description: 'What FMB News stores on your device, what you send us, which services we rely on, and what we deliberately do not do. FMB News sets no cookies and runs no analytics.',
  lede: 'FMB News is a newsroom, not an advertising business. This page states plainly what is stored, what is sent, and who else is involved when you read the bulletin.',
  sections: [
    ['What we do not do',
      '<p>FMB News sets <b>no cookies</b>. It runs <b>no analytics</b>, no advertising, no tracking pixels and no third-party measurement of any kind. There is no advertising network, no data broker and no sale or rental of reader information. These are not policy promises layered on top of the product &mdash; there is no such code in the site.</p>'],
    ['What stays on your device',
      '<p>Your reading preferences are kept in your own browser&rsquo;s local storage. They are never uploaded on their own, and clearing your browser data removes them permanently.</p>',
      '<ul><li><b>Appearance</b> &mdash; whether you chose System, Light or Dark.</li><li><b>Feed preferences</b> &mdash; the desks and topics you asked to see more of.</li><li><b>Saved stories</b> &mdash; the reports you saved to read later.</li><li><b>Sign-in email</b> &mdash; only if you asked to stay signed in.</li><li><b>Horoscope sign</b> &mdash; only if you chose one.</li></ul>'],
    ['What reaches FMB News',
      '<p>Three things, each only when you start them:</p>',
      '<ul><li><b>The Daily Brief.</b> If you subscribe, your email address is stored so the briefing can be sent to you.</li><li><b>Signing in.</b> FMB News uses passwordless sign-in: you give an email address, we send a one-time code, and there is no password to store or lose.</li><li><b>Story alerts.</b> If you turn on alerts, your browser&rsquo;s push address, its encryption keys, your platform and a shortened browser identification string are stored so a notification can reach that device. Turning alerts off deletes it.</li></ul>'],
    ['Weather and location',
      '<p>The weather panel is the only feature that can use your location, and only when you tap to allow it. FMB News requests <b>low-accuracy</b> location, uses it once to fetch the forecast, and does not store it. You can type a city instead and share nothing. The forecast itself comes from Open-Meteo.</p>'],
    ['Services FMB News relies on',
      '<ul><li><b>Supabase</b> &mdash; database, passwordless sign-in and alert delivery.</li><li><b>Cloudflare</b> &mdash; serving the site. Like any host, it processes the network request that delivers a page to you.</li><li><b>Google Fonts</b> &mdash; delivering the typefaces. Loading a font makes a request to Google, which sees the IP address that request comes from.</li><li><b>Open-Meteo</b> &mdash; the weather forecast, as described above.</li></ul>',
      '<p>Image credits sometimes link to Wikimedia Commons. Following such a link takes you to that site, under its own terms.</p>'],
    ['Your controls',
      '<ul><li>Clear your browser data to remove everything stored on your device.</li><li>Unsubscribe from any Daily Brief email to stop the briefing.</li><li>Turn off alerts in the Menu to delete the push record for that device.</li><li>Write to us at ' + CONTACT + ' to ask what is held about you, or to ask for it to be deleted.</li></ul>'],
    ['Children',
      '<p>FMB News is a general news publication and is not directed at children.</p>'],
    ['Changes',
      '<p>If this page changes, the revised version is published here. Material changes will be noted on the page rather than made quietly.</p>'],
    ['Contact',
      '<p>Questions about this page, or about anything held about you, go to ' + CONTACT + '.</p>'],
  ],
});

const terms = legalPage({
  slug: 'terms',
  kicker: 'FMB News · Filipino Media Bulletin',
  h1: 'Terms of Use',
  title: 'Terms of Use | FMB News · Filipino Media Bulletin',
  description: 'The terms on which FMB News, the Filipino Media Bulletin, publishes: who publishes it, how the reporting may be used, what the reader features are, and how corrections work.',
  lede: 'These terms cover reading FMB News and using its reader features. They sit alongside the editorial standards, which govern how the reporting itself is produced.',
  sections: [
    ['Who publishes this',
      `<p>FMB News, the Filipino Media Bulletin, is published by Francine Marie Bautista. How the reporting is produced, sourced and corrected is set out in the <a href="/news/editorial-standards/">editorial standards</a> and the <a href="/news/corrections/">corrections policy</a>.</p>`],
    ['Using the bulletin',
      '<p>You are welcome to read, link to, quote and share FMB News reporting with attribution. Republishing whole articles, or reproducing FMB-owned visuals outside a link or short quotation, needs permission first.</p>'],
    ['Accuracy and corrections',
      `<p>FMB News reports what can be established and says plainly what is still open. When something is wrong, it is corrected on the record rather than edited away &mdash; see the <a href="/news/corrections/">corrections policy</a>. If you believe a report is inaccurate, write to ${CONTACT}.</p>`],
    ['Images and credits',
      '<p>Photographs and documents from third parties are credited to their source and used under their own licences, including Creative Commons licences where stated. Visuals produced by FMB News are labelled as FMB-owned editorial visuals and are not documentary photographs; that label appears on the image itself.</p>'],
    ['Reader features',
      '<p>The Weekly Horoscope and the FMB Crossword are entertainment features. The horoscope is reflective writing, not prediction, and nothing in it should be treated as advice &mdash; medical, financial, legal or otherwise. Crossword answers stay sealed until the following edition.</p>'],
    ['Accounts, the Daily Brief and alerts',
      '<p>Signing in, subscribing to the Daily Brief and enabling alerts are optional and can be undone at any time. What each one stores is set out on the <a href="/news/privacy/">privacy page</a>. Please do not use these features to impersonate someone else or to submit an address you do not control.</p>'],
    ['Availability',
      '<p>FMB News is published continuously but is not guaranteed to be uninterrupted. Features that depend on outside services &mdash; the weather panel, alert delivery, sign-in &mdash; can be unavailable when those services are.</p>'],
    ['Governing law',
      '<p>These terms are governed by the laws of the Republic of the Philippines.</p>'],
    ['Changes',
      '<p>If these terms change, the revised version is published here.</p>'],
    ['Contact',
      '<p>Questions about these terms go to ' + CONTACT + '.</p>'],
  ],
});

for (const [slug, html] of [['founder', founder], ['entertainment', entertainment], ['privacy', privacy], ['terms', terms]]) {
  const dir = path.join(newsRoot, slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), html, 'utf8');
}
console.log('Rendered /news/founder/, /news/entertainment/, and the two legal routes /news/privacy/ and /news/terms/ that the footer linked on all 571 pages and that both 404d.');
