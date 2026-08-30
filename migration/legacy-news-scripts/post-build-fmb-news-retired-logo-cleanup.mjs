import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(repositoryRoot, 'dist', 'news');
const retiredRelative = [
  '/assets/images/fmb-approved/fmb-news-official-transparent.webp',
  '/assets/images/news/fmb-news-official.svg',
];
const retiredAbsolute = retiredRelative.map(value => `https://www.francinemariebautista.com${value}`);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

function footerMasthead() {
  return '<a class="nc-footer-brand nc-text-masthead nc-footer-masthead" href="/news/" aria-label="FMB News Center home"><span class="nc-masthead-monogram" aria-hidden="true">FMB</span><span class="nc-masthead-copy"><strong class="nc-masthead-title">News Center</strong><span class="nc-masthead-tagline">Filipino ang Mismong Balita.</span></span></a>';
}

let cleanedPages = 0;
let withheldMediaPages = 0;
for (const filePath of await walk(newsRoot)) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(html)) continue;

  html = html.replace(
    /<a\b(?=[^>]*\bclass=["'][^"']*\bnc-footer-brand\b[^"']*["'])(?=[^>]*\bhref=["']\/news\/["'])[^>]*>[\s\S]*?<\/a>/i,
    footerMasthead(),
  );

  const hadRetiredMedia = [...retiredRelative, ...retiredAbsolute].some(value => html.includes(value));
  if (hadRetiredMedia) {
    html = html
      .replace(/<source\b[^>]*(?:fmb-news-official-transparent\.webp|fmb-news-official\.svg)[^>]*>\s*/gi, '')
      .replace(/<img\b[^>]*(?:fmb-news-official-transparent\.webp|fmb-news-official\.svg)[^>]*>\s*/gi, '')
      .replace(/<meta\b[^>]*content=["'][^"']*(?:fmb-news-official-transparent\.webp|fmb-news-official\.svg)[^"']*["'][^>]*>\s*/gi, '');
    withheldMediaPages += 1;
  }

  if (/<(?:img|source)\b[^>]*(?:src|srcset)=["'][^"']*(?:fmb-news-official-transparent\.webp|fmb-news-official\.svg)/i.test(html)) {
    throw new Error(`News Center logo cleanup: retired News identity still renders in ${filePath}`);
  }
  await writeFile(filePath, html, 'utf8');
  cleanedPages += 1;
}

console.log(`Normalized ${cleanedPages} FMB News Center report footers and removed retired-logo media from ${withheldMediaPages} page(s); those reports stay out of image-led listings until a real photo is attached.`);
