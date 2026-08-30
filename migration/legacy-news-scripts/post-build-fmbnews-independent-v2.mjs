import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const fmbNewsRoot = path.join(dist, 'fmbnews');
const cssRoot = path.join(root, 'apps', 'withlovefmb', 'assets', 'css');
const cssFiles = ['fmbnews-independent-v1.css', 'fmbnews-independent-v2.css'];
const sitemapPath = path.join(dist, 'sitemap.xml');
const version = '20260803-independent-v2';
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
      attrs = attrs.replace(/\bclass=(['"])([^'"]*)\1/i, (whole, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    } else {
      attrs += ` class="${className}"`;
    }
    return `<body${attrs}>`;
  });
}

function categoryRail() {
  const links = categories
    .map(([slug, label]) => `<a href="/news/?category=${slug}#rundown" data-news-category-link="${slug}">${label}</a>`)
    .join('');
  return `<nav class="nc-topic-rail fn-category-rail" aria-label="News categories"><div class="wrap">${links}</div></nav>`;
}

function publicationHeader(active = '') {
  return `<header class="nc-site-header fn-site-header" id="fnNewsTop"><div class="fn-header-inner"><a class="fn-brand" href="/fmbnews/" aria-label="FMB News home"><span class="fn-brand-name">FMB NEWS</span><span class="fn-brand-line">The news, made clear.</span></a><nav class="nc-site-links fn-header-links" id="fnNewsNav" aria-label="FMB News navigation"><a href="/fmbnews/"${active === 'news' ? ' aria-current="page"' : ''}>Latest</a><a href="/news/about/"${active === 'about' ? ' aria-current="page"' : ''}>About</a><a class="fn-home-button" href="/fmbandco/">FMB&amp;CO. Home</a></nav><button class="nc-menu-toggle fn-menu-toggle" type="button" data-news-menu aria-label="Open news menu" aria-expanded="false" aria-controls="fnNewsNav"><span></span><span></span></button></div></header>`;
}

function publicationFooter() {
  return `<footer class="nc-footer fn-site-footer"><div class="fn-footer-inner"><span class="fn-footer-brand">FMB NEWS</span><span class="fn-footer-copy">Clarity, context, and why it matters to Filipinos · © 2026 Francine Marie Bautista</span></div></footer>`;
}

function landingIntro() {
  return `<section class="fn-intro" aria-labelledby="fnNewsTitle"><div class="fn-intro-inner"><div><p class="fn-eyebrow">Independent news desk</p><h1 id="fnNewsTitle">The news, <em>made clear.</em></h1></div><div class="fn-intro-copy"><p>Important developments gathered from credible sources, clarified, and explained through one practical question: Why does this matter to you as a Filipino?</p><a href="/news/about/">How we do news</a></div></div></section>`;
}

function unifiedHeader() {
  return `<header class="fmb-shell-header" data-fmb-unified-shell><a class="fmb-shell-brand" href="/" aria-label="Francine Marie Bautista and FMB&CO. home"><img src="/assets/images/fmbandco/fmbandco-primary-reversed.png" width="1414" height="405" alt="FMB&CO. Francine Marie Bautista"></a><nav class="fmb-shell-nav" id="fmbUnifiedNav" aria-label="Primary navigation"><a href="/">Home</a><a href="/aboutfmb/">About FMB</a><a href="/fmbnews/">Bulletin</a><a href="/projects/">Projects</a><a href="/ebooks/">Reading</a><a href="/music/">Music</a><a href="/get-involved/">Get Involved</a><a href="/gethelp/">Get Help</a><a href="/fmbandco/">FMB&amp;CO.</a><a href="/work-with-fmb/">Work with FMB</a></nav><a class="fmb-shell-cta" href="/work-with-fmb/">Work with FMB</a><a class="fmb-shell-yoni" href="https://yoni.francinemariebautista.com/">Open Yoni</a><button class="fmb-shell-menu" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="fmbUnifiedNav"><span></span></button></header>`;
}

function unifiedFooter() {
  return `<footer class="fmb-shell-footer" data-fmb-unified-shell><div class="fmb-shell-footer-grid"><div class="fmb-shell-footer-brand"><img src="/assets/images/fmbandco/fmbandco-primary-reversed.png" width="1414" height="405" loading="lazy" decoding="async" alt="FMB&CO. Francine Marie Bautista"><p>The official digital home, bulletin, authority platform, and ecosystem gateway of Francine Marie Bautista.</p></div><nav aria-label="Official site links"><strong>Official Site</strong><a href="/">Home</a><a href="/aboutfmb/">About FMB</a><a href="/fmbnews/">Bulletin</a><a href="/projects/">Projects</a><a href="/work-with-fmb/">Work with FMB</a></nav><nav aria-label="Public resources"><strong>Public Resources</strong><a href="/ebooks/">Reading</a><a href="/music/">Music</a><a href="/withlovefmb/">With Love, FMB</a><a href="/get-involved/">Get Involved</a><a href="/gethelp/">Get Help</a></nav><nav aria-label="FMB ecosystem links"><strong>Ecosystem</strong><a href="/fmbandco/">FMB&amp;CO.</a><a href="https://senzpr.com/">SENZ</a><a href="https://thecognitainstitute.com/">Cognita</a><a href="https://yoni.francinemariebautista.com/">Yoni</a><a href="/mabayani/">Mabayani</a></nav></div><div class="fmb-shell-footer-bottom"><span>© 2026 Francine Marie Bautista. All rights reserved.</span></div></footer>`;
}

function cssLinks() {
  return `<link rel="stylesheet" href="/assets/css/fmbnews-independent-v1.css?v=${version}" data-fmb-news-independent-v1><link rel="stylesheet" href="/assets/css/fmbnews-independent-v2.css?v=${version}" data-fmb-news-independent-v2>`;
}

