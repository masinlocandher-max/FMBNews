import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const roots = [path.join(distRoot, 'news'), path.join(distRoot, 'fmbnews')];
const cssPath = path.join(
  repositoryRoot,
  'apps',
  'withlovefmb',
  'assets',
  'css',
  'fmbnews-fmbandco-brand-v8.css',
);

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

function addBodyClass(html, className) {
  return html.replace(/<body\b([^>]*)>/i, (match, attrs = '') => {
    if (/\bclass=(['"])([^'"]*)\1/i.test(attrs)) {
      const next = attrs.replace(/\bclass=(['"])([^'"]*)\1/i, (whole, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
      return `<body${next}>`;
    }
    return `<body${attrs} class="${className}">`;
  });
}

function alignPublicationWordmark(html) {
  return html.replace(
    /(<a\b[^>]*class=(['"])[^'"]*\bfn7-wordmark\b[^'"]*\2[^>]*>\s*<span>FMB<\/span>\s*<strong>NEWS<\/strong>)(?:\s*<small>[\s\S]*?<\/small>)?(\s*<\/a>)/gi,
    '$1<small>An FMB&amp;CO. publication</small>$3',
  );
}

function alignMetadata(html) {
  let next = html
    .replace(
      /<meta\b[^>]*name=(['"])theme-color\1[^>]*>/i,
      '<meta name="theme-color" content="#18033f">',
    )
    .replace(
      /<meta\b[^>]*property=(['"])og:site_name\1[^>]*>/i,
      '<meta property="og:site_name" content="FMB News · FMB&amp;CO.">',
    );

  if (!/<meta\b[^>]*name=(['"])theme-color\1/i.test(next)) {
    next = next.replace(/<\/head>/i, '<meta name="theme-color" content="#18033f"></head>');
  }

  return next;
}

function alignFooter(html) {
  return html.replace(
    /(<footer\b[^>]*class=(['"])[^'"]*\bfn7-footer\b[^'"]*\2[^>]*>[\s\S]*?<p>)[\s\S]*?(<\/p>)/i,
    '$1Latest news, made clear for Filipinos. An FMB&amp;CO. publication.$3',
  );
}

const brandCss = (await readFile(cssPath, 'utf8')).trim();
const brandStyle = `<style data-fmb-news-fmbandco-v8>${brandCss}</style>`;
const files = [...new Set((await Promise.all(roots.map(walkHtml))).flat())];
let updated = 0;

for (const file of files) {
  let html = await readFile(file, 'utf8');
  if (!/\bnews-independent-v7\b/.test(html)) continue;
  const original = html;

  html = addBodyClass(html, 'news-fmbandco-v8');
  html = alignPublicationWordmark(html);
  html = alignMetadata(html);
  html = alignFooter(html);
  html = html
    .replace(/<style\b[^>]*data-fmb-news-fmbandco-v8[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<\/head>/i, `${brandStyle}</head>`);

  if (!html.includes('news-fmbandco-v8')) {
    throw new Error(`FMB&CO. News brand class missing: ${file}`);
  }
  if (!html.includes('data-fmb-news-fmbandco-v8')) {
    throw new Error(`FMB&CO. News brand style missing: ${file}`);
  }
  if (!html.includes('An FMB&amp;CO. publication')) {
    throw new Error(`FMB&CO. publication relationship missing: ${file}`);
  }
  if (!html.includes('FMB&amp;CO. Home')) {
    throw new Error(`FMB&CO. Home control missing: ${file}`);
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    updated += 1;
  }
}

if (!updated) throw new Error('No independent FMB News routes received the FMB&CO. brand layer.');
console.log(`Applied the FMB&CO. purple, ivory and gold brand kit to ${updated} FMB News route(s) without restoring competing logo layers.`);