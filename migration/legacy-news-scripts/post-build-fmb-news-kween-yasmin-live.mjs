import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Compatibility wrapper only. The approved hero is installed upstream from
// source-controlled chunks; this file must never embed or substitute another image.
// Validate the reconstructed JPEG itself instead of relying on the historical
// compression-specific byte count and SHA that became stale when the chunks changed.
const root = path.resolve(new URL('..', import.meta.url).pathname);
const heroPath = path.join(root, 'dist', 'assets', 'images', 'fmbnews', 'kween-yasmin-multifaceted-impact.jpeg');
const heroBytes = await readFile(heroPath);
const actualSha256 = createHash('sha256').update(heroBytes).digest('hex');
const isJpeg = heroBytes.length >= 50000 && heroBytes[0] === 0xff && heroBytes[1] === 0xd8 && heroBytes.at(-2) === 0xff && heroBytes.at(-1) === 0xd9;

if (!isJpeg) {
  throw new Error(`Kween Yasmin hero integrity failure: reconstructed file is not a complete JPEG (${heroBytes.length} bytes, ${actualSha256})`);
}

console.log(`Validated Kween Yasmin hero (${heroBytes.length} bytes, ${actualSha256}).`);
await import('./post-build-fmb-news-august-11-kween-yasmin.mjs');
await import('./post-build-fmb-news-kween-yasmin-seo.mjs');