import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const roots = [path.join(distRoot, 'news'), path.join(distRoot, 'fmbnews')];
const cssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-signal-v10.css');

const presentedFontLoader = `<link rel="preconnect" href="https://fonts.googleapis.com" data-fmb-presented-font-preconnect>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin data-fmb-presented-font-preconnect>
<link rel="stylesheet" data-fmb-presented-fonts href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&amp;family=Manrope:wght@400;500;600;650;700;750;800&amp;display=swap">`;

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

function removeElementByClass(html, className, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*class=(['"])[^'"]*\\b${className}\\b[^'"]*\\1[^>]*>[\\s\\S]*?<\\/${tagName}>\\s*`, 'i');
  return html.replace(pattern, '');
}

function removeRedundantControls(html) {
  let next = html.replace(/<div\b[^>]*class=(['"])[^'"]*\bfn9-publication-bar\b[^'"]*\1[^>]*>\s*<div\b[^>]*>[\s\S]*?<\/nav>\s*<\/div>\s*<\/div>\s*/i, '');
  next = removeElementByClass(next, 'fn9-category-nav', 'nav');
  next = removeElementByClass(next, 'fn9-menu-button', 'button');
  return next;
}

function injectPresentedFonts(html) {
  const cleaned = html
    .replace(/<link\b[^>]*data-fmb-presented-font-preconnect[^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*data-fmb-presented-fonts[^>]*>\s*/gi, '');

  if (/<link\b[^>]*rel=(['"])stylesheet\1[^>]*>/i.test(cleaned)) {
    return cleaned.replace(/<link\b[^>]*rel=(['"])stylesheet\1[^>]*>/i, (firstStylesheet) => `${presentedFontLoader}\n${firstStylesheet}`);
  }

  return cleaned.replace(/<\/head>/i, `${presentedFontLoader}</head>`);
}

function signalEmblem() {
  return '<span class="fn10-signal-emblem" aria-hidden="true"><i></i><i></i><i></i><b></b></span>';
}

function enhancedFooter() {
  return `<footer class="nc-footer fn9-footer fn10-footer"><div class="fn9-shell fn10-footer-grid"><div class="fn10-footer-brand"><span class="fn10-footer-kicker">Our signal</span><div class="fn10-footer-lockup">${signalEmblem()}<div><strong>FMB News</strong><p>Latest news, made clear for Filipinos. An FMB&amp;CO. publication.</p></div></div></div><div class="fn10-footer-mission"><h2>Clear information should travel farther than noise.</h2><p>We gather credible reports, explain the context, and answer why each story matters to Filipinos.</p></div><nav class="fn9-footer-links" aria-label="FMB News footer links"><a href="/fmbnews/">Latest reports</a><a href="/fmbnews/about/">About FMB News</a><a href="/fmbandco/">FMB&amp;CO. Home</a></nav></div><div class="fn9-shell fn10-footer-bottom"><span>© 2026 FMB&amp;CO. All rights reserved.</span><nav class="fn10-footer-socials" aria-label="FMB News social links"><a href="https://www.facebook.com/BinibiningFrancineMarie" target="_blank" rel="noopener noreferrer">Facebook</a><a href="https://www.instagram.com/bb.fmb/" target="_blank" rel="noopener noreferrer">Instagram</a><a href="mailto:withlovefmb@gmail.com">Email</a></nav></div></footer>`;
}

function replaceFooter(html) {
  const footer = enhancedFooter();
  if (/<footer\b[^>]*class=(['"])[^'"]*\bfn9-footer\b[^'"]*\1/i.test(html)) {
    return html.replace(/<footer\b[^>]*class=(['"])[^'"]*\bfn9-footer\b[^'"]*\1[^>]*>[\s\S]*?<\/footer>/i, footer);
  }
  return html.replace(/<\/body>/i, `${footer}</body>`);
}

function injectCss(html, css) {
  const style = `<style data-fmb-news-signal-v10>${css}</style>`;
  return html
    .replace(/<style\b[^>]*data-fmb-news-signal-v10[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<\/head>/i, `${style}</head>`);
}

const css = (await readFile(cssPath, 'utf8')).trim();
const files = [...new Set((await Promise.all(roots.map(walkHtml))).flat())];
let updated = 0;
let landingCount = 0;

for (const filePath of files) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-editorial-v9\b/.test(html)) continue;
  const original = html;
  const isLanding = /[\\/](?:news|fmbnews)[\\/]index\.html$/i.test(filePath);

  html = addBodyClass(html, 'news-signal-v10');
  html = removeRedundantControls(html);
  html = injectPresentedFonts(html);
  html = replaceFooter(html);
  html = injectCss(html, css);

  if (isLanding) landingCount += 1;

  const required = ['news-signal-v10', 'data-fmb-news-signal-v10', 'data-fmb-news-ticker', 'data-philippine-time', 'fn10-footer-grid', 'fn10-signal-emblem', 'data-fmb-presented-fonts', 'Cormorant+Garamond', 'family=Manrope'];
  for (const marker of required) {
    if (!html.includes(marker)) throw new Error(`FMB News Signal V10 marker ${marker} missing: ${filePath}`);
  }
  if (/<div\b[^>]*class=(['"])[^'"]*\bfn9-publication-bar\b[^'"]*\1/i.test(html)) throw new Error(`Redundant publication bar remains: ${filePath}`);
  if (/<nav\b[^>]*class=(['"])[^'"]*\bfn9-category-nav\b[^'"]*\1/i.test(html)) throw new Error(`Redundant upper category navigation remains: ${filePath}`);

  if (html !== original) {
    await writeFile(filePath, html, 'utf8');
    updated += 1;
  }
}

if (!updated || landingCount !== 2) {
  throw new Error(`FMB News Signal V10 expected two landing routes and updated pages; found ${landingCount} landing route(s), ${updated} update(s).`);
}

console.log(`Applied the FMB News signal system with the presented Cormorant Garamond and Manrope typography, consolidated moving headlines with Philippine time, removed redundant upper labels and category navigation, and enhanced the footer across ${updated} route(s).`);