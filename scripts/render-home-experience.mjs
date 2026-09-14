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
  (story?.sections || [])
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
      // Editorial validation owns malformed records.
    }
  }
  return out.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

function imageFor(story) {
  const url = String(story?.image?.url || '').trim();
  return /^https?:\/\//i.test(url) || url.startsWith('/') ? url : fallback;
}

function hrefFor(story) {
  return story?.slug ? `/news/${esc(story.slug)}/` : '/news/archive/';
}

function categoryFor(story, fallbackLabel = 'News') {
  return esc(story?.category || story?.kicker || fallbackLabel);
}

function deckFor(story, fallbackCopy) {
  return esc(story?.deck || fallbackCopy || 'Verified reporting with context and what to watch next.');
}

function storyMeta(story) {
  return `<div class="fmb-app-story-meta"><span>${categoryFor(story)}</span><span>·</span><time datetime="${esc(story?.publishedAt || '')}">${esc(fmtTime(story?.publishedAt))}</time><span>·</span><span>${readTime(story)} min</span></div>`;
}

function storyRow(story) {
  return `<a class="fmb-app-story-row" href="${hrefFor(story)}"><img src="${esc(imageFor(story))}" alt="${esc(story?.image?.alt || story?.headline || 'FMB News report')}" loading="lazy"><div class="fmb-app-story-copy">${storyMeta(story)}<h3>${esc(story?.headline || 'Latest verified report')}</h3></div></a>`;
}

function breakingStory(stories) {
  return stories.find((story) => story?.audit?.push_alert === true || story?.push_alert === true || story?.breaking === true);
}

function isWorldStory(story) {
  const category = String(story?.category || '').trim().toLowerCase();
  const kicker = String(story?.kicker || '').toLowerCase();
  return category === 'world' || /(^|[ ·|])world(?:wide)?([ ·|]|$)/i.test(kicker);
}

function isSportsStory(story) {
  const category = String(story?.category || '').trim().toLowerCase();
  const kicker = String(story?.kicker || '').toLowerCase();
  return category === 'sports' || category === 'sport' || /(^|[ ·|])sports?([ ·|]|$)/i.test(kicker);
}

function isEntertainmentStory(story) {
  const haystack = `${story?.category || ''} ${story?.kicker || ''} ${story?.headline || ''}`.toLowerCase();
  return /entertainment|culture|lifestyle|film|music|pageant|celebrity|arts?\b/.test(haystack);
}

function firstDistinct(stories, predicates = [], excluded = new Set()) {
  for (const predicate of predicates) {
    const hit = stories.find((story) => predicate(story) && !excluded.has(story.slug));
    if (hit) return hit;
  }
  return stories.find((story) => !excluded.has(story.slug)) || stories[0];
}

function deskCard({ cls, href, title, label, story, emptyCopy, image = true }) {
  const state = story ? 'Latest' : 'Desk ready';
  const media = image ? `<img src="${esc(imageFor(story))}" alt="${esc(story?.image?.alt || story?.headline || title)}" loading="lazy">` : '';
  const detail = story
    ? `<b>${esc(story.headline)}</b><p>${deckFor(story, `Open the latest ${title} report.`)}</p>`
    : `<b>${esc(emptyCopy)}</b><p>Coverage appears here only when a matching verified report is published.</p>`;
  return `<a class="editorial-desk ${cls}${story ? '' : ' is-empty'}" href="${href}">${media}<div class="editorial-side-copy"><div class="editorial-desk-top"><strong>${title}</strong><span>${state}</span></div>${detail}</div><span class="sr-only">${label}</span></a>`;
}

function productStoryCard({ cls, href, title, story, copy, linkText, extra = '' }) {
  const image = story ? `<img class="editorial-product-image" src="${esc(imageFor(story))}" alt="${esc(story.image?.alt || story.headline)}" loading="lazy">` : '';
  const headline = story ? `<div class="editorial-product-headline">${esc(story.headline)}</div>` : '';
  return `<a class="network-product ${cls}" href="${href}"><h2>${title}</h2>${image}${headline}${extra}<p>${esc(copy)}</p><span class="product-link">${linkText} <b>›</b></span></a>`;
}

function renderMobileHome(stories) {
  if (!stories.length) throw new Error('Cannot build FMB mobile app home without published stories.');

  const lead = stories[0];
  const used = new Set([lead.slug]);
  const world = firstDistinct(stories, [isWorldStory], used); if (world?.slug) used.add(world.slug);
  const sports = firstDistinct(stories, [isSportsStory], used); if (sports?.slug) used.add(sports.slug);
  const entertainment = firstDistinct(stories, [isEntertainmentStory], used); if (entertainment?.slug) used.add(entertainment.slug);
  const latest = stories.slice(1, 6);
  const breaking = breakingStory(stories);
  const tickerStories = stories.slice(0, 5);
  const tickerLabel = breaking ? 'BREAKING' : 'HEADLINES';
  const tickerHref = breaking ? hrefFor(breaking) : '#fmb-app-latest-title';
  const tickerGroup = tickerStories.map((story) => `<i>${esc(story.headline)}</i>`).join('');

  const mobileRail = [
    ['World', '/news/world/', world],
    ['Sports', '/news/sports/', sports],
    ['Entertainment', '/news/horoscope/', entertainment],
  ].map(([label, href, story]) => `<a class="fmb-editorial-mobile-rail-item ${label.toLowerCase()}" href="${href}"><img src="${esc(imageFor(story))}" alt="${esc(story?.image?.alt || story?.headline || label)}" loading="lazy"><div><span>${label}</span><h2>${esc(story?.headline || (label === 'Sports' ? 'Stories beyond the game' : label === 'World' ? 'Global perspectives on a changing world' : 'People, culture and creative life'))}</h2></div><b aria-hidden="true">›</b></a>`).join('');

  // Below 700px the desktop <main> is display:none and this block is the page's
  // primary content, so without a role the mobile Home exposed no main landmark
  // at all. Measured: 0 visible <main> at 320, 390 and 430. The role is on the
  // container rather than a second <main> element because exactly one of the two
  // is ever rendered to assistive technology; the served document keeps one
  // <main>, and the mobile breakpoint now has a main landmark.
  return `<div class="fmb-mobile-app-home fmb-editorial-mobile-home" role="main" data-fmb-mobile-home>
  <a class="fmb-approved-hero-ticker fmb-app-top-ticker" href="${tickerHref}" aria-label="${tickerLabel}">
    <strong>${tickerLabel}</strong>
    <span class="fmb-approved-hero-ticker-window"><span class="fmb-approved-hero-ticker-track"><span class="fmb-approved-hero-ticker-group">${tickerGroup}</span><span class="fmb-approved-hero-ticker-group" aria-hidden="true">${tickerGroup}</span></span></span>
    <b aria-hidden="true">›</b>
  </a>
  <section class="fmb-app-brand-hero" aria-label="Latest FMB News report">
    <img class="fmb-editorial-mobile-lead-image" src="${esc(imageFor(lead))}" alt="${esc(lead.image?.alt || lead.headline)}" fetchpriority="high" data-fmb-editorial-lead>
    <img src="${approvedHero}" alt="" aria-hidden="true" data-fmb-approved-hero class="fmb-legacy-hero-recovery">
    <span class="fmb-hero-readable-shade" aria-hidden="true"></span>
    <div class="fmb-approved-hero-copy">
      <span class="fmb-editorial-mobile-kicker">${categoryFor(lead)}</span>
      <span data-fmb-greeting class="sr-only">FMB News update</span>
      <h1 data-fmb-greeting-line data-fmb-rotating-slogan>${esc(lead.headline)}</h1>
      <p class="fmb-approved-hero-deck">${deckFor(lead)}</p>
      <div class="fmb-approved-hero-cta" aria-hidden="true"><a href="#fmb-app-latest-title">Read the Latest</a><button type="button" data-fmb-customize>Customize</button></div>
    </div>
    <div class="fmb-hero-live-overlay" aria-label="Philippine Standard Time"><div class="fmb-hero-clock"><strong data-fmb-local-date>Today</strong><span data-fmb-local-time>--:--</span></div></div>
  </section>
  <section class="fmb-editorial-mobile-rail" aria-label="FMB News desks">${mobileRail}</section>
  <a class="fmb-editorial-newsroom-row" href="/news/about/"><span class="status-dot" aria-hidden="true"></span><span>From the newsroom</span><b aria-hidden="true">›</b></a>
  <section class="fmb-app-section" aria-labelledby="fmb-app-latest-title">
    <div class="fmb-app-section-head"><h2 id="fmb-app-latest-title">Latest News</h2><a href="/news/archive/">View all</a></div>
    <div class="fmb-app-story-list">${latest.map(storyRow).join('')}</div>
  </section>
  <section class="fmb-app-feature-grid" aria-label="FMB News features">
    <a class="fmb-app-feature-card brief" href="/news/fmb-brief/live/"><img src="${approvedMug}" alt="FMB Daily Brief mug" loading="lazy" data-fmb-approved-mug><span class="fmb-feature-shade" aria-hidden="true"></span><div><span>Daily Briefing</span><h2>The big picture and what to watch next.</h2><b>Read today’s brief ›</b></div></a>
    <a class="fmb-app-feature-card worldwide" href="/news/explainer/"><div><span>Explainers</span><h2>Clear answers to complex topics.</h2><b>Browse explainers ›</b></div></a>
  </section>
</div>`;
}

function applyDesktopPublicationLanding(html, stories) {
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>FMB News | Filipino Media Bulletin</title>');
  html = html.replace(/<meta name="description" content="[^"]*">/i, '<meta name="description" content="FMB News by Filipino Media Bulletin: verified reporting, global perspective, sports, daily briefing, fact checks, explainers and entertainment.">');
  html = html.replace(/<meta property="og:site_name" content="[^"]*">/i, '<meta property="og:site_name" content="Filipino Media Bulletin">');
  html = html.replace(/<meta property="og:title" content="[^"]*">/i, '<meta property="og:title" content="FMB News">');
  html = html.replace(/<meta property="og:description" content="[^"]*">/i, '<meta property="og:description" content="News and information with purpose.">');

  html = html.replace(/<link[^>]+fmb-news-landing-hardfix\.css[^>]*>/gi, '');
  html = html.replace(/<style data-fmb-four-products>[\s\S]*?<\/style>/gi, '');
  for (const href of [
    '/assets/css/fmb-news-publication-landing.css?v=20260913-editorial-base',
    '/assets/css/fmb-news-editorial-ia.css?v=20260912-desk-v1',
    '/assets/css/fmb-news-editorial-reference-v2.css?v=20260913-reference-v2',
  ]) {
    const base = href.split('?')[0];
    if (!html.includes(base)) html = html.replace('</head>', `<link rel="stylesheet" href="${href}"></head>`);
  }
  if (!html.includes('/assets/images/brand/fmb-bulletin-emblem.svg')) html = html.replace('</head>', '<link rel="icon" type="image/svg+xml" href="/assets/images/brand/fmb-bulletin-emblem.svg"></head>');

  html = html.replace(/<body\s+class="([^"]*)"/i, (_match, classes) => {
    const set = new Set(classes.split(/\s+/).filter(Boolean));
    set.delete('fmb-news-route');
    set.add('fmb-network-landing');
    return `<body class="${[...set].join(' ')}"`;
  });

  const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25"></circle><path d="m15.1 15.1 5 5"></path></svg>';
  const mast = `<header class="mast publication-mast"><div class="publication-header-inner"><div class="publication-brand-row"><div class="publication-date-block"><span data-pht-date>Philippine Standard Time</span><br><span data-pht-clock>--:--</span></div><a class="publication-lockup" href="/news/" aria-label="Filipino Media Bulletin"><img class="publication-emblem" src="/assets/images/brand/fmb-bulletin-emblem.svg" alt=""><span class="fmb-editorial-wordmark">FMB NEWS<span class="dot">.</span></span><span class="fmb-editorial-subtitle">Filipino Media Bulletin</span><span class="publication-name"><strong class="publication-wordmark">Filipino Media Bulletin</strong></span></a><div class="publication-purpose">News and Information<br>with Purpose.</div></div><nav class="nav publication-nav" aria-label="Filipino Media Bulletin"><a href="/news/">Home</a><a href="/news/archive/">News</a><a href="/news/world/">Worldwide</a><a href="/news/sports/">Sports</a><a href="/news/fmb-brief/">Daily Brief</a><a href="/news/fact-check/">Fact Check</a><a href="/news/explainer/">Explainer</a><details class="publication-menu"><summary>Entertainment</summary><div class="publication-menu-panel"><a href="/news/horoscope/">Weekly Horoscope</a><a href="/news/crossword/">FMB Crossword</a></div></details><a href="/news/about/">About</a><a class="publication-search" href="/news/search/" aria-label="Search FMB News">${searchIcon}</a></nav></div></header>`;
  if (/<header class="mast publication-mast"/i.test(html)) html = html.replace(/<header class="mast publication-mast"[\s\S]*?<\/header>/i, mast);
  else html = html.replace(/<header class="mast[^"]*"[\s\S]*?<\/header>\s*<nav class="nav"[\s\S]*?<\/nav>/i, mast);

  if (!stories.length) throw new Error('Cannot build FMB News desktop home without published stories.');
  const lead = stories[0];
  const used = new Set([lead.slug]);
  const worldLead = firstDistinct(stories, [isWorldStory], used); if (worldLead?.slug) used.add(worldLead.slug);
  const sportsLead = firstDistinct(stories, [isSportsStory], used); if (sportsLead?.slug) used.add(sportsLead.slug);
  const entertainmentLead = firstDistinct(stories, [isEntertainmentStory], used); if (entertainmentLead?.slug) used.add(entertainmentLead.slug);
  const secondaryNews = firstDistinct(stories, [(story) => !isWorldStory(story) && !isSportsStory(story)], used); if (secondaryNews?.slug) used.add(secondaryNews.slug);

  const newsDesk = deskCard({ cls:'news editorial-status-desk', href:'/news/archive/', title:'News', label:'Open FMB News', story:lead, emptyCopy:'Latest verified reports from FMB News.', image:false });
  const worldDesk = deskCard({ cls:'worldwide', href:'/news/world/', title:'Worldwide', label:'Open FMB Worldwide', story:worldLead, emptyCopy:'Worldwide coverage will appear here when published.' });
  const sportsDesk = deskCard({ cls:'sports', href:'/news/sports/', title:'Sports', label:'Open Sports desk', story:sportsLead, emptyCopy:'No Sports report is published yet.' });
  const entertainmentDesk = `<a class="editorial-feature entertainment" href="${hrefFor(entertainmentLead)}"><img src="${esc(imageFor(entertainmentLead))}" alt="${esc(entertainmentLead?.image?.alt || entertainmentLead?.headline || 'Entertainment')}" loading="lazy"><div class="editorial-side-copy"><span class="editorial-kicker">Entertainment</span><h3>${esc(entertainmentLead?.headline || 'People, culture and creative life')}</h3></div></a>`;

  const newsProduct = productStoryCard({ cls:'news', href:'/news/archive/', title:'FMB News', story:secondaryNews, copy:'Key updates, context and what to watch next.', linkText:'Explore FMB News' });
  const worldProduct = productStoryCard({ cls:'world', href:'/news/world/', title:'FMB Worldwide', story:worldLead, copy:'A wider view on what is shaping our world.', linkText:'Explore Worldwide' });
  const briefExtra = '<div class="briefing-numbers"><div class="briefing-number"><b>01</b><span>The big picture today</span></div><div class="briefing-number"><b>02</b><span>What to watch next</span></div></div>';
  const briefProduct = productStoryCard({ cls:'brief', href:'/news/fmb-brief/', title:'FMB Daily Brief', story:null, copy:'A concise roundup of essential stories.', linkText:'Get the Daily Brief', extra:briefExtra });
  const factProduct = productStoryCard({ cls:'fact-check', href:'/news/fact-check/', title:'FMB Fact Check', story:null, copy:'Evidence over assumptions. Claims checked against credible sources.', linkText:'Open Fact Check' });
  const explainerProduct = productStoryCard({ cls:'explainer', href:'/news/explainer/', title:'FMB Explainer', story:null, copy:'Clear answers to complex topics, with useful context.', linkText:'Open FMB Explainer' });

  const main = `<main class="network-home"><section class="network-hero" aria-labelledby="network-hero-title"><div class="network-hero-art" aria-hidden="true"></div><div class="network-hero-inner"><div class="network-hero-copy"><p id="network-hero-title"><span>FMB News.</span><span>Filipino Media Bulletin.</span></p><div class="network-hero-rule"><span></span></div><p>News. Worldwide. Sports.</p></div><div class="editorial-status-strip">${newsDesk}<span><span class="status-dot" aria-hidden="true"></span>From the newsroom</span><a href="/news/archive/">See all updates →</a></div><div class="editorial-top-grid"><a class="editorial-lead-story" href="${hrefFor(lead)}"><img class="editorial-lead-image" src="${esc(imageFor(lead))}" alt="${esc(lead.image?.alt || lead.headline)}" fetchpriority="high"><span class="editorial-kicker">${categoryFor(lead)}</span><h1>${esc(lead.headline)}</h1><p>${deckFor(lead)}</p></a><aside class="editorial-side-rail" aria-label="Editorial desks">${worldDesk}${sportsDesk}${entertainmentDesk}</aside></div><section class="editorial-desks sr-only" aria-labelledby="editorial-desks-title"><h2 id="editorial-desks-title">News. Worldwide. Sports.</h2><div class="editorial-desk-grid"></div></section><div class="network-products" aria-label="Filipino Media Bulletin editorial products">${newsProduct}${worldProduct}${briefProduct}${factProduct}${explainerProduct}</div><div class="editorial-bottom-grid"><section class="editorial-entertainment" aria-labelledby="entertainment-title"><h2 class="editorial-section-title" id="entertainment-title">Entertainment</h2><div class="entertainment-grid"><a class="entertainment-card" href="/news/horoscope/"><div class="entertainment-art" aria-hidden="true">☾</div><h3>Weekly Horoscope</h3><p>Guidance and reflections for all 12 signs.</p></a><a class="entertainment-card" href="/news/crossword/"><div class="entertainment-art" aria-hidden="true">#</div><h3>FMB Crossword</h3><p>A current-events mental break.</p></a></div></section><section class="editorial-about" aria-labelledby="about-fmb-title"><h2 class="editorial-section-title" id="about-fmb-title">About FMB</h2><div class="founder-card"><div class="founder-portrait-placeholder" role="img" aria-label="Founder portrait placeholder"><span>FMB.</span></div><div class="founder-copy"><strong>Francine Marie Bautista</strong><span>Founder</span><span>FMB News and Information with Purpose.</span><a href="/news/about/">Our story →</a></div></div></section></div><section class="daily-brief-signup" id="fmb-daily-brief-signup" aria-labelledby="daily-brief-title"><div class="daily-brief-mark"><img src="/assets/images/brand/fmb-bulletin-emblem.svg" alt="" aria-hidden="true"></div><div class="brief-copy"><div class="brief-label">Be part of a more informed tomorrow.</div><h2 id="daily-brief-title">Get our latest stories, straight to your inbox.</h2><span class="brief-rule"><i></i></span></div><p class="brief-promise">FMB Daily Brief</p><form data-fmb-newsletter-form novalidate><div class="brief-form-row"><label class="sr-only" for="fmb-landing-email">Email address</label><input id="fmb-landing-email" type="email" name="email" placeholder="Your email address" autocomplete="email" required><button type="submit">Subscribe</button></div><input data-fmb-newsletter-honeypot name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><label class="consent"><input type="checkbox" data-fmb-newsletter-consent required><span>Receive FMB Daily Brief. See our <a href="/news/privacy/">Privacy</a> and <a href="/news/terms/">Terms of Use</a>.</span></label><p class="status" data-fmb-newsletter-status role="status" aria-live="polite"></p></form></section></div></section></main>`;
  html = html.replace(/<main[\s\S]*?<\/main>/i, main);

  const footer = '<footer class="footer publication-footer"><div class="publication-footer-inner"><div><div class="footer-publication-title">FMB NEWS.</div><div class="footer-publication-kicker">Filipino Media Bulletin · News and Information with Purpose.</div></div><div class="footer-publication-kicker">© 2026 FMB News. All rights reserved.</div><img class="publication-footer-emblem" src="/assets/images/brand/fmb-bulletin-emblem.svg" alt=""></div></footer>';
  html = html.replace(/<footer class="footer"[\s\S]*?<\/footer>/i, footer);
  html = html.replace(/<div class="ticker-label">[\s\S]*?<\/div>/i, '<div class="ticker-label"><span class="ticker-pulse" aria-hidden="true"></span>HEADLINES</div>');
  return html;
}

const stories = await publishedStories();
let html = await readFile(page, 'utf8');
html = applyDesktopPublicationLanding(html, stories);
html = html.replace(/<div class="fmb-mobile-app-home"[\s\S]*?<\/div>\s*(?=<main class="network-home")/i, '');
html = html.replace('<main class="network-home">', `${renderMobileHome(stories)}<main class="network-home">`);
await writeFile(page, html, 'utf8');

console.log(`Rendered FMB News editorial reference home: story-led desktop newspaper layout, World/Sports/Entertainment rail, five publication products, founder section, newsletter, and mobile editorial home with ${stories.slice(0, 6).length} current stories.`);