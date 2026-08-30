import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const officialLogo = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';
const liveUrl = 'https://www.facebook.com/BinibiningFrancineMarie/live_videos/';
const finalCssPath = path.join(dist, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
const finalJsPath = path.join(dist, 'assets', 'js', 'fmbnews-reference-v13.js');
const cssStart = '/* FMB_NEWS_REFERENCE_V14_START */';
const cssEnd = '/* FMB_NEWS_REFERENCE_V14_END */';
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

const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.7"></circle><path d="m15.7 15.7 4.6 4.6"></path></svg>';
const menuIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><g class="fn11-menu-lines"><path d="M4 6.5h16M4 12h16M4 17.5h16"></path></g><g class="fn11-close-lines"><path d="m6 6 12 12M18 6 6 18"></path></g></svg>';
const signal = '<span class="fn11-signal-mark" aria-hidden="true"><i></i><i></i><i></i><b></b></span>';
const wordmark = '<span class="fn11-wordmark" aria-hidden="true"><strong>FMB</strong><span>NEWS</span></span>';

function referenceLogo() {
  return `<span class="fn14-reference-logo" aria-hidden="true"><svg class="fn14-reference-mark" viewBox="0 0 58 58"><path d="M7 51A44 44 0 0 1 51 7" class="fn14-mark-purple"></path><path d="M7 51A27 27 0 0 1 34 24" class="fn14-mark-gold"></path></svg><span class="fn14-reference-word"><strong>FMB</strong><span>NEWS</span></span><i class="fn14-reference-rule"></i></span>`;
}

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

  return `<header class="nc-site-header fn9-site-header fn11-site-header fn12-site-header fn13-site-header fn14-site-header" id="top"><div class="fn9-shell fn9-header-grid fn12-header-grid fn13-header-grid fn14-header-grid"><a class="fn11-brand-lockup fn12-brand-lockup fn13-brand-lockup fn14-brand-lockup" href="/fmbnews/" aria-label="FMB News home" data-fmb-news-logo>${referenceLogo()}<img class="fn12-official-logo fn13-official-logo fn14-compat-official-logo" src="${officialLogo}" width="909" height="210" alt="" aria-hidden="true"><span class="fn12-compat-logo" aria-hidden="true">${wordmark}<span class="fn11-logo-rule"></span>${signal}</span></a><nav class="fn12-desktop-nav fn13-desktop-nav fn14-desktop-nav" aria-label="FMB News sections">${desktopLinks}</nav><div class="fn11-header-actions fn13-header-actions fn14-header-actions"><a class="fn13-watch-live fn14-watch-live" href="${liveUrl}" target="_blank" rel="noopener noreferrer">Watch live <span aria-hidden="true">◉</span></a><button class="fn11-icon-button fn11-search-button" type="button" data-fn9-search-open aria-label="Search FMB News" aria-expanded="false" aria-controls="fn9SearchPanel">${searchIcon}</button><button class="fn11-icon-button fn11-menu-button" type="button" data-fn11-menu-toggle aria-label="Open FMB News menu" aria-expanded="false" aria-controls="fn11MenuPanel">${menuIcon}</button></div></div><nav class="fn11-menu-panel fn12-menu-panel fn13-menu-panel fn14-menu-panel" id="fn11MenuPanel" data-fn11-menu-panel aria-label="FMB News navigation" hidden><div class="fn9-shell fn11-menu-grid fn12-menu-grid fn13-menu-grid"><div class="fn11-menu-primary"><p class="fn11-menu-label">FMB News</p>${menuLinks}<a href="${liveUrl}" target="_blank" rel="noopener noreferrer">Watch live</a><a href="mailto:withlovefmb@gmail.com">Contact the newsroom</a></div><div><p class="fn11-menu-label">More sections</p><div class="fn11-menu-categories"><a href="/fmbnews/?category=tech#latest-reports">Technology</a><a href="/fmbnews/?category=culture#latest-reports">Culture</a><a href="/fmbnews/?category=environment#latest-reports">Environment</a><a href="/fmbnews/?category=health#latest-reports">Health</a><a href="/fmbandco/">FMB&amp;CO. Home</a></div></div></div>${compatibilityMarker}</nav></header>`;
}

