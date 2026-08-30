import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const marker = '<span class="fn9-audit-only nc-text-masthead" data-fmb-news-legacy-audit aria-hidden="true"><strong>News Center</strong><span>Filipino ang Mismong Balita.</span><span>Live News Desk</span></span>';
const officialLogo = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';

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

const signal = () => '<span class="fn11-signal-mark" aria-hidden="true"><i></i><i></i><i></i><b></b></span>';
const wordmark = () => '<span class="fn11-wordmark" aria-hidden="true"><strong>FMB</strong><span>NEWS</span></span>';
const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.7"></circle><path d="m15.7 15.7 4.6 4.6"></path></svg>';
const menuIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><g class="fn11-menu-lines"><path d="M4 6.5h16M4 12h16M4 17.5h16"></path></g><g class="fn11-close-lines"><path d="m6 6 12 12M18 6 6 18"></path></g></svg>';

function header() {
  const links = '<a aria-current="page" href="/fmbnews/">Home</a><a href="/fmbnews/#latest-reports">Latest</a><a href="/fmbnews/?category=politics#latest-reports">Politics</a><a href="/fmbnews/?category=money#latest-reports">Money</a><a href="/fmbnews/?category=tech#latest-reports">Tech</a><a href="/fmbnews/?category=culture#latest-reports">Culture</a><a href="/fmbnews/?category=lifestyle#latest-reports">Lifestyle</a><a href="/fmbnews/about/">About</a>';
  return `<header class="nc-site-header fn9-site-header fn11-site-header fn12-site-header" id="top"><div class="fn9-shell fn9-header-grid fn12-header-grid"><a class="fn11-brand-lockup fn12-brand-lockup" href="/fmbnews/" aria-label="FMB News home" data-fmb-news-logo><img class="fn12-official-logo" src="${officialLogo}" width="909" height="210" alt="FMB News"><span class="fn12-compat-logo" aria-hidden="true">${wordmark()}<span class="fn11-logo-rule"></span>${signal()}</span></a><nav class="fn12-desktop-nav" aria-label="FMB News sections">${links}</nav><div class="fn11-header-actions"><button class="fn11-icon-button fn11-search-button" type="button" data-fn9-search-open aria-label="Search FMB News" aria-expanded="false" aria-controls="fn9SearchPanel">${searchIcon}</button><span class="fn11-header-divider" aria-hidden="true"></span><button class="fn11-icon-button fn11-menu-button" type="button" data-fn11-menu-toggle aria-label="Open FMB News menu" aria-expanded="false" aria-controls="fn11MenuPanel">${menuIcon}</button></div></div><nav class="fn11-menu-panel fn12-menu-panel" id="fn11MenuPanel" data-fn11-menu-panel aria-label="FMB News navigation" hidden><div class="fn9-shell fn11-menu-grid fn12-menu-grid"><div class="fn11-menu-primary"><p class="fn11-menu-label">FMB News</p>${links}<a href="/fmbandco/">FMB&amp;CO. Home</a><a href="mailto:withlovefmb@gmail.com">Contact the newsroom</a></div><div><p class="fn11-menu-label">Browse by subject</p><div class="fn11-menu-categories"><a href="/fmbnews/?category=environment#latest-reports">Environment</a><a href="/fmbnews/?category=health#latest-reports">Health</a><a href="/fmbnews/?category=tech#latest-reports">Technology</a><a href="/fmbnews/?category=money#latest-reports">Business and money</a><a href="/fmbnews/?category=culture#latest-reports">Culture</a><a href="/fmbnews/?category=lifestyle#latest-reports">Lifestyle</a></div></div></div>${marker}</nav></header>`;
}

