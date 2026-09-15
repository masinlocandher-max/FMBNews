// Serve article photographs from FMB News, not from someone else's server.
//
// 66 published pages carried <img src="https://commons.wikimedia.org/...">, and
// 220 of those references went through commons.wikimedia.org/wiki/Special:Redirect/file/,
// which is a MediaWiki redirect endpoint rather than an image URL. Three things
// are wrong with shipping that:
//
//   - It is not ours to depend on. Wikimedia asks people not to hotlink at
//     scale and is entitled to throttle or block it. The day it does, the
//     photograph disappears from every one of those pages at once.
//   - Special:Redirect/file/ costs an extra redirect per image before a single
//     byte of picture arrives.
//   - build.mjs already states the rule -- "production pages must serve the
//     publication's own files, never a third-party host" -- and localizes the
//     rights-cleared ledger for exactly this reason. These pages simply were
//     not covered by that pass, because their photographs live in the article
//     record rather than in the ledger.
//
// This closes the gap for every remaining remote image.
//
// DEDUPED BY CONTENT, NOT BY ARTICLE. One file photograph was referenced by 69
// different pages. Keying the local copy on a hash of the source URL means it
// is fetched once and stored once, instead of 69 times.
//
// FAIL-SOFT, DELIBERATELY. If a download fails the page keeps its original
// remote URL, which is exactly what it has today, and the build continues. An
// earlier pass in this repository made every deploy depend on Wikimedia being
// reachable and in a good mood, and two production deploys died on it. A
// hardening step must not become a new way for the newsroom to be unable to
// publish. Failures are reported loudly and counted by verify-images.mjs.
//
// VENDOR FIRST. A copy committed under public/assets/images/article-photos/ is
// used without any network call, so the dependency can be removed entirely by
// running `npm run photos:vendor-articles` once and committing the result.

import { access, mkdir, readFile, readdir, writeFile, stat, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const outDir = path.join(newsRoot, 'assets', 'images', 'article-photos');
const vendorDir = path.join(root, 'public', 'assets', 'images', 'article-photos');
const VENDOR_MODE = process.argv.includes('--vendor');

const EXT = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg', 'image/tiff': 'tiff',
};
const exists = async (f) => { try { await access(f); return true; } catch { return false; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cloudflare Workers refuses any single asset over 25 MiB, so an oversized
// download does not degrade the site -- it blocks the deploy outright. The
// first run of this pass fetched a 28.9 MiB Wikimedia original and did exactly
// that. 6 MiB is far above any sane web photograph and still leaves enormous
// headroom under the platform limit.
const MAX_BYTES = 6 * 1024 * 1024;

// Ask Wikimedia for a web-sized rendition instead of the camera original.
// Those originals run to 4608x3456 and tens of megabytes; serving one to a
// phone reader is indefensible even when it fits. Both of Wikimedia's public
// URL shapes support a width-limited form, and this uses the documented one for
// each. Anything else is left exactly as it is.
const WEB_WIDTH = 1600;
function webSizedUrl(url) {
  if (/commons\.wikimedia\.org\/wiki\/Special:Redirect\/file\//i.test(url)) {
    return url.includes('?') ? url : `${url}?width=${WEB_WIDTH}`;
  }
  const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+)\/([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+)$/i);
  if (m && !/\.svg$/i.test(m[4])) {
    return `${m[1]}/thumb/${m[2]}/${m[3]}/${m[4]}/${WEB_WIDTH}px-${m[4]}`;
  }
  return url;
}

// A stable, collision-resistant name derived from the source URL. Two articles
// citing the same photograph resolve to the same file.
const keyFor = (url) => createHash('sha256').update(url).digest('hex').slice(0, 16);

const extFromUrl = (url) => {
  const m = url.match(/\.([a-z0-9]{2,5})(?:$|[?#])/i);
  const e = m?.[1]?.toLowerCase();
  return e && Object.values(EXT).includes(e === 'jpeg' ? 'jpg' : e) ? (e === 'jpeg' ? 'jpg' : e) : '';
};

async function download(url) {
  let pause = 900;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'FMBNewsBuild/1.0 (Filipino Media Bulletin; +https://www.francinemariebautista.com/news/)',
        accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    });
    if (response.ok) {
      const type = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      return { bytes: Buffer.from(await response.arrayBuffer()), ext: EXT[type] || extFromUrl(url) || 'jpg' };
    }
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 4) throw new Error(`HTTP ${response.status}`);
    const retryAfter = Number(response.headers.get('retry-after'));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : pause);
    pause *= 2;
  }
  throw new Error('exhausted retries');
}

