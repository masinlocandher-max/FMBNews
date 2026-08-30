import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const articleRoot = path.join(root, 'apps', 'withlovefmb', 'content', 'news', 'articles');
const newsRoot = path.join(root, 'dist', 'news');

async function walkJson(dir) {
  const { readdir } = await import('node:fs/promises');
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walkJson(target));
    else if (entry.isFile() && entry.name.endsWith('.json')) out.push(target);
  }
  return out;
}

const fallbackLens = `<section class="lens lens-watch-fallback" data-editorial-lens="watch-next-fallback"><div class="lens-icon">→</div><div><h2>What to watch next</h2><p>Follow verified updates from the agencies, institutions, or people directly involved in this report. FMB News will update this page when a material development is confirmed.</p></div></section>`;

let inserted = 0;
let alreadyPresent = 0;
let missingRoute = 0;

for (const jsonFile of await walkJson(articleRoot)) {
  let story;
  try { story = JSON.parse(await readFile(jsonFile, 'utf8')); } catch { continue; }
  if (story?.status !== 'published' || !story?.slug) continue;

  const articleFile = path.join(newsRoot, story.slug, 'index.html');
  let html;
  try { html = await readFile(articleFile, 'utf8'); } catch { missingRoute += 1; continue; }

  if (/What to watch next/i.test(html)) {
    alreadyPresent += 1;
    continue;
  }

  if (!/<section class="sources">/i.test(html)) {
    throw new Error(`FMB News editorial lens guard: ${story.slug} has no sources anchor for watch-next insertion.`);
  }

  html = html.replace(/<section class="sources">/i, `${fallbackLens}<section class="sources">`);
  await writeFile(articleFile, html);
  inserted += 1;
}

console.log(`FMB News editorial lens guard complete: ${alreadyPresent} article(s) retained authored watch-next guidance, ${inserted} article(s) received a transparent non-factual follow-up guidance fallback, ${missingRoute} missing route(s) skipped for the final publication QA to catch.`);
