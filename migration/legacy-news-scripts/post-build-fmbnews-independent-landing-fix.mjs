import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const landingPaths = [
  path.join(repositoryRoot, 'dist', 'news', 'index.html'),
  path.join(repositoryRoot, 'dist', 'fmbnews', 'index.html'),
];

const intro = '<section class="fn7-intro" aria-labelledby="fn7IntroTitle"><div class="wrap fn7-intro-grid"><div><p class="fn7-eyebrow">FMB News</p><h1 id="fn7IntroTitle">Latest news, made clear.</h1></div><div class="fn7-intro-copy"><p>In a world overloaded with information, all you need is clarity. We gather the latest reports, make them easier to understand, and answer one question: why does this matter to you as a Filipino?</p><a class="fn7-text-link" href="/fmbnews/about/">How we do it</a></div></div></section>';

function replaceMeta(html, attribute, value, content) {
  const pattern = new RegExp(`<meta\\b[^>]*${attribute}=(['"])${value}\\1[^>]*>`, 'i');
  const tag = `<meta ${attribute}="${value}" content="${content}">`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `${tag}</head>`);
}

let updated = 0;
for (const filePath of landingPaths) {
  let html = await readFile(filePath, 'utf8');
  const original = html;

  if (!/<section\b[^>]*class=(['"])[^'"]*\bfn7-intro\b[^'"]*\1/i.test(html)) {
    html = html.replace(/<main\b([^>]*)>/i, (main) => `${main}${intro}`);
  }

  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>FMB News | Latest News Made Clear for Filipinos</title>')
    .replace(/<meta\b[^>]*name=(['"])theme-color\1[^>]*>/i, '<meta name="theme-color" content="#111111">');

  html = replaceMeta(html, 'name', 'description', 'FMB News gathers the latest reports, makes them clear, and explains why they matter to Filipinos.');
  html = replaceMeta(html, 'property', 'og:title', 'FMB News | Latest News Made Clear for Filipinos');
  html = replaceMeta(html, 'property', 'og:description', 'In a world overloaded with information, all you need is clarity. FMB News explains the latest developments and why they matter to Filipinos.');
  html = replaceMeta(html, 'property', 'og:site_name', 'FMB News');
  html = replaceMeta(html, 'name', 'twitter:title', 'FMB News | Latest News Made Clear');
  html = replaceMeta(html, 'name', 'twitter:description', 'The latest news, clarified and explained through why it matters to Filipinos.');

  if (!/<section\b[^>]*class=(['"])[^'"]*\bfn7-intro\b[^'"]*\1/i.test(html)) {
    throw new Error(`FMB News landing introduction is missing: ${filePath}`);
  }

  if (html !== original) {
    await writeFile(filePath, html, 'utf8');
    updated += 1;
  }
}

console.log(`Guaranteed the FMB News clarity introduction and independent publication metadata on ${updated} landing route(s).`);