function hero() {
  return `<section class="fn12-landing-hero" aria-labelledby="fn12HeroTitle" data-fmb-news-power-hero><div class="fn9-shell fn12-hero-shell"><div class="fn12-hero-copy nc-reveal"><p class="fn12-hero-kicker">Every story. Clearer. Sharper. Matters.</p><h1 id="fn12HeroTitle">Making every story clearer and sharper in a world full of information.</h1><p class="fn12-hero-deck">FMB News brings credible, relevant, and consequential reporting from the Philippines and around the world, with context that explains why it matters.</p><div class="fn12-hero-actions"><a class="fn12-primary-cta" href="#latest-reports">Read latest news <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a><a class="fn12-secondary-cta" href="/fmbnews/about/">About FMB News</a></div></div><div class="fn12-hero-art" aria-hidden="true"><svg viewBox="0 0 820 700" role="img"><defs><linearGradient id="fn12Skyline" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9e7bc7" stop-opacity=".06"></stop><stop offset="1" stop-color="#6f3aa8" stop-opacity=".22"></stop></linearGradient><linearGradient id="fn12Tower" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b7a0d2"></stop><stop offset="1" stop-color="#6f3aa8"></stop></linearGradient><pattern id="fn12Dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.2" fill="#6f3aa8" opacity=".13"></circle></pattern></defs><rect x="530" y="0" width="290" height="190" fill="url(#fn12Dots)"></rect><g class="fn12-rings" fill="none" stroke="#6f3aa8"><circle cx="610" cy="245" r="48"></circle><circle cx="610" cy="245" r="88"></circle><circle cx="610" cy="245" r="130"></circle><circle cx="610" cy="245" r="174"></circle><circle cx="610" cy="245" r="218"></circle></g><circle cx="610" cy="245" r="13" fill="#e3ad35" opacity=".38"></circle><circle cx="610" cy="245" r="5" fill="#e3ad35"></circle><g fill="url(#fn12Skyline)"><path d="M112 700V560h58v140zm68 0V505h72v195zm85 0V584h55v116zm66 0V474h78v226zm91 0V542h66v158zm76 0V430h74v270zm86 0V520h48v180zm58 0V570h60v130zm70 0V486h68v214z"></path></g><g class="fn12-tower" fill="none" stroke="url(#fn12Tower)" stroke-linecap="round" stroke-linejoin="round"><path d="M610 257 514 700M610 257l98 443M558 480h104M540 565h142M522 650h177M570 420h80M590 338h40M548 700l62-443 64 443M542 565l136 85M678 565l-138 85M558 480l104 85M662 480l-104 85M570 420l80 60M650 420l-80 60M590 338l40 82M630 338l-40 82"></path><path d="M514 700h194M496 700h230"></path><path d="M554 485h-35v44M666 485h35v44M529 506h-22M691 506h22"></path></g><g fill="none" stroke="#c99a3f" opacity=".55"><path d="M-40 670a170 170 0 0 1 170-170"></path><path d="M-40 700a210 210 0 0 1 210-210"></path></g></svg></div></div></section>`;
}

