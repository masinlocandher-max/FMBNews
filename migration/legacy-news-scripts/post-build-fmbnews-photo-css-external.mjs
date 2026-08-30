import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const fmbNewsLandingPath = path.join(distRoot, 'fmbnews', 'index.html');
const sourceCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-photo-credits.css');
const outputCssPath = path.join(distRoot, 'assets', 'css', 'fmbnews-photo-credits.css');
const styleStart = '<!-- FMB_NEWS_PHOTO_CREDITS_START -->';
const styleEnd = '<!-- FMB_NEWS_PHOTO_CREDITS_END -->';
const linkMarkup = '<link rel="stylesheet" href="/assets/css/fmbnews-photo-credits.css?v=20260803-sourced-photos-v1">';

async function walkHtml(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

function externalize(html) {
  let next = html.replace(new RegExp(`${styleStart}[\\s\\S]*?${styleEnd}\\s*`, 'g'), '');
  next = next.replace(/<link\b[^>]*href=(['"])\/assets\/css\/fmbnews-photo-credits\.css[^'"]*\1[^>]*>\s*/gi, '');
  const sitewide = /<link\b[^>]*href=(['"])\/assets\/css\/fmb-sitewide-visual-fixes\.css[^'"]*\1[^>]*>/i;
  if (sitewide.test(next)) return next.replace(sitewide, `${linkMarkup}\n$&`);
  return next.replace('</head>', `${linkMarkup}\n</head>`);
}

const css = await readFile(sourceCssPath, 'utf8');
await mkdir(path.dirname(outputCssPath), { recursive: true });
await writeFile(outputCssPath, css, 'utf8');

const files = [...await walkHtml(newsRoot), fmbNewsLandingPath];
let changed = 0;
for (const filePath of files) {
  const html = await readFile(filePath, 'utf8');
  const updated = externalize(html);
  if (updated === html) continue;
  await writeFile(filePath, updated, 'utf8');
  changed += 1;
}

console.log(`Externalized FMB News sourced-photo credit styles across ${changed} page(s) while preserving the final safeguard order.`);
