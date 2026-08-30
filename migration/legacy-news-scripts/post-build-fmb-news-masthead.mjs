import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(repositoryRoot, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const cssRoot = path.join(repositoryRoot, 'dist', 'assets', 'css');
const sourceCssRoot = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css');

const [landingCss, polishCss, mastheadCss, approvalCss, professionalTypeCss, channelRedesignCss, channelFixesCss, articleContrastCss, approvedRedWhiteCss, approvedFinalPolishCss] = await Promise.all([
  readFile(path.join(cssRoot, 'news-center-v2.css'), 'utf8'),
  readFile(path.join(cssRoot, 'fmb-news-polish-v3.css'), 'utf8'),
  readFile(path.join(sourceCssRoot, 'fmb-news-masthead-v3.css'), 'utf8'),
  readFile(path.join(sourceCssRoot, 'fmb-news-visual-approval.css'), 'utf8'),
  readFile(path.join(sourceCssRoot, 'fmb-news-professional-type.css'), 'utf8'),
  readFile(path.join(sourceCssRoot, 'fmb-news-channel-v4.css'), 'utf8'),
  readFile(path.join(sourceCssRoot, 'fmb-news-channel-v4-fixes.css'), 'utf8'),
  readFile(path.join(sourceCssRoot, 'fmb-news-channel-v4-article-contrast.css'), 'utf8'),
  readFile(path.join(sourceCssRoot, 'fmb-news-approved-red-white.css'), 'utf8'),
  readFile(path.join(sourceCssRoot, 'fmb-news-approved-final-polish.css'), 'utf8'),
]);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

let count = 0;
for (const filePath of await walk(newsRoot)) {
  let html = await readFile(filePath, 'utf8');
  html = html
    .replace(/<link\b[^>]*href=["'][^"']*(?:news-center-v2|fmb-news-polish-v3|fmb-news-masthead-v3|fmb-news-visual-approval|fmb-news-professional-type|fmb-news-channel-v4|fmb-news-channel-v4-fixes|fmb-news-channel-v4-article-contrast|fmb-news-approved-red-white|fmb-news-approved-final-polish)\.css[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<style\b[^>]*data-fmb-news-final-styles[^>]*>[\s\S]*?<\/style>\s*/gi, '');

  const css = filePath === landingPath
    ? `${landingCss}\n${polishCss}\n${mastheadCss}\n${approvalCss}\n${professionalTypeCss}\n${channelRedesignCss}\n${channelFixesCss}\n${articleContrastCss}\n${approvedRedWhiteCss}\n${approvedFinalPolishCss}`
    : `${polishCss}\n${mastheadCss}\n${professionalTypeCss}\n${channelRedesignCss}\n${channelFixesCss}\n${articleContrastCss}\n${approvedRedWhiteCss}\n${approvedFinalPolishCss}`;
  const finalStyles = `<style data-fmb-news-final-styles>\n${css}\n</style>`;
  const safeguard = /(<link\b[^>]*href=["'][^"']*fmb-sitewide-visual-fixes\.css[^"']*["'][^>]*>)/i;
  if (safeguard.test(html)) {
    html = html.replace(safeguard, `$1\n${finalStyles}`);
  } else {
    if (!html.includes('</head>')) throw new Error(`News Center styles: missing closing head in ${filePath}`);
    html = html.replace('</head>', `${finalStyles}\n</head>`);
  }
  await writeFile(filePath, html, 'utf8');
  count += 1;
}

console.log(`Compiled the final approved red-white FMB News Center channel system and purple-surface cleanup on ${count} News pages.`);
