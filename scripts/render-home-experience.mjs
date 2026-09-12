import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = path.join(root, 'dist', 'news', 'index.html');
const contentRoot = path.join(root, 'content', 'news', 'articles');
const fallback = '/assets/images/news/fmb-news-editorial-fallback.svg';
const approvedHero = '/assets/images/mobile/fmb-mobile-hero.jpg';
const approvedMug = '/assets/images/mobile/fmb-daily-brief-mug.jpg';

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const fmtTime = (iso) => {
  try {
    return `${new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(iso))} PHT`;
  } catch {
    return '';
  }
};

const readTime = (story) => Math.max(1, Math.ceil(
  (story.sections || [])
    .flatMap((section) => section.paragraphs || [])
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length / 220,
));

async function walk(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(target));
    else if (entry.isFile() && entry.name.endsWith('.json')) out.push(target);
  }
  return out;
}

async function publishedStories() {
  const out = [];
  for (const file of await walk(contentRoot)) {
    try {
      const story = JSON.parse(await readFile(file, 'utf8'));
      if (story.status === 'published' && story.slug && story.headline && story.publishedAt) out.push(story);
    } catch {
      // Invalid content records are ignored here and remain covered by editorial verification.
    }
  }
  return out.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

function imageFor(story) {
  const url = String(story?.image?.url || '').trim();
  return /^https?:\/\//i.test(url) || url.startsWith('/') ? url : fallback;
}

function storyMeta(story) {
  return `<div class="fmb-app-story-meta"><span>${esc(story.category || story.kicker || 'News')}</span><span>·</span><time datetime="${esc(story.publishedAt)}">${esc(fmtTime(story.publishedAt))}</time><span>·</span><span>${readTime(story)} min</span></div>`;
}

function storyRow(story) {
  return `<a class="fmb-app-story-row" href="/news/${esc(story.slug)}/"><img src="${esc(imageFor(story))}" alt="${esc(story.image?.alt || story.headline)}" loading="lazy"><div class="fmb-app-story-copy">${storyMeta(story)}<h3>${esc(story.headline)}</h3></div></a>`;
}

function breakingStory(stories) {
  return stories.find((story) => story?.audit?.push_alert === true || story?.push_alert === true || story?.breaking === true);
}

function renderMobileHome(stories) {
  if (!stories.length) throw new Error('Cannot build FMB mobile app home without published stories.');

  const latest = stories.slice(0, 5);
  const breaking = breakingStory(stories);
  const tickerStories = stories.slice(0, 4);
  const tickerLabel = breaking ? 'BREAKING' : 'HEADLINES';
  const tickerHref = breaking ? `/news/${esc(breaking.slug)}/` : '#fmb-app-latest-title';
  const tickerGroup = tickerStories.map((story) => `<i>${esc(story.headline)}</i>`).join('');

  return `<div class="fmb-mobile-app-home" data-fmb-mobile-home>
  <a class="fmb-approved-hero-ticker fmb-app-top-ticker" href="${tickerHref}" aria-label="${tickerLabel}">
    <strong>${tickerLabel}</strong>
    <span class="fmb-approved-hero-ticker-window"><span class="fmb-approved-hero-ticker-track"><span class="fmb-approved-hero-ticker-group">${tickerGroup}</span><span class="fmb-approved-hero-ticker-group" aria-hidden="true">${tickerGroup}</span></span></span>
    <b aria-hidden="true">›</b>
  </a>
  <section class="fmb-app-brand-hero" aria-label="FMB News live home">
    <img src="${approvedHero}" alt="FMB News Philippines newsroom hero with the Philippine flag, global map, broadcast camera and official gold shell emblem" fetchpriority="high" data-fmb-approved-hero>
    <span class="fmb-hero-readable-shade" aria-hidden="true"></span>
    <div class="fmb-approved-hero-copy">
      <p data-fmb-greeting>Afternoon update</p>
      <h1 data-fmb-greeting-line data-fmb-rotating-slogan>The world is still moving. Here’s what changed.</h1>
      <p class="fmb-approved-hero-deck">Stay informed with verified facts, meaningful context, and perspectives that help you understand what matters.</p>
      <div class="fmb-approved-hero-cta">
        <a href="#fmb-app-latest-title">Read the Latest</a>
        <button type="button" data-fmb-customize>Customize</button>
      </div>
    </div>
    <div class="fmb-hero-live-overlay" aria-label="Live local date, time and weather">
      <div class="fmb-hero-clock"><strong data-fmb-local-date>Today</strong><span data-fmb-local-time>--:--</span></div>
      <button class="fmb-hero-weather" type="button" data-fmb-weather-button aria-label="Set local weather"><span class="fmb-hero-weather-icon" data-fmb-weather-icon aria-hidden="true">☀</span><span class="fmb-hero-weather-copy"><strong data-fmb-weather>Weather</strong><small data-fmb-weather-note>Tap for local weather</small></span></button>
    </div>
  </section>
  <section class="fmb-app-section" aria-labelledby="fmb-app-latest-title">
    <div class="fmb-app-section-head"><h2 id="fmb-app-latest-title">Latest News</h2><a href="/news/archive/">View all</a></div>
    <div class="fmb-app-story-list">${latest.map(storyRow).join('')}</div>
  </section>
  <section class="fmb-app-feature-grid" aria-label="FMB News features">
    <a class="fmb-app-feature-card brief" href="/news/fmb-brief/live/"><img src="${approvedMug}" alt="FMB Daily Brief coffee mug with gold FMB emblem" loading="lazy" data-fmb-approved-mug><span class="fmb-feature-shade" aria-hidden="true"></span><div><span>FMB Daily Brief</span><h2>Your essential rundown in minutes.</h2><b>Read today’s brief ›</b></div></a>
    <a class="fmb-app-feature-card worldwide" href="/news/world/"><span class="fmb-world-grid" aria-hidden="true"></span><div><span>FMB Worldwide</span><h2>Global stories. Local perspective.</h2><b>Explore Worldwide ›</b></div></a>
  </section>
  <section class="fmb-app-section fmb-app-week" aria-labelledby="fmb-app-week-title">
    <div class="fmb-app-section-head"><h2 id="fmb-app-week-title">This Week</h2></div>
    <div class="fmb-app-week-grid">
      <a class="fmb-app-week-card horoscope" href="/news/horoscope/"><span class="fmb-app-week-art" aria-hidden="true">☾</span><span class="fmb-app-week-kicker">Lifestyle · Entertainment</span><h3>Weekly Horoscope</h3><p>All 12 zodiac signs, with free will kept front and center.</p><b>Read this week ›</b></a>
      <a class="fmb-app-week-card crossword" href="/news/crossword/"><span class="fmb-mini-grid" aria-hidden="true"><i></i><i></i><i class="on"></i><i></i><i class="on"></i><i class="on"></i><i></i><i class="on"></i><i></i></span><span class="fmb-app-week-kicker">Weekly Current Events</span><h3>FMB Crossword</h3><p>35+ clues drawn from the week’s verified news cycle.</p><b>Play now ›</b></a>
    </div>
  </section>
</div>`;
}

function applyDesktopPublicationLanding(html) {
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>Filipino Media Bulletin | FMB News, Worldwide, Explainer, Fact Check and Daily Brief</title>');
  html = html.replace(/<meta name="description" content="[^"]*">/i, '<meta name="description" content="Filipino Media Bulletin brings together FMB News, FMB Worldwide, FMB Explainer, FMB Fact Check, and FMB Daily Brief.">');
  html = html.replace(/<meta property="og:site_name" content="[^"]*">/i, '<meta property="og:site_name" content="Filipino Media Bulletin">');
  html = html.replace(/<meta property="og:title" content="[^"]*">/i, '<meta property="og:title" content="Filipino Media Bulletin">');
  html = html.replace(/<meta property="og:description" content="[^"]*">/i, '<meta property="og:description" content="Five editorial products: FMB News, FMB Worldwide, FMB Explainer, FMB Fact Check, and FMB Daily Brief.">');

  html = html.replace(/<link[^>]+fmb-news-landing-hardfix\.css[^>]*>/gi, '');
  html = html.replace(/<style data-fmb-four-products>[\s\S]*?<\/style>/gi, '');
  if (!html.includes('/assets/css/fmb-news-publication-landing.css')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="/assets/css/fmb-news-publication-landing.css?v=20260912-five-product"></head>');
  }
  if (!html.includes('/assets/images/brand/fmb-bulletin-emblem.svg')) {
    html = html.replace('</head>', '<link rel="icon" type="image/svg+xml" href="/assets/images/brand/fmb-bulletin-emblem.svg"></head>');
  }

  html = html.replace(/<body\s+class="([^"]*)"/i, (_match, classes) => {
    const set = new Set(classes.split(/\s+/).filter(Boolean));
    set.delete('fmb-news-route');
    set.add('fmb-network-landing');
    return `<body class="${[...set].join(' ')}"`;
  });

  const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25"></circle><path d="m15.1 15.1 5 5"></path></svg>';
  const newspaperIcon = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="11" y="10" width="26" height="28" rx="2"></rect><path d="M16 16h16M16 22h7M27 22h5M16 28h16M16 33h11"></path><path d="M8 15v20a3 3 0 0 0 3 3"></path></svg>';
  const globeIcon = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="16"></circle><path d="M8 24h32M24 8c5 4 7 10 7 16s-2 12-7 16M24 8c-5 4-7 10-7 16s2 12 7 16M12 15c3 2 7 3 12 3s9-1 12-3M12 33c3-2 7-3 12-3s9 1 12 3"></path></svg>';
  const explainerIcon = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 9h22v30H13z"></path><path d="M18 16h12M18 22h12M18 28h8"></path><circle cx="32" cy="31" r="5"></circle><path d="m35.5 34.5 4 4"></path></svg>';
  const factCheckIcon = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 7 38 12v10c0 9-5.8 15.2-14 19-8.2-3.8-14-10-14-19V12L24 7Z"></path><path d="m17.5 23.5 4.2 4.2 9-10"></path></svg>';
  const envelopeIcon = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="12" width="32" height="24" rx="2"></rect><path d="m10 15 14 12 14-12"></path></svg>';

  const mast = `<header class="mast publication-mast"><div class="shell publication-header-inner"><a class="publication-lockup" href="/news/" aria-label="Filipino Media Bulletin"><img class="publication-emblem" src="/assets/images/brand/fmb-bulletin-emblem.svg" alt=""><span class="publication-name"><strong class="publication-wordmark">Filipino Media Bulletin</strong><span class="publication-tagline"><span></span>Information with Purpose<span></span></span></span></a><nav class="nav publication-nav" aria-label="Filipino Media Bulletin"><a href="/news/archive/">FMB News</a><a href="/news/world/">FMB Worldwide</a><a href="/news/explainer/">FMB Explainer</a><a href="/news/fact-check/">FMB Fact Check</a><a href="/news/fmb-brief/">FMB Daily Brief</a><a href="/news/about/">About</a><a class="publication-search" href="/news/archive/" aria-label="Search FMB News">${searchIcon}</a></nav></div></header>`;
  html = html.replace(/<header class="mast[^"]*"[\s\S]*?<\/header>\s*<nav class="nav"[\s\S]*?<\/nav>/i, mast);

  const main = `<main class="network-home">
  <section class="network-hero" aria-labelledby="network-hero-title">
    <div class="network-hero-art" aria-hidden="true"></div>
    <div class="network-hero-inner">
      <div class="network-hero-copy">
        <h1 id="network-hero-title"><span>Trusted News.</span><span>Meaningful Perspectives.</span></h1>
        <div class="network-hero-rule"><span></span></div>
        <p>Five distinct editorial products, one Filipino Media Bulletin standard: verified information, useful context, and clear relevance for Filipino readers.</p>
      </div>
      <div class="network-products" aria-label="Five Filipino Media Bulletin editorial products">
        <a class="network-product news" href="/news/archive/"><span class="network-product-icon">${newspaperIcon}</span><h2>FMB News</h2><span class="network-card-rule"><i></i></span><p>Verified Philippine reporting.<br>Clear facts, concise updates,<br>and meaningful context.</p><span class="product-link">Explore FMB News <b>›</b></span></a>
        <a class="network-product world" href="/news/world/"><span class="network-product-icon">${globeIcon}</span><h2>FMB Worldwide</h2><span class="network-card-rule"><i></i></span><p>Major global developments.<br>Filtered for importance<br>and Filipino relevance.</p><span class="product-link">Explore Worldwide <b>›</b></span></a>
        <a class="network-product explainer" href="/news/explainer/"><span class="network-product-icon">${explainerIcon}</span><h2>FMB Explainer</h2><span class="network-card-rule"><i></i></span><p>Go beyond the headline.<br>Understand how things work,<br>why they happen, and why they matter.</p><span class="product-link">Open FMB Explainer <b>›</b></span></a>
        <a class="network-product fact-check" href="/news/fact-check/"><span class="network-product-icon">${factCheckIcon}</span><h2>FMB Fact Check</h2><span class="network-card-rule"><i></i></span><p>Claims examined against evidence.<br>Clear verdicts, visible reasoning,<br>and corrections when facts change.</p><span class="product-link">Open Fact Check <b>›</b></span></a>
        <a class="network-product brief" href="#fmb-daily-brief-signup"><span class="network-product-icon">${envelopeIcon}</span><h2>FMB Daily Brief</h2><span class="network-card-rule"><i></i></span><p>One concise daily briefing.<br>The developments, context,<br>and implications worth knowing.</p><span class="product-link">Get the Daily Brief <b>›</b></span></a>
      </div>
      <section class="daily-brief-signup" id="fmb-daily-brief-signup" aria-labelledby="daily-brief-title">
        <div class="daily-brief-mark"><img src="/assets/images/brand/fmb-bulletin-emblem.svg" alt="" aria-hidden="true"></div>
        <div class="brief-copy"><div class="brief-label">Your personalized FMB News</div><h2 id="daily-brief-title">FMB Daily Brief</h2><span class="brief-rule"><i></i></span></div>
        <p class="brief-promise">Sign in by email for your Daily Brief,<br>saved stories, preferences,<br>and mobile alerts.</p>
        <form data-fmb-newsletter-form novalidate><div class="brief-form-row"><label class="sr-only" for="fmb-landing-email">Email address</label><input id="fmb-landing-email" type="email" name="email" placeholder="Enter your email address" autocomplete="email" required><button type="submit">Continue</button></div><input data-fmb-newsletter-honeypot name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><label class="consent"><input type="checkbox" data-fmb-newsletter-consent required><span>Personalize FMB News and receive FMB Daily Brief. <a href="/privacy/">Privacy Policy</a>.</span></label><p class="status" data-fmb-newsletter-status role="status" aria-live="polite"></p></form>
      </section>
    </div>
  </section>
</main>`;
  html = html.replace(/<main[\s\S]*?<\/main>/i, main);

  const footer = '<footer class="footer publication-footer"><div class="shell publication-footer-inner"><img class="publication-footer-emblem" src="/assets/images/brand/fmb-bulletin-emblem.svg" alt=""><div><div class="footer-publication-title">Filipino Media Bulletin</div><div class="footer-publication-kicker">FMB News · FMB Worldwide · FMB Explainer · FMB Fact Check · FMB Daily Brief</div></div></div></footer>';
  html = html.replace(/<footer class="footer"[\s\S]*?<\/footer>/i, footer);
  html = html.replace(/<div class="ticker-label">[\s\S]*?<\/div>/i, '<div class="ticker-label"><span class="ticker-pulse" aria-hidden="true"></span>HEADLINES</div>');

  return html;
}

const stories = await publishedStories();
let html = await readFile(page, 'utf8');
html = applyDesktopPublicationLanding(html);
html = html.replace(/<div class="fmb-mobile-app-home"[\s\S]*?<\/div>\s*(?=<main class="network-home")/i, '');
html = html.replace('<main class="network-home">', `${renderMobileHome(stories)}<main class="network-home">`);
await writeFile(page, html, 'utf8');

console.log(`Rendered canonical FMB News home experience in one pass: five-product desktop Filipino Media Bulletin landing plus mobile app home with ${stories.slice(0, 5).length} latest stories.`);
