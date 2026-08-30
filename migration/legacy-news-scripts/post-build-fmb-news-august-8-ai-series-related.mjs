import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const sourcePath = path.join(root, 'scripts', 'post-build-fmb-news-august-8-ai-pax-silica.mjs');
const source = await readFile(sourcePath, 'utf8');

const esc = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const storyPattern = /slug\s*:\s*'([^']+)'[\s\S]*?title\s*:\s*'([^']+)'/g;
const stories = [];
for (const match of source.matchAll(storyPattern)) {
  stories.push({ slug: match[1], title: match[2] });
  if (stories.length === 3) break;
}

if (stories.length !== 3) {
  throw new Error(`Expected exactly three August 8 AI/Pax Silica stories, found ${stories.length}.`);
}

const style = `<style data-fmb-ai-series-related-style>
.fmb-related-series{margin:3rem 0 1rem;padding-top:1.5rem;border-top:1px solid rgba(67,24,91,.16)}
.fmb-related-series__eyebrow{margin:0 0 .5rem;font:700 .72rem/1.2 Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#5b246f}
.fmb-related-series h2{margin:.1rem 0 1rem;font-size:clamp(1.35rem,2.4vw,2rem);line-height:1.08}
.fmb-related-series__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem}
.fmb-related-series__link{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1rem 1.05rem;border:1px solid rgba(67,24,91,.14);border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(248,244,250,.94));color:inherit;text-decoration:none;box-shadow:0 14px 38px rgba(35,17,51,.06);transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.fmb-related-series__link:hover{transform:translateY(-2px);border-color:rgba(91,36,111,.34);box-shadow:0 18px 44px rgba(35,17,51,.1)}
.fmb-related-series__title{font-weight:750;line-height:1.32}
.fmb-related-series__arrow{flex:0 0 auto;font-size:1.1rem;color:#5b246f}
@media(max-width:720px){.fmb-related-series__grid{grid-template-columns:1fr}.fmb-related-series{margin-top:2.25rem}}
</style>`;

for (const story of stories) {
  const file = path.join(newsRoot, story.slug, 'index.html');
  let html = await readFile(file, 'utf8');
  const others = stories.filter(item => item.slug !== story.slug);
  const related = `<div class="wrap" data-fmb-ai-series-related><section class="fmb-related-series" aria-labelledby="related-${esc(story.slug)}"><p class="fmb-related-series__eyebrow">Related in this FMB News series</p><h2 id="related-${esc(story.slug)}">Continue reading</h2><div class="fmb-related-series__grid">${others.map(item => `<a class="fmb-related-series__link" href="/news/${esc(item.slug)}/"><span class="fmb-related-series__title">${esc(item.title)}</span><span class="fmb-related-series__arrow" aria-hidden="true">→</span></a>`).join('')}</div></section></div>`;

  html = html.replace(/<style\s+data-fmb-ai-series-related-style>[\s\S]*?<\/style>/i, '');
  html = html.replace(/<div class="wrap" data-fmb-ai-series-related>[\s\S]*?<\/section><\/div>/i, '');
  html = html.replace('</head>', `${style}</head>`);
  if (!html.includes('</article>')) throw new Error(`Missing </article> in ${story.slug}`);
  html = html.replace('</article>', `${related}</article>`);
  await writeFile(file, html, 'utf8');
}

console.log('Added reciprocal related-story links to the three FMB News AI/Pax Silica articles.');
