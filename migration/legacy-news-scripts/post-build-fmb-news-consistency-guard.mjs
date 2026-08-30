import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const canonicalOrigin = 'https://www.francinemariebautista.com';
const fallbackPath = '/assets/images/news/fmb-news-editorial-fallback.svg';
const fallbackAbsolute = canonicalOrigin + fallbackPath;

async function walk(directory, predicate) {
  const files = [];
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return files;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target, predicate));
    else if (entry.isFile() && predicate(target)) files.push(target);
  }
  return files;
}

function routeFor(file) {
  return '/' + path.relative(dist, path.dirname(file)).split(path.sep).join('/') + '/';
}

function isBriefRoute(route) {
  return /^\/news\/fmb-brief(?:\/|-)/i.test(route);
}

function remoteOrProxyImage(value = '') {
  const text = String(value).trim();
  if (!text) return false;
  if (text.startsWith('/api/news-image?url=')) return true;
  if (!/^https?:\/\//i.test(text)) return false;
  return !text.startsWith(canonicalOrigin + '/');
}

function ensureImageFallback(tag) {
  const srcMatch = tag.match(/\bsrc=(["'])(.*?)\1/i);
  if (!srcMatch) return tag;
  let src = srcMatch[2];
  let output = tag;

  if (remoteOrProxyImage(src)) {
    output = output.replace(srcMatch[0], `src="${fallbackPath}"`);
    src = fallbackPath;
  }

  output = output.replace(/\s+srcset=(["'])(.*?)\1/gi, (full, quote, value) => {
    return remoteOrProxyImage(value) || /https?:\/\//i.test(value) ? '' : full;
  });

  if (src !== fallbackPath) {
    const handler = `if(!this.dataset.fmbFallback){this.dataset.fmbFallback='1';this.removeAttribute('srcset');this.src='${fallbackPath}';}`;
    if (/\sonerror=(["']).*?\1/i.test(output)) {
      output = output.replace(/\sonerror=(["']).*?\1/i, ` onerror="${handler}"`);
    } else {
      output = output.replace(/\s*\/?>(?=\s*$)/, (ending) => ` onerror="${handler}"${ending}`);
    }
  }
  return output;
}

function normalizeSocialImageMeta(tag) {
  if (!/\b(?:property|name)=(["'])(?:og:image(?::url)?|twitter:image)\1/i.test(tag)) return tag;
  const content = tag.match(/\bcontent=(["'])(.*?)\1/i);
  if (!content || !remoteOrProxyImage(content[2])) return tag;
  return tag.replace(content[0], `content="${fallbackAbsolute}"`);
}

const canonicalHeader = `<header class="fmb-consistent-header"><div class="fmb-consistent-header-inner"><a class="fmb-consistent-brand" href="/news/">FMB News<small>Filipino Media Bulletin</small></a><nav class="fmb-consistent-nav" aria-label="FMB News"><a href="/news/">Latest</a><a href="/news/fmb-brief/">FMB Brief</a><a href="/news/archive/">Archive</a><a href="/news/about/">About</a><a href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit a story</a></nav></div></header>`;
const canonicalFooter = `<footer class="fmb-consistent-footer"><div class="fmb-consistent-footer-inner"><strong>FMB News</strong><span>Filipino Media Bulletin</span><p>The news that matters. Made clear for Filipinos.</p><nav><a href="/news/">Latest</a><a href="/news/fmb-brief/">FMB Brief</a><a href="/news/archive/">Archive</a><a href="/news/about/">About</a></nav></div></footer>`;

const consistencyStyles = `<style id="fmb-news-consistency-guard-style">
.fmb-consistent-header{position:sticky;top:0;z-index:130;background:rgba(255,253,251,.985);border-bottom:1px solid #d9d4da;box-shadow:0 8px 28px rgba(28,8,40,.045)}.fmb-consistent-header-inner{width:min(1380px,calc(100% - 48px));margin:auto;display:grid;justify-items:center}.fmb-consistent-brand{display:block;padding-top:15px;color:#281136;text-align:center;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:clamp(3rem,6vw,5.5rem);font-weight:700;line-height:.84;letter-spacing:-.065em}.fmb-consistent-brand small{display:block;margin:9px 0 0;color:#6d6670;font:800 .56rem/1 Arial,Helvetica,sans-serif;letter-spacing:.22em;text-transform:uppercase}.fmb-consistent-nav{width:100%;display:flex;justify-content:center;gap:clamp(18px,3vw,38px);margin-top:15px;border-top:1px solid #d9d4da;overflow-x:auto;scrollbar-width:none}.fmb-consistent-nav::-webkit-scrollbar{display:none}.fmb-consistent-nav a{padding:11px 0 12px;border-bottom:3px solid transparent;color:#18151a;white-space:nowrap;text-decoration:none;font:800 .62rem/1 Arial,Helvetica,sans-serif;letter-spacing:.095em;text-transform:uppercase}.fmb-consistent-nav a:hover{border-color:#35125e;color:#35125e}.fmb-consistent-footer{margin-top:64px;padding:52px 0;background:#1b0828;color:#fff}.fmb-consistent-footer-inner{width:min(1380px,calc(100% - 48px));margin:auto}.fmb-consistent-footer strong{display:block;font:700 2.35rem/1 Georgia,'Times New Roman',serif}.fmb-consistent-footer span{display:block;margin-top:7px;color:#d6c7dc;font:800 .62rem/1 Arial,Helvetica,sans-serif;letter-spacing:.15em;text-transform:uppercase}.fmb-consistent-footer p{margin:16px 0 20px;color:#d3c4d9;font:1rem/1.6 Georgia,'Times New Roman',serif}.fmb-consistent-footer nav{display:flex;flex-wrap:wrap;gap:18px}.fmb-consistent-footer nav a{color:#fff;text-decoration:none;font:800 .66rem/1 Arial,Helvetica,sans-serif;text-transform:uppercase}.fnc-livebar,.fnc-nav-backdrop{display:none!important}.fmb-news-article .nc-story-masthead,.news-story-route .nc-story-masthead{border-top:0!important}.fmb-news-article img,.news-story-route img{max-width:100%;height:auto}.fmb-news-article figure,.news-story-route figure{overflow:hidden}@media(max-width:700px){.fmb-consistent-header-inner{width:100%;padding:0 14px}.fmb-consistent-brand{font-size:2.65rem;padding-top:12px}.fmb-consistent-brand small{font-size:.48rem;letter-spacing:.18em}.fmb-consistent-nav{justify-content:flex-start;gap:20px}.fmb-consistent-nav a{font-size:.56rem;padding:10px 0 11px}.fmb-consistent-footer-inner{width:min(100% - 28px,1380px)}}
</style>`;

function patchPage(html, route) {
  let output = html
    .replaceAll('/fmbnews/', '/news/')
    .replace(/\|\s*FMB News\s*\|\s*FMB News/gi, '| FMB News')
    .replace(/FMB News \| FMB News/gi, 'FMB News');

  output = output.replace(/<img\b[^>]*>/gi, ensureImageFallback);
  output = output.replace(/<source\b[^>]*>/gi, (tag) => {
    for (const match of tag.matchAll(/\b(?:src|srcset)=(["'])(.*?)\1/gi)) {
      if (remoteOrProxyImage(match[2]) || /https?:\/\//i.test(match[2])) return '';
    }
    return tag;
  });
  output = output.replace(/<meta\b[^>]*>/gi, normalizeSocialImageMeta);

  if (!isBriefRoute(route) && /<header\b[^>]*class=["'][^"']*fnc-header[^"']*["']/i.test(output)) {
    output = output.replace(/<header\b[^>]*class=["'][^"']*fnc-header[^"']*["'][^>]*>[\s\S]*?<\/header>/i, canonicalHeader);
    output = output.replace(/<footer\b[^>]*class=["'][^"']*fnc-footer[^"']*["'][^>]*>[\s\S]*?<\/footer>/i, canonicalFooter);
    if (!output.includes('id="fmb-news-consistency-guard-style"')) {
      output = output.replace('</head>', `${consistencyStyles}</head>`);
    }
  }

  return output;
}

await access(path.join(dist, fallbackPath.replace(/^\//, '')));

const htmlFiles = await walk(newsRoot, (file) => file.endsWith('.html'));
let changed = 0;
let canonicalized = 0;
for (const file of htmlFiles) {
  const route = routeFor(file);
  const before = await readFile(file, 'utf8');
  const after = patchPage(before, route);
  if (after !== before) {
    await writeFile(file, after, 'utf8');
    changed += 1;
  }
  if (!isBriefRoute(route) && after.includes('fmb-consistent-header')) canonicalized += 1;
}

const aliasFile = path.join(dist, 'fmbnews', 'index.html');
try {
  const canonical = await readFile(path.join(newsRoot, 'index.html'), 'utf8');
  await writeFile(aliasFile, canonical, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const sitemapFile = path.join(dist, 'sitemap.xml');
try {
  let sitemap = await readFile(sitemapFile, 'utf8');
  sitemap = sitemap
    .replace(/<url>\s*<loc>https:\/\/www\.francinemariebautista\.com\/news\/morning-special\/[\s\S]*?<\/url>/gi, '')
    .replace(/<image:loc>https?:\/\/(?!www\.francinemariebautista\.com\/)[^<]+<\/image:loc>/gi, `<image:loc>${fallbackAbsolute}</image:loc>`);
  if (!sitemap.includes('<loc>https://www.francinemariebautista.com/news/fmb-brief/</loc>')) {
    sitemap = sitemap.replace('</urlset>', `  <url><loc>https://www.francinemariebautista.com/news/fmb-brief/</loc><changefreq>daily</changefreq><priority>0.8</priority></url>\n</urlset>`);
  }
  await writeFile(sitemapFile, sitemap, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const violations = [];
for (const file of htmlFiles) {
  const route = routeFor(file);
  const html = await readFile(file, 'utf8');
  if (html.includes('/fmbnews/')) violations.push(`${route} still links to /fmbnews/`);
  if (/\|\s*FMB News\s*\|\s*FMB News/i.test(html)) violations.push(`${route} still has duplicate FMB News title text`);
  for (const tag of html.matchAll(/<img\b[^>]*>/gi)) {
    const src = tag[0].match(/\bsrc=(["'])(.*?)\1/i)?.[2] || '';
    if (remoteOrProxyImage(src)) violations.push(`${route} still delivers a remote/proxy image: ${src}`);
  }
  if (!isBriefRoute(route) && /<header\b[^>]*class=["'][^"']*fnc-header[^"']*["']/i.test(html)) {
    violations.push(`${route} still has the legacy FMB News header`);
  }
}

if (violations.length) {
  throw new Error('FMB News final consistency guard failed:\n' + violations.slice(0, 40).join('\n'));
}

console.log(`FMB News final consistency guard passed: ${changed} page(s) repaired, ${canonicalized} standard News page(s) on the canonical masthead/footer, and broken-image fallbacks enforced.`);
