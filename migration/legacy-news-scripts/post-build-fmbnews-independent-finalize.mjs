import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const sitewidePath = path.join(dist, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
const sourceRoot = path.join(root, 'apps', 'withlovefmb', 'assets', 'css');
const markerStart = '/* FMB_NEWS_INDEPENDENT_FINAL_START */';
const markerEnd = '/* FMB_NEWS_INDEPENDENT_FINAL_END */';
const requiredHref = '/assets/css/fmb-sitewide-visual-fixes.css?v=20260726-readability-v2';

async function walkHtml(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walkHtml(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addBodyClass(html, className) {
  return html.replace(/<body\b([^>]*)>/i, (match, attrs = '') => {
    if (/\bclass=(['"])([^'"]*)\1/i.test(attrs)) {
      attrs = attrs.replace(/\bclass=(['"])([^'"]*)\1/i, (whole, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    } else {
      attrs += ` class="${className}"`;
    }
    return `<body${attrs}>`;
  });
}

const [sitewide, independentV1, independentV2] = await Promise.all([
  readFile(sitewidePath, 'utf8'),
  readFile(path.join(sourceRoot, 'fmbnews-independent-v1.css'), 'utf8'),
  readFile(path.join(sourceRoot, 'fmbnews-independent-v2.css'), 'utf8'),
]);

const cleanSitewide = sitewide.replace(
  new RegExp(`${escapeRegExp(markerStart)}[\\s\\S]*?${escapeRegExp(markerEnd)}\\s*`, 'g'),
  '',
);

await writeFile(
  sitewidePath,
  `${cleanSitewide.trimEnd()}\n\n${markerStart}\n${independentV1.trim()}\n\n${independentV2.trim()}\n${markerEnd}\n`,
  'utf8',
);

const files = [...new Set((await Promise.all(newsRoots.map(walkHtml))).flat())];
let updated = 0;

for (const file of files) {
  let html = await readFile(file, 'utf8');
  if (!/\bfn-news-independent\b/.test(html)) continue;
  const original = html;

  html = addBodyClass(html, 'fmb-approved-launch')
    .replace(/<link\b[^>]*href=(['"])[^'"]*fmbnews-independent-v[12]\.css[^'"]*\1[^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*href=(['"])[^'"]*fmb-sitewide-visual-fixes\.css[^'"]*\1[^>]*>\s*/gi, '');

  if (!/\bfmb-announcement-track\b/.test(html)) {
    const hiddenRail = '<div class="fmb-shell-rail" data-fmb-unified-shell aria-hidden="true"><div class="fmb-announcement-window"><div class="fmb-announcement-track"><div class="fmb-announcement-group"><a class="fmb-announcement-item" href="/fmbnews/">FMB News</a></div></div></div></div>';
    html = html.replace(/(<header\b[^>]*class=(['"])[^'"]*\bfmb-shell-header\b[^'"]*\2[^>]*>)/i, `${hiddenRail}$1`);
  }

  html = html.replace(/<\/head>/i, `<link rel="stylesheet" href="${requiredHref}"></head>`);

  const hrefCount = (html.match(/fmb-sitewide-visual-fixes\.css/g) || []).length;
  if (hrefCount !== 1) throw new Error(`Independent News page must load one final safeguard stylesheet: ${file}`);
  if (!html.includes(requiredHref)) throw new Error(`Independent News page is missing the approved safeguard version: ${file}`);
  if (!html.includes('fmb-approved-launch') || !html.includes('fmb-announcement-track')) {
    throw new Error(`Independent News page is missing required hidden public-shell compatibility: ${file}`);
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    updated += 1;
  }
}

if (!updated) throw new Error('No independent FMB News pages were finalized.');
console.log(`Compiled the independent FMB NEWS design into the final sitewide safeguards and normalized ${updated} route(s).`);
