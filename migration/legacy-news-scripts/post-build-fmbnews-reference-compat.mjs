import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const officialLogo = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';
const visibleOfficialLogo = /<(?:img|source)\b[^>]*(?:src|srcset)=["'][^"']*fmb-news-official-transparent\.webp/i;
const stylePattern = /<style\b[^>]*data-fmb-news-reference-v13[^>]*>([\s\S]*?)<\/style>/i;
const scriptPattern = /<script\b[^>]*data-fmb-news-reference-v13[^>]*>([\s\S]*?)<\/script>/i;
const scriptTag = '<script src="/assets/js/fmbnews-reference-v13.js" data-fmb-news-reference-v13 defer></script>';
const finalCssPath = path.join(dist, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
const jsPath = path.join(dist, 'assets', 'js', 'fmbnews-reference-v13.js');
const cssStart = '/* FMB_NEWS_REFERENCE_V13_START */';
const cssEnd = '/* FMB_NEWS_REFERENCE_V13_END */';

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

const files = [...new Set((await Promise.all(newsRoots.map(walk))).flat())];
let updated = 0;
let verified = 0;
let sharedCss = '';
let sharedJs = '';

for (const file of files) {
  let html = await readFile(file, 'utf8');
  if (!/\bnews-reference-v13\b/.test(html)) continue;
  const original = html;

  html = html
    .replace(/<img\b[^>]*data-fmb-news-footer-logo[^>]*>\s*/gi, '')
    .replace(/html body\.news-reference-v13 \.fn13-footer-logo\{[^}]*\}\n?/g, '')
    .replace(/html body\.news-reference-v13 \.fn11-footer-brand>\.fn11-signal-mark,html body\.news-reference-v13 \.fn11-footer-brand>div>\.fn11-wordmark\{[^}]*\}\n?/g, '');

  const styleMatch = html.match(stylePattern);
  const scriptMatch = html.match(scriptPattern);
  if (styleMatch) {
    const css = styleMatch[1].trim();
    if (sharedCss && sharedCss !== css) throw new Error(`FMB News reference CSS differs between generated routes: ${file}`);
    sharedCss ||= css;
    html = html.replace(stylePattern, '');
  }
  if (scriptMatch) {
    const js = scriptMatch[1].trim();
    if (sharedJs && sharedJs !== js) throw new Error(`FMB News reference JavaScript differs between generated routes: ${file}`);
    sharedJs ||= js;
    html = html.replace(scriptPattern, scriptTag);
  }

  if (stylePattern.test(html) || !html.includes(scriptTag)) {
    throw new Error(`FMB News reference shared assets were not connected cleanly: ${file}`);
  }

  const currentHeader = html.match(/<header\b[^>]*class=(['"])[^'"]*\bfn13-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
  if (currentHeader) {
    const headerToken = '<!-- FMB_NEWS_MASTHEAD_PLACEHOLDER -->';
    html = html.replace(currentHeader, headerToken)
      .replace(/<source\b[^>]*(?:src|srcset)=["'][^"']*fmb-news-official-transparent\.webp[^>]*>\s*/gi, '')
      .replace(/<img\b[^>]*src=["'][^"']*fmb-news-official-transparent\.webp[^>]*>/gi, '')
      .replace(headerToken, currentHeader);
  }

  const header = html.match(/<header\b[^>]*class=(['"])[^'"]*\bfn13-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
  if (!header.includes(officialLogo) || !visibleOfficialLogo.test(header)) {
    throw new Error(`FMB News official masthead logo missing after compatibility cleanup: ${file}`);
  }

  const outsideHeader = html.replace(header, '');
  if (visibleOfficialLogo.test(outsideHeader)) {
    throw new Error(`FMB News official logo visibly renders outside the masthead: ${file}`);
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    updated += 1;
  }
  verified += 1;
}

if (!verified) throw new Error('FMB News reference compatibility could not find generated News routes.');
if (!sharedCss || !sharedJs) throw new Error('FMB News reference compatibility could not extract the shared CSS and JavaScript.');

await mkdir(path.dirname(jsPath), { recursive: true });
const currentFinalCss = await readFile(finalCssPath, 'utf8');
const withoutOldReference = currentFinalCss.replace(
  new RegExp(`${cssStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${cssEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g'),
  '',
).trimEnd();

await Promise.all([
  writeFile(finalCssPath, `${withoutOldReference}\n${cssStart}\n${sharedCss}\n${cssEnd}\n`, 'utf8'),
  writeFile(jsPath, `${sharedJs}\n`, 'utf8'),
]);

console.log(`Kept the official FMB News logo in the approved masthead-only lockup across ${verified} generated page(s), preserved the final stylesheet order, and externalized the sharing/time logic from ${updated} page(s).`);
