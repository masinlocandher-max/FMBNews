// Fill in width and height on article image records, by measuring the file.
//
// verify-editorial-production.mjs requires image.width and image.height to be
// real positive numbers. They are the one field in an image record that cannot
// be copied from the rights-cleared ledger, because the ledger stores where a
// photograph came from and how it must be credited -- not its pixel size.
//
// They also must not be guessed. A fabricated dimension is a false statement
// about the file in the article's own metadata, it feeds the layout hints
// browsers use to reserve space, and it would be indistinguishable from a real
// measurement to every later reader of the repo. So this measures.
//
// The measurement is done by reading the image header directly rather than by
// adding an image library, because this repository ships with no runtime
// dependencies and one command that needs network is easier to run than one
// that needs network AND a native module.
//
// Usage: node scripts/backfill-article-image-dimensions.mjs [--dry-run]
//
// Requires network access to the image host. It is a no-op for any record that
// already carries dimensions, so it is safe to re-run.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const articlesRoot = path.join(root, 'content', 'news', 'articles');
const dryRun = process.argv.includes('--dry-run');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- header readers --------------------------------------------------------
// Each returns {width, height} or null. They read the real header fields, so a
// truncated or mislabelled file yields null rather than a plausible-looking
// number.

function pngSize(buf) {
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marker = buf[i + 1];
    // Standalone markers carry no length payload.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const length = buf.readUInt16BE(i + 2);
    // SOF0-SOF15, excluding the non-frame markers DHT (c4), JPG (c8), DAC (cc).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  return null;
}

function gifSize(buf) {
  if (buf.length < 10 || buf.toString('ascii', 0, 3) !== 'GIF') return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

function webpSize(buf) {
  if (buf.length < 30) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const format = buf.toString('ascii', 12, 16);
  if (format === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (format === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (format === 'VP8X') {
    const w = buf[24] | (buf[25] << 8) | (buf[26] << 16);
    const h = buf[27] | (buf[28] << 8) | (buf[29] << 16);
    return { width: w + 1, height: h + 1 };
  }
  return null;
}

const measure = (buf) => pngSize(buf) || jpegSize(buf) || gifSize(buf) || webpSize(buf);

// --- fetch -----------------------------------------------------------------
// Same courtesy as the other network passes in this repo: a descriptive
// user-agent, a gap between requests, and backoff that honours Retry-After.
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
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 4) throw new Error(`HTTP ${response.status}`);
    const retryAfter = Number(response.headers.get('retry-after'));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : pause);
    pause *= 2;
  }
  throw new Error('exhausted retries');
}

// --- walk ------------------------------------------------------------------
async function articleFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await articleFiles(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

const files = await articleFiles(articlesRoot);
let measured = 0; let already = 0; let skipped = 0;
const failures = [];
let requests = 0;

for (const file of files) {
  const story = JSON.parse(await readFile(file, 'utf8'));
  const image = story.image;
  if (!image?.url) { skipped += 1; continue; }
  if (Number(image.width) > 0 && Number(image.height) > 0) { already += 1; continue; }
  if (!/^https:\/\//i.test(image.url)) { skipped += 1; continue; }

  if (requests) await sleep(350);
  requests += 1;
  try {
    const bytes = await download(image.url);
    const size = measure(bytes);
    if (!size || !(size.width > 0) || !(size.height > 0)) {
      failures.push(`${story.slug}: could not read dimensions from the file header`);
      continue;
    }
    image.width = size.width;
    image.height = size.height;
    if (!dryRun) await writeFile(file, JSON.stringify(story), 'utf8');
    measured += 1;
    console.log(`  ${story.slug} -> ${size.width}x${size.height}`);
  } catch (error) {
    failures.push(`${story.slug}: ${error.message} (${image.url})`);
  }
}

console.log(`\nImage dimensions ${dryRun ? 'measured (dry run, nothing written)' : 'backfilled'}: ${measured}; already present: ${already}; no remote image: ${skipped}.`);
if (failures.length) {
  console.error(`\n${failures.length} record(s) could not be measured:`);
  for (const line of failures) console.error(`  ${line}`);
  process.exitCode = 1;
}
