import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const holdingRoot = path.join(dist, '.fmb-brief-hold');
const identityCss = '<link rel="stylesheet" href="/assets/css/fmb-news-identity-lockup.css?v=20260820">';

async function exists(target) {
  try { await readFile(target); return true; } catch { return false; }
}

async function htmlFiles(directory) {
  const out = [];
  let entries = [];
  try { entries = await readdir(directory, { withFileTypes: true }); } catch (error) {
    if (error?.code === 'ENOENT') return out;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

await rm(holdingRoot, { recursive: true, force: true });
await mkdir(holdingRoot, { recursive: true });

const held = [];
for (const entry of await readdir(newsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.startsWith('fmb-brief')) continue;
  const source = path.join(newsRoot, entry.name);
  const target = path.join(holdingRoot, entry.name);
  await rename(source, target);
  held.push(entry.name);
}

try {
  await import('./post-build-fmbnews-headquarters-final.mjs');
} finally {
  for (const name of held) {
    const source = path.join(holdingRoot, name);
    const target = path.join(newsRoot, name);
    await rm(target, { recursive: true, force: true });
    await rename(source, target);
  }
  await rm(holdingRoot, { recursive: true, force: true });
}

const identitySource = path.join(root, 'apps', 'withlovefmb', 'assets', 'css', 'fmb-news-identity-lockup.css');
const identityTarget = path.join(dist, 'assets', 'css', 'fmb-news-identity-lockup.css');
await mkdir(path.dirname(identityTarget), { recursive: true });
await writeFile(identityTarget, await readFile(identitySource, 'utf8'), 'utf8');

for (const base of [path.join(dist, 'fmbnews'), path.join(dist, 'news')]) {
  for (const file of await htmlFiles(base)) {
    let html = await readFile(file, 'utf8');
    if (!html.includes('fmb-news-identity-lockup.css')) html = html.replace('</head>', `${identityCss}</head>`);
    await writeFile(file, html, 'utf8');
  }
}

const briefFailures = [];
for (const file of await htmlFiles(newsRoot)) {
  const relative = path.relative(newsRoot, file).replaceAll(path.sep, '/');
  if (!relative.startsWith('fmb-brief')) continue;
  const html = await readFile(file, 'utf8');
  if (!html.includes('fmb-brief.css')) briefFailures.push(`${relative}: FMB Brief stylesheet missing`);
  if (!/FMB Brief/i.test(html)) briefFailures.push(`${relative}: FMB Brief identity missing`);
  if (!/Filipino Media Bulletin/i.test(html)) briefFailures.push(`${relative}: Filipino Media Bulletin descriptor missing`);
  if (!/<meta\b[^>]*property=(['"])og:image\1[^>]*content=(['"])(?!\s*\2)[^>]+>/i.test(html)) briefFailures.push(`${relative}: social image missing`);
  if (relative !== 'fmb-brief/index.html') {
    const date = html.match(/<meta\b[^>]*property=(['"])article:published_time\1[^>]*content=(['"])([^'"]+)\2/i)?.[3] || '';
    if (!date || Number.isNaN(new Date(date).getTime())) briefFailures.push(`${relative}: valid publication date missing`);
    if (!/<figcaption\b[^>]*class=(['"])[^'"]*brief-credit[^'"]*\1[^>]*>[\s\S]*?(?:Photo|Image)[\s\S]*?<\/figcaption>/i.test(html)) briefFailures.push(`${relative}: visible photo credit missing`);

    const fallbackFigures = (html.match(/<figure\b[\s\S]*?<\/figure>/gi) || [])
      .filter((figure) => /fmb-news-editorial-fallback|newsroom-editorial-fallback/i.test(figure));
    for (const [index, figure] of fallbackFigures.entries()) {
      if (!/<figcaption\b[^>]*class=(['"])[^'"]*brief-credit[^'"]*\1[^>]*>[\s\S]*?EDITORIAL FALLBACK[\s\S]*?<\/figcaption>/i.test(figure)) {
        briefFailures.push(`${relative}: fallback figure ${index + 1} must be visibly labeled EDITORIAL FALLBACK`);
      }
    }
  }
}

if (briefFailures.length) throw new Error(`FMB Brief production audit failed:\n${briefFailures.join('\n')}`);
console.log(`Protected ${held.length} FMB Brief route(s) from the legacy newsroom processor, applied the FMB News / Filipino Media Bulletin lockup, and passed the Brief-specific date, image, credit, and labeled-fallback audit.`);