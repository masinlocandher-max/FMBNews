import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const cssFile = path.join(root, 'apps/withlovefmb/assets/css/fmbnews-faithful-v11.css');
const portraitUrl = '/assets/images/fmb-approved/francine-portrait-front.webp';
const portraitSource = path.join(root, 'apps/withlovefmb/assets/images/fmb-approved/francine-portrait-front.webp');
const portraitDist = path.join(dist, 'assets/images/fmb-approved/francine-portrait-front.webp');
const portraitHash = 'cd41d7a47590d93171628ac99a7c50ae6776b83fcf64a46a25f9ecb15d90c6de';

async function walk(dir) {
  const files = [];
  try {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) files.push(...await walk(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

function bodyClass(html, className) {
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
  return `<header class="nc-site-header fn9-site-header fn11-site-header" id="top"><div class="fn9-shell fn9-header-grid"><a class="fn11-brand-lockup" href="/fmbnews/" aria-label="FMB News home" data-fmb-news-logo>${wordmark()}<span class="fn11-logo-rule" aria-hidden="true"></span>${signal()}</a><div class="fn11-header-actions"><button class="fn11-icon-button fn11-search-button" type="button" data-fn9-search-open aria-label="Search FMB News" aria-expanded="false" aria-controls="fn9SearchPanel">${searchIcon}</button><span class="fn11-header-divider" aria-hidden="true"></span><button class="fn11-icon-button fn11-menu-button" type="button" data-fn11-menu-toggle aria-label="Open FMB News menu" aria-expanded="false" aria-controls="fn11MenuPanel">${menuIcon}</button></div></div><nav class="fn11-menu-panel" id="fn11MenuPanel" data-fn11-menu-panel aria-label="FMB News navigation" hidden><div class="fn9-shell fn11-menu-grid"><div class="fn11-menu-primary"><p class="fn11-menu-label">FMB News</p><a href="/fmbnews/#latest-reports">Latest reports</a><a href="/fmbnews/about/">About FMB News</a><a href="/fmbandco/">FMB&amp;CO. Home</a><a href="mailto:withlovefmb@gmail.com">Contact the newsroom</a></div><div><p class="fn11-menu-label">Browse by subject</p><div class="fn11-menu-categories"><a href="/fmbnews/?category=money#latest-reports">Money</a><a href="/fmbnews/?category=tech#latest-reports">Tech</a><a href="/fmbnews/?category=lifestyle#latest-reports">Lifestyle</a><a href="/fmbnews/?category=politics#latest-reports">Politics</a><a href="/fmbnews/?category=culture#latest-reports">Culture</a><a href="/fmbnews/?category=environment#latest-reports">Environment</a><a href="/fmbnews/?category=health#latest-reports">Health</a></div></div></div></nav></header>`;
}

const fb = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 8H17V4.5c-.7-.1-1.8-.3-3.2-.3-3.2 0-5.3 1.9-5.3 5.5V13H5v4h3.5v7h4.3v-7h3.5l.6-4h-4.1V10c0-1.2.3-2 1.7-2Z"></path></svg>';
const ig = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.4" cy="6.7" r=".8" fill="currentColor" stroke="none"></circle></svg>';
const mail = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path></svg>';

function footer() {
  return `<footer class="nc-footer fn9-footer fn10-footer fn11-footer"><div class="fn9-shell fn11-footer-grid"><div><div class="fn11-footer-brand">${signal()}<div>${wordmark()}<p>Latest news, made clear for Filipinos. An FMB&amp;CO. publication.</p></div></div></div><div class="fn11-footer-mission"><h2>Clear information should travel farther than noise.</h2><p>We gather credible reports, explain the context, and answer why each story matters to Filipinos.</p></div><nav class="fn11-footer-links" aria-label="FMB News footer links"><a href="/fmbnews/#latest-reports">Latest reports</a><a href="/fmbnews/about/">About FMB News</a><a href="/fmbandco/">FMB&amp;CO. Home</a><a href="mailto:withlovefmb@gmail.com">Contact us</a></nav></div><div class="fn9-shell fn11-footer-bottom"><span>© 2026 FMB&amp;CO. All rights reserved.</span><nav class="fn11-footer-socials" aria-label="FMB News social links"><a href="https://www.facebook.com/BinibiningFrancineMarie" target="_blank" rel="noopener noreferrer" aria-label="FMB News on Facebook">${fb}</a><a href="https://www.instagram.com/bb.fmb/" target="_blank" rel="noopener noreferrer" aria-label="FMB News on Instagram">${ig}</a><a href="mailto:withlovefmb@gmail.com" aria-label="Email FMB News">${mail}</a></nav></div></footer>`;
}

function replaceHeader(html) {
  if (!/<header\b[^>]*class=(['"])[^'"]*\bfn9-site-header\b[^'"]*\1/i.test(html)) throw new Error('Editorial masthead not found.');
  return html.replace(/<header\b[^>]*class=(['"])[^'"]*\bfn9-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i, header());
}

function replaceFooter(html) {
  if (!/<footer\b[^>]*class=(['"])[^'"]*\bfn10-footer\b[^'"]*\1/i.test(html)) throw new Error('Signal footer not found.');
  return html.replace(/<footer\b[^>]*class=(['"])[^'"]*\bfn10-footer\b[^'"]*\1[^>]*>[\s\S]*?<\/footer>/i, footer());
}

function replacePortrait(html, landing) {
  if (!landing) return html;
  const figure = `<figure class="fn11-about-portrait" data-fmb-news-exact-portrait><img src="${portraitUrl}" width="922" height="1152" loading="lazy" decoding="async" alt="Francine Marie Bautista, publisher of FMB News"></figure>`;
  const pattern = /<div\b[^>]*class=(['"])[^'"]*\bfn9-about-mark\b[^'"]*\1[^>]*>[\s\S]*?<\/div>/i;
  if (pattern.test(html)) return html.replace(pattern, figure);
  if (html.includes('data-fmb-news-exact-portrait')) return html;
  throw new Error('Approved portrait target not found.');
}

function injectCss(html, css) {
  return html.replace(/<style\b[^>]*data-fmb-news-faithful-v11[^>]*>[\s\S]*?<\/style>\s*/gi, '').replace(/<\/head>/i, `<style data-fmb-news-faithful-v11>${css}</style></head>`);
}

function injectJs(html) {
  const script = `<script data-fmb-news-faithful-v11>(()=>{const b=document.body,t=document.querySelector('[data-fn11-menu-toggle]'),p=document.querySelector('[data-fn11-menu-panel]');if(!b?.classList.contains('news-faithful-v11')||!t||!p)return;const open=(v,f=false)=>{p.hidden=!v;t.setAttribute('aria-expanded',String(v));t.setAttribute('aria-label',v?'Close FMB News menu':'Open FMB News menu');b.classList.toggle('fn11-menu-open',v);if(v)p.querySelector('a')?.focus({preventScroll:true});else if(f)t.focus()};t.addEventListener('click',()=>open(p.hidden));p.addEventListener('click',e=>{if(e.target.closest('a'))open(false)});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!p.hidden){e.preventDefault();open(false,true)}});document.addEventListener('click',e=>{if(!p.hidden&&!e.target.closest('.fn11-site-header'))open(false)})})();</script>`;
  return html.replace(/<script\b[^>]*data-fmb-news-faithful-v11[^>]*>[\s\S]*?<\/script>\s*/gi, '').replace(/<\/body>/i, `${script}</body>`);
}

function verifyIcons(html, file) {
  const masthead = html.match(/<header\b[^>]*class=(['"])[^'"]*\bfn11-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
  const controls = [...masthead.matchAll(/<button\b[^>]*class=(['"])[^'"]*\bfn11-icon-button\b[^'"]*\1[^>]*>[\s\S]*?<\/button>/gi)].map(m => m[0]);
  if (controls.length !== 2) throw new Error(`Expected exactly two header controls: ${file}`);
  if (controls.some(control => !/<svg\b[^>]*viewBox=/i.test(control) || !/<(?:path|circle|rect)\b/i.test(control))) throw new Error(`Incomplete header icon: ${file}`);
}

const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
await access(portraitSource);
await access(portraitDist);
const sourceHash = await hash(portraitSource);
const builtHash = await hash(portraitDist);
if (sourceHash !== portraitHash || builtHash !== portraitHash) throw new Error(`Approved portrait changed: source ${sourceHash}; dist ${builtHash}.`);

const css = (await readFile(cssFile, 'utf8')).trim();
const files = [...new Set((await Promise.all(newsRoots.map(walk))).flat())];
let updated = 0;
let landings = 0;

for (const file of files) {
  let html = await readFile(file, 'utf8');
  if (!/\bnews-signal-v10\b/.test(html)) continue;
  const before = html;
  const landing = /[\\/](?:news|fmbnews)[\\/]index\.html$/i.test(file);
  html = bodyClass(html, 'news-faithful-v11');
  html = replaceHeader(html);
  html = replacePortrait(html, landing);
  html = replaceFooter(html);
  html = injectCss(html, css);
  html = injectJs(html);

  for (const marker of ['news-faithful-v11','data-fmb-news-faithful-v11','data-fmb-news-logo','fn11-wordmark','fn11-signal-mark','fn11-search-button','fn11-menu-button','fn11-menu-panel','fn11-footer-grid','Cormorant Garamond','Manrope']) {
    if (!html.includes(marker)) throw new Error(`Missing V11 marker ${marker}: ${file}`);
  }
  verifyIcons(html, file);

  if (landing) {
    landings += 1;
    if (!html.includes('data-fmb-news-exact-portrait') || !html.includes(portraitUrl)) throw new Error(`Approved portrait missing: ${file}`);
    if (/<(?:div|span)\b[^>]*class=(['"])[^'"]*\bfn9-about-mark\b[^'"]*\1/i.test(html)) throw new Error(`Visible decorative ampersand remains: ${file}`);
  }

  if (html !== before) {
    await writeFile(file, html, 'utf8');
    updated += 1;
  }
}

if (!updated || landings !== 2) throw new Error(`Expected two V11 landing routes; found ${landings}, updated ${updated}.`);
console.log(`Applied faithful FMB News V11 to ${updated} route(s), with two complete header controls, the shared signal wordmark, and the byte-verified approved Francine portrait on both landing routes.`);
