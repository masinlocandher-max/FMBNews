import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const editionRoot = path.join(root, 'apps', 'withlovefmb', 'content', 'news', 'morning-special');
const origin = 'https://www.francinemariebautista.com';
const forbiddenImagePattern = /(?:newsroom-editorial-fallback|fmb-news-(?:primary-logo|white-transparent|official)|(?:^|[-_/])(?:logo|wordmark|masthead)(?:[-_.?/]|$))/i;

const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const decode = (value = '') => String(value).replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
const strip = (value = '') => decode(String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

async function walk(dir) {
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch (error) {
    if (error?.code === 'ENOENT') return out;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))?.[2] || '';
}

function meta(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if ((attr(tag, 'property') || attr(tag, 'name')).toLowerCase() === key.toLowerCase()) return decode(attr(tag, 'content'));
  }
  return '';
}

function canonical(html, file) {
  const link = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]).find((tag) => attr(tag, 'rel').toLowerCase() === 'canonical');
  if (link) {
    try { return new URL(decode(attr(link, 'href')), origin).pathname.replace(/\/+$/, '/') || '/'; } catch {}
  }
  return `/${path.relative(dist, path.dirname(file)).split(path.sep).join('/')}/`.replace(/\/+/g, '/');
}

function jsonDate(html) {
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const value = JSON.parse(match[1]);
      for (const item of (Array.isArray(value) ? value : [value])) if (item?.datePublished) return String(item.datePublished);
    } catch {}
  }
  return '';
}

function localEditorialImage(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, origin);
    if (parsed.origin !== origin) return '';
    const local = parsed.pathname + parsed.search;
    if (!local.startsWith('/assets/') || forbiddenImagePattern.test(local)) return '';
    return local;
  } catch { return ''; }
}

function firstImage(html) {
  const candidates = [meta(html, 'og:image'), ...[...html.matchAll(/<img\b[^>]*>/gi)].map((match) => decode(attr(match[0], 'src')))];
  for (const candidate of candidates) {
    const local = localEditorialImage(candidate);
    if (local) return local;
  }
  return '';
}

async function imageExists(url) {
  const local = localEditorialImage(url);
  if (!local) return false;
  try {
    await access(path.join(dist, local.split('?')[0].replace(/^\/+/, '')));
    return true;
  } catch { return false; }
}

function dateValue(raw) {
  const stamp = Date.parse(raw || '');
  return Number.isFinite(stamp) ? stamp : 0;
}

function dateLabel(raw) {
  const stamp = dateValue(raw);
  if (!stamp) return 'Undated archive';
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(stamp));
}

function timeLabel(raw) {
  const stamp = dateValue(raw);
  if (!stamp) return 'Archive';
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(stamp)) + ' PHT';
}