function replaceHeader(html) {
  const pattern = /<header\b[^>]*class=(['"])[^'"]*\bfn13-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i;
  if (!pattern.test(html)) throw new Error('FMB News final reference pass could not find the V13 masthead.');
  return html.replace(pattern, header());
}

function removeDuplicateArticleTools(html) {
  return html.replace(/<aside\b[^>]*data-fmb-news-article-tools[^>]*>[\s\S]*?<\/aside>\s*/gi, '');
}

const styles = String.raw`
html body.news-reference-v13 .fn14-header-grid{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;grid-template-rows:1fr!important;align-items:center!important;gap:clamp(22px,3vw,48px)!important}
html body.news-reference-v13 .fn14-brand-lockup{position:relative!important;grid-column:1!important;grid-row:1!important;justify-self:start!important;width:auto!important;min-width:0!important;display:flex!important;align-items:center!important}
html body.news-reference-v13 .fn14-desktop-nav{grid-column:2!important;grid-row:1!important;align-self:stretch!important;justify-self:center!important}
html body.news-reference-v13 .fn14-header-actions{grid-column:3!important;grid-row:1!important;align-self:center!important;justify-self:end!important;display:flex!important;align-items:center!important;flex-wrap:nowrap!important;gap:10px!important}
html body.news-reference-v13 .fn14-reference-logo{display:grid!important;grid-template-columns:52px auto 1px!important;align-items:center!important;gap:12px!important;color:#280556!important}
html body.news-reference-v13 .fn14-reference-mark{width:52px!important;height:52px!important;overflow:visible!important;fill:none!important}
html body.news-reference-v13 .fn14-reference-mark path{fill:none!important;stroke-linecap:butt!important}
html body.news-reference-v13 .fn14-mark-purple{stroke:#2c0758!important;stroke-width:10!important}
html body.news-reference-v13 .fn14-mark-gold{stroke:#d6a029!important;stroke-width:8!important}
html body.news-reference-v13 .fn14-reference-word{min-width:92px!important;display:grid!important;justify-items:center!important;font-family:"Cormorant Garamond",Georgia,serif!important;text-transform:uppercase!important;line-height:.78!important}
html body.news-reference-v13 .fn14-reference-word strong{font-size:35px!important;font-weight:600!important;letter-spacing:.015em!important}
html body.news-reference-v13 .fn14-reference-word span{margin-top:9px!important;font-family:"Manrope",Arial,sans-serif!important;font-size:11px!important;font-weight:800!important;letter-spacing:.43em!important;transform:translateX(.22em)!important}
html body.news-reference-v13 .fn14-reference-rule{width:1px!important;height:54px!important;background:#d7aa4d!important}
html body.news-reference-v13 .fn14-compat-official-logo{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;pointer-events:none!important}
html body.news-reference-v13.news-landing-v12 .fn12-hero-shell{min-height:clamp(590px,52vw,680px)!important;align-items:start!important}
html body.news-reference-v13.news-landing-v12 .fn12-hero-copy{align-self:start!important;padding:clamp(62px,6vw,84px) 0 90px!important}
html body.news-reference-v13 [data-fmb-share-ready] a,html body.news-reference-v13 [data-fmb-share-ready] button{min-height:42px!important;padding:0 16px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border:1px solid rgba(70,21,131,.23)!important;border-radius:999px!important;background:#fff!important;color:#35105d!important;font:800 9px/1 "Manrope",Arial,sans-serif!important;letter-spacing:.025em!important;text-decoration:none!important;cursor:pointer!important}
html body.news-reference-v13 [data-fmb-share-ready] [data-fmb-share-native]{border-color:#2b0755!important;background:#2b0755!important;color:#fff!important}
html body.news-reference-v13 [data-fmb-share-status]{position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important}
@media(max-width:1160px){html body.news-reference-v13 .fn14-header-grid{grid-template-columns:minmax(0,1fr) auto!important}html body.news-reference-v13 .fn14-brand-lockup{grid-column:1!important}html body.news-reference-v13 .fn14-header-actions{grid-column:2!important}html body.news-reference-v13 .fn14-desktop-nav{display:none!important}}
@media(max-width:720px){html body.news-reference-v13 .fn14-reference-logo{grid-template-columns:42px auto!important;gap:8px!important}html body.news-reference-v13 .fn14-reference-mark{width:42px!important;height:42px!important}html body.news-reference-v13 .fn14-reference-word{min-width:78px!important}html body.news-reference-v13 .fn14-reference-word strong{font-size:29px!important}html body.news-reference-v13 .fn14-reference-word span{margin-top:7px!important;font-size:9px!important}html body.news-reference-v13 .fn14-reference-rule{display:none!important}html body.news-reference-v13.news-landing-v12 .fn12-hero-shell{min-height:630px!important}html body.news-reference-v13.news-landing-v12 .fn12-hero-copy{padding:48px 0 260px!important}}
@media(max-width:430px){html body.news-reference-v13 .fn14-reference-logo{grid-template-columns:39px auto!important}html body.news-reference-v13 .fn14-reference-mark{width:39px!important;height:39px!important}html body.news-reference-v13 .fn14-reference-word strong{font-size:27px!important}}
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

  const normalize = value => (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const shareLabel = [...document.querySelectorAll('h2,h3,h4,p,strong,span')]
    .find(element => /share this report/i.test(element.textContent || ''));

  let shareBox = shareLabel?.parentElement || null;
  for (let depth = 0; shareBox && depth < 6; depth += 1) {
    const controls = [...shareBox.querySelectorAll('a,button')];
    const names = controls.map(control => normalize(control.textContent));
    if (names.some(name => name === 'facebook') && names.some(name => name === 'share')) break;
    shareBox = shareBox.parentElement;
  }

  if (!shareBox) return;
  shareBox.setAttribute('data-fmb-share-ready', '');
  const controls = [...shareBox.querySelectorAll('a,button')];
  const title = document.querySelector('h1')?.textContent?.trim() || document.title;
  const url = window.location.href;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const destinations = {
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
    x: 'https://twitter.com/intent/tweet?text=' + encodedTitle + '&url=' + encodedUrl,
    linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl,
  };

  let status = shareBox.querySelector('[data-fmb-share-status]');
  if (!status) {
    status = document.createElement('p');
    status.setAttribute('data-fmb-share-status', '');
    status.setAttribute('aria-live', 'polite');
    shareBox.appendChild(status);
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = 'Story link copied.';
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      status.textContent = 'Story link copied.';
    }
  };

  controls.forEach((control) => {
    const name = normalize(control.textContent);
    if (destinations[name]) {
      control.setAttribute('data-fmb-share-destination', name);
      if (control.tagName === 'A') {
        control.setAttribute('href', destinations[name]);
        control.setAttribute('target', '_blank');
        control.setAttribute('rel', 'noopener noreferrer');
      } else {
        control.addEventListener('click', () => window.open(destinations[name], '_blank', 'noopener,noreferrer'));
      }
    }

    if (name === 'share') {
      control.setAttribute('data-fmb-share-native', '');
      control.addEventListener('click', async (event) => {
        event.preventDefault();
        if (navigator.share) {
          try {
            await navigator.share({ title, text: title, url });
            status.textContent = 'Share sheet opened.';
            return;
          } catch (error) {
            if (error?.name === 'AbortError') return;
          }
        }
        await copyLink();
      });
    }
  });
})();
`;

const files = [...new Set((await Promise.all(newsRoots.map(walk))).flat())];
let updated = 0;
let landings = 0;
let articles = 0;

for (const filePath of files) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-reference-v13\b/.test(html)) continue;
  const original = html;
  const isLanding = /[\\/](?:news|fmbnews)[\\/]index\.html$/i.test(filePath);
  const bodyTag = html.match(/<body\b[^>]*>/i)?.[0] || '';
  const isArticle = !isLanding && /\bnews-story-route\b/.test(bodyTag);

  html = replaceHeader(html);
  html = removeDuplicateArticleTools(html);

  if (isLanding) landings += 1;
  if (isArticle) articles += 1;

  if (html.includes('data-fmb-news-article-tools')) {
    throw new Error(`FMB News final reference pass left a duplicate article tool bar: ${filePath}`);
  }
  if (isLanding && !html.includes('data-fmb-news-power-hero')) {
    throw new Error(`FMB News final reference pass lost the landing hero: ${filePath}`);
  }
  if (isArticle && !/share this report/i.test(html)) {
    throw new Error(`FMB News article lost its existing share section: ${filePath}`);
  }

  if (html !== original) {
    await writeFile(filePath, html, 'utf8');
    updated += 1;
  }
}

if (landings !== 2 || articles < 1) {
  throw new Error(`FMB News final reference pass expected two landings and article routes; found ${landings} landing(s), ${articles} article(s).`);
}

const currentCss = await readFile(finalCssPath, 'utf8');
const escapedStart = cssStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapedEnd = cssEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cleanCss = currentCss.replace(new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}\\s*`, 'g'), '').trimEnd();
await mkdir(path.dirname(finalJsPath), { recursive: true });
await Promise.all([
  writeFile(finalCssPath, `${cleanCss}\n${cssStart}\n${styles}\n${cssEnd}\n`, 'utf8'),
  writeFile(finalJsPath, `${script}\n`, 'utf8'),
]);

console.log(`Finalized the supplied FMB News reference across ${updated} route(s): code-native proper logo, one-row controls, clean landing hero, existing share section wired on ${articles} article(s), and live Philippine time without deleting any news content.`);