function aboutPage() {
  const description = 'FMB News gathers important developments from credible public sources, makes them clear, and explains why they matter to Filipinos.';
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>About FMB News | The News, Made Clear</title><meta name="description" content="${description}"><meta name="author" content="Francine Marie Bautista"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><link rel="canonical" href="https://www.francinemariebautista.com/news/about/"><meta property="og:type" content="website"><meta property="og:site_name" content="FMB News"><meta property="og:title" content="About FMB News | The News, Made Clear"><meta property="og:description" content="${description}"><meta property="og:url" content="https://www.francinemariebautista.com/news/about/"><link rel="stylesheet" href="/assets/css/fmb-unified-system.css?v=20260724-total-makeover-v1"><link rel="stylesheet" href="/assets/css/fmb-sitewide-visual-fixes.css?v=20260803-news-editorial-v6"><link rel="stylesheet" href="/assets/css/fmbnews-mobile-v6.css?v=20260803-mobile-v6"><link rel="stylesheet" href="/assets/css/fmbnews-categories-v1.css?v=20260803-categories-v1">${cssLinks()}</head><body class="news-route news-channel-route fmb-unified-public fmb-unified-news news-channel-v4 news-futuristic-ph news-editorial-v5 fn-news-independent fn-news-about" data-fmb-page="news-about">${unifiedHeader()}${publicationHeader('about')}${categoryRail()}<main class="fn-about-main" id="main"><div class="fn-about-grid"><div><p class="fn-eyebrow">About FMB News</p><h1>Clarity in an <em>overloaded world.</em></h1><p class="fn-about-lead">FMB News gathers important developments from credible public sources and presents them clearly. In a world overloaded with information, clarity is what people need. We explain what happened and answer the question that matters: <strong>Why does this matter to you as a Filipino?</strong> That is how we do it.</p></div><aside class="fn-about-note"><strong>Transparent by design</strong><p>Sources remain visible. Verified information is separated from commentary. We gather, clarify, and add Filipino context without pretending that every report began in our own newsroom.</p></aside></div><section class="fn-about-steps" aria-label="How FMB News works"><article><span>01</span><h2>Gather</h2><p>We follow credible news organizations, official records, public advisories, and primary sources.</p></article><article><span>02</span><h2>Clarify</h2><p>We remove unnecessary noise and explain the development in direct, understandable language.</p></article><article><span>03</span><h2>Make it relevant</h2><p>We answer why the story matters to Filipinos, our communities, our choices, and our future.</p></article></section></main>${publicationFooter()}${unifiedFooter()}<script defer src="/assets/js/fmb-unified-system.js?v=20260724-total-makeover-v1"></script><script defer src="/assets/js/news-channel.js?v=20260722-luxury-v3"></script><script defer src="/assets/js/fmbnews-categories-v1.js?v=20260803-categories-v1"></script></body></html>`;
}

await mkdir(path.join(dist, 'assets', 'css'), { recursive: true });
for (const fileName of cssFiles) {
  const source = path.join(cssRoot, fileName);
  const destination = path.join(dist, 'assets', 'css', fileName);
  await writeFile(destination, `${(await readFile(source, 'utf8')).trim()}\n`, 'utf8');
}

const files = [...new Set([...await walkHtml(newsRoot), ...await walkHtml(fmbNewsRoot)])];
const landingFiles = new Set([path.join(newsRoot, 'index.html'), path.join(fmbNewsRoot, 'index.html')]);
let updated = 0;

for (const file of files) {
  if (file.includes(`${path.sep}about${path.sep}`)) continue;
  let html = await readFile(file, 'utf8');
  if (!/\bnews-(?:route|story-route)\b/.test(html) && !/\bnews-channel-v4\b/.test(html)) continue;
  const original = html;

  html = addBodyClass(html, 'fn-news-independent')
    .replace(/<link\b[^>]*data-fmb-news-independent(?:-v[12])?[^>]*>\s*/gi, '')
    .replace(/<header\b[^>]*class=(['"])[^'"]*\bfn-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>\s*/gi, '')
    .replace(/<nav\b[^>]*class=(['"])[^'"]*\bfn-category-rail\b[^'"]*\1[^>]*>[\s\S]*?<\/nav>\s*/gi, '')
    .replace(/<footer\b[^>]*class=(['"])[^'"]*\bfn-site-footer\b[^'"]*\1[^>]*>[\s\S]*?<\/footer>\s*/gi, '')
    .replace(/<section\b[^>]*class=(['"])[^'"]*\bfn-intro\b[^'"]*\1[^>]*>[\s\S]*?<\/section>\s*/gi, '')
    .replace(/\sid=(['"])newsNav\1/gi, ' id="legacyNewsNav"')
    .replace(/\sdata-news-menu(?=\s|>)/gi, '')
    .replace(/<\/head>/i, `${cssLinks()}</head>`);

  const shell = `${publicationHeader(landingFiles.has(file) ? 'news' : '')}${categoryRail()}`;
  html = html.replace(/<main\b/i, `${shell}<main`);
  html = html.replace(/<footer\b(?=[^>]*class=(['"])[^'"]*\bfmb-shell-footer\b)/i, `${publicationFooter()}<footer`);
  if (!html.includes('fn-site-footer')) html = html.replace(/<\/body>/i, `${publicationFooter()}</body>`);

  if (landingFiles.has(file)) {
    html = html.replace(/<main\b([^>]*)>/i, (match) => `${match}${landingIntro()}`)
      .replace(/<title>[^<]*<\/title>/i, '<title>FMB News | The News, Made Clear</title>')
      .replace(/<meta\b[^>]*name=(['"])description\1[^>]*>/i, '<meta name="description" content="Important developments gathered from credible sources, made clear, and explained through why they matter to Filipinos.">');
  }

  if (!html.includes('fn-site-header') || !html.includes('fn-site-footer') || !html.includes('FMB&amp;CO. Home')) {
    throw new Error(`Independent FMB News shell could not be inserted: ${file}`);
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    updated += 1;
  }
}

const aboutDirectory = path.join(newsRoot, 'about');
await mkdir(aboutDirectory, { recursive: true });
await writeFile(path.join(aboutDirectory, 'index.html'), aboutPage(), 'utf8');

let sitemap = await readFile(sitemapPath, 'utf8');
const aboutUrl = 'https://www.francinemariebautista.com/news/about/';
if (!sitemap.includes(aboutUrl)) {
  sitemap = sitemap.replace('</urlset>', `  <url><loc>${aboutUrl}</loc><lastmod>2026-08-03</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n</urlset>`);
  await writeFile(sitemapPath, sitemap, 'utf8');
}

console.log(`Inserted the independent FMB NEWS shell on ${updated} generated route(s) and created the concise About page.`);
