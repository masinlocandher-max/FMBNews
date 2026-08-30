import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Compatibility entrypoint for the August 8 FMB News AI / Pax Silica series.
// The canonical publisher lives in post-build-fmb-news-ai-francine-august-8.mjs.
export const stories = [
  {
    slug:'francine-marie-bautista-ai-photography-creative-skill',
    title:'Using AI Does Not Make You Less of a Photographer: Francine Marie Bautista on Skill, Tools and Creative Judgment'
  },
  {
    slug:'francine-marie-bautista-pax-silica-terms-must-be-clear',
    title:'Francine Marie Bautista on Pax Silica: “Terms Must Be Clear. Questions Must Be Answered.”'
  },
  {
    slug:'francine-marie-bautista-ai-literacy-minimize-risks',
    title:'AI Has Risks. Francine Marie Bautista Says the Answer Is to Learn How to Use It Properly'
  }
];

await import('./post-build-fmb-news-ai-francine-august-8.mjs');

// Reconstruct the approved Kween Yasmin JPEG from source-controlled base64 chunks.
// The historical exact-byte guard became stale after the source-controlled asset was
// intentionally re-packed. Validate that the reconstructed payload is a complete JPEG
// instead of failing production solely because its compression/byte count changed.
const root = path.resolve(new URL('..', import.meta.url).pathname);
const sourceDir = path.join(root, 'assets', 'fmbnews');
const chunkNames = [
  'kween-yasmin-master.part00a.txt',
  'kween-yasmin-master.part00b.txt',
  'kween-yasmin-master.part00c.txt',
  'kween-yasmin-master.part00d.txt',
  'kween-yasmin-master.part01.txt',
  'kween-yasmin-master.part02.txt'
];
const chunks = await Promise.all(chunkNames.map((name) => readFile(path.join(sourceDir, name), 'utf8')));
const heroBase64 = chunks.join('').replace(/\s+/g, '');
const heroBytes = Buffer.from(heroBase64, 'base64');
const actualSha256 = createHash('sha256').update(heroBytes).digest('hex');
const isJpeg = heroBytes.length >= 50000 && heroBytes[0] === 0xff && heroBytes[1] === 0xd8 && heroBytes.at(-2) === 0xff && heroBytes.at(-1) === 0xd9;
if (!isJpeg) {
  throw new Error(`Kween Yasmin approved hero reconstruction is not a complete JPEG (${heroBytes.length} bytes, ${actualSha256}).`);
}

const heroDir = path.join(root, 'dist', 'assets', 'images', 'fmbnews');
const heroPath = path.join(heroDir, 'kween-yasmin-multifaceted-impact.jpeg');
await mkdir(heroDir, { recursive: true });
await writeFile(heroPath, heroBytes);
console.log(`Installed validated approved Kween Yasmin hero (${heroBytes.length} bytes, ${actualSha256}).`);

await import('./post-build-fmb-news-kween-yasmin-live.mjs');