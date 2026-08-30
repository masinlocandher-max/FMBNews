import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const scriptsRoot = path.resolve(new URL('.', import.meta.url).pathname);
const sourceFile = path.join(scriptsRoot, 'post-build-fmb-brief-finalize.mjs');
const patchedFile = path.join(scriptsRoot, '.post-build-fmb-brief-finalize-runtime.mjs');
const cropNeedle = "    const crop = await createSafeSocialCrop(sourceFile, socialFile, image.focusX ?? 50, image.focusY ?? 50);";
const cropReplacement = `    let crop;\n    try {\n      crop = await createSafeSocialCrop(sourceFile, socialFile, image.focusX ?? 50, image.focusY ?? 50);\n    } catch (error) {\n      repairQueue.push({ slug, headline:raw.headline || raw.seoTitle || slug, publishedAt:raw.publishedAt || null, currentImage:ogImage || image.url || null, reasons:[\`social crop source could not be decoded: \${error.message}\`], priority:raw.publishedAt || '' });\n      continue;\n    }`;
const archiveNeedle = "async function updateBriefArchive(briefs, manifest) {\n  const file = path.join(newsRoot, 'fmb-brief', 'index.html');\n  let html = await readFile(file, 'utf8');";
const archiveReplacement = "async function updateBriefArchive(briefs, manifest) {\n  const file = path.join(newsRoot, 'fmb-brief', 'index.html');\n  let html = await readFile(file, 'utf8');\n  if (!html.includes('brief-issue-list')) {\n    html = await readFile(path.join(root, 'apps', 'withlovefmb', 'news', 'fmb-brief', 'index.html'), 'utf8');\n  }";
const routeNeedle = "    const relative = path.relative(newsRoot, file).replaceAll(path.sep,'/');\n    if (relative.startsWith('fmb-brief')) continue;";
const routeReplacement = "    const relative = path.relative(newsRoot, file).replaceAll(path.sep,'/');\n    if (relative === 'index.html' || relative === 'archive/index.html' || relative === 'about/index.html' || relative.startsWith('fmb-brief')) continue;";

let source = await readFile(sourceFile, 'utf8');
if (!source.includes(cropNeedle)) throw new Error('FMB Brief safe finalizer could not find the article crop call to harden.');
if (!source.includes(archiveNeedle)) throw new Error('FMB Brief safe finalizer could not find the archive updater to harden.');
if (!source.includes(routeNeedle)) throw new Error('FMB Brief safe finalizer could not find the legacy redirect guard to harden.');
source = source
  .replace(cropNeedle, cropReplacement)
  .replace(archiveNeedle, archiveReplacement)
  .replace(routeNeedle, routeReplacement);
await writeFile(patchedFile, source, 'utf8');
try {
  await import(`${pathToFileURL(patchedFile).href}?v=${Date.now()}`);
} finally {
  await rm(patchedFile, { force:true });
}
