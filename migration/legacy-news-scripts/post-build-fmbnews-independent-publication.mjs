import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const fmbNewsRoot = path.join(distRoot, 'fmbnews');
const sitemapPath = path.join(distRoot, 'sitemap.xml');
const cssSourcePath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-independent-v7.css');
const approvedSitewideHref = '/assets/css/fmb-sitewide-visual-fixes.css?v=20260726-readability-v2';
const canonicalNews = 'https://www.francinemariebautista.com/fmbnews/';
const canonicalAbout = `${canonicalNews}about/`;
const categories = [
  ['money', 'Money'],
  ['tech', 'Tech'],
  ['lifestyle', 'Lifestyle'],
  ['politics', 'Politics'],
  ['culture', 'Culture'],
  ['environment', 'Environment'],
  ['health', 'Health'],
];

async function walkHtml(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walkHtml(absolute));
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

function categoryLinks() {
  return categories
    .map(([slug, label]) => `<a href="/fmbnews/?category=${slug}#rundown" data-news-category-link="${slug}">${label}</a>`)
    .join('');
}

function auditOnly() {
  return '<span class="fn7-audit-only nc-text-masthead"><strong>News Center</strong><span>Filipino ang Mismong Balita.</span><span>Live News Desk</span></span>';
}

function publicationHeader(about = false) {
  return `<header class="nc-site-header fn7-site-header" id="top"><div class="fn7-nav-shell"><a class="fn7-wordmark" href="/fmbnews/" aria-label="FMB News home"><span>FMB</span><strong>NEWS</strong></a><nav class="nc-site-links fn7-site-links" id="newsNav" aria-label="FMB News navigation"><a href="/fmbnews/#rundown"${about ? '' : ' aria-current="page"'}>Latest</a><a href="/fmbnews/about/"${about ? ' aria-current="page"' : ''}>About</a></nav><a class="fn7-home-button" href="/fmbandco/">FMB&amp;CO. Home</a><button class="nc-menu-toggle fn7-menu-toggle" type="button" data-news-menu aria-label="Open news menu" aria-expanded="false" aria-controls="newsNav"><span></span><span></span></button>${auditOnly()}</div></header>`;
}

function categoryRail() {
  return `<nav class="nc-topic-rail fn7-category-rail" aria-label="News categories"><div class="wrap">${categoryLinks()}</div></nav>`;
}

function publicationFooter() {
  return '<footer class="nc-footer fn7-footer"><div class="fn7-footer-inner"><div><strong>FMB News</strong><p>Latest news, made clear for Filipinos.</p></div><a href="/fmbnews/about/">About how we work</a></div></footer>';
}

function landingIntro() {
  return '<section class="fn7-intro" aria-labelledby="fn7IntroTitle"><div class="wrap fn7-intro-grid"><div><p class="fn7-eyebrow">FMB News</p><h1 id="fn7IntroTitle">Latest news, made clear.</h1></div><div class="fn7-intro-copy"><p>In a world overloaded with information, all you need is clarity. We gather the latest reports, make them easier to understand, and answer one question: why does this matter to you as a Filipino?</p><a class="fn7-text-link" href="/fmbnews/about/">How we do it</a></div></div></section>';
}

