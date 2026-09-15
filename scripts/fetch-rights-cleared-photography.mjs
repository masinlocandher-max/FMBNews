// Localize the rights-cleared photographs named in the newsroom's ledger.
//
// content/news/rights-cleared-image-overrides.json is the newsroom's record of
// photographs it has cleared for publication: each entry carries the file, the
// source page it came from, the creator-and-licence credit, an alt text and a
// caption. The ledger existed before this script and was complete. Nothing in
// the build read it, so all fourteen cleared photographs sat unused while the
// articles they belong to rendered a generic FMB editorial vector.
//
// Photographs are copied into the build rather than hot-linked, which is what
// the newsroom's own credits file already commits to: "All files below are
// locally hosted derivatives." Hot-linking a third-party host from production
// pages leaks readers to that host, breaks when the upstream file moves, and
// takes bandwidth the publication was never granted.
//
// This fails the build on a download error rather than quietly degrading. A
// silent fallback here would mean a story that the newsroom cleared a photo for
// ships a placeholder instead, with nobody told -- which is the exact failure
// this whole pipeline exists to end.

import { mkdir, writeFile, readFile, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ledgerPath = path.join(root, 'content', 'news', 'rights-cleared-image-overrides.json');
const outDir = path.join(root, 'dist', 'news', 'assets', 'images', 'rights-cleared');

// The accepted set must cover what the ledger actually holds, which is jpg, png,
// svg and gif. It originally held only the three raster types, and because the
// fetcher throws on an unknown type by design, the first cleared SVG it met took
// the whole deploy down -- run #679, "not a supported image (content-type
// image/svg+xml)". Three ledger entries are vector charts and one is a GIF.
//
// The fail-hard behaviour is still right: a story the newsroom cleared a visual
// for must never silently ship a placeholder. The bug was the narrow type list,
// and it reached CI because this had only ever run against a local stub that
// wrote .png for every entry regardless of the real URL.
//
// A cleared SVG is safe to serve here: it is stored locally and rendered through
// an <img>, where scripts inside an SVG do not execute.
const EXT = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/gif': 'gif',
  'image/avif': 'avif', 'image/tiff': 'tiff',
};
// A vector chart is legitimately a few kilobytes; a raster news photograph is
// not. A single floor would either wave through a truncated JPEG or reject a
// perfectly good SVG.
const MIN_BYTES = { svg: 1_000, gif: 4_000 };

const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
await mkdir(outDir, { recursive: true });

// Where a cleared file is VENDORED into the repository. A build should prefer
// this and never touch the network.
const vendorDir = path.join(root, 'public', 'assets', 'images', 'rights-cleared');
const VENDOR_MODE = process.argv.includes('--vendor');

const exists = async (f) => { try { await stat(f); return true; } catch { return false; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wikimedia rate-limits bursts. Run #680 died on HTTP 429 part-way through the
// ledger, which is the real lesson of this script: a newsroom's deploy must not
// be blockable by a third party's rate limiter. Retries make a transient 429 or
// 5xx survivable; VENDORING is what removes the dependency for good.
async function download(slug, url) {
  let wait = 900;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'FMBNewsBuild/1.0 (Filipino Media Bulletin; +https://www.francinemariebautista.com/news/)',
        accept: 'image/avif,image/webp,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
    if (response.ok) return response;
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 4) {
      throw new Error(`Rights-cleared photograph for ${slug} failed: HTTP ${response.status} from ${url}`);
    }
    const after = Number(response.headers.get('retry-after'));
    await sleep(Number.isFinite(after) && after > 0 ? after * 1000 : wait);
    wait *= 2;
  }
  throw new Error(`Rights-cleared photograph for ${slug} failed after 4 attempts: ${url}`);
}

let localized = 0;
let vendored = 0;
let fetched = 0;
for (const [slug, entry] of Object.entries(ledger)) {
  // 1. A vendored copy wins. No network, no rate limit, no third-party outage.
  let used = false;
  for (const ext of Object.values(EXT)) {
    const src = path.join(vendorDir, `${slug}.${ext}`);
    if (await exists(src)) {
      await copyFile(src, path.join(outDir, `${slug}.${ext}`));
      vendored += 1; localized += 1; used = true; break;
    }
  }
  if (used) continue;

  // 2. Otherwise fetch it, politely and with retries.
  if (fetched > 0) await sleep(350);
  const response = await download(slug, entry.url);
  fetched += 1;

  const type = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const ext = EXT[type];
  if (!ext) throw new Error(`Rights-cleared photograph for ${slug} is not a supported image (content-type ${type || 'absent'}).`);

  const bytes = Buffer.from(await response.arrayBuffer());
  // A few kilobytes is an error page or a hotlink block, not a news photograph.
  const floor = MIN_BYTES[ext] ?? 20_000;
  if (bytes.length < floor) throw new Error(`Rights-cleared photograph for ${slug} looks incomplete (${bytes.length} bytes, floor ${floor}).`);

  await writeFile(path.join(outDir, `${slug}.${ext}`), bytes);
  // `npm run photos:vendor` also writes into public/ so the files can be
  // committed once and the build stops reaching for Wikimedia entirely.
  if (VENDOR_MODE) {
    await mkdir(vendorDir, { recursive: true });
    await writeFile(path.join(vendorDir, `${slug}.${ext}`), bytes);
  }
  localized += 1;
}

console.log(`Rights-cleared photography localized: ${localized} cleared visuals in the build (${vendored} vendored in-repo, ${fetched} fetched), each carrying its recorded creator, source and licence.${VENDOR_MODE ? ' Vendored copies written to public/assets/images/rights-cleared/ -- commit them so deploys stop depending on the upstream host.' : ''}`);
