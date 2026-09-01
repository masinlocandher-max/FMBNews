import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolve = (...parts) => path.join(root, ...parts);

const required = [
  'public/assets/images/news/fmb-news-editorial-fallback.svg',
  'public/assets/js/fmb-news-image-hardfix.js',
  'public/assets/js/fmb-news-newsletter.js',
  'scripts/hardfix-all-article-images.mjs',
  'scripts/hardfix-designated-fallbacks.mjs',
  'dist/news/assets/images/news/fmb-news-editorial-fallback.svg',
  'dist/news/assets/images/mobile/fmb-explainer-fallback.jpg',
  'dist/news/assets/images/mobile/fmb-daily-brief-mug.jpg',
  'dist/news/assets/js/fmb-news-image-hardfix.js',
  'dist/news/assets/js/fmb-news-newsletter.js'
];
for (const rel of required) await access(resolve(rel));

const sourceGuard = await readFile(resolve('public/assets/js/fmb-news-image-hardfix.js'), 'utf8');
const sourceNewsletter = await readFile(resolve('public/assets/js/fmb-news-newsletter.js'), 'utf8');
const articleImageHardfix = await readFile(resolve('scripts/hardfix-all-article-images.mjs'), 'utf8');
const designatedFallbackHardfix = await readFile(resolve('scripts/hardfix-designated-fallbacks.mjs'), 'utf8');
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
for(const signal of ['isArticle','article-grid','hasContentImage','injectFigure','og:image','twitter:image','fmb-guaranteed-article-figure','fmb-explainer-fallback.jpg','fmb-daily-brief-mug.jpg']){
  if(!articleImageHardfix.includes(signal))throw new Error(`Article image build hard rule is missing ${signal}`);
}
for(const signal of ['fmb-explainer-fallback.jpg','generatedExplainerArt','Real supplied photos were left untouched']){
  if(!designatedFallbackHardfix.includes(signal))throw new Error(`Designated Explainer fallback rule is missing ${signal}`);
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

const isArticle=html=>html.includes('class="article-grid"')||/property=["']og:type["'][^>]*content=["']article["']/i.test(html)||/content=["']article["'][^>]*property=["']og:type["']/i.test(html)||/["']@type["']\s*:\s*["'](?:NewsArticle|Article)["']/i.test(html);
const hasArticleImage=html=>/class=["'][^"']*(?:article-figure|cms-article-image|explainer-article-image|article-hero-image|brief-hero)[^"']*["'][\s\S]*?<img\s+[^>]*src=["'][^"']+/i.test(html)||/<article\b[\s\S]*?<img\s+[^>]*src=["'][^"']+/i.test(html);

let htmlPages = 0;
let articlePages = 0;
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

  if(isArticle(html)){
    articlePages += 1;
    if(!hasArticleImage(html))throw new Error(`Article route has no visible content image in ${path.relative(root,target)}`);
    if(!/<meta\b[^>]*property=["']og:image["'][^>]*content=["'][^"']+["']/i.test(html)&&!/<meta\b[^>]*content=["'][^"']+["'][^>]*property=["']og:image["']/i.test(html)){
      throw new Error(`Article route has no og:image in ${path.relative(root,target)}`);
    }
  }
}

await scan(resolve('dist/news'));
if (generatedArticles === 0) throw new Error('Image hard-fix regression: no generated article pages were inspected');
if (articlePages === 0) throw new Error('Article image regression: no article routes were inspected');
if (articlePages < generatedArticles) throw new Error(`Article image regression: only ${articlePages} article routes inspected vs ${generatedArticles} generated articles`);

console.log(`FMB News image verification passed: all ${articlePages} article routes have visible content images and og:image metadata; ${generatedArticles} generated articles have figure images; designated Explainer and Daily Brief fallback assets are present; ${htmlPages} built HTML pages load broken/missing-image recovery.`);