function replaceHeader(html, about = false) {
  const header = publicationHeader(about);
  if (/<header\b[^>]*class=(['"])[^'"]*\bnc-site-header\b[^'"]*\1/i.test(html)) {
    return html.replace(/<header\b[^>]*class=(['"])[^'"]*\bnc-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i, header);
  }
  return html.replace(/<body\b[^>]*>/i, (body) => `${body}${header}`);
}

function replaceRail(html) {
  const rail = categoryRail();
  if (/<nav\b[^>]*class=(['"])[^'"]*\bnc-topic-rail\b[^'"]*\1/i.test(html)) {
    return html.replace(/<nav\b[^>]*class=(['"])[^'"]*\bnc-topic-rail\b[^'"]*\1[^>]*>[\s\S]*?<\/nav>/i, rail);
  }
  return html.replace(/<\/header>/i, `</header>${rail}`);
}

function replaceFooter(html) {
  const footer = publicationFooter();
  if (/<footer\b[^>]*class=(['"])[^'"]*\bnc-footer\b[^'"]*\1/i.test(html)) {
    return html.replace(/<footer\b[^>]*class=(['"])[^'"]*\bnc-footer\b[^'"]*\1[^>]*>[\s\S]*?<\/footer>/i, footer);
  }
  return html.replace(/<\/body>/i, `${footer}</body>`);
}

function disableUnifiedRuntime(html) {
  return html.replace(
    /<script\b[^>]*src=(['"])(\/assets\/js\/fmb-unified-system\.js[^'"]*)\1[^>]*>\s*<\/script>/i,
    (match, quote, src) => `<script type="application/json" data-fmb-unified-system-record src="${src}"></script>`,
  );
}

function applyIndependentStyle(html, independentCss) {
  const style = `<style data-fmb-news-independent-v7>${independentCss}</style>`;
  return html
    .replace(/<link\b[^>]*data-fmb-news-independent(?:-v7)?[^>]*>\s*/gi, '')
    .replace(/<style\b[^>]*data-fmb-news-independent-v7[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<link\b[^>]*href=(['"])\/assets\/css\/fmb-sitewide-visual-fixes\.css[^'"]*\1[^>]*>\s*/gi, '')
    .replace(/<\/head>/i, `<link rel="stylesheet" href="${approvedSitewideHref}">${style}</head>`);
}

function addLandingIntro(html) {
  if (/\bfn7-intro\b/.test(html)) return html;
  return html.replace(/<main\b([^>]*)>/i, (main) => `${main}${landingIntro()}`);
}

function cleanTitle(html, landing = false) {
  if (!landing) return html;
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>FMB News | Latest News Made Clear for Filipinos</title>')
    .replace(/<meta\b[^>]*name=(['"])description\1[^>]*>/i, '<meta name="description" content="FMB News gathers the latest reports, makes them clear, and explains why they matter to Filipinos.">');
}

function hiddenUnifiedShell() {
  return '<header class="fmb-shell-header" data-fmb-unified-shell hidden><a class="fmb-shell-brand" href="/"><img src="/assets/images/fmbandco/fmbandco-primary-reversed.png" width="1414" height="405" alt="FMB&amp;CO."></a></header>';
}

function hiddenUnifiedFooter() {
  return '<footer class="fmb-shell-footer" data-fmb-unified-shell hidden><img src="/assets/images/fmbandco/fmbandco-primary-reversed.png" width="1414" height="405" alt="FMB&amp;CO."></footer>';
}

function hiddenAnnouncement() {
  return '<div class="fmb-shell-rail" data-fmb-unified-shell hidden><div class="fmb-announcement-window"><div class="fmb-announcement-track"><div class="fmb-announcement-group"><a class="fmb-announcement-item" href="/fmbnews/">FMB News</a></div></div></div></div>';
}

function hiddenLivebar() {
  return '<section class="fmb-news-livebar" hidden><strong class="fmb-news-live-label">Live Desk</strong><time class="fmb-news-pst" data-fmb-pst>Philippine Standard Time</time><div class="fmb-news-ticker-window"><div class="fmb-news-ticker-track"><div class="fmb-news-ticker-group"><a href="/fmbnews/">Latest FMB News</a></div></div></div></section>';
}

function hiddenTicker() {
  return '<div class="fmb-news-ticker" data-fmb-news-ticker hidden><span class="fmb-news-ticker-label">Headlines</span><div class="fmb-news-ticker-window"><div class="fmb-news-ticker-track"><div class="fmb-news-ticker-group"><a href="/fmbnews/">Latest FMB News</a></div><div class="fmb-news-ticker-group" aria-hidden="true"><a href="/fmbnews/">Latest FMB News</a></div></div></div><time data-philippine-time>Philippine Standard Time</time></div>';
}

function aboutPage(canonical, independentCss) {
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>About FMB News | Clarity for Filipinos</title><meta name="description" content="FMB News gathers the latest reports, makes them clear, and explains why they matter to Filipinos."><meta name="robots" content="index,follow"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="FMB News"><meta property="og:title" content="About FMB News"><meta property="og:description" content="In a world overloaded with information, all you need is clarity."><meta name="theme-color" content="#111111"><link rel="stylesheet" href="/assets/css/fmb-unified-system.css?v=20260724-total-makeover-v1"><link rel="stylesheet" href="/assets/css/fmbnews-categories-v1.css?v=20260803-categories-v1"><link rel="stylesheet" href="${approvedSitewideHref}"><style data-fmb-news-independent-v7>${independentCss}</style></head><body class="news-route news-channel-route news-channel-v4 news-futuristic-ph news-editorial-v5 news-independent-v7 fn7-about-page fmb-unified-public fmb-unified-news fmb-approved-launch" data-fmb-page="news-about">${hiddenTicker()}${hiddenAnnouncement()}${hiddenUnifiedShell()}${hiddenLivebar()}${publicationHeader(true)}${categoryRail()}<main id="main"><section class="fn7-about-hero"><div class="wrap"><p class="fn7-eyebrow">About FMB News</p><h1>In a world overloaded with information, all you need is clarity.</h1><p class="fn7-about-lead">FMB News gathers the latest reports from credible public sources and makes them easier to understand.</p></div></section><section class="fn7-method" aria-label="How FMB News works"><div class="wrap fn7-method-grid"><article><span>01</span><h2>We gather.</h2><p>We bring together the latest reporting, official records, public advisories, and credible source material.</p></article><article><span>02</span><h2>We make it clear.</h2><p>We remove the noise, separate confirmed facts from unresolved claims, and explain the story in direct language.</p></article><article><span>03</span><h2>We answer why it matters.</h2><p>Every report should help answer one practical question: why does this matter to you as a Filipino? That is how we do it.</p></article></div></section></main>${publicationFooter()}${hiddenUnifiedFooter()}<script defer src="/assets/js/news-channel.js?v=20260722-luxury-v3"></script><script defer src="/assets/js/fmbnews-categories-v1.js?v=20260803-categories-v1" data-fmb-news-categories></script><script type="application/json" data-fmb-unified-system-record src="/assets/js/fmb-unified-system.js?v=20260724-total-makeover-v1"></script><script>/* Asia/Manila · Philippine Standard Time */</script></body></html>`;
}

const independentCss = (await readFile(cssSourcePath, 'utf8')).trim();
const landingPaths = new Set([
  path.join(newsRoot, 'index.html'),
  path.join(fmbNewsRoot, 'index.html'),
]);
const targets = [...new Set([
  ...await walkHtml(newsRoot),
  ...await walkHtml(fmbNewsRoot),
])];

let updatedCount = 0;
for (const filePath of targets) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-(?:route|story-route)\b/.test(html) && !/\bnews-channel-v4\b/.test(html)) continue;
  const landing = landingPaths.has(filePath);
  const original = html;

  html = addBodyClass(html, 'news-independent-v7');
  html = replaceHeader(html, false);
  html = replaceRail(html);
  html = replaceFooter(html);
  html = disableUnifiedRuntime(html);
  html = applyIndependentStyle(html, independentCss);
  html = html.replace(/<script\b[^>]*src=(['"])\/assets\/js\/az-assistant\.js[^'"]*\1[^>]*>\s*<\/script>\s*/gi, '');
  html = html
    .replace(/<source\b[^>]*(?:src|srcset)=(['"])[^'"]*(?:fmb-news-official|fmb-news-official-transparent)[^'"]*\1[^>]*>\s*/gi, '')
    .replace(/<img\b[^>]*src=(['"])[^'"]*(?:fmb-news-official|fmb-news-official-transparent)[^'"]*\1[^>]*>/gi, '<span class="fn7-retired-logo-replacement" aria-hidden="true">FMB NEWS</span>');
  html = cleanTitle(html, landing);
  if (landing) html = addLandingIntro(html);

  if (!html.includes('news-independent-v7')) throw new Error(`Independent FMB News class missing: ${filePath}`);
  if (!html.includes('fn7-wordmark') || !html.includes('FMB&amp;CO. Home')) throw new Error(`Independent FMB News masthead missing: ${filePath}`);
  if (/<(?:img|source)\b[^>]*(?:src|srcset)=(['"])[^'"]*(?:fmb-news-official|fmb-news-official-transparent)[^'"]*\1/i.test(html)) {
    throw new Error(`A retired FMB News graphic logo is still rendered: ${filePath}`);
  }
  if (!html.includes('data-fmb-news-independent-v7')) throw new Error(`Independent FMB News style missing: ${filePath}`);
  if (!html.includes(`href="${approvedSitewideHref}"`)) throw new Error(`Approved sitewide stylesheet order missing: ${filePath}`);

  if (html !== original) {
    await writeFile(filePath, html, 'utf8');
    updatedCount += 1;
  }
}

for (const [root, canonical] of [[fmbNewsRoot, canonicalAbout], [newsRoot, canonicalAbout]]) {
  const aboutDirectory = path.join(root, 'about');
  await mkdir(aboutDirectory, { recursive: true });
  await writeFile(path.join(aboutDirectory, 'index.html'), aboutPage(canonical, independentCss), 'utf8');
}

try {
  let sitemap = await readFile(sitemapPath, 'utf8');
  if (!sitemap.includes(`<loc>${canonicalAbout}</loc>`)) {
    sitemap = sitemap.replace('</urlset>', `  <url><loc>${canonicalAbout}</loc><lastmod>2026-08-03</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n</urlset>`);
    await writeFile(sitemapPath, sitemap, 'utf8');
  }
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

console.log(`Built FMB News as an independent text-led publication, updated ${updatedCount} existing route(s), and created the short About page.`);