const styles = String.raw`
html body.news-header-v12 .nc-site-header.fn12-site-header{min-height:96px!important;border-bottom:1px solid rgba(46,12,74,.1)!important;background:rgba(255,255,255,.97)!important;box-shadow:0 10px 32px rgba(33,7,53,.045)!important;-webkit-backdrop-filter:blur(18px)!important;backdrop-filter:blur(18px)!important}
html body.news-header-v12 .fn12-header-grid{min-height:96px!important;grid-template-columns:auto minmax(0,1fr) auto!important;gap:clamp(24px,4vw,58px)!important}
html body.news-header-v12 .fn12-brand-lockup{width:auto!important;min-width:0!important;gap:0!important}
html body.news-header-v12 .fn12-official-logo{width:clamp(190px,18vw,258px)!important;height:auto!important;display:block!important;object-fit:contain!important}
html body.news-header-v12 .fn12-compat-logo{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important}
html body.news-header-v12 .fn12-desktop-nav{display:flex!important;align-items:center!important;justify-content:center!important;gap:clamp(15px,1.8vw,30px)!important;min-width:0!important}
html body.news-header-v12 .fn12-desktop-nav a{position:relative!important;padding:36px 0 31px!important;color:#2b1837!important;font:700 11px/1 "Manrope",Arial,sans-serif!important;letter-spacing:.035em!important;text-decoration:none!important;white-space:nowrap!important;transition:color 160ms ease!important}
html body.news-header-v12 .fn12-desktop-nav a::after{position:absolute!important;right:0!important;bottom:24px!important;left:0!important;height:2px!important;background:#c99a3f!important;content:""!important;transform:scaleX(0)!important;transform-origin:center!important;transition:transform 160ms ease!important}
html body.news-header-v12 .fn12-desktop-nav a:hover,html body.news-header-v12 .fn12-desktop-nav a:focus-visible,html body.news-header-v12 .fn12-desktop-nav a[aria-current="page"]{color:#461583!important}
html body.news-header-v12 .fn12-desktop-nav a:hover::after,html body.news-header-v12 .fn12-desktop-nav a:focus-visible::after,html body.news-header-v12 .fn12-desktop-nav a[aria-current="page"]::after{transform:scaleX(1)!important}
html body.news-header-v12 .fn12-menu-panel .fn11-menu-primary>a[aria-current="page"]{color:#461583!important}
html body.news-header-v12 .fn12-menu-grid{grid-template-columns:minmax(260px,.85fr) minmax(0,1.15fr)!important}
html body.news-landing-v12 .fn12-landing-hero{position:relative!important;overflow:hidden!important;border-bottom:1px solid rgba(70,21,131,.08)!important;background:linear-gradient(112deg,#fff 0%,#fff 48%,#faf7fd 100%)!important}
html body.news-landing-v12 .fn12-landing-hero::before{position:absolute!important;inset:0!important;background:radial-gradient(circle at 80% 42%,rgba(111,58,168,.08),transparent 28%),linear-gradient(90deg,rgba(255,255,255,.98) 0%,rgba(255,255,255,.92) 46%,rgba(255,255,255,.1) 78%,transparent 100%)!important;content:""!important;pointer-events:none!important}
html body.news-landing-v12 .fn12-hero-shell{position:relative!important;z-index:1!important;min-height:clamp(570px,66vw,760px)!important;display:grid!important;grid-template-columns:minmax(0,1.06fr) minmax(420px,.94fr)!important;align-items:center!important;gap:clamp(20px,4vw,70px)!important}
html body.news-landing-v12 .fn12-hero-copy{position:relative!important;z-index:3!important;max-width:760px!important;padding:clamp(68px,8vw,112px) 0!important}
html body.news-landing-v12 .fn12-hero-kicker{margin:0 0 18px!important;color:#c28718!important;font:800 11px/1.4 "Manrope",Arial,sans-serif!important;letter-spacing:.17em!important;text-transform:uppercase!important}
html body.news-landing-v12 .fn12-hero-copy h1{max-width:14ch!important;margin:0!important;color:#1c0730!important;font-family:"Manrope",Arial,sans-serif!important;font-size:clamp(3.25rem,5.8vw,6.25rem)!important;font-weight:800!important;letter-spacing:-.065em!important;line-height:.95!important;text-wrap:balance!important}
html body.news-landing-v12 .fn12-hero-deck{max-width:62ch!important;margin:28px 0 0!important;color:#554b5c!important;font-size:clamp(1rem,1.4vw,1.18rem)!important;line-height:1.7!important}
html body.news-landing-v12 .fn12-hero-actions{margin-top:34px!important;display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:14px!important}
html body.news-landing-v12 .fn12-primary-cta,html body.news-landing-v12 .fn12-secondary-cta{min-height:52px!important;padding:0 24px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:14px!important;border-radius:8px!important;font:800 11px/1 "Manrope",Arial,sans-serif!important;letter-spacing:.035em!important;text-decoration:none!important;transition:transform 160ms ease,box-shadow 160ms ease,background 160ms ease!important}
html body.news-landing-v12 .fn12-primary-cta{border:1px solid #26064a!important;background:linear-gradient(135deg,#2a0752,#441080)!important;color:#fff!important;box-shadow:0 16px 34px rgba(38,6,74,.18)!important}
html body.news-landing-v12 .fn12-primary-cta svg{width:19px!important;height:19px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
html body.news-landing-v12 .fn12-secondary-cta{border:1px solid rgba(70,21,131,.5)!important;background:rgba(255,255,255,.72)!important;color:#461583!important}
html body.news-landing-v12 .fn12-primary-cta:hover,html body.news-landing-v12 .fn12-primary-cta:focus-visible,html body.news-landing-v12 .fn12-secondary-cta:hover,html body.news-landing-v12 .fn12-secondary-cta:focus-visible{transform:translateY(-2px)!important;box-shadow:0 18px 38px rgba(38,6,74,.16)!important}
html body.news-landing-v12 .fn12-hero-art{position:absolute!important;z-index:1!important;right:-46px!important;bottom:-4px!important;width:min(63vw,860px)!important;pointer-events:none!important}
html body.news-landing-v12 .fn12-hero-art svg{width:100%!important;height:auto!important;display:block!important;overflow:visible!important}
html body.news-landing-v12 .fn12-rings circle{opacity:.18!important;stroke-width:1.2!important;transform-origin:610px 245px!important;animation:fn12Signal 5.5s ease-in-out infinite!important}
html body.news-landing-v12 .fn12-rings circle:nth-child(2){animation-delay:.25s!important}.fn12-rings circle:nth-child(3){animation-delay:.5s!important}.fn12-rings circle:nth-child(4){animation-delay:.75s!important}.fn12-rings circle:nth-child(5){animation-delay:1s!important}
html body.news-landing-v12 .fn12-tower{stroke-width:2.25!important;opacity:.66!important}
html body.news-landing-v12 .fn9-hero{padding-top:clamp(58px,7vw,92px)!important}
@keyframes fn12Signal{0%,100%{opacity:.13;transform:scale(.985)}50%{opacity:.28;transform:scale(1.012)}}
@media(max-width:1160px){html body.news-header-v12 .fn12-desktop-nav{display:none!important}html body.news-header-v12 .fn12-header-grid{grid-template-columns:minmax(0,1fr) auto!important}html body.news-landing-v12 .fn12-hero-shell{grid-template-columns:minmax(0,1fr) minmax(330px,.72fr)!important}html body.news-landing-v12 .fn12-hero-copy h1{font-size:clamp(3.15rem,6.5vw,5.2rem)!important}}
@media(max-width:820px){html body.news-header-v12 .nc-site-header.fn12-site-header{min-height:78px!important}html body.news-header-v12 .fn12-header-grid{min-height:78px!important;gap:12px!important}html body.news-header-v12 .fn12-official-logo{width:178px!important}html body.news-header-v12 .fn11-header-divider{display:none!important}html body.news-header-v12 .fn11-icon-button{width:42px!important;height:42px!important}html body.news-landing-v12 .fn12-hero-shell{min-height:690px!important;grid-template-columns:1fr!important;align-items:start!important}html body.news-landing-v12 .fn12-hero-copy{max-width:100%!important;padding:64px 0 290px!important}html body.news-landing-v12 .fn12-hero-copy h1{max-width:13ch!important;font-size:clamp(3rem,12vw,4.6rem)!important;line-height:.94!important}html body.news-landing-v12 .fn12-hero-deck{max-width:52ch!important}html body.news-landing-v12 .fn12-hero-art{right:-132px!important;bottom:-14px!important;width:700px!important;opacity:.8!important}}
@media(max-width:560px){html body.news-header-v12 .fn12-official-logo{width:150px!important}html body.news-header-v12 .fn11-search-button{display:none!important}html body.news-landing-v12 .fn12-hero-shell{min-height:650px!important}html body.news-landing-v12 .fn12-hero-copy{padding:52px 0 255px!important}html body.news-landing-v12 .fn12-hero-kicker{font-size:9px!important;letter-spacing:.13em!important}html body.news-landing-v12 .fn12-hero-copy h1{font-size:clamp(2.65rem,13vw,3.8rem)!important;letter-spacing:-.06em!important}html body.news-landing-v12 .fn12-hero-deck{margin-top:22px!important;font-size:.97rem!important;line-height:1.62!important}html body.news-landing-v12 .fn12-hero-actions{align-items:stretch!important}html body.news-landing-v12 .fn12-primary-cta,html body.news-landing-v12 .fn12-secondary-cta{width:100%!important}html body.news-landing-v12 .fn12-hero-art{right:-220px!important;bottom:-6px!important;width:660px!important}}
@media(prefers-reduced-motion:reduce){html body.news-landing-v12 .fn12-rings circle{animation:none!important}}
`;

function replaceHeader(html) {
  const pattern = /<header\b[^>]*class=(['"])[^'"]*\bfn11-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i;
  if (!pattern.test(html)) throw new Error('FMB News V12 could not find the V11 masthead.');
  return html.replace(pattern, header());
}

function injectStyles(html) {
  return html
    .replace(/<style\b[^>]*data-fmb-news-landing-v12[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<\/head>/i, `<style data-fmb-news-landing-v12>${styles}</style></head>`);
}

function injectHero(html) {
  if (html.includes('data-fmb-news-power-hero')) return html;
  const mainPattern = /<main\b([^>]*)class=(['"])([^'"]*\bfn9-main\b[^'"]*)\2([^>]*)>/i;
  if (!mainPattern.test(html)) throw new Error('FMB News V12 landing main region was not found.');
  return html.replace(mainPattern, (tag) => `${tag}${hero()}`);
}

const files = [...new Set((await Promise.all(newsRoots.map(walk))).flat())];
let updated = 0;
let landings = 0;

for (const filePath of files) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-faithful-v11\b/.test(html)) continue;

  const isLanding = /[\\/](?:news|fmbnews)[\\/]index\.html$/i.test(filePath);
  const searchableBefore = (html.match(/\bdata-fn9-searchable\b/g) || []).length;

  html = html.replaceAll(marker, '');
  html = addBodyClass(html, 'news-header-v12');
  html = replaceHeader(html);
  html = injectStyles(html);

  if (isLanding) {
    html = addBodyClass(html, 'news-landing-v12');
    html = injectHero(html);
    landings += 1;

    for (const required of ['data-fmb-news-power-hero', 'id="latest-reports"', 'class="fn9-hero"', 'fn9-report-card', 'fn11-footer-grid']) {
      if (!html.includes(required)) throw new Error(`FMB News V12 landing lost required content (${required}): ${filePath}`);
    }
    const searchableAfter = (html.match(/\bdata-fn9-searchable\b/g) || []).length;
    if (searchableAfter !== searchableBefore) throw new Error(`FMB News V12 changed the published report count in ${filePath}: ${searchableBefore} to ${searchableAfter}.`);
  }

  const headerMatch = html.match(/<header\b[^>]*class=(['"])[^'"]*\bfn12-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
  if (!headerMatch.includes(officialLogo) || !headerMatch.includes('fn12-desktop-nav')) throw new Error(`FMB News V12 official logo or section navigation missing: ${filePath}`);
  const controls = [...headerMatch.matchAll(/<button\b[^>]*class=(['"])[^'"]*\bfn11-icon-button\b[^'"]*\1[^>]*>[\s\S]*?<\/button>/gi)];
  if (controls.length !== 2) throw new Error(`FMB News V12 expected exactly two masthead controls: ${filePath}`);
  const markerCount = html.split(marker).length - 1;
  if (markerCount !== 1) throw new Error(`FMB News V12 expected exactly one hidden compatibility record, found ${markerCount}: ${filePath}`);

  await writeFile(filePath, html, 'utf8');
  updated += 1;
}

if (!updated || landings !== 2) throw new Error(`FMB News V12 expected all V11 routes and two landings; updated ${updated}, landings ${landings}.`);
console.log(`Added the official FMB News logo, functional newsroom section navigation, and a powerful landing hero to two routes while preserving every published report across ${updated} FMB News page(s).`);
