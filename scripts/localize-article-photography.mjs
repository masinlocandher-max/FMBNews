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

// --- canonical remote URL ----------------------------------------------------
//
// This runs whether or not a download succeeds, and it is the half of this pass
// that does not need the network. Two measured defects in the built site, both
// invisible to every existing gate:
//
//   1. 29 of the 56 distinct remote references carry NO width limit. They are
//      camera originals -- Wikimedia's run to 4608x3456 and tens of megabytes --
//      and one of them is the lead figure on 69 pages. A phone reader on mobile
//      data pays for all of it. This is not the deploy-size problem that killed
//      deploy #699; the bytes never touch our bucket. It is worse, because it is
//      billed to the reader instead and no build gate can see it.
//   2. Three photographs are each referenced under TWO URL shapes, so the same
//      file is fetched and cached twice: Aerial_view_kyiv with and without a
//      width, Quiapo_..._Habagat-Carina with its comma spelt "," once and "%2C"
//      the other, and Wikimedia_Servers-0051_19 through both the redirect
//      endpoint and a direct upload URL.
//
// The width-limited Special:Redirect form is what fixes both, and it is chosen
// because it is already proven in this corpus rather than because it looks
// right: 27 of the URLs the newsroom publishes today are exactly that shape.
// MediaWiki's SpecialRedirect passes the width to File::createThumb(), which
// does not upscale -- ask for 1600 on a 900px original and you get the 900px
// original, not a 404. That forgiveness is the whole reason to prefer it over a
// hand-built upload.wikimedia thumbnail path, which has to be right about the
// hash prefix AND about what the server does when the requested width exceeds
// the source.
//
// DELIBERATELY NOT DONE: converting Special:Redirect to a direct
// upload.wikimedia.org/thumb/ path. The prefix is computable from an MD5 of the
// filename, which would save a redirect hop on 49 references. It is left alone
// because it cannot be tested from here, and an MD5 or an upscale assumption
// that is wrong breaks 230 references at once with no way to notice before
// production. A redirect hop is a cost; a broken photograph is a defect.
const WEB_WIDTH = 1600;