// --- collect every remote image referenced by a built page --------------------
const pages = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name === 'index.html') pages.push(full);
  }
}
await walk(newsRoot);

const SITE = 'https://www.francinemariebautista.com';
// Only <img src> and <source srcset> are collected. og:image and twitter:image
// are handled separately below, because a social card needs an ABSOLUTE URL --
// rewriting one to a site-relative path would silently break every share
// preview, which is a worse defect than the hotlinking this pass exists to fix.
const SRC = /\ssrc="(https:\/\/[^"]+)"/g;
const IMAGEY = /\.(?:jpe?g|png|webp|gif|avif|svg|tiff)(?:$|[?#])|Special:Redirect\/file\//i;
// Our own domain is already ours. Localizing it would be a no-op at best and,
// for the publisher logo in JSON-LD, actively wrong.
const isOurs = (url) => url.startsWith(SITE) || url.startsWith('https://francinemariebautista.com');

const urls = new Map();           // url -> Set(page)
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  for (const m of html.matchAll(SRC)) {
    const url = m[1];
    if (!IMAGEY.test(url) || isOurs(url)) continue;
    if (!urls.has(url)) urls.set(url, new Set());
    urls.get(url).add(page);
  }
}

if (!urls.size) {
  console.log('Article photography localization: no third-party image references found.');
} else {
  await mkdir(outDir, { recursive: true });
  if (VENDOR_MODE) await mkdir(vendorDir, { recursive: true });

  const local = new Map();        // url -> "/assets/images/article-photos/<file>"
  let vendored = 0; let fetched = 0; let requests = 0;
  const failures = [];

  for (const url of urls.keys()) {
    const key = keyFor(url);
    // A vendored copy wins outright -- no network call at all.
    let hit = '';
    if (await exists(vendorDir)) {
      for (const candidate of await readdir(vendorDir)) {
        if (candidate.startsWith(`${key}.`)) { hit = candidate; break; }
      }
    }
    if (hit) {
      await copyFile(path.join(vendorDir, hit), path.join(outDir, hit));
      local.set(url, `/assets/images/article-photos/${hit}`);
      vendored += 1;
      continue;
    }
    try {
      if (requests) await sleep(350);
      requests += 1;
      // Try the web-sized rendition first; fall back to the URL as given.
      const sized = webSizedUrl(url);
      let got;
      try { got = await download(sized); }
      catch (err) { if (sized === url) throw err; got = await download(url); }
      const { bytes, ext } = got;
      if (bytes.length < 1000) throw new Error(`suspiciously small (${bytes.length} bytes)`);
      if (bytes.length > MAX_BYTES) {
        throw new Error(`${(bytes.length / 1048576).toFixed(1)} MiB exceeds the ${MAX_BYTES / 1048576} MiB ceiling`);
      }
      const file = `${key}.${ext}`;
      await writeFile(path.join(outDir, file), bytes);
      if (VENDOR_MODE) await writeFile(path.join(vendorDir, file), bytes);
      local.set(url, `/assets/images/article-photos/${file}`);
      fetched += 1;
    } catch (error) {
      // Keep the remote URL. That is today's behaviour, so nothing regresses.
      failures.push(`${error.message}  ${url.slice(0, 110)}`);
    }
  }

  // --- rewrite the pages ------------------------------------------------------
  let rewritten = 0; let references = 0;
  for (const page of pages) {
    let html = await readFile(page, 'utf8');
    const before = html;
    for (const [url, localPath] of local) {
      if (!html.includes(url)) continue;
      const count = html.split(url).length - 1;
      // Absolute for metadata (social cards resolve nothing relative),
      // site-relative everywhere else so the later asset-scoping pass owns it.
      html = html.split(`content="${url}"`).join(`content="${SITE}/news${localPath}"`);
      html = html.split(url).join(localPath);
      references += count;
    }
    if (html !== before) { await writeFile(page, html, 'utf8'); rewritten += 1; }
  }

  console.log(
    `Article photography localized: ${local.size}/${urls.size} distinct photographs now served from FMB News `
    + `(${vendored} vendored in-repo, ${fetched} fetched); ${references} reference(s) rewritten across ${rewritten} page(s).`
  );
  if (failures.length) {
    console.warn(`  ${failures.length} photograph(s) could not be localized and keep their third-party URL:`);
    for (const line of failures.slice(0, 8)) console.warn(`    ${line}`);
    if (failures.length > 8) console.warn(`    ... and ${failures.length - 8} more`);
    console.warn('  Run `npm run photos:vendor-articles` on a networked machine and commit public/assets/images/article-photos/.');
  }
}
