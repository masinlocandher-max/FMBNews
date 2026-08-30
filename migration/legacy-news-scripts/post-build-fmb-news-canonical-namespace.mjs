import { access, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const legacyRoot = path.join(dist, 'fmbnews');
const canonicalOrigin = 'https://www.francinemariebautista.com';
const protectedPrefixes = ['app/', '_sites/'];
const canonicalAboutSource = path.join(root, 'apps', 'withlovefmb', 'news', 'about', 'index.html');
const canonicalAboutOutput = path.join(newsRoot, 'about', 'index.html');

async function walk(directory) {
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
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (entry.isFile()) files.push(target);
  }
  return files;
}

async function publishedBriefRoutes() {
  const routes = [];
  for (const entry of await readdir(newsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^fmb-brief-[a-z]+-\d{1,2}-\d{4}$/i.test(entry.name)) continue;
    const indexFile = path.join(newsRoot, entry.name, 'index.html');
    try {
      await access(indexFile);
      routes.push(`/news/${entry.name}/`);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return routes.sort();
}

function canonicalizeNewsNamespace(value) {
  return String(value)
    .replaceAll(`${canonicalOrigin}/fmbnews/`, `${canonicalOrigin}/news/`)
    .replaceAll('/fmbnews/', '/news/')
    .replace(/\/fmbnews(?=["'?#<\s])/gi, '/news');
}

function containsLegacyPublicPath(value) {
  return /\/fmbnews(?:\/|(?=["'?#<\s]))/i.test(String(value));
}

function isSelfRedirectingAbout(html) {
  return /http-equiv=["']refresh["'][^>]*content=["']0;\s*url=\/news\/about\/?["']/i.test(html)
    || /FMB News has moved to\s*<a[^>]+href=["']\/news\/about\//i.test(html);
}

await access(path.join(newsRoot, 'index.html'));
await access(canonicalAboutOutput);
await access(path.join(newsRoot, 'fmb-brief', 'index.html'));

let aboutRestored = false;
const generatedAbout = await readFile(canonicalAboutOutput, 'utf8');
if (isSelfRedirectingAbout(generatedAbout)) {
  const sourceAbout = await readFile(canonicalAboutSource, 'utf8');
  await writeFile(canonicalAboutOutput, sourceAbout, 'utf8');
  aboutRestored = true;
}

let rewritten = 0;
for (const file of await walk(dist)) {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  if (protectedPrefixes.some((prefix) => relative.startsWith(prefix))) continue;
  if (!/\.(?:html|xml|json|js|css|txt|webmanifest)$/i.test(relative)) continue;

  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    continue;
  }
  const next = canonicalizeNewsNamespace(text);
  if (next !== text) {
    await writeFile(file, next, 'utf8');
    rewritten += 1;
  }
}

const briefRoutes = await publishedBriefRoutes();
const sitemapFile = path.join(dist, 'sitemap.xml');
try {
  let sitemap = await readFile(sitemapFile, 'utf8');
  sitemap = sitemap.replace(
    /<url>\s*<loc>https:\/\/www\.francinemariebautista\.com\/fmbnews(?:\/[^<]*)?<\/loc>[\s\S]*?<\/url>\s*/gi,
    '',
  );
  sitemap = canonicalizeNewsNamespace(sitemap);

  for (const route of ['/news/fmb-brief/', ...briefRoutes]) {
    const canonical = `${canonicalOrigin}${route}`;
    if (sitemap.includes(`<loc>${canonical}</loc>`)) continue;
    sitemap = sitemap.replace(
      '</urlset>',
      `  <url><loc>${canonical}</loc><changefreq>${route === '/news/fmb-brief/' ? 'daily' : 'monthly'}</changefreq><priority>0.8</priority></url>\n</urlset>`,
    );
  }
  await writeFile(sitemapFile, sitemap, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

// `/news/` is the only deployable FMB News namespace. Vercel handles the
// historical `/fmbnews/*` namespace as permanent redirects, never as files.
await rm(legacyRoot, { recursive: true, force: true });

const violations = [];
for (const file of await walk(dist)) {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  if (protectedPrefixes.some((prefix) => relative.startsWith(prefix))) continue;
  if (!/\.(?:html|xml|json|js|css|txt|webmanifest)$/i.test(relative)) continue;
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    continue;
  }
  if (containsLegacyPublicPath(text)) violations.push(relative);
}

try {
  await access(legacyRoot);
  violations.push('fmbnews/ directory still exists in dist');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

try {
  const sitemap = await readFile(sitemapFile, 'utf8');
  for (const route of briefRoutes) {
    if (!sitemap.includes(`<loc>${canonicalOrigin}${route}</loc>`)) {
      violations.push(`sitemap.xml is missing published FMB Brief ${route}`);
    }
  }
  if (containsLegacyPublicPath(sitemap)) violations.push('sitemap.xml still contains /fmbnews');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
  violations.push('sitemap.xml is missing');
}

const finalAbout = await readFile(canonicalAboutOutput, 'utf8');
if (isSelfRedirectingAbout(finalAbout)) violations.push('/news/about/ still redirects to itself');
if (!/<link\b[^>]*rel=["']canonical["'][^>]*href=["']https:\/\/www\.francinemariebautista\.com\/news\/about\/["']/i.test(finalAbout)) {
  violations.push('/news/about/ is missing its canonical /news/about/ URL');
}

if (violations.length) {
  throw new Error(`FMB News canonical namespace guard failed:\n${violations.slice(0, 40).join('\n')}`);
}

console.log(`FMB News canonical namespace guard passed: /news/ is the sole public namespace, ${briefRoutes.length} published FMB Brief route(s) are indexed, ${rewritten} legacy-reference file(s) normalized, canonical About ${aboutRestored ? 'restored' : 'preserved'}, and dist/fmbnews removed.`);