const REDIRECT_URL = /^(https:\/\/commons\.wikimedia\.org\/wiki\/Special:Redirect\/file\/)([^?#]+)(?:\?([^#]*))?$/i;
const UPLOAD_ORIGINAL = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)$/i;
const UPLOAD_THUMB = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)\/)(\d+)(px-[^/?#]+)$/i;

// Percent-decoding is only ever used to decide whether two URLs name the same
// file. It never produces a URL we ship, so a filename that will not decode is
// simply its own identity rather than an error.
const decode = (name) => { try { return decodeURIComponent(name); } catch { return name; } };

// The file a URL points at, for grouping. null means "not a Wikimedia file
// reference", which is never grouped or rewritten.
function wikimediaFile(url) {
  const redirect = url.match(REDIRECT_URL);
  if (redirect) return decode(redirect[2]);
  const original = url.match(UPLOAD_ORIGINAL);
  if (original) return decode(original[1]);
  const thumb = url.match(UPLOAD_THUMB);
  if (thumb) return decode(thumb[2]);
  return null;
}

// Bound a single URL to WEB_WIDTH without changing which server serves it, and
// without ever raising a width the newsroom set deliberately: Bank of Japan is
// published at 1486 and Putin at 1200, both under the ceiling, and both stay.
function boundedUrl(url) {
  const redirect = url.match(REDIRECT_URL);
  if (redirect) {
    const [, endpoint, name, query = ''] = redirect;
    const params = new URLSearchParams(query);
    const declared = Number(params.get('width'));
    params.set('width', String(Number.isFinite(declared) && declared > 0 ? Math.min(declared, WEB_WIDTH) : WEB_WIDTH));
    return `${endpoint}${name}?${params.toString()}`;
  }
  // A camera original. SVGs are excluded: they are resolution-independent, so a
  // width limit buys nothing and rasterizing one would be a downgrade.
  const original = url.match(UPLOAD_ORIGINAL);
  if (original && !/\.svg$/i.test(original[1])) {
    return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${original[1]}?width=${WEB_WIDTH}`;
  }
  // Already a width-limited thumbnail on the direct host: the best shape there
  // is. Only touched if the baked-in width is above the ceiling.
  const thumb = url.match(UPLOAD_THUMB);
  if (thumb && Number(thumb[3]) > WEB_WIDTH) return `${thumb[1]}${WEB_WIDTH}${thumb[4]}`;
  return url;
}

// A direct thumbnail beats the redirect endpoint when both are available for
// the same file: same bytes, one fewer round trip, and the URL is one the
// corpus already publishes rather than one this pass invented.
const isDirectThumb = (url) => UPLOAD_THUMB.test(url);

// Collapse every URL naming the same file onto one string, so it is fetched and
// cached once. Sorted rather than left in page-walk order: this build is
// byte-reproducible and a Map iteration order that depends on readdir would
// quietly end that.
function canonicalMap(allUrls) {
  const groups = new Map();
  for (const url of [...allUrls.keys()].sort()) {
    const file = wikimediaFile(url);
    if (!file) continue;
    if (!groups.has(file)) groups.set(file, []);
    groups.get(file).push(url);
  }
  const canonical = new Map();
  for (const [, members] of groups) {
    const candidates = [...new Set(members.map(boundedUrl))].sort((a, b) => {
      if (isDirectThumb(a) !== isDirectThumb(b)) return isDirectThumb(a) ? -1 : 1;
      const refs = (u) => members.filter((m) => boundedUrl(m) === u).reduce((n, m) => n + allUrls.get(m).size, 0);
      return refs(b) - refs(a) || a.localeCompare(b);
    });
    const winner = candidates[0];
    for (const url of members) if (url !== winner) canonical.set(url, winner);
  }
  return canonical;
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

  // Bound and dedupe first. This needs no network, so it is the part that still
  // improves the site on a build machine that cannot reach Wikimedia at all --
  // which is the situation this pass has to survive, not an edge case.
  const canonical = canonicalMap(urls);
  const target = (url) => canonical.get(url) || url;
  const wanted = new Map();       // canonical url -> Set(page)
  for (const [url, onPages] of urls) {
    const key = target(url);
    if (!wanted.has(key)) wanted.set(key, new Set());
    for (const page of onPages) wanted.get(key).add(page);
  }

  const local = new Map();        // canonical url -> "/assets/images/article-photos/<file>"
  let vendored = 0; let fetched = 0; let requests = 0;
  const failures = [];
  const shapeFallbacks = [];

  for (const url of wanted.keys()) {
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
      // The canonical, width-limited URL first. If that specific rendition is
      // unavailable, every other URL the corpus already cites for the same file
      // is tried before giving up -- those are known to work, since the site is
      // serving them today. Only then is this photograph a failure.
      const alternates = [...new Set([...urls.keys()].filter((u) => u !== url && target(u) === url))];
      let got;
      try { got = await download(url); }
      catch (err) {
        if (!alternates.length) throw err;
        let last = err;
        for (const alternate of alternates) {
          try { got = await download(alternate); last = null; break; }
          catch (alternateError) { last = alternateError; }
        }
        if (last) throw last;
        shapeFallbacks.push(url);
      }
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
  //
  // Every reference gets its best available destination: the local copy when
  // there is one, and the bounded canonical URL when there is not. The second
  // case is the one that matters on a build machine with no network, and it is
  // why this loop walks `urls` rather than `local`.
  //
  // Anchored on the closing quote, and that is load-bearing rather than tidy.
  // The bare Aerial_view_kyiv URL is a strict PREFIX of its own ?width=1600
  // form, so an unanchored replace would find it inside the very URL it is
  // rewriting to and produce "...jpg?width=1600?width=1600". All 433 remote
  // references in the built site are quote-terminated -- none sits in a srcset
  // with a trailing descriptor -- so the quote is a safe anchor.
  const destination = new Map();
  for (const url of urls.keys()) {
    const localPath = local.get(target(url));
    const to = localPath || target(url);
    if (to !== url || localPath) destination.set(url, { to, isLocal: Boolean(localPath) });
  }

  let rewritten = 0; let references = 0; let bounded = 0;
  for (const page of pages) {
    let html = await readFile(page, 'utf8');
    const before = html;
    for (const [url, { to, isLocal }] of destination) {
      if (!html.includes(`${url}"`)) continue;
      references += html.split(`${url}"`).length - 1;
      // Absolute for metadata (social cards resolve nothing relative),
      // site-relative everywhere else so the later asset-scoping pass owns it.
      // A canonical remote URL is already absolute and needs neither.
      if (isLocal) html = html.split(`content="${url}"`).join(`content="${SITE}/news${to}"`);
      html = html.split(`${url}"`).join(`${to}"`);
    }
    if (html !== before) { await writeFile(page, html, 'utf8'); rewritten += 1; }
  }
  for (const url of urls.keys()) if (!local.get(target(url)) && target(url) !== url) bounded += 1;

  console.log(
    `Article photography localized: ${local.size}/${wanted.size} distinct photographs now served from FMB News `
    + `(${vendored} vendored in-repo, ${fetched} fetched); ${references} reference(s) rewritten across ${rewritten} page(s).`
  );
  if (urls.size !== wanted.size || bounded) {
    console.log(
      `  Remote references canonicalized without the network: ${urls.size} distinct URL(s) collapsed to ${wanted.size} `
      + `(${urls.size - wanted.size} duplicate spelling(s) of a photograph already cited), `
      + `${bounded} still-remote reference(s) bounded to ${WEB_WIDTH}px instead of serving a camera original.`
    );
  }
  if (shapeFallbacks.length) {
    console.warn(`  ${shapeFallbacks.length} photograph(s) had no ${WEB_WIDTH}px rendition and were fetched at their published URL:`);
    for (const line of shapeFallbacks.slice(0, 5)) console.warn(`    ${line.slice(0, 120)}`);
  }
  if (failures.length) {
    console.warn(`  ${failures.length} photograph(s) could not be localized and keep their third-party URL:`);
    for (const line of failures.slice(0, 8)) console.warn(`    ${line}`);
    if (failures.length > 8) console.warn(`    ... and ${failures.length - 8} more`);
    console.warn('  Run `npm run photos:vendor-articles` on a networked machine and commit public/assets/images/article-photos/.');
  }
}
