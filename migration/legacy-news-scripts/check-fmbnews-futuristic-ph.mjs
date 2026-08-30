import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsPath = path.join(distRoot, 'news', 'index.html');
const compatibilityPath = path.join(distRoot, 'fmbnews', 'index.html');

await stat(newsPath);
await stat(compatibilityPath);

const [newsHtml, compatibilityHtml] = await Promise.all([
  readFile(newsPath, 'utf8'),
  readFile(compatibilityPath, 'utf8'),
]);

if (!/FMB News|FILIPINO MEDIA BULLETIN|Filipino ang Mismong Balita/i.test(newsHtml)) {
  throw new Error('FMB News compatibility audit: /news/ lost its publication identity before final rendering.');
}
if (!/FMB News|FILIPINO MEDIA BULLETIN|Filipino ang Mismong Balita/i.test(compatibilityHtml)) {
  throw new Error('FMB News compatibility audit: /fmbnews/ compatibility output lost its publication identity.');
}

// /news/ is the active canonical publication. /fmbnews/ is retained only as a
// historical compatibility output. Final visual identity, the typographic
// FMB-bold + News-regular wordmark, fixed PHT clock, moving headlines,
// canonical navigation/footer, newsletter and article structure are asserted
// after all transforms by verify-fmb-news-publication.mjs.
//
// Do not import or run the retired exact-image-logo audit here. That audit
// belonged to an older brand direction and generated misleading warnings that
// asked the build to restore image logos the current publication explicitly
// forbids.
console.log('FMB News compatibility audit passed: /news/ remains the active publication surface and /fmbnews/ remains available for historical compatibility. Final broadcast-network identity is owned exclusively by the post-finalization publication QA gate.');
