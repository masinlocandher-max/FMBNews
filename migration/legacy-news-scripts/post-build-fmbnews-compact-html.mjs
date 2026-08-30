import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoots = [
  path.join(root, 'dist', 'news'),
  path.join(root, 'dist', 'fmbnews')
];

const retiredInlineStyles = [
  'data-fmb-news-mobile-dock',
  'data-fmb-news-final-styles',
  'data-fmbnews-futuristic-ph'
];

async function walkHtml(directory) {
  const files = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return files;
    throw error;
  }

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

function removeTaggedBlockByAttribute(html, tagName, attribute) {
  const expression = new RegExp(
    `<${tagName}\\b(?=[^>]*\\b${attribute}\\b)[^>]*>[\\s\\S]*?<\\/${tagName}>\\s*`,
    'gi'
  );
  return html.replace(expression, '');
}

const targets = [...new Set((await Promise.all(newsRoots.map(walkHtml))).flat())];
let totalSavedBytes = 0;
let optimizedCount = 0;

for (const file of targets) {
  let html = await readFile(file, 'utf8');
  if (!/\bnews-(?:route|story-route)\b/.test(html) && !/\bnews-channel-v4\b/.test(html)) continue;

  const originalBytes = Buffer.byteLength(html, 'utf8');

  for (const attribute of retiredInlineStyles) {
    html = removeTaggedBlockByAttribute(html, 'style', attribute);
  }

  const optimized = html
    .replace(/<link\b[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>\s*/gi, '')
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  if (!/fmb-sitewide-visual-fixes\.css/i.test(optimized)) {
    throw new Error(`FMB News optimization removed the required final stylesheet from ${file}`);
  }

  if (/data-fmb-news-final-styles|data-fmbnews-futuristic-ph/i.test(optimized)) {
    throw new Error(`FMB News optimization left a retired inline design layer in ${file}`);
  }

  await writeFile(file, optimized, 'utf8');
  const savedBytes = Math.max(0, originalBytes - Buffer.byteLength(optimized, 'utf8'));
  totalSavedBytes += savedBytes;
  optimizedCount += 1;
}

if (!optimizedCount) {
  throw new Error('FMB News optimization did not find generated News pages.');
}

console.log(`Optimized ${optimizedCount} FMB News page(s) and removed ${totalSavedBytes} bytes of retired inline styling.`);
