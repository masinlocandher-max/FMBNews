// Replace the retired FMB-owned editorial graphics with editorial plates.
//
// The retired graphics baked the headline, deck, metadata and a disclaimer into
// each SVG in Arial, over a plum-and-gold ground. The words already exist in the
// HTML, so the graphic restated the story in a second voice and a typeface the
// publication does not use -- and at a 100x70 story-row thumbnail none of it was
// legible. scripts/lib/editorial-plate.mjs replaces that with a wordless plate.
//
// What is NOT touched, and why:
//   * anything that is not an FMB-owned vector -- photographs and third-party
//     images are journalism and carry their own credits
//   * verdict, fact-check and data-chart artwork -- those colours and shapes
//     carry editorial meaning, and a plate would destroy it
//   * the newsroom's designated fallback and product-identity assets -- these
//     are not story artwork. The fallback is what the image guard substitutes
//     when no legitimate asset exists, so it is named in the guard and asserted
//     by scripts/verify-images.mjs; a story plate in its place would report a
//     picture where the newsroom is declaring it has none.
//   * graphics that never carried the retired identity
//
// The desk is read from the graphic's own "FMB NEWS · DESK" line where it has
// one, so a plate keeps the ground its desk reads on. Files are rewritten in
// place; git holds the originals.

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { editorialPlate } from './lib/editorial-plate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsImages = path.join(root, 'public', 'assets', 'images', 'news');

const RETIRED = /^(220d50|630661|f9ab60|120720|f7d8ff|d8cbe8)$/i;
const isRetiredHex = (hex) => {
  if (RETIRED.test(hex)) return true;
  const [r, g, b] = [0, 2, 4].map((o) => parseInt(hex.slice(o, o + 2), 16));
  return b > r && b > g + 18 && b > 40;
};

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(file));
    else if (entry.name.endsWith('.svg')) out.push(file);
  }
  return out;
}

function deskOf(svg) {
  const m = svg.match(/FMB\s*NEWS\s*[·|]\s*([A-Za-z ]+)</i);
  if (!m) return '';
  return m[1].trim().split(/\s+/)[0].toLowerCase();
}

function sizeOf(svg, file) {
  const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (vb) return [Number(vb[1]), Number(vb[2])];
  const name = path.basename(file);
  if (/-4x5\./.test(name)) return [1280, 1600];
  if (/-1x1\./.test(name)) return [1200, 1200];
  return [1600, 900];
}

const files = await walk(newsImages);
let rewritten = 0;
const skipped = { notFmbOwned: 0, meaningful: 0, designated: 0, alreadyClean: 0 };

for (const file of files) {
  const svg = await readFile(file, 'utf8');

  // Evidence and verdict artwork carries meaning in its colour and shape.
  // "chart" and "graph" are deliberately NOT loose substrings here: every
  // graphic carries the line "Not a documentary photograph", and matching
  // /graph/ skipped 149 of 191 files on the first run.
  if (/fmb-verdict|fact-check-verdict|data-chart|\bbar chart\b|\bline chart\b/i.test(svg)
      || /verdict|fact-check|-chart/i.test(path.basename(file))) {
    skipped.meaningful += 1;
    continue;
  }
  // Designated fallback and identity assets are contract surfaces, not stories.
  if (/fallback|placeholder|-official|logo|wordmark|masthead/i.test(path.basename(file))) {
    skipped.designated += 1;
    continue;
  }
  // Only FMB-owned vectors.
  if (!/FMB[\s-](?:News|NEWS|owned)/i.test(svg)) { skipped.notFmbOwned += 1; continue; }

  const hexes = [...svg.matchAll(/#([0-9a-f]{6})\b/gi)].map((m) => m[1]);
  if (!hexes.some(isRetiredHex)) { skipped.alreadyClean += 1; continue; }

  const [w, h] = sizeOf(svg, file);
  const slug = path.basename(file).replace(/\.svg$/, '');
  await writeFile(file, editorialPlate(slug, w, h, deskOf(svg)), 'utf8');
  rewritten += 1;
}

console.log(`Editorial plates: rewrote ${rewritten} FMB-owned graphics of ${files.length}; preserved ${skipped.meaningful} verdict/evidence artwork, ${skipped.designated} designated fallback/identity assets, ${skipped.notFmbOwned} non-FMB-owned images and ${skipped.alreadyClean} already on the brand palette. No headline, deck or metadata text is baked into a plate; the HTML carries the words.`);
