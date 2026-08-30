import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const roots = [path.join(distRoot, 'news'), path.join(distRoot, 'fmbnews')];
const cssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-editorial-v9-fidelity.css');
const landingFiles = new Set([
  path.join(distRoot, 'news', 'index.html'),
  path.join(distRoot, 'fmbnews', 'index.html'),
]);

const categories = [
  ['money', 'Money'],
  ['tech', 'Tech'],
  ['lifestyle', 'Lifestyle'],
  ['politics', 'Politics'],
  ['culture', 'Culture'],
  ['environment', 'Environment'],
  ['health', 'Health'],
];

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

function categoryNavigation() {
  const links = [
    '<a href="/fmbnews/#top-story">Top Stories</a>',
    ...categories.map(([slug, label]) => `<a href="/fmbnews/?category=${slug}#latest-reports" data-news-category-link="${slug}">${label}</a>`),
  ].join('');

  return `<nav class="nc-topic-rail fn9-category-nav" id="fn9CategoryNav" aria-label="News categories"><div class="fn9-shell">${links}</div></nav>`;
}

function stripNestedCaptionLinks(html) {
  return html.replace(/(<figcaption\b[^>]*>)([\s\S]*?)(<\/figcaption>)/gi, (match, open, inner, close) => {
    const clean = inner.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1');
    return `${open}${clean}${close}`;
  });
}

function containsCaptionLink(html) {
  const captions = [...html.matchAll(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/gi)];
  return captions.some((match) => /<a\b/i.test(match[1]));
}

function placeLandingCategoryNavigation(html) {
  const nav = categoryNavigation();
  let next = html.replace(/<nav\b[^>]*class=(['"])[^'"]*\bfn9-category-nav\b[^'"]*\1[^>]*>[\s\S]*?<\/nav>\s*/gi, '');

  const searchPanel = /<section\b[^>]*data-fn9-search-panel[^>]*>[\s\S]*?<\/section>/i;
  if (searchPanel.test(next)) {
    return next.replace(searchPanel, (panel) => `${panel}${nav}`);
  }

  return next.replace(/<\/header>/i, `</header>${nav}`);
}

function injectFidelityStyle(html, css) {
  const style = `<style data-fmb-news-editorial-v9-fidelity>${css}</style>`;
  return html
    .replace(/<style\b[^>]*data-fmb-news-editorial-v9-fidelity[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<\/head>/i, `${style}</head>`);
}

const css = (await readFile(cssPath, 'utf8')).trim();
const files = [...new Set((await Promise.all(roots.map(walkHtml))).flat())];
let updated = 0;
let landingCount = 0;

for (const filePath of files) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-editorial-v9\b/.test(html)) continue;
  const original = html;

  if (landingFiles.has(filePath)) {
    html = stripNestedCaptionLinks(html);
    html = placeLandingCategoryNavigation(html);
    landingCount += 1;

    const reportCards = [...html.matchAll(/<article\b[^>]*class=(['"])[^'"]*\bfn9-report-card\b[^'"]*\1[^>]*>[\s\S]*?<\/article>/gi)];
    if (reportCards.length < 6 || reportCards.slice(0, 6).some((match) => !/<h3\b/i.test(match[0]))) {
      throw new Error(`FMB News V9 fidelity found an incomplete report grid on ${filePath}`);
    }

    if (!/<nav\b[^>]*class=(['"])[^'"]*\bfn9-category-nav\b[^'"]*\1/i.test(html)) {
      throw new Error(`FMB News V9 category navigation is missing on ${filePath}`);
    }

    if (containsCaptionLink(html)) {
      throw new Error(`FMB News V9 landing page still contains a link inside a card caption on ${filePath}`);
    }
  }

  html = injectFidelityStyle(html, css);

  if (!html.includes('data-fmb-news-editorial-v9-fidelity')) {
    throw new Error(`FMB News V9 fidelity style was not installed on ${filePath}`);
  }

  if (html !== original) {
    await writeFile(filePath, html, 'utf8');
    updated += 1;
  }
}

if (landingCount !== 2 || !updated) {
  throw new Error(`FMB News V9 fidelity expected two landing pages and generated updates; found ${landingCount} landing page(s) and ${updated} update(s).`);
}

console.log(`Applied approved FMB News V9 fidelity corrections to ${updated} route(s), restored category navigation on ${landingCount} landing page(s), and normalized nested card links.`);
