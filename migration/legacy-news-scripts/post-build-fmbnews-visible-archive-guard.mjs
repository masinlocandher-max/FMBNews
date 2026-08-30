import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const landings = [path.join(dist, 'news', 'index.html'), path.join(dist, 'fmbnews', 'index.html')];
const origin = 'https://www.francinemariebautista.com';

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name === 'index.html') files.push(absolute);
  }
  return files;
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))?.[2] ?? '';
}

function decode(value = '') {
  return value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
}

function text(value = '') {
  return decode(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function escape(value = '') {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function meta(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if ((attr(tag, 'property') || attr(tag, 'name')).toLowerCase() === key.toLowerCase()) return decode(attr(tag, 'content'));
  }
  return '';
}

function routeFrom(html, filePath) {
  const canonicalTag = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]).find((tag) => attr(tag, 'rel').toLowerCase() === 'canonical');
  const fallback = `${origin}/${path.relative(dist, path.dirname(filePath)).split(path.sep).join('/')}/`;
  const href = canonicalTag ? attr(canonicalTag, 'href') : fallback;
  try {
    const pathname = new URL(href, origin).pathname;
    if (!pathname.startsWith('/news/') || pathname === '/news/') return '';
    return pathname.endsWith('/') ? pathname : `${pathname}/`;
  } catch {
    return '';
  }
}

function articleRecord(html, filePath) {
  if (!/\bnews-story-route\b/i.test(html)) return null;
  if (/http-equiv=(['"])refresh\1/i.test(html) || /<meta\b[^>]*(?:name|property)=(['"])robots\1[^>]*content=(['"])[^'"]*noindex/i.test(html)) return null;
  const route = routeFrom(html, filePath);
  if (!route) return null;
  const imageTag = html.match(/<img\b[^>]*>/i)?.[0] ?? '';
  const title = meta(html, 'og:title') || text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
  const image = meta(html, 'og:image') || attr(imageTag, 'src');
  const alt = meta(html, 'og:image:alt') || decode(attr(imageTag, 'alt')) || `Editorial image for ${title}`;
  const width = meta(html, 'og:image:width') || attr(imageTag, 'width');
  const height = meta(html, 'og:image:height') || attr(imageTag, 'height');
  const kicker = text(html.match(/<[^>]+class=(["'])[^"']*\bnc-kicker\b[^"']*\1[^>]*>([\s\S]*?)<\//i)?.[2] ?? '') || 'FMB News archive';
  const readTime = text(html).match(/\b\d+\s*min(?:ute)?s?\s*read\b/i)?.[0] ?? 'Read report';
  if (!title || !image) throw new Error(`Published article lacks title or image: ${filePath}`);
  return { route, title: title.replace(/\s*[|·-]\s*FMB News.*$/i, '').trim(), image, alt, width, height, kicker, readTime };
}

function matchingDivClose(html, openingIndex) {
  const pattern = /<\/?div\b[^>]*>/gi;
  pattern.lastIndex = openingIndex;
  let depth = 0;
  let match;
  while ((match = pattern.exec(html))) {
    depth += /^<\/div/i.test(match[0]) ? -1 : 1;
    if (depth === 0) return match.index;
  }
  return -1;
}

function reportGrid(html) {
  const openingIndex = html.search(/<div\b[^>]*class=(["'])[^"']*\bfn9-report-grid\b[^"']*\1[^>]*>/i);
  const closingIndex = openingIndex >= 0 ? matchingDivClose(html, openingIndex) : -1;
  if (openingIndex < 0 || closingIndex < 0) throw new Error('FMB News report grid could not be located.');
  const closingTagEnd = html.indexOf('>', closingIndex);
  if (closingTagEnd < 0) throw new Error('FMB News report grid closing tag is malformed.');
  return html.slice(openingIndex, closingTagEnd + 1);
}

function gridRoutes(html) {
  const routes = new Set();
  for (const match of reportGrid(html).matchAll(/<a\b[^>]*href=(["'])([^"']+)\1/gi)) {
    try {
      const pathname = new URL(match[2], origin).pathname;
      if (pathname.startsWith('/news/') && pathname !== '/news/') routes.add(pathname.endsWith('/') ? pathname : `${pathname}/`);
    } catch {}
  }
  return routes;
}

function card(article) {
  const dimensions = `${/^\d+$/.test(article.width) ? ` width="${article.width}"` : ''}${/^\d+$/.test(article.height) ? ` height="${article.height}"` : ''}`;
  return `<article class="nc-rundown-story fn9-report-card fn11-restored-report" data-fn9-searchable data-restored-news-route="${escape(article.route)}"><a href="${escape(article.route)}"><span class="nc-rundown-number">ARCHIVE</span><figure class="news-visual"><img src="${escape(article.image)}"${dimensions} loading="lazy" decoding="async" alt="${escape(article.alt)}"><figcaption>Photo and source details appear in the report.</figcaption></figure><div><p>${escape(article.kicker)}</p><h3>${escape(article.title)}</h3><span>${escape(article.readTime)}</span></div></a></article>`;
}

function appendToArchive(html, cards) {
  if (!cards.length) return html;
  const start = html.search(/<div\b[^>]*class=(["'])[^"']*\bfn9-more-reports\b[^"']*\1[^>]*>/i);
  const end = start >= 0 ? matchingDivClose(html, start) : -1;
  if (start < 0 || end < 0) throw new Error('Expandable FMB News archive container could not be located.');
  return `${html.slice(0, end)}${cards.join('')}${html.slice(end)}`;
}

const records = new Map();
for (const filePath of await walk(newsRoot)) {
  if (filePath === path.join(newsRoot, 'index.html')) continue;
  const record = articleRecord(await readFile(filePath, 'utf8'), filePath);
  if (record) records.set(record.route, record);
}
const articles = [...records.values()].sort((a, b) => a.route.localeCompare(b.route));
const publishedRoutes = new Set(articles.map(({ route }) => route));

for (const landingPath of landings) {
  let html = await readFile(landingPath, 'utf8');
  const before = gridRoutes(html);
  const missing = articles.filter((article) => !before.has(article.route));
  html = appendToArchive(html, missing.map(card));

  const after = gridRoutes(html);
  const unresolved = articles.filter((article) => !after.has(article.route));
  const unknown = [...after].filter((route) => !publishedRoutes.has(route));
  if (unresolved.length) throw new Error(`Expandable FMB News report grid still omits: ${unresolved.map(({ route }) => route).join(', ')}`);
  if (unknown.length) throw new Error(`Expandable FMB News report grid contains unknown article routes: ${unknown.join(', ')}`);
  if (after.size !== articles.length) throw new Error(`Expandable FMB News report grid expected ${articles.length} unique published routes; found ${after.size}.`);

  html = html.replace(/(<button\b[^>]*data-fn9-view-all[^>]*>)[\s\S]*?(<\/button>)/i, `$1View all ${articles.length} published reports →$2`);
  await writeFile(landingPath, html, 'utf8');
  console.log(`Expandable report grid ${path.relative(dist, landingPath)}: ${after.size} published routes, ${missing.length} restored directly into the archive.`);
}

await import('./post-build-fmbnews-v11-finalize.mjs');
