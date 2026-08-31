import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolve = (...parts) => path.join(root, ...parts);

const required = [
  'public/assets/images/news/fmb-news-editorial-fallback.svg',
  'public/assets/js/fmb-news-image-hardfix.js',
  'public/assets/js/fmb-news-newsletter.js',
  'dist/news/assets/images/news/fmb-news-editorial-fallback.svg',
  'dist/news/assets/js/fmb-news-image-hardfix.js',
  'dist/news/assets/js/fmb-news-newsletter.js'
];
for (const rel of required) await access(resolve(rel));

const sourceGuard = await readFile(resolve('public/assets/js/fmb-news-image-hardfix.js'), 'utf8');
const sourceNewsletter = await readFile(resolve('public/assets/js/fmb-news-newsletter.js'), 'utf8');
const builtGuard = await readFile(resolve('dist/news/assets/js/fmb-news-image-hardfix.js'), 'utf8');
const builtNewsletter = await readFile(resolve('dist/news/assets/js/fmb-news-newsletter.js'), 'utf8');
const fallback = await readFile(resolve('public/assets/images/news/fmb-news-editorial-fallback.svg'), 'utf8');

for (const signal of [
  '/assets/images/news/fmb-news-editorial-fallback.svg',
  'MutationObserver',
  "addEventListener('error'",
  '.cms-article',
  '.cms-edition-entry',
  '.country-card',
  '.country-entry',
  '.brief-issue',
  '.story-card',
  '.support-item',
  '.more-item',
  '.related-item'
]) {
  if (!sourceGuard.includes(signal)) throw new Error(`Image hard-fix regression: source guard is missing ${signal}`);
}
if (!sourceNewsletter.includes('/assets/js/fmb-news-image-hardfix.js')) {
  throw new Error('Image hard-fix regression: source loader is not wired through the shared newsletter script');
}
if (!builtGuard.includes('/news/assets/images/news/fmb-news-editorial-fallback.svg')) {
  throw new Error('Image hard-fix regression: built guard does not point to the scoped fallback asset');
}
if (!builtNewsletter.includes('/news/assets/js/fmb-news-image-hardfix.js')) {
  throw new Error('Image hard-fix regression: built loader does not point to the scoped image guard');
}
if (builtGuard.includes('/news/news/assets/') || builtNewsletter.includes('/news/news/assets/')) {
  throw new Error('Image hard-fix regression: double-scoped /news/news/assets/ path detected');
}
if (!fallback.includes('<svg') || !fallback.includes('FMB News editorial visual')) {
  throw new Error('Image hard-fix regression: fallback visual is invalid');
}

let htmlPages = 0;
let generatedArticles = 0;

async function scan(target) {
  const info = await stat(target);
  if (info.isDirectory()) {
    for (const entry of await readdir(target)) await scan(path.join(target, entry));
    return;
  }
  if (!target.endsWith('.html')) return;

  htmlPages += 1;
  const html = await readFile(target, 'utf8');
  if (!html.includes('/news/assets/js/fmb-news-newsletter.js')) {
    throw new Error(`Image hard-fix loader missing from ${path.relative(root, target)}`);
  }
  if (html.includes('/news/news/assets/')) {
    throw new Error(`Double-scoped image asset path found in ${path.relative(root, target)}`);
  }

  if (html.includes('class="article-grid"') && html.includes('class="article-figure"')) {
    generatedArticles += 1;
    if (!/class="article-figure"[\s\S]*?<img\s+[^>]*src="[^"]+"/i.test(html)) {
      throw new Error(`Generated FMB News article has no usable figure image in ${path.relative(root, target)}`);
    }
  }
}

await scan(resolve('dist/news'));
if (generatedArticles === 0) throw new Error('Image hard-fix regression: no generated article pages were inspected');

console.log(`FMB News image verification passed: ${generatedArticles} generated articles have figure images; ${htmlPages} built HTML pages load broken/missing-image recovery; scoped fallback paths are valid and no double-scoped assets remain.`);
