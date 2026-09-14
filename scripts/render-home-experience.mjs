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

// The phone home is deliberately not given a lead card above Latest News. An
// earlier iteration had one and it was switched off on purpose —
// fmb-news-mobile-approved-home.css still carries
// `.fmb-mobile-route-home .fmb-app-lead{display:none!important}` — and the
// approved mobile home is the locked visual source of truth. The lead-story
// system in this pass is the desktop front page's.
function breakingStory(stories) {
  return stories.find((story) => story?.audit?.push_alert === true || story?.push_alert === true || story?.breaking === true);
}

function isWorldStory(story) {
  return String(story?.category || '').trim().toLowerCase() === 'world';
}

function isSportsStory(story) {
  const category = String(story?.category || '').trim().toLowerCase();
  const kicker = String(story?.kicker || '').toLowerCase();
  return category === 'sports' || category === 'sport' || /(^|[ ·|])sports?([ ·|]|$)/i.test(kicker);
}

// The front page states the Fact Check desk's real position, read from the same
// ledger the editorial gate writes. It must never imply published verdicts that
// the gate is currently holding back.
async function factCheckLedger() {
  try {
    const raw = JSON.parse(await readFile(path.join(root, 'content', 'fact-check', 'HELD.json'), 'utf8'));
    return {
      published: Number(raw.published) || 0,
      held: Number(raw.held) || 0,
      total: Number(raw.total) || 0,
    };
  } catch {
    return { published: 0, held: 0, total: 0 };
  }
}

async function explainerCount() {
  try {
    const entries = await readdir(path.join(root, 'dist', 'news', 'explainer'), { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).length;
  } catch {
    return 0;
  }
}

function deskCard({ cls, href, title, label, story, emptyCopy }) {
  const state = story ? 'Latest' : 'Desk ready';
  const detail = story
    ? `<b>${esc(story.headline)}</b><p>${esc(story.deck || `Open the latest ${title} report.`)}</p>`
    : `<b>${esc(emptyCopy)}</b><p>Coverage appears here only when a matching verified report is published.</p>`;
  return `<a class="editorial-desk ${cls}${story ? '' : ' is-empty'}" href="${href}"><div class="editorial-desk-top"><strong>${title}</strong><span>${state}</span></div>${detail}<span class="sr-only">${label}</span></a>`;
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

function leadFigure(story, sizes, eager) {
  return `<div class="${sizes}"><img src="${esc(imageFor(story))}" alt="${esc(story.image?.alt || story.headline)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} width="1200" height="675"></div>`;
}

function metaLine(story) {
  return `<p class="fmbv2-meta"><span class="fmbv2-cat">${esc(story.category || 'News')}</span><i>·</i><time datetime="${esc(story.publishedAt)}">${esc(fmtTime(story.publishedAt))}</time><i>·</i><span>${readTime(story)} min read</span></p>`;
}

function leadBlock(story) {
  return `<a class="fmbv2-lead" href="/news/${esc(story.slug)}/">
      ${leadFigure(story, 'fmbv2-lead-fig', true)}
      <div class="fmbv2-lead-copy">${metaLine(story)}<h1>${esc(story.headline)}</h1>${story.deck ? `<p>${esc(story.deck)}</p>` : ''}<span class="fmbv2-more">Read the full report</span></div>
    </a>`;
}

function subBlock(story) {
  return `<a class="fmbv2-sub" href="/news/${esc(story.slug)}/">${leadFigure(story, 'fmbv2-sub-fig')}<div>${metaLine(story)}<h3>${esc(story.headline)}</h3></div></a>`;
}

function streamCard(story) {
  return `<a class="fmbv2-card" href="/news/${esc(story.slug)}/">${leadFigure(story, 'fmbv2-card-fig')}<div>${metaLine(story)}<h3>${esc(story.headline)}</h3></div>${story.deck ? `<p>${esc(story.deck)}</p>` : ''}</a>`;
}

function applyDesktopPublicationLanding(html, stories, desk) {
  // Retire the template's static wire and dead category rail. The canonical
  // shell supplies the live ticker; V2 supplies the real desk navigation.
  html = html.replace(/<div class="top-wire">[\s\S]*?<div class="wire-time"[^>]*>[\s\S]*?<\/div>\s*<\/div>/i, '');
  html = html.replace(/<div class="section-rail">[\s\S]*?<\/div>\s*<\/div>/i, '');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>Filipino Media Bulletin | News, Worldwide, Sports, Explainer, Fact Check and Daily Brief</title>');
  html = html.replace(/<meta name="description" content="[^"]*">/i, '<meta name="description" content="Filipino Media Bulletin brings together FMB News, FMB Worldwide, Sports, FMB Explainer, FMB Fact Check, and FMB Daily Brief.">');
  html = html.replace(/<meta property="og:site_name" content="[^"]*">/i, '<meta property="og:site_name" content="Filipino Media Bulletin">');
  html = html.replace(/<meta property="og:title" content="[^"]*">/i, '<meta property="og:title" content="Filipino Media Bulletin">');
  html = html.replace(/<meta property="og:description" content="[^"]*">/i, '<meta property="og:description" content="News, Worldwide and Sports desks, plus FMB Explainer, FMB Fact Check and FMB Daily Brief.">');

  html = html.replace(/<link[^>]+fmb-news-landing-hardfix\.css[^>]*>/gi, '');
  html = html.replace(/<style data-fmb-four-products>[\s\S]*?<\/style>/gi, '');
  // fmb-news-publication-landing.css is now homepage CHROME only — ticker,
  // utility strip, masthead, footer. Every rule it used to carry for <main>
  // moved to fmb-news-home-v2.css (injected last, by apply-brand-system.mjs),
  // so the two sheets no longer overlap and neither overrides the other. That
  // sheet sized .network-product by nth-child, which is why the five product
  // cards rendered as a staircase of five different widths at 1440.
  if (!html.includes('/assets/css/fmb-news-publication-landing.css')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="/assets/css/fmb-news-publication-landing.css?v=20260914-chrome-only"></head>');
  }
  if (!html.includes('/assets/css/fmb-news-editorial-ia.css')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="/assets/css/fmb-news-editorial-ia.css?v=20260912-desk-v1"></head>');
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
  // Drawn, not typed: the ☾ character rendered as a bare parenthesis in the
  // display serif, and the page's other marks are all line-art SVG.
  const crescentIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.8A8.6 8.6 0 0 1 9.2 3.5a8.6 8.6 0 1 0 11.3 11.3Z"></path></svg>';

  const mast = `<header class="mast publication-mast"><div class="shell publication-header-inner"><a class="publication-lockup" href="/news/" aria-label="Filipino Media Bulletin"><img class="publication-emblem" src="/assets/images/brand/fmb-bulletin-emblem.svg" alt=""><span class="publication-name"><strong class="publication-wordmark">Filipino Media Bulletin</strong><span class="publication-tagline"><span></span>Information with Purpose<span></span></span></span></a><nav class="nav publication-nav" aria-label="Filipino Media Bulletin"><a href="/news/archive/">News</a><a href="/news/world/">Worldwide</a><a href="/news/sports/">Sports</a><a href="/news/fmb-brief/">Daily Brief</a><a href="/news/fact-check/">Fact Check</a><a href="/news/explainer/">Explainer</a><details class="publication-menu"><summary>Entertainment</summary><div class="publication-menu-panel"><a href="/news/horoscope/">Weekly Horoscope</a><a href="/news/crossword/">FMB Crossword</a></div></details><a href="/news/about/">About</a><a class="publication-search" href="/news/search/" aria-label="Search FMB News">${searchIcon}</a></nav></div></header>`;
  html = html.replace(/<header class="mast[^"]*"[\s\S]*?<\/header>\s*<nav class="nav"[\s\S]*?<\/nav>/i, mast);

  const newsLead = stories.find((story) => !isWorldStory(story) && !isSportsStory(story)) || stories[0];
  const worldLead = stories.find(isWorldStory);
  const sportsLead = stories.find(isSportsStory);
  const desks = `${deskCard({ cls:'news', href:'/news/archive/', title:'News', label:'Open FMB News', story:newsLead, emptyCopy:'Latest verified reports from FMB News.' })}${deskCard({ cls:'worldwide', href:'/news/world/', title:'Worldwide', label:'Open FMB Worldwide', story:worldLead, emptyCopy:'Worldwide coverage will appear here when published.' })}${deskCard({ cls:'sports', href:'/news/sports/', title:'Sports', label:'Open Sports desk', story:sportsLead, emptyCopy:'No Sports report is published yet.' })}`;

  // The front page opens on the newsroom's most recent verified report. It used
  // to open on "Trusted News. Meaningful Perspectives." above a wall of product
  // cards, which is a marketing landing page: a reader arriving at the FMB home
  // could not see a single headline without scrolling past the sales pitch.
  const lead = stories[0];
  const subs = stories.slice(1, 3);
  const stream = stories.slice(3, 9);
  const breaking = breakingStory(stories);

  const alertBar = breaking
    ? `<a class="fmbv2-alert" href="/news/${esc(breaking.slug)}/"><strong>Breaking</strong><span>${esc(breaking.headline)}</span><b aria-hidden="true">›</b></a>`
    : '';

  const factCheckState = desk.factCheck.published > 0
    ? `<span class="fmbv2-state">${desk.factCheck.published} published</span><p>Claims examined against evidence FMB can reach and show. Verdicts carry their reasoning, and corrections are published when the facts change.</p>`
    : `<span class="fmbv2-state">Verification in progress</span><p>FMB Fact Check publishes a verdict only once the claim has been checked against evidence FMB can independently reach. ${desk.factCheck.held} item${desk.factCheck.held === 1 ? '' : 's'} ${desk.factCheck.held === 1 ? 'is' : 'are'} currently held for that reason, so nothing is presented as verified yet.</p>`;

  const main = `<main class="network-home fmbv2-home">
  <section class="fmbv2-sec fmbv2-well" aria-labelledby="fmbv2-lead-title">
    <div class="fmbv2-shell">
      <h2 class="sr-only" id="fmbv2-lead-title">Top stories</h2>
      ${alertBar}
      <div class="fmbv2-well-grid">
        ${leadBlock(lead)}
        <div class="fmbv2-aside">${subs.map(subBlock).join('')}</div>
      </div>
    </div>
  </section>

  <section class="fmbv2-sec" aria-labelledby="fmbv2-latest-title">
    <div class="fmbv2-shell">
      <div class="fmbv2-sec-head"><div><span class="fmbv2-kicker">FMB News</span><h2 id="fmbv2-latest-title">Latest</h2></div><a class="fmbv2-more" href="/news/archive/">All reports</a></div>
      <hr class="fmbv2-rule">
      <div class="fmbv2-stream">${stream.map(streamCard).join('')}</div>
    </div>
  </section>

  <section class="fmbv2-sec editorial-desks" aria-labelledby="editorial-desks-title">
    <div class="fmbv2-shell">
      <div class="editorial-desks-head"><span class="fmbv2-kicker">Browse by desk</span><h2 id="editorial-desks-title">News. Worldwide. Sports.</h2><p>Direct reporting desks stay separate from FMB’s explanation, fact-checking, and briefing products.</p></div>
      <div class="editorial-desk-grid">${desks}</div>
    </div>
  </section>

  <section class="fmbv2-sec" aria-labelledby="fmbv2-mods-title">
    <div class="fmbv2-shell">
      <h2 class="sr-only" id="fmbv2-mods-title">FMB Daily Brief and FMB Worldwide</h2>
      <div class="fmbv2-mods">
        <a class="fmbv2-mod brief" href="/news/fmb-brief/live/"><img src="${approvedMug}" alt="" aria-hidden="true" loading="lazy"><span class="fmbv2-mod-shade" aria-hidden="true"></span><span class="fmbv2-kicker">FMB Daily Brief</span><h2>Your essential rundown in minutes.</h2><p>One concise daily briefing: the developments, the context behind them, and what they are likely to mean.</p><b>Read today’s brief ›</b></a>
        <a class="fmbv2-mod worldwide" href="/news/world/"><span class="fmbv2-world-field" aria-hidden="true"></span><span class="fmbv2-mod-shade" aria-hidden="true"></span><span class="fmbv2-kicker">FMB Worldwide</span><h2>Global stories. Local perspective.</h2><p>Major global developments, filtered for importance and for what they actually change for Filipinos.</p><b>Explore Worldwide ›</b></a>
      </div>
    </div>
  </section>

  <section class="fmbv2-sec" aria-labelledby="fmbv2-verify-title">
    <div class="fmbv2-shell">
      <div class="fmbv2-sec-head"><div><span class="fmbv2-kicker">Understanding and verification</span><h2 id="fmbv2-verify-title">Beyond the headline</h2></div></div>
      <hr class="fmbv2-rule">
      <div class="fmbv2-pair">
        <div class="fmbv2-panel"><h2>FMB Fact Check</h2>${factCheckState}<a class="fmbv2-more" href="/news/fact-check/">Open Fact Check</a></div>
        <div class="fmbv2-panel"><h2>FMB Explainer</h2><span class="fmbv2-state">${desk.explainers} explainers</span><p>Go beyond the headline: how things work, why they happen, and why they matter — written to be read once and understood.</p><a class="fmbv2-more" href="/news/explainer/">Open FMB Explainer</a></div>
      </div>
    </div>
  </section>

  <section class="fmbv2-sec" aria-labelledby="fmbv2-products-title">
    <div class="fmbv2-shell">
      <div class="fmbv2-sec-head"><div><span class="fmbv2-kicker">One publication</span><h2 id="fmbv2-products-title">Filipino Media Bulletin</h2></div></div>
      <hr class="fmbv2-rule">
      <div class="network-products" aria-label="Five Filipino Media Bulletin editorial products">
        <a class="network-product news" href="/news/archive/"><span class="network-product-icon">${newspaperIcon}</span><h2>FMB News</h2><span class="network-card-rule"><i></i></span><p>Verified Philippine reporting. Clear facts, concise updates, and meaningful context.</p><span class="product-link">Explore FMB News <b>›</b></span></a>
        <a class="network-product world" href="/news/world/"><span class="network-product-icon">${globeIcon}</span><h2>FMB Worldwide</h2><span class="network-card-rule"><i></i></span><p>Major global developments. Filtered for importance and Filipino relevance.</p><span class="product-link">Explore Worldwide <b>›</b></span></a>
        <a class="network-product explainer" href="/news/explainer/"><span class="network-product-icon">${explainerIcon}</span><h2>FMB Explainer</h2><span class="network-card-rule"><i></i></span><p>Go beyond the headline. Understand how things work, why they happen, and why they matter.</p><span class="product-link">Open FMB Explainer <b>›</b></span></a>
        <a class="network-product fact-check" href="/news/fact-check/"><span class="network-product-icon">${factCheckIcon}</span><h2>FMB Fact Check</h2><span class="network-card-rule"><i></i></span><p>Claims examined against evidence. Clear verdicts, visible reasoning, and corrections when facts change.</p><span class="product-link">Open Fact Check <b>›</b></span></a>
        <a class="network-product brief" href="#fmb-daily-brief-signup"><span class="network-product-icon">${envelopeIcon}</span><h2>FMB Daily Brief</h2><span class="network-card-rule"><i></i></span><p>One concise daily briefing. The developments, context, and implications worth knowing.</p><span class="product-link">Get the Daily Brief <b>›</b></span></a>
      </div>
    </div>
  </section>

  <section class="fmbv2-sec" aria-labelledby="fmbv2-play-title">
    <div class="fmbv2-shell">
      <div class="fmbv2-sec-head"><div><span class="fmbv2-kicker">Entertainment</span><h2 id="fmbv2-play-title">Read something else</h2></div><a class="fmbv2-more" href="/news/entertainment/">Open Entertainment</a></div>
      <hr class="fmbv2-rule">
      <div class="fmbv2-play">
        <a class="fmbv2-play-card" href="/news/horoscope/"><span class="fmbv2-moon" aria-hidden="true">${crescentIcon}</span><h3>Weekly Horoscope</h3><p>All 12 zodiac signs, written with free will kept front and centre.</p><b>Read this week ›</b></a>
        <a class="fmbv2-play-card" href="/news/crossword/"><span class="fmbv2-grid-mark" aria-hidden="true"><i></i><i></i><i class="on"></i><i></i><i class="on"></i><i class="on"></i><i></i><i class="on"></i><i></i></span><h3>FMB Crossword</h3><p>Clues drawn from the week’s verified news cycle.</p><b>Play now ›</b></a>
      </div>
    </div>
  </section>

  <section class="fmbv2-sec fmbv2-trust" aria-labelledby="fmbv2-trust-title">
    <div class="fmbv2-shell">
      <div class="fmbv2-sec-head"><div><span class="fmbv2-kicker">How FMB works</span><h2 id="fmbv2-trust-title">Why you can check us</h2></div></div>
      <div class="fmbv2-trust-grid">
        <div class="fmbv2-trust-item"><h3>Editorial standards</h3><p>What FMB will and will not publish, and who is accountable for it.</p><a class="fmbv2-more" href="/news/editorial-standards/">Read the standards</a></div>
        <div class="fmbv2-trust-item"><h3>Corrections</h3><p>Errors are corrected in place, dated, and described — not quietly deleted.</p><a class="fmbv2-more" href="/news/corrections/">Corrections policy</a></div>
        <div class="fmbv2-trust-item"><h3>Sources</h3><p>Reports name where the information came from so you can check it yourself.</p><a class="fmbv2-more" href="/news/about/">How FMB reports</a></div>
        <div class="fmbv2-trust-item"><h3>Contact</h3><p>Corrections, tips and questions reach the newsroom directly.</p><a class="fmbv2-more" href="/news/submit/">Contact the newsroom</a></div>
      </div>
    </div>
  </section>

  <section class="fmbv2-sec" aria-labelledby="fmbv2-founder-title">
    <div class="fmbv2-shell">
      <div class="fmbv2-founder">
        <span class="fmbv2-founder-mark" aria-hidden="true">FMB</span>
        <div>
          <span class="fmbv2-kicker">Founder</span>
          <h2 id="fmbv2-founder-title">Francine Marie Bautista</h2>
          <p>Filipino Media Bulletin is an independent Philippine newsroom. Its founder is named, reachable, and accountable for what it publishes.</p>
          <a class="fmbv2-more" href="/news/founder/">About the founder</a>
        </div>
      </div>
    </div>
  </section>

  <section class="fmbv2-sec" aria-labelledby="daily-brief-title">
    <div class="fmbv2-shell">
      <div class="daily-brief-signup" id="fmb-daily-brief-signup">
        <div class="daily-brief-mark"><img src="/assets/images/brand/fmb-bulletin-emblem.svg" alt="" aria-hidden="true"></div>
        <div class="brief-copy"><div class="brief-label">Your personalized FMB News</div><h2 id="daily-brief-title">FMB Daily Brief</h2><span class="brief-rule"><i></i></span></div>
        <p class="brief-promise">Sign in by email for your Daily Brief, saved stories, preferences, and mobile alerts.</p>
        <form data-fmb-newsletter-form novalidate><div class="brief-form-row"><label class="sr-only" for="fmb-landing-email">Email address</label><input id="fmb-landing-email" type="email" name="email" placeholder="Enter your email address" autocomplete="email" required><button type="submit">Continue</button></div><input data-fmb-newsletter-honeypot name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><label class="consent"><input type="checkbox" data-fmb-newsletter-consent required><span>Personalize FMB News and receive FMB Daily Brief. <a href="/privacy/">Privacy Policy</a>.</span></label><p class="status" data-fmb-newsletter-status role="status" aria-live="polite"></p></form>
      </div>
    </div>
  </section>
</main>`;
  html = html.replace(/<main[\s\S]*?<\/main>/i, main);

  const footer = '<footer class="footer publication-footer"><div class="shell publication-footer-inner"><img class="publication-footer-emblem" src="/assets/images/brand/fmb-bulletin-emblem.svg" alt=""><div><div class="footer-publication-title">Filipino Media Bulletin</div><div class="footer-publication-kicker">News · Worldwide · Sports · FMB Explainer · FMB Fact Check · FMB Daily Brief</div></div></div></footer>';
  html = html.replace(/<footer class="footer"[\s\S]*?<\/footer>/i, footer);
  html = html.replace(/<div class="ticker-label">[\s\S]*?<\/div>/i, '<div class="ticker-label"><span class="ticker-pulse" aria-hidden="true"></span>HEADLINES</div>');

  return html;
}

const stories = await publishedStories();
const desk = { factCheck: await factCheckLedger(), explainers: await explainerCount() };
let html = await readFile(page, 'utf8');
html = applyDesktopPublicationLanding(html, stories, desk);
html = html.replace(/<div class="fmb-mobile-app-home"[\s\S]*?<\/div>\s*(?=<main class="network-home")/i, '');
// Anchor on the tag prefix, not the whole class attribute: the desktop <main>
// now also carries fmbv2-home, and an exact-string anchor silently dropped the
// entire mobile app home the first time that class changed.
const mobileAnchor = /<main class="network-home\b/i;
if (!mobileAnchor.test(html)) throw new Error('Canonical homepage lost its network-home main; the mobile app home has nowhere to mount.');
html = html.replace(mobileAnchor, (match) => `${renderMobileHome(stories)}${match}`);
await writeFile(page, html, 'utf8');

console.log(`Rendered canonical FMB News home experience in one pass: a lead-story desktop front page (1 lead, ${stories.slice(1, 3).length} secondary, ${stories.slice(3, 9).length} in the Latest stream) replacing the marketing hero, News/Worldwide/Sports desk hierarchy, five-product Filipino Media Bulletin system, Fact Check state read from the editorial ledger (${desk.factCheck.published} published / ${desk.factCheck.held} held), ${desk.explainers} explainers, and the approved mobile app home with ${stories.slice(0, 5).length} latest stories.`);
