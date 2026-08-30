import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const roots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];

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

let normalized = 0;
for (const file of [...new Set((await Promise.all(roots.map(walkHtml))).flat())]) {
  let html = await readFile(file, 'utf8');
  if (!/\bnews-(?:route|story-route)\b/.test(html) && !/\bnews-channel-v4\b/.test(html)) continue;
  const original = html;

  html = html.replace(
    /<(?:img|source)\b[^>]*(?:src|srcset)=(['"])[^'"]*(?:fmb-news-official-transparent\.webp|fmb-news-official\.svg)[^'"]*\1[^>]*>\s*/gi,
    '',
  );

  if (!/class=(['"])[^'"]*\bnc-site-header\b[^'"]*\1/i.test(html)) {
    html = html.replace(/<main\b/i, '<header class="nc-site-header"></header><main');
  }

  if (!/class=(['"])[^'"]*\bnc-topic-rail\b[^'"]*\1/i.test(html)) {
    html = html.replace(
      /(<header\b[^>]*class=(['"])[^'"]*\bnc-site-header\b[^'"]*\2[^>]*>[\s\S]*?<\/header>)/i,
      '$1<nav class="nc-topic-rail"><div class="wrap"></div></nav>',
    );
  }

  if (!/class=(['"])[^'"]*\bnc-footer\b[^'"]*\1/i.test(html)) {
    if (/class=(['"])[^'"]*\bfmb-shell-footer\b[^'"]*\1/i.test(html)) {
      html = html.replace(/<footer\b(?=[^>]*class=(['"])[^'"]*\bfmb-shell-footer\b)/i, '<footer class="nc-footer"></footer><footer');
    } else {
      html = html.replace(/<\/body>/i, '<footer class="nc-footer"></footer></body>');
    }
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    normalized += 1;
  }
}

console.log(`Normalized ${normalized} legacy News route(s) for the independent publication shell.`);
