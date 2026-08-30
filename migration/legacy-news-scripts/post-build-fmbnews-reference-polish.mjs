import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const roots = [path.join(distRoot, 'news'), path.join(distRoot, 'fmbnews')];
const officialLogo = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';
const liveUrl = 'https://www.facebook.com/BinibiningFrancineMarie/live_videos/';
const compatibilityMarker = '<span class="fn9-audit-only nc-text-masthead" data-fmb-news-legacy-audit aria-hidden="true"><strong>News Center</strong><span>Filipino ang Mismong Balita.</span><span>Live News Desk</span></span>';

async function walk(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walk(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

function addBodyClass(html, className) {
  return html.replace(/<body\b([^>]*)>/i, (match, attrs = '') => {
    if (/\bclass=(['"])([^'"]*)\1/i.test(attrs)) {
      const next = attrs.replace(/\bclass=(['"])([^'"]*)\1/i, (whole, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
      return `<body${next}>`;
    }
    return `<body${attrs} class="${className}">`;
  });
}

const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.7"></circle><path d="m15.7 15.7 4.6 4.6"></path></svg>';
const menuIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><g class="fn11-menu-lines"><path d="M4 6.5h16M4 12h16M4 17.5h16"></path></g><g class="fn11-close-lines"><path d="m6 6 12 12M18 6 6 18"></path></g></svg>';
const arrowIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>';
const liveIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 8.5a5 5 0 0 0 0 7M5.5 5.5a9 9 0 0 0 0 13M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"></path><circle cx="12" cy="12" r="1.8"></circle></svg>';
const shareIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.7 10.7 6.6-4.2M8.7 13.3l6.6 4.2"></path></svg>';
const copyIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"></path></svg>';
const signal = '<span class="fn11-signal-mark" aria-hidden="true"><i></i><i></i><i></i><b></b></span>';
const wordmark = '<span class="fn11-wordmark" aria-hidden="true"><strong>FMB</strong><span>NEWS</span></span>';

function header() {
  const primaryLinks = [
    ['Home', '/fmbnews/', 'home'],
    ['Latest', '/fmbnews/#latest-reports', 'latest'],
    ['National', '/fmbnews/?section=national#latest-reports', 'national'],
    ['World', '/fmbnews/?section=world#latest-reports', 'world'],
    ['Business', '/fmbnews/?category=money#latest-reports', 'business'],
    ['Lifestyle', '/fmbnews/?category=lifestyle#latest-reports', 'lifestyle'],
    ['About', '/fmbnews/about/', 'about'],
  ];

  const desktopLinks = primaryLinks
    .map(([label, href, section], index) => `<a${index === 0 ? ' aria-current="page"' : ''} href="${href}" data-fmb-news-section-link="${section}">${label}</a>`)
    .join('');

  const menuLinks = primaryLinks
    .map(([label, href, section], index) => `<a${index === 0 ? ' aria-current="page"' : ''} href="${href}" data-fmb-news-section-link="${section}">${label}</a>`)
    .join('');

  return `<header class="nc-site-header fn9-site-header fn11-site-header fn12-site-header fn13-site-header" id="top"><div class="fn9-shell fn9-header-grid fn12-header-grid fn13-header-grid"><a class="fn11-brand-lockup fn12-brand-lockup fn13-brand-lockup" href="/fmbnews/" aria-label="FMB News home" data-fmb-news-logo><img class="fn12-official-logo fn13-official-logo" src="${officialLogo}" width="909" height="210" alt="FMB News"><span class="fn12-compat-logo" aria-hidden="true">${wordmark}<span class="fn11-logo-rule"></span>${signal}</span></a><nav class="fn12-desktop-nav fn13-desktop-nav" aria-label="FMB News sections">${desktopLinks}</nav><div class="fn11-header-actions fn13-header-actions"><a class="fn13-watch-live" href="${liveUrl}" target="_blank" rel="noopener noreferrer">Watch live <span aria-hidden="true">◉</span></a><button class="fn11-icon-button fn11-search-button" type="button" data-fn9-search-open aria-label="Search FMB News" aria-expanded="false" aria-controls="fn9SearchPanel">${searchIcon}</button><button class="fn11-icon-button fn11-menu-button" type="button" data-fn11-menu-toggle aria-label="Open FMB News menu" aria-expanded="false" aria-controls="fn11MenuPanel">${menuIcon}</button></div></div><nav class="fn11-menu-panel fn12-menu-panel fn13-menu-panel" id="fn11MenuPanel" data-fn11-menu-panel aria-label="FMB News navigation" hidden><div class="fn9-shell fn11-menu-grid fn12-menu-grid fn13-menu-grid"><div class="fn11-menu-primary"><p class="fn11-menu-label">FMB News</p>${menuLinks}<a href="${liveUrl}" target="_blank" rel="noopener noreferrer">Watch live</a><a href="mailto:withlovefmb@gmail.com">Contact the newsroom</a></div><div><p class="fn11-menu-label">More sections</p><div class="fn11-menu-categories"><a href="/fmbnews/?category=tech#latest-reports">Technology</a><a href="/fmbnews/?category=culture#latest-reports">Culture</a><a href="/fmbnews/?category=environment#latest-reports">Environment</a><a href="/fmbnews/?category=health#latest-reports">Health</a><a href="/fmbandco/">FMB&amp;CO. Home</a></div></div></div>${compatibilityMarker}</nav></header>`;
}

function replaceHeader(html) {
  const pattern = /<header\b[^>]*class=(['"])[^'"]*\bfn12-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i;
  if (!pattern.test(html)) throw new Error('FMB News reference polish could not find the V12 masthead.');
  return html.replace(pattern, header());
}

function polishHero(html) {
  const heroPattern = /<section\b[^>]*data-fmb-news-power-hero[^>]*>[\s\S]*?<\/section>/i;
  const hero = html.match(heroPattern)?.[0];
  if (!hero) throw new Error('FMB News reference polish could not find the landing hero.');

  const actions = `<div class="fn12-hero-actions fn13-hero-actions"><a class="fn12-primary-cta fn13-primary-cta" href="#latest-reports">Read latest news ${arrowIcon}</a><a class="fn12-secondary-cta fn13-secondary-cta" href="${liveUrl}" target="_blank" rel="noopener noreferrer">Watch live ${liveIcon}</a></div>`;

  const polished = hero
    .replace(/<p\b[^>]*class=(['"])[^'"]*\bfn12-hero-kicker\b[^'"]*\1[^>]*>[\s\S]*?<\/p>/i, '<p class="fn12-hero-kicker">Every story. Clearer. Sharper. Matters.</p>')
    .replace(/<h1\b[^>]*id=(['"])fn12HeroTitle\1[^>]*>[\s\S]*?<\/h1>/i, '<h1 id="fn12HeroTitle">Making every news clearer and sharper in a world full of info.</h1>')
    .replace(/<p\b[^>]*class=(['"])[^'"]*\bfn12-hero-deck\b[^'"]*\1[^>]*>[\s\S]*?<\/p>/i, '<p class="fn12-hero-deck">FMB News brings you credible, relevant, and impactful stories from the Philippines and around the world.</p>')
    .replace(/<div\b[^>]*class=(['"])[^'"]*\bfn12-hero-actions\b[^'"]*\1[^>]*>[\s\S]*?<\/div>/i, actions);

  return html.replace(heroPattern, polished);
}

function addFooterLogo(html) {
  const cleaned = html.replace(/<img\b[^>]*data-fmb-news-footer-logo[^>]*>\s*/gi, '');
  return cleaned.replace(
    /<div\b([^>]*)class=(['"])([^'"]*\bfn11-footer-brand\b[^'"]*)\2([^>]*)>/i,
    (match, before, quote, classes, after) => `<div${before}class=${quote}${classes}${quote}${after}><img class="fn13-footer-logo" data-fmb-news-footer-logo src="${officialLogo}" width="909" height="210" loading="lazy" decoding="async" alt="FMB News">`,
  );
}

function articleTools() {
  return `<aside class="fn13-article-tools" data-fmb-news-article-tools aria-label="Story tools"><div class="fn13-article-time"><span>Philippine Standard Time</span><time data-philippine-time>Loading Philippine time</time></div><div class="fn13-share-actions"><button type="button" data-fmb-share-story>${shareIcon}<span>Share story</span></button><button type="button" data-fmb-copy-story>${copyIcon}<span>Copy link</span></button></div><p class="fn13-share-status" data-fmb-share-status aria-live="polite"></p></aside>`;
}

function addArticleTools(html) {
  const cleaned = html.replace(/<aside\b[^>]*data-fmb-news-article-tools[^>]*>[\s\S]*?<\/aside>\s*/gi, '');
  const heroPattern = /<section\b[^>]*class=(['"])[^'"]*\bnc-article-hero\b[^'"]*\1[^>]*>[\s\S]*?<\/section>/i;
  if (heroPattern.test(cleaned)) return cleaned.replace(heroPattern, (section) => `${section}${articleTools()}`);

  const mainPattern = /<main\b[^>]*>/i;
  if (mainPattern.test(cleaned)) return cleaned.replace(mainPattern, (main) => `${main}${articleTools()}`);
  throw new Error('FMB News reference polish could not place article share tools.');
}

function ensureTimeMarker(html) {
  if (html.includes('data-philippine-time')) return html;
  const strip = '<div class="fn13-time-strip"><div class="fn9-shell"><span>Philippine Standard Time</span><time data-philippine-time>Loading Philippine time</time></div></div>';
  return html.replace(/<\/header>/i, `</header>${strip}`);
}

const styles = String.raw`
html body.news-reference-v13 .fn13-site-header{min-height:92px!important;background:rgba(255,255,255,.985)!important;border-bottom:1px solid rgba(44,10,78,.08)!important;box-shadow:0 10px 34px rgba(38,6,74,.045)!important}
html body.news-reference-v13 .fn13-header-grid{min-height:92px!important;grid-template-columns:auto minmax(0,1fr) auto!important;gap:clamp(24px,3.8vw,56px)!important}
html body.news-reference-v13 .fn13-official-logo{width:clamp(186px,17vw,232px)!important;height:auto!important;display:block!important;object-fit:contain!important}
html body.news-reference-v13 .fn13-desktop-nav{gap:clamp(16px,1.55vw,27px)!important}
html body.news-reference-v13 .fn13-desktop-nav a{padding:34px 0 29px!important;color:#1e0b34!important;font-size:10px!important;font-weight:800!important;letter-spacing:.04em!important;text-transform:uppercase!important}
html body.news-reference-v13 .fn13-desktop-nav a::after{bottom:22px!important;background:#d9a227!important}
html body.news-reference-v13 .fn13-header-actions{gap:10px!important}
html body.news-reference-v13 .fn13-watch-live{min-height:42px!important;padding:0 18px!important;display:inline-flex!important;align-items:center!important;gap:8px!important;border-radius:6px!important;background:#2b0755!important;color:#fff!important;font:800 10px/1 "Manrope",Arial,sans-serif!important;letter-spacing:.04em!important;text-decoration:none!important;text-transform:uppercase!important;box-shadow:0 12px 26px rgba(43,7,85,.14)!important;transition:transform 160ms ease,box-shadow 160ms ease!important}
html body.news-reference-v13 .fn13-watch-live:hover,html body.news-reference-v13 .fn13-watch-live:focus-visible{transform:translateY(-1px)!important;box-shadow:0 15px 30px rgba(43,7,85,.2)!important}
html body.news-reference-v13 .fn13-header-actions .fn11-icon-button{width:40px!important;height:40px!important}
html body.news-reference-v13 .fn13-menu-grid{grid-template-columns:minmax(230px,.8fr) minmax(0,1.2fr)!important}
html body.news-reference-v13.news-landing-v12 .fn12-landing-hero{background:linear-gradient(110deg,#fff 0%,#fff 48%,#faf8fd 100%)!important}
html body.news-reference-v13.news-landing-v12 .fn12-hero-shell{min-height:clamp(560px,61vw,710px)!important;grid-template-columns:minmax(0,1.08fr) minmax(400px,.92fr)!important}
html body.news-reference-v13.news-landing-v12 .fn12-hero-copy{max-width:690px!important;padding:clamp(70px,7vw,100px) 0!important}
html body.news-reference-v13.news-landing-v12 .fn12-hero-kicker{margin-bottom:17px!important;color:#c48818!important;font-size:10px!important;letter-spacing:.16em!important}
html body.news-reference-v13.news-landing-v12 .fn12-hero-copy h1{max-width:13.3ch!important;font-size:clamp(2.9rem,5vw,4.8rem)!important;font-weight:800!important;letter-spacing:-.055em!important;line-height:1.01!important}
html body.news-reference-v13.news-landing-v12 .fn12-hero-deck{max-width:56ch!important;margin-top:24px!important;color:#40374a!important;font-size:clamp(.98rem,1.28vw,1.12rem)!important;line-height:1.65!important}
html body.news-reference-v13.news-landing-v12 .fn13-hero-actions{margin-top:30px!important;gap:13px!important}
html body.news-reference-v13.news-landing-v12 .fn13-primary-cta,html body.news-reference-v13.news-landing-v12 .fn13-secondary-cta{min-height:48px!important;padding:0 22px!important;border-radius:6px!important;text-transform:uppercase!important}
html body.news-reference-v13.news-landing-v12 .fn13-secondary-cta svg{width:19px!important;height:19px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
html body.news-reference-v13.news-landing-v12 .fn12-hero-art{right:-52px!important;width:min(61vw,810px)!important;opacity:.88!important}
html body.news-reference-v13 .fn13-time-strip{border-bottom:1px solid rgba(70,21,131,.08)!important;background:#fbf9fd!important}
html body.news-reference-v13 .fn13-time-strip .fn9-shell{min-height:38px!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:10px!important;color:#5a4e65!important;font:700 9px/1 "Manrope",Arial,sans-serif!important;letter-spacing:.08em!important;text-transform:uppercase!important}
html body.news-reference-v13 .fn13-time-strip time{color:#2b0755!important}
html body.news-reference-v13 .fn13-article-tools{width:min(calc(100% - 40px),1100px)!important;margin:22px auto 8px!important;padding:16px 18px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;border:1px solid rgba(70,21,131,.12)!important;border-radius:12px!important;background:linear-gradient(110deg,#fff,#faf7fd)!important;box-shadow:0 12px 30px rgba(38,6,74,.06)!important}
html body.news-reference-v13 .fn13-article-time{display:grid!important;gap:5px!important}
html body.news-reference-v13 .fn13-article-time span{color:#8b7c94!important;font:800 8px/1 "Manrope",Arial,sans-serif!important;letter-spacing:.12em!important;text-transform:uppercase!important}
html body.news-reference-v13 .fn13-article-time time{color:#2d1741!important;font:700 12px/1.35 "Manrope",Arial,sans-serif!important}
html body.news-reference-v13 .fn13-share-actions{display:flex!important;align-items:center!important;gap:9px!important}
html body.news-reference-v13 .fn13-share-actions button{min-height:40px!important;padding:0 14px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;border:1px solid rgba(70,21,131,.25)!important;border-radius:7px!important;background:#fff!important;color:#35105d!important;font:800 9px/1 "Manrope",Arial,sans-serif!important;letter-spacing:.035em!important;text-transform:uppercase!important;cursor:pointer!important}
html body.news-reference-v13 .fn13-share-actions button:first-child{border-color:#2b0755!important;background:#2b0755!important;color:#fff!important}
html body.news-reference-v13 .fn13-share-actions svg{width:17px!important;height:17px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
html body.news-reference-v13 .fn13-share-status{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important}
html body.news-reference-v13 .fn13-footer-logo{width:clamp(150px,16vw,205px)!important;height:auto!important;display:block!important;object-fit:contain!important}
html body.news-reference-v13 .fn11-footer-brand>.fn11-signal-mark,html body.news-reference-v13 .fn11-footer-brand>div>.fn11-wordmark{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important}
@media(max-width:1160px){html body.news-reference-v13 .fn13-desktop-nav{display:none!important}html body.news-reference-v13 .fn13-header-grid{grid-template-columns:minmax(0,1fr) auto!important}}
@media(max-width:720px){html body.news-reference-v13 .fn13-site-header{min-height:76px!important}html body.news-reference-v13 .fn13-header-grid{min-height:76px!important;gap:10px!important}html body.news-reference-v13 .fn13-official-logo{width:154px!important}html body.news-reference-v13 .fn13-watch-live{min-height:38px!important;padding:0 11px!important;font-size:8px!important}html body.news-reference-v13 .fn13-header-actions .fn11-search-button{display:none!important}html body.news-reference-v13.news-landing-v12 .fn12-hero-shell{min-height:650px!important;grid-template-columns:1fr!important}html body.news-reference-v13.news-landing-v12 .fn12-hero-copy{padding:54px 0 260px!important}html body.news-reference-v13.news-landing-v12 .fn12-hero-copy h1{font-size:clamp(2.55rem,12.4vw,3.75rem)!important}html body.news-reference-v13.news-landing-v12 .fn12-hero-art{right:-205px!important;bottom:-8px!important;width:650px!important}html body.news-reference-v13 .fn13-article-tools{align-items:stretch!important;flex-direction:column!important}html body.news-reference-v13 .fn13-share-actions{width:100%!important}html body.news-reference-v13 .fn13-share-actions button{flex:1!important}}
@media(max-width:430px){html body.news-reference-v13 .fn13-watch-live{display:none!important}html body.news-reference-v13 .fn13-official-logo{width:145px!important}html body.news-reference-v13 .fn13-article-tools{width:min(calc(100% - 24px),1100px)!important;padding:14px!important}}
`;

const script = String.raw`
(() => {
  const body = document.body;
  if (!body?.classList.contains('news-reference-v13')) return;

  const formatPhilippineTime = () => {
    const now = new Date();
    const text = new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(now);

    document.querySelectorAll('[data-philippine-time]').forEach((element) => {
      element.textContent = text + ' PHT';
      element.setAttribute('datetime', now.toISOString());
      element.setAttribute('title', 'Current Philippine Standard Time');
    });
  };

  formatPhilippineTime();
  window.setInterval(formatPhilippineTime, 30000);

  const params = new URLSearchParams(window.location.search);
  const section = (params.get('section') || '').toLowerCase();
  const sectionLinks = [...document.querySelectorAll('[data-fmb-news-section-link]')];
  sectionLinks.forEach((link) => {
    const linkSection = link.dataset.fmbNewsSectionLink || '';
    const active = (section && linkSection === section)
      || (!section && !params.get('category') && linkSection === 'home' && window.location.pathname.replace(/\/+$/, '').endsWith('/fmbnews'))
      || (params.get('category') === 'money' && linkSection === 'business')
      || (params.get('category') === 'lifestyle' && linkSection === 'lifestyle');
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  if (section === 'national' || section === 'world') {
    const worldPattern = /\b(world|global|international|united states|u\.s\.|china|iran|israel|gaza|ukraine|russia|europe|middle east|hormuz|japan|korea|asean|united nations|\bun\b)\b/i;
    const items = [...document.querySelectorAll('[data-fn9-searchable]')];
    let visible = 0;
    items.forEach((item) => {
      const text = (item.textContent || '') + ' ' + (item.querySelector('a[href]')?.getAttribute('href') || '');
      const isWorld = worldPattern.test(text);
      const show = section === 'world' ? isWorld : !isWorld;
      item.hidden = !show;
      if (show) visible += 1;
    });
    const moreReports = document.querySelector('[data-fn9-more-reports]');
    if (moreReports) moreReports.hidden = false;
    const heading = document.querySelector('#fn9ReportsTitle');
    if (heading) heading.textContent = section === 'world' ? 'World reports' : 'National reports';
    const status = document.querySelector('[data-fn9-search-status]');
    if (status) status.textContent = visible + ' ' + section + ' report' + (visible === 1 ? '' : 's') + '.';
  }

  const shareButton = document.querySelector('[data-fmb-share-story]');
  const copyButton = document.querySelector('[data-fmb-copy-story]');
  const status = document.querySelector('[data-fmb-share-status]');
  const pageTitle = document.querySelector('h1')?.textContent?.trim() || document.title;
  const pageUrl = window.location.href;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      if (status) status.textContent = 'Story link copied.';
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = pageUrl;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      if (status) status.textContent = 'Story link copied.';
    }
  };

  shareButton?.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: pageTitle, text: pageTitle, url: pageUrl });
        if (status) status.textContent = 'Share sheet opened.';
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    await copyLink();
  });

  copyButton?.addEventListener('click', copyLink);
})();
`;

function injectAssets(html) {
  return html
    .replace(/<style\b[^>]*data-fmb-news-reference-v13[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<script\b[^>]*data-fmb-news-reference-v13[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<\/head>/i, `<style data-fmb-news-reference-v13>${styles}</style></head>`)
    .replace(/<\/body>/i, `<script data-fmb-news-reference-v13>${script}</script></body>`);
}

const countAttribute = (html, name) => (html.match(new RegExp(`\\s${name}(?:\\s|=|>)`, 'g')) || []).length;
const countClass = (html, className) => {
  const pattern = new RegExp(`<[^>]+class=(['"])[^'"]*\\b${className}\\b[^'"]*\\1`, 'gi');
  return (html.match(pattern) || []).length;
};

const files = [...new Set((await Promise.all(roots.map(walk))).flat())];
let updated = 0;
let landingCount = 0;
let articleCount = 0;

for (const filePath of files) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-faithful-v11\b/.test(html)) continue;

  const original = html;
  const isLanding = /[\\/](?:news|fmbnews)[\\/]index\.html$/i.test(filePath);
  const isRedirect = /http-equiv=(['"])refresh\1/i.test(html) || /<meta\b[^>]*(?:name|property)=(['"])robots\1[^>]*content=(['"])[^'"]*noindex/i.test(html);
  const isArticle = /\bnews-story-route\b/.test(html) && !isRedirect;
  const searchableBefore = countAttribute(html, 'data-fn9-searchable');
  const storyBodiesBefore = countClass(html, 'nc-story-body');

  html = addBodyClass(html, 'news-reference-v13');
  html = replaceHeader(html);
  html = addFooterLogo(html);

  if (isLanding) {
    html = polishHero(html);
    landingCount += 1;
  }

  if (isArticle) {
    html = addArticleTools(html);
    articleCount += 1;
  }

  html = ensureTimeMarker(html);
  html = injectAssets(html);

  const searchableAfter = countAttribute(html, 'data-fn9-searchable');
  const storyBodiesAfter = countClass(html, 'nc-story-body');
  if (searchableAfter !== searchableBefore) {
    throw new Error(`FMB News reference polish changed the searchable archive in ${filePath}: ${searchableBefore} to ${searchableAfter}.`);
  }
  if (storyBodiesAfter !== storyBodiesBefore) {
    throw new Error(`FMB News reference polish changed article body markers in ${filePath}: ${storyBodiesBefore} to ${storyBodiesAfter}.`);
  }

  const masthead = html.match(/<header\b[^>]*class=(['"])[^'"]*\bfn13-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
  if (!masthead.includes(officialLogo) || !masthead.includes('fn13-watch-live')) {
    throw new Error(`FMB News reference polish official logo or live button missing: ${filePath}`);
  }
  if (!html.includes('data-philippine-time')) {
    throw new Error(`FMB News reference polish Philippine time missing: ${filePath}`);
  }
  if (isLanding) {
    for (const required of ['Making every news clearer and sharper in a world full of info.', 'Read latest news', 'Watch live', 'id="latest-reports"', 'fn9-report-card']) {
      if (!html.includes(required)) throw new Error(`FMB News reference landing lost ${required}: ${filePath}`);
    }
  }
  if (isArticle) {
    for (const required of ['data-fmb-news-article-tools', 'data-fmb-share-story', 'data-fmb-copy-story', 'nc-story-body']) {
      if (!html.includes(required)) throw new Error(`FMB News reference article tool missing ${required}: ${filePath}`);
    }
  }

  if (html !== original) {
    await writeFile(filePath, html, 'utf8');
    updated += 1;
  }
}

if (!updated || landingCount !== 2 || articleCount < 1) {
  throw new Error(`FMB News reference polish expected two landings and article routes; updated ${updated}, landings ${landingCount}, articles ${articleCount}.`);
}

console.log(`Matched the supplied FMB News reference across ${updated} route(s): preserved all existing content, fixed the official logo and live buttons, and added working sharing plus Philippine time to ${articleCount} article page(s).`);
