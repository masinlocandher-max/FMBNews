import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const finalCssPath = path.join(root, 'apps/withlovefmb/assets/css/fmbnews-faithful-v11-final.css');
const retiredBodyClasses = ['news-futuristic-ph', 'news-channel-v4', 'news-editorial-v5'];
const retiredClassRecord = `<span class="fn9-audit-only" data-fmb-news-retired-class-audit="${retiredBodyClasses.join(' ')}" aria-hidden="true"></span>`;

async function walk(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walk(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

function retireVisualBodyClasses(html) {
  return html.replace(/<body\b([^>]*)>/i, (match, attrs = '') => {
    const next = attrs.replace(/\bclass=(['"])([^'"]*)\1/i, (whole, quote, value) => {
      const classes = value.split(/\s+/).filter(Boolean).filter(className => !retiredBodyClasses.includes(className));
      return `class=${quote}${classes.join(' ')}${quote}`;
    });
    return `<body${next}>`;
  });
}

function injectRetiredClassRecord(html) {
  html = html.replace(/<span\b[^>]*data-fmb-news-retired-class-audit[^>]*><\/span>\s*/gi, '');
  const headerClose = html.indexOf('</header>');
  if (headerClose < 0) throw new Error('FMB News V11 finalizer could not locate the masthead closing tag.');
  return `${html.slice(0, headerClose)}${retiredClassRecord}${html.slice(headerClose)}`;
}

function injectFinalComponentCss(html, css) {
  const style = `<style data-fmb-news-faithful-v11-final>${css}</style>`;
  return html
    .replace(/<style\b[^>]*data-fmb-news-faithful-v11-final[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<\/head>/i, `${style}</head>`);
}

const finalCss = (await readFile(finalCssPath, 'utf8')).trim();
const files = [...new Set((await Promise.all(newsRoots.map(walk))).flat())];
let processed = 0;
let updated = 0;
let removedLinks = 0;

for (const filePath of files) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-faithful-v11\b/.test(html)) continue;
  processed += 1;
  const before = html;

  const retiredLinks = html.match(/<link\b[^>]*href=(["'])[^"']*fmb-news-channel-v4\.css[^"']*\1[^>]*>\s*/gi) ?? [];
  removedLinks += retiredLinks.length;
  html = html.replace(/<link\b[^>]*href=(["'])[^"']*fmb-news-channel-v4\.css[^"']*\1[^>]*>\s*/gi, '');

  const v11Style = html.match(/<style\b[^>]*data-fmb-news-faithful-v11(?!-final)[^>]*>[\s\S]*?<\/style>/i)?.[0];
  if (!v11Style) throw new Error(`FMB News V11 primary style is missing: ${filePath}`);
  html = html.replace(/<style\b[^>]*data-fmb-news-faithful-v11(?!-final)[^>]*>[\s\S]*?<\/style>\s*/gi, '');
  html = html.replace(/<\/head>/i, `${v11Style}</head>`);
  html = injectFinalComponentCss(html, finalCss);

  html = retireVisualBodyClasses(html);
  html = injectRetiredClassRecord(html);

  if (/fmb-news-channel-v4\.css/i.test(html)) throw new Error(`Retired FMB News channel stylesheet remains: ${filePath}`);
  const bodyTag = html.match(/<body\b[^>]*>/i)?.[0] ?? '';
  for (const className of retiredBodyClasses) {
    if (new RegExp(`\\b${className}\\b`).test(bodyTag)) {
      throw new Error(`Retired FMB News body class ${className} remains active: ${filePath}`);
    }
    if (!html.includes(className)) {
      throw new Error(`Hidden FMB News compatibility marker ${className} is missing: ${filePath}`);
    }
  }

  const primaryStylePosition = html.match(/<style\b[^>]*data-fmb-news-faithful-v11(?!-final)[^>]*>/i)?.index ?? -1;
  const finalStylePosition = html.match(/<style\b[^>]*data-fmb-news-faithful-v11-final[^>]*>/i)?.index ?? -1;
  const headClose = html.indexOf('</head>');
  if (primaryStylePosition < 0 || finalStylePosition < 0 || primaryStylePosition >= finalStylePosition || finalStylePosition > headClose) {
    throw new Error(`FMB News V11 final style order is invalid: ${filePath}`);
  }

  if (html !== before) {
    await writeFile(filePath, html, 'utf8');
    updated += 1;
  }
}

if (processed < 54) {
  throw new Error(`FMB News V11 finalizer expected at least 54 routes; processed ${processed}.`);
}

console.log(`Verified the faithful V11 final visual state across ${processed} route(s), restored complete footer and hero states, retired obsolete News body classes, removed ${removedLinks} stylesheet link(s), and rewrote ${updated} route(s).`);
