import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsAssets = path.join(dist, 'assets', 'images', 'news');
const newsRoot = path.join(dist, 'news');
const canonicalOrigin = 'https://www.francinemariebautista.com';
const rasterExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];

async function walk(directory, predicate) {
  const output = [];
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return output;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(full, predicate));
    else if (entry.isFile() && predicate(full)) output.push(full);
  }
  return output;
}

async function firstExistingRaster(svgFile) {
  const base = svgFile.slice(0, -4);
  for (const extension of rasterExtensions) {
    const candidate = base + '.' + extension;
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next local format.
    }
  }
  return null;
}

function publicPath(file) {
  return '/' + path.relative(dist, file).split(path.sep).join('/');
}

function isRemoteImageValue(value) {
  return /https?:\/\/(?:upload|commons)\.wikimedia\.org\//i.test(value)
    || String(value || '').startsWith('/api/news-image?url=');
}

function tagDeliversUnavailableImage(tag, unavailableValues) {
  for (const match of tag.matchAll(/\b(?:src|srcset)=(["'])(.*?)\1/gi)) {
    const value = match[2];
    if (isRemoteImageValue(value) || unavailableValues.some((item) => value.includes(item))) return true;
  }
  return false;
}

function removeUnavailableImageDelivery(html, unavailableValues, onRemove) {
  let output = html.replace(/<(?:img|source)\b[^>]*>/gi, (tag) => {
    if (!tagDeliversUnavailableImage(tag, unavailableValues)) return tag;
    onRemove();
    return '';
  });
  output = output.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (!/\b(?:property|name)=(["'])(?:og:image(?::url)?|twitter:image)\1/i.test(tag)) return tag;
    const value = tag.match(/\bcontent=(["'])(.*?)\1/i)?.[2] || '';
    if (!isRemoteImageValue(value) && !unavailableValues.some((item) => value.includes(item))) return tag;
    onRemove();
    return '';
  });
  return output;
}

function containsUnavailableDelivery(html, unavailableValues) {
  let found = false;
  html.replace(/<(?:img|source)\b[^>]*>/gi, (tag) => {
    if (tagDeliversUnavailableImage(tag, unavailableValues)) found = true;
    return tag;
  });
  html.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (!/\b(?:property|name)=(["'])(?:og:image(?::url)?|twitter:image)\1/i.test(tag)) return tag;
    const value = tag.match(/\bcontent=(["'])(.*?)\1/i)?.[2] || '';
    if (isRemoteImageValue(value) || unavailableValues.some((item) => value.includes(item))) found = true;
    return tag;
  });
  return found;
}

const wrapperReplacements = new Map();
const unavailableWrappers = [];

for (const svgFile of await walk(newsAssets, (file) => file.endsWith('.svg'))) {
  const svg = await readFile(svgFile, 'utf8');
  if (!/<image\b[^>]*\b(?:href|xlink:href)=["']https?:\/\//i.test(svg)) continue;
  const svgPublic = publicPath(svgFile);
  const rasterFile = await firstExistingRaster(svgFile);
  if (rasterFile) {
    const rasterPublic = publicPath(rasterFile);
    wrapperReplacements.set(svgPublic, rasterPublic);
    wrapperReplacements.set(canonicalOrigin + svgPublic, canonicalOrigin + rasterPublic);
  } else {
    unavailableWrappers.push(svgPublic, canonicalOrigin + svgPublic);
  }
}

const htmlFiles = await walk(newsRoot, (file) => file.endsWith('.html'));
let changedFiles = 0;
let changedReferences = 0;
let withheldReferences = 0;

for (const htmlFile of htmlFiles) {
  const before = await readFile(htmlFile, 'utf8');
  let after = before;
  for (const [from, to] of wrapperReplacements) {
    if (!after.includes(from)) continue;
    changedReferences += after.split(from).length - 1;
    after = after.split(from).join(to);
  }
  after = removeUnavailableImageDelivery(after, unavailableWrappers, () => {
    withheldReferences += 1;
  });
  if (after !== before) {
    await writeFile(htmlFile, after, 'utf8');
    changedFiles += 1;
  }
}

const violations = [];
for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8');
  if (containsUnavailableDelivery(html, unavailableWrappers)) {
    violations.push(path.relative(dist, htmlFile) + ' still contains an unavailable or remote image delivery reference');
  }
}
if (violations.length) {
  throw new Error('FMB News local-image audit failed:\n' + violations.slice(0, 25).join('\n'));
}

console.log(
  'FMB News local-image enforcement localized ' + (wrapperReplacements.size / 2) +
  ' wrapper(s), withheld ' + withheldReferences + ' unavailable image reference(s), and rewrote ' +
  changedReferences + ' reference(s) across ' + changedFiles + ' page(s).'
);