function record(html, file) {
  const route = canonical(html, file);
  if (!route.startsWith('/news/') || route === '/news/' || route.startsWith('/news/archive/') || route.startsWith('/news/morning-special/')) return null;
  if (/http-equiv=["']refresh["']/i.test(html) || /\bnoindex\b/i.test(meta(html, 'robots'))) return null;
  const title = (meta(html, 'og:title') || strip(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '')).replace(/\s*[|·-]\s*FMB News.*$/i, '').trim();
  if (!title) return null;
  const description = meta(html, 'description') || meta(html, 'og:description') || '';
  const published = meta(html, 'article:published_time') || meta(html, 'date') || jsonDate(html);
  if (!dateValue(published)) return null;
  const category = strip(html.match(/<[^>]+class=(["'])[^"']*(?:nc-kicker|ms-kicker)[^"']*\1[^>]*>([\s\S]*?)<\//i)?.[2] || '') || 'FMB News';
  const image = firstImage(html);
  if (!image) return null;
  return { route, title, description, published, category, image };
}

function imgTag(src, alt, priority = false) {
  return `<img src="${esc(localEditorialImage(src))}" alt="${esc(alt)}" width="1600" height="1000" loading="${priority ? 'eager' : 'lazy'}" decoding="async"${priority ? ' fetchpriority="high"' : ''}>`;
}

function articleCard(item, compact = false, priority = false) {
  return `<article class="story-card${compact ? ' compact' : ''}"><a class="story-media" href="${esc(item.route)}">${imgTag(item.image, item.title, priority)}</a><div class="story-copy"><div class="story-meta"><span>${esc(item.category)}</span><time datetime="${esc(item.published)}">${esc(timeLabel(item.published))}</time></div><h3><a href="${esc(item.route)}">${esc(item.title)}</a></h3>${compact ? '' : `<p>${esc(item.description)}</p>`}</div></article>`;
}

function shell({ title, description, active, body, canonicalPath, preload = '' }) {
  const canonicalRoute = canonicalPath || (active === 'latest' ? '/news/' : active === 'morning' ? '/news/morning-special/' : '/news/archive/');
  const preloadLink = preload ? `<link rel="preload" as="image" href="${esc(localEditorialImage(preload))}" fetchpriority="high">` : '';
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${origin}${canonicalRoute}">${preloadLink}<style>
:root{--ink:#18151a;--purple:#35125e;--plum:#1b0828;--orchid:#8a38f5;--muted:#6d6670;--line:#d9d4da;--paper:#fffdfb;--wash:#f2efec;--serif:Georgia,'Times New Roman',serif;--sans:Arial,Helvetica,sans-serif;--measure:760px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);overflow-x:hidden}img{max-width:100%}.topline{height:6px;background:var(--purple)}.mast{position:sticky;top:0;z-index:20;border-bottom:1px solid var(--line);background:rgba(255,253,251,.96);backdrop-filter:blur(18px)}.mast-inner{width:min(1380px,calc(100% - 48px));min-height:82px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:28px}.brand{color:var(--purple);font-family:var(--serif);font-size:2.35rem;font-weight:700;letter-spacing:-.045em;text-decoration:none}.brand small{display:inline;margin-left:16px;color:var(--muted);font:700 .62rem/1 var(--sans);letter-spacing:.04em}.nav{display:flex;align-items:center;gap:25px}.nav a{padding:31px 0 27px;border-bottom:3px solid transparent;color:var(--ink);font-size:.7rem;font-weight:800;letter-spacing:.06em;text-decoration:none;text-transform:uppercase}.nav a.active,.nav a:hover{border-color:var(--purple);color:var(--purple)}.hero{border-bottom:1px solid var(--line);background:var(--paper)}.hero-inner{width:min(1380px,calc(100% - 48px));margin:auto;padding:28px 0 22px}.eyebrow{display:inline-flex;padding:9px 13px;background:var(--plum);color:#e6cef7;font-size:.64rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.hero h1{max-width:980px;margin:22px 0 12px;font-family:var(--serif);font-size:clamp(2.5rem,5vw,5.2rem);line-height:.92;letter-spacing:-.055em}.hero p{max-width:760px;margin:0 0 12px;color:var(--muted);font:1.08rem/1.65 var(--serif)}.section{width:min(1380px,calc(100% - 48px));margin:auto;padding:44px 0 78px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:24px;padding-bottom:15px;border-bottom:1px solid var(--line)}.section-head h2{margin:0;font-family:var(--serif);font-size:clamp(2.4rem,4vw,4rem);line-height:.94;letter-spacing:-.048em}.section-head a{color:var(--purple);font-size:.7rem;font-weight:800;text-decoration:none;text-transform:uppercase}.lead-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(320px,.75fr);gap:28px}.lead-card{padding-bottom:26px;border-bottom:1px solid var(--line)}.lead-media,.story-media,.edition-cover,.edition-hero,.chapter-figure{display:block;overflow:hidden;background:#e8e4e0}.lead-media{aspect-ratio:16/9}.lead-media img,.story-media img,.edition-cover img,.edition-hero img,.chapter-figure img{display:block;width:100%;height:100%;object-fit:cover}.lead-card h2{margin:16px 0 9px;font-family:var(--serif);font-size:clamp(2.5rem,4.8vw,4.7rem);line-height:.93;letter-spacing:-.055em}.lead-card h2 a,.story-card h3 a{color:inherit;text-decoration:none}.lead-card p,.story-card p{color:var(--muted);line-height:1.62}.stack{display:grid;align-content:start;gap:14px}.story-card{display:grid;grid-template-columns:180px 1fr;gap:17px;padding:14px 0;border-top:1px solid var(--line)}.story-card.compact{grid-template-columns:130px 1fr}.story-media{aspect-ratio:4/3}.story-meta{display:flex;justify-content:space-between;gap:12px;color:var(--muted);font-size:.56rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.story-card h3{margin:7px 0;font-family:var(--serif);font-size:1.42rem;line-height:1.06;letter-spacing:-.025em}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:36px 22px}.grid .story-card{display:block}.grid .story-media{margin-bottom:13px;aspect-ratio:16/10}.special{background:var(--plum);color:#fff}.special .section-head{border-color:#ffffff32}.special .section-head a{color:#dec5ef}.edition-feature{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:34px;align-items:end}.edition-cover{aspect-ratio:16/9}.edition-feature-copy .edition-date{color:#d7bfdf}.edition-feature-copy h3{margin:10px 0 14px;font:700 clamp(2.3rem,4.4vw,4.6rem)/.95 var(--serif);letter-spacing:-.052em}.edition-feature-copy p{color:#d4c9d7;font:1.02rem/1.65 var(--serif)}.button{display:inline-flex;margin-top:10px;padding:13px 17px;background:#fff;color:var(--plum);font-size:.7rem;font-weight:800;letter-spacing:.08em;text-decoration:none;text-transform:uppercase}.archive-day{padding:28px 0 10px;border-top:1px solid var(--line)}.archive-day h2{margin:0 0 18px;font-family:var(--serif);font-size:2.2rem}.archive-list{display:grid;gap:10px}.edition-list{display:grid;gap:34px}.edition-card{display:grid;grid-template-columns:minmax(280px,.8fr) minmax(0,1.2fr);gap:30px;padding:0 0 34px;border-bottom:1px solid var(--line)}.edition-card .edition-cover{aspect-ratio:16/10}.edition-card h2{margin:9px 0 12px;font:700 clamp(2.2rem,4vw,4rem)/.96 var(--serif);letter-spacing:-.045em}.edition-card h2 a{color:inherit;text-decoration:none}.edition-card p{max-width:760px;color:var(--muted);font:1rem/1.65 var(--serif)}.edition-date{font-size:.65rem;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.edition-page{background:#f6f2ed}.edition-top{width:min(1180px,calc(100% - 48px));margin:auto;padding:42px 0 22px}.edition-top h1{max-width:1040px;margin:18px 0 18px;font:700 clamp(3.2rem,7vw,7.4rem)/.86 var(--serif);letter-spacing:-.065em}.edition-top .standfirst{max-width:820px;margin:0;color:var(--muted);font:1.25rem/1.65 var(--serif)}.edition-byline{display:flex;flex-wrap:wrap;gap:10px 24px;margin-top:22px;padding-top:16px;border-top:1px solid var(--line);font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.edition-hero{width:min(1380px,100%);height:min(68vw,760px);margin:10px auto 0}.edition-hero img{object-position:center}.figcaption{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;padding:11px 14px;background:#fff;color:var(--muted);font-size:.7rem;line-height:1.45}.figcaption a{color:var(--purple)}.edition-layout{width:min(1180px,calc(100% - 48px));margin:0 auto;display:grid;grid-template-columns:230px minmax(0,var(--measure));gap:70px;align-items:start;padding:62px 0 90px}.toc{position:sticky;top:110px;padding-top:6px;border-top:3px solid var(--purple)}.toc strong{display:block;margin:12px 0;font:700 1.25rem var(--serif)}.toc a{display:block;padding:10px 0;border-top:1px solid var(--line);color:var(--ink);font-size:.7rem;font-weight:800;line-height:1.35;text-decoration:none}.edition-body{min-width:0}.chapter{scroll-margin-top:105px;padding:0 0 60px}.chapter+.chapter{padding-top:60px;border-top:1px solid var(--line)}.chapter-number{color:var(--purple);font-size:.65rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.chapter h2{margin:12px 0 14px;font:700 clamp(2.5rem,5vw,4.8rem)/.94 var(--serif);letter-spacing:-.05em}.chapter .chapter-deck{margin:0 0 28px;color:var(--muted);font:1.24rem/1.55 var(--serif)}.chapter p{margin:0 0 1.2em;font:1.08rem/1.82 var(--serif)}.chapter p:first-of-type::first-letter{float:left;margin:.08em .12em 0 0;color:var(--purple);font:700 4.7rem/.76 var(--serif)}.chapter-figure{margin:28px 0 26px;aspect-ratio:16/10}.sources{margin-top:32px;padding:20px;border:1px solid var(--line);background:#fff}.sources h3{margin:0 0 10px;font:700 1.2rem var(--serif)}.sources ul{margin:0;padding-left:20px}.sources li+li{margin-top:8px}.sources a{color:var(--purple);font-size:.78rem;line-height:1.45}.edition-next{display:flex;justify-content:space-between;gap:20px;margin-top:20px;padding-top:24px;border-top:1px solid var(--line)}.edition-next a{color:var(--purple);font-size:.72rem;font-weight:800;text-decoration:none;text-transform:uppercase}.footer{margin-top:0;padding:65px 0;background:var(--plum);color:#fff}.footer-inner{width:min(1380px,calc(100% - 48px));margin:auto;color:#d3c4d9;font:1rem/1.7 var(--serif)}.footer-inner strong{display:block;margin-bottom:8px;color:#fff;font-size:2.2rem}
@media(max-width:900px){.mast-inner{width:min(100% - 28px,1380px);min-height:68px}.brand{font-size:1.8rem}.brand small{display:none}.nav{gap:15px;overflow-x:auto}.nav a{padding:26px 0 21px;font-size:.59rem;white-space:nowrap}.hero-inner,.section{width:min(100% - 28px,1380px)}.lead-grid,.grid,.edition-feature{grid-template-columns:1fr}.edition-feature-copy{padding-bottom:4px}.story-card,.story-card.compact{grid-template-columns:120px 1fr}.edition-card{grid-template-columns:1fr}.edition-layout{width:min(100% - 34px,760px);display:block}.toc{position:static;margin-bottom:50px}.edition-top{width:min(100% - 34px,1180px)}.edition-hero{height:auto;aspect-ratio:16/10}}
@media(max-width:560px){.topline{height:4px}.mast-inner{width:100%;padding:0 14px;align-items:flex-start;flex-direction:column;gap:0}.brand{padding-top:13px;font-size:1.65rem}.nav{width:100%;gap:18px}.nav a{padding:12px 0 14px}.nav a:nth-child(4),.nav a:nth-child(5){display:none}.hero-inner{padding:23px 0 20px}.hero h1{font-size:2.85rem}.hero p{font-size:1rem}.section{padding:32px 0 58px}.section-head{align-items:flex-start;flex-direction:column;gap:8px}.section-head h2{font-size:2.7rem}.lead-grid{display:flex;flex-direction:column}.lead-media{margin-inline:-14px}.lead-card h2{font-size:2.55rem;line-height:.96}.lead-card p{font-size:.92rem}.story-card,.story-card.compact{grid-template-columns:108px minmax(0,1fr);gap:13px}.story-card p{display:none}.story-card h3{font-size:1.17rem}.story-meta{display:block}.story-meta time{display:block;margin-top:4px}.grid{display:block}.grid .story-card{display:grid}.grid .story-media{margin:0;aspect-ratio:4/3}.edition-feature{gap:20px}.edition-cover{margin-inline:-14px}.edition-feature-copy h3{font-size:2.65rem}.edition-card{gap:18px}.edition-card .edition-cover{margin-inline:-14px}.edition-card h2{font-size:2.65rem}.edition-top{padding-top:28px}.edition-top h1{font-size:3.2rem;line-height:.9}.edition-top .standfirst{font-size:1.08rem}.edition-hero{aspect-ratio:4/3}.figcaption{grid-template-columns:1fr}.edition-layout{padding:40px 0 70px}.toc{margin-bottom:40px}.chapter{padding-bottom:45px}.chapter+.chapter{padding-top:45px}.chapter h2{font-size:2.75rem}.chapter .chapter-deck{font-size:1.1rem}.chapter p{font-size:1.02rem;line-height:1.75}.chapter-figure{margin-inline:-17px;aspect-ratio:4/3}.footer{padding:48px 0}.footer-inner{width:min(100% - 28px,1380px)}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}</style></head><body class="fmb-news-clean fmb-news-landing${active === 'edition' ? ' edition-page' : ''}"><div class="topline"></div><header class="mast"><div class="mast-inner"><a class="brand" href="/news/">FMB News<small>The news that matters. Made clear for Filipinos.</small></a><nav class="nav"><a class="${active === 'latest' ? 'active' : ''}" href="/news/">Latest</a><a class="${active === 'morning' || active === 'edition' ? 'active' : ''}" href="/news/morning-special/">Morning Special</a><a class="${active === 'archive' ? 'active' : ''}" href="/news/archive/">Archive</a><a href="/news/about/">About</a><a href="mailto:info.senz.pr@gmail.com?subject=FMB%20News%20Story%20Submission">Submit a story</a></nav></div></header>${body}<footer class="footer"><div class="footer-inner"><strong>FMB News</strong>Verified facts, visible sources, meaningful context and clear explanations for Filipinos.</div></footer></body></html>`;
}

function groupByDate(items) {
  const groups = new Map();
  for (const item of items) {
    const key = dateLabel(item.published);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function editionRoute(edition) { return `/news/morning-special/${edition.date}/`; }

function editionFeature(edition) {
  return `<div class="edition-feature"><a class="edition-cover" href="${editionRoute(edition)}">${imgTag(edition.hero.src, edition.hero.alt, true)}</a><div class="edition-feature-copy"><div class="edition-date">${esc(edition.editionLabel)} · ${esc(dateLabel(edition.publishedAt))}</div><h3>${esc(edition.title)}</h3><p>${esc(edition.deck)}</p><a class="button" href="${editionRoute(edition)}">Read the full edition →</a></div></div>`;
}

function editionCard(edition, priority = false) {
  return `<article class="edition-card"><a class="edition-cover" href="${editionRoute(edition)}">${imgTag(edition.hero.src, edition.hero.alt, priority)}</a><div><div class="edition-date">${esc(edition.editionLabel)} · ${esc(dateLabel(edition.publishedAt))}</div><h2><a href="${editionRoute(edition)}">${esc(edition.title)}</a></h2><p>${esc(edition.deck)}</p><a class="button" href="${editionRoute(edition)}">Open complete edition →</a></div></article>`;
}

function latestPage(normal, editions) {
  const lead = normal[0];
  const side = normal.slice(1, 4);
  const rest = normal.slice(4, 13);
  const latestEdition = editions[0];
  const body = `<section class="hero"><div class="hero-inner"><div class="eyebrow">What matters now</div><h1>The news that matters. Made clear for Filipinos.</h1><p>Verified reporting, useful context, and the developments shaping Filipino lives.</p></div></section><main><section class="section"><div class="section-head"><h2>Latest News</h2><a href="/news/archive/">Browse complete archive →</a></div>${lead ? `<div class="lead-grid"><article class="lead-card"><a class="lead-media" href="${esc(lead.route)}">${imgTag(lead.image, lead.title, true)}</a><div class="story-meta"><span>${esc(lead.category)}</span><time datetime="${esc(lead.published)}">${esc(timeLabel(lead.published))}</time></div><h2><a href="${esc(lead.route)}">${esc(lead.title)}</a></h2><p>${esc(lead.description)}</p></article><div class="stack">${side.map((item) => articleCard(item, true, true)).join('')}</div></div>` : '<p>No current reports available.</p>'}</section>${latestEdition ? `<section class="special"><div class="section"><div class="section-head"><div><div class="eyebrow">Daily magazine edition</div><h2>Morning Special</h2></div><a href="/news/morning-special/">All editions →</a></div>${editionFeature(latestEdition)}</div></section>` : ''}<section class="section"><div class="section-head"><h2>More Reports</h2><a href="/news/archive/">View all →</a></div><div class="grid">${rest.map((item) => articleCard(item)).join('')}</div></section></main>`;
  return shell({ title: 'FMB News | The news that matters. Made clear for Filipinos.', description: 'FMB News presents current Philippine and global reports in clear chronological order, including a complete Morning Special daily magazine edition.', active: 'latest', body, preload: lead?.image || latestEdition?.hero?.src || '' });
}

function morningArchivePage(editions) {
  const body = `<section class="hero"><div class="hero-inner"><div class="eyebrow">One complete edition every morning</div><h1>Morning Special</h1><p>Each date opens as one continuous magazine-style article—complete, sourced and image-backed—not as a row of disconnected story cards.</p></div></section><main class="section"><div class="section-head"><h2>Today &amp; Archive</h2><a href="/news/">Back to latest →</a></div><div class="edition-list">${editions.map((edition, index) => editionCard(edition, index < 2)).join('')}</div></main>`;
  return shell({ title: 'Morning Special Archive | FMB News', description: 'Browse complete FMB News Morning Special magazine editions by date.', active: 'morning', body, preload: editions[0]?.hero?.src || '' });
}

function figure(image, className, priority = false) {
  return `<figure class="${className}">${imgTag(image.src, image.alt, priority)}<figcaption class="figcaption"><span>${esc(image.caption)}</span><span>${image.sourceUrl ? `<a href="${esc(image.sourceUrl)}" rel="noopener">${esc(image.credit)}</a>` : esc(image.credit)}${image.licenseUrl ? ` · <a href="${esc(image.licenseUrl)}" rel="noopener">License</a>` : ''}</span></figcaption></figure>`;
}

function sourcesBox(sources) {
  return `<aside class="sources"><h3>Sources and public record</h3><ul>${sources.map((source) => `<li><a href="${esc(source.url)}" rel="noopener">${esc(source.label)}</a></li>`).join('')}</ul></aside>`;
}

function editionPage(edition, previous, next) {
  const route = editionRoute(edition);
  const chapters = edition.stories.map((story, index) => `<section class="chapter" id="chapter-${index + 1}" data-story-id="${esc(story.id)}"><div class="chapter-number">Chapter ${index + 1} · ${esc(story.kicker)}</div><h2>${esc(story.headline)}</h2><p class="chapter-deck">${esc(story.deck)}</p>${story.image ? figure(story.image, 'chapter-figure') : ''}${story.body.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}${sourcesBox(story.sources)}</section>`).join('');
  const toc = edition.stories.map((story, index) => `<a href="#chapter-${index + 1}">${index + 1}. ${esc(story.headline)}</a>`).join('');
  const nav = `<div class="edition-next">${previous ? `<a href="${editionRoute(previous)}">← ${esc(dateLabel(previous.publishedAt))}</a>` : '<span></span>'}${next ? `<a href="${editionRoute(next)}">${esc(dateLabel(next.publishedAt))} →</a>` : '<a href="/news/morning-special/">All editions →</a>'}</div>`;
  const structured = JSON.stringify({ '@context': 'https://schema.org', '@type': 'NewsArticle', headline: edition.title, description: edition.deck, datePublished: edition.publishedAt, dateModified: edition.publishedAt, mainEntityOfPage: origin + route, image: [origin + edition.hero.src], author: { '@type': 'Organization', name: 'FMB News Desk' }, publisher: { '@type': 'Organization', name: 'FMB News' } }).replaceAll('<', '\\u003c');
  const body = `<main><article class="morning-edition" data-edition-date="${esc(edition.date)}"><header class="edition-top"><div class="eyebrow">${esc(edition.editionLabel)}</div><h1>${esc(edition.title)}</h1><p class="standfirst">${esc(edition.deck)}</p><div class="edition-byline"><span>FMB News Desk</span><time datetime="${esc(edition.publishedAt)}">${esc(dateLabel(edition.publishedAt))} · ${esc(timeLabel(edition.publishedAt))}</time><span>3 chapters · One complete edition</span></div></header>${figure(edition.hero, 'edition-hero', true)}<div class="edition-layout"><nav class="toc" aria-label="In this edition"><strong>In this edition</strong>${toc}<a href="/news/morning-special/">View archive</a></nav><div class="edition-body">${chapters}${nav}</div></div></article><script type="application/ld+json">${structured}</script></main>`;
  return shell({ title: `${edition.title} | Morning Special | FMB News`, description: edition.deck, active: 'edition', canonicalPath: route, body, preload: edition.hero.src });
}

function archivePage(normal) {
  const groups = groupByDate(normal);
  const body = `<section class="hero"><div class="hero-inner"><div class="eyebrow">FMB News Record</div><h1>News Archive</h1><p>Every standard FMB News report in reverse chronological order. Morning Special remains a separate full-edition archive.</p></div></section><main class="section">${normal.length ? [...groups.entries()].map(([label, items]) => `<section class="archive-day"><h2>${esc(label)}</h2><div class="archive-list">${items.map((item, index) => articleCard(item, true, index < 2)).join('')}</div></section>`).join('') : '<p>No archived reports are available.</p>'}</main>`;
  return shell({ title: 'News Archive | FMB News', description: 'Browse the complete chronological archive of standard FMB News reports.', active: 'archive', body, preload: normal[0]?.image || '' });
}

function editorialStoryRoute(html, file) {
  const route = canonical(html, file);
  if (!route.startsWith('/news/') || route === '/news/' || route.startsWith('/news/about/') || route.startsWith('/news/archive/') || route.startsWith('/news/morning-special/')) return '';
  if (/http-equiv=["']refresh["']/i.test(html) || /\bnoindex\b/i.test(meta(html, 'robots')) || !/<h1\b/i.test(html)) return '';
  return route;
}

function unavailableStoryRedirect() {
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Report unavailable | FMB News</title><meta name="description" content="Continue to the current FMB News newsroom."><meta name="robots" content="noindex,follow"><link rel="canonical" href="${origin}/news/"><meta http-equiv="refresh" content="0;url=/news/"></head><body><main><p>This report is not currently published. <a href="/news/">Continue to FMB News</a>.</p></main></body></html>`;
}

function cleanGenericImageDelivery(html) {
  return html.replace(/<style\b[^>]*id=["']fmb-news-image-fallback-surface["'][^>]*>[\s\S]*?<\/style>\s*/gi, '').replace(/<figure\b[^>]*>[\s\S]*?newsroom-editorial-fallback\.svg[\s\S]*?<\/figure>\s*/gi, '').replace(/<(?:img|source)\b[^>]*newsroom-editorial-fallback\.svg[^>]*>\s*/gi, '').replace(/<meta\b[^>]*content=["'][^"']*newsroom-editorial-fallback\.svg[^"']*["'][^>]*>\s*/gi, '');
}

async function readSitemap() {
  const sitemapPath = path.join(dist, 'sitemap.xml');
  try { return { sitemapPath, html: await readFile(sitemapPath, 'utf8') }; } catch (error) {
    if (error?.code === 'ENOENT') return { sitemapPath, html: '' };
    throw error;
  }
}

async function updateSitemap({ remove = [], add = [] }) {
  const { sitemapPath, html } = await readSitemap();
  if (!html) return;
  const removed = new Set(remove.map((route) => origin + route));
  let next = html.replace(/<url>[\s\S]*?<\/url>/g, (block) => ([...removed].some((url) => block.includes(`<loc>${url}</loc>`)) ? '' : block));
  const missing = add.filter((route) => !next.includes(`<loc>${origin}${route}</loc>`));
  if (missing.length) {
    const blocks = missing.map((route) => `<url><loc>${origin}${route}</loc></url>`).join('');
    next = next.replace('</urlset>', `${blocks}</urlset>`);
  }
  if (next !== html) await writeFile(sitemapPath, next, 'utf8');
}

async function loadEditions() {
  const names = (await readdir(editionRoot)).filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort();
  const editions = [];
  for (const name of names) {
    const edition = JSON.parse(await readFile(path.join(editionRoot, name), 'utf8'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(edition.date || '') || !dateValue(edition.publishedAt)) throw new Error(`Invalid Morning Special date in ${name}`);
    if (!edition.title || !edition.deck || !edition.hero || !Array.isArray(edition.stories) || edition.stories.length < 1) throw new Error(`Incomplete Morning Special in ${name}`);
    const images = [edition.hero, ...edition.stories.map((story) => story.image).filter(Boolean)];
    for (const image of images) {
      if (!image.src || !image.alt || !image.caption || !image.credit || !await imageExists(image.src)) throw new Error(`Missing or invalid attached Morning Special image ${image.src || '(empty)'} in ${name}`);
    }
    for (const story of edition.stories) {
      if (!story.id || !story.headline || !story.deck || !Array.isArray(story.body) || story.body.length < 4 || !Array.isArray(story.sources) || !story.sources.length) throw new Error(`Incomplete Morning Special chapter ${story.id || '(unknown)'} in ${name}`);
    }
    editions.push(edition);
  }
  return editions.sort((a, b) => dateValue(b.publishedAt) - dateValue(a.publishedAt));
}

const files = await walk(newsRoot);
const records = [];
const withheldStories = [];
for (const file of files) {
  if (file === path.join(newsRoot, 'index.html')) continue;
  const html = await readFile(file, 'utf8');
  const route = editorialStoryRoute(html, file);
  const cleanStory = html.includes('news-story-route') && html.includes('fmb-news-clean');
  const rec = cleanStory ? record(html, file) : null;
  const publishable = Boolean(rec && await imageExists(rec.image));
  if (publishable) records.push(rec);
  else if (route) withheldStories.push({ file, route });
  const cleaned = cleanGenericImageDelivery(html);
  if (cleaned !== html) await writeFile(file, cleaned, 'utf8');
}

records.sort((a, b) => dateValue(b.published) - dateValue(a.published) || a.title.localeCompare(b.title));
const editions = await loadEditions();

await mkdir(path.join(newsRoot, 'archive'), { recursive: true });
await mkdir(path.join(newsRoot, 'morning-special'), { recursive: true });
const latest = latestPage(records, editions);
await writeFile(path.join(newsRoot, 'index.html'), latest, 'utf8');
await writeFile(path.join(newsRoot, 'archive', 'index.html'), archivePage(records), 'utf8');
await writeFile(path.join(newsRoot, 'morning-special', 'index.html'), morningArchivePage(editions), 'utf8');

for (let index = 0; index < editions.length; index++) {
  const edition = editions[index];
  const dir = path.join(newsRoot, 'morning-special', edition.date);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), editionPage(edition, editions[index + 1], editions[index - 1]), 'utf8');
}

const aliasDir = path.join(dist, 'fmbnews');
await mkdir(aliasDir, { recursive: true });
await writeFile(path.join(aliasDir, 'index.html'), latest.replace('content="index,follow,max-image-preview:large"', 'content="noindex,follow,max-image-preview:large"'), 'utf8');

for (const story of withheldStories) await writeFile(story.file, unavailableStoryRedirect(), 'utf8');
await updateSitemap({ remove: withheldStories.map((story) => story.route), add: ['/news/morning-special/', ...editions.map(editionRoute)] });

console.log(`FMB News newsroom finalized with ${records.length} image-backed standard reports and ${editions.length} complete Morning Special magazine editions; ${withheldStories.length} invalid or imageless story routes remain withheld.`);
