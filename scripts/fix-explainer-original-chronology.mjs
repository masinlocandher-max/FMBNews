import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const indexPath = path.join(newsRoot, 'assets', 'data', 'fmb-explained', 'published-index.json');

// The 206-topic library was imported in the source archive's publication order:
// lower IDs are newer and higher IDs are older. Preserve that original sequence
// instead of the synthetic June-September 2026 dates previously generated from IDs.
const index = JSON.parse(await readFile(indexPath, 'utf8'))
  .map(item => ({
    ...item,
    sourceOrder: Number(item.id),
    archiveDate: null
  }))
  .sort((a, b) => a.sourceOrder - b.sourceOrder);

await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');

const explainerRoot = path.join(newsRoot, 'explainer');
for (const entry of await readdir(explainerRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(explainerRoot, entry.name, 'index.html');
  let html;
  try { html = await readFile(file, 'utf8'); } catch { continue; }

  html = html
    .replace(
      /FMB Explainer Archive · [A-Z][a-z]+ \d{1,2}, \d{4} ·/g,
      'FMB Explainer Archive · Original publication chronology ·'
    )
    .replace(
      /<p class="article-context-note"><strong>Archive context:<\/strong> This explainer is organized by its FMB archive date\. Time-sensitive developments may have changed since then and should be read together with the cited sources and later updates\.<\/p>/g,
      '<p class="article-context-note"><strong>Archive context:</strong> This explainer is placed according to the original publication sequence of the imported archive. FMB does not substitute an import or generation date for an unverified original publication date. Time-sensitive developments should be read with the cited sources and later updates.</p>'
    );

  await writeFile(file, html, 'utf8');
}

const imageRoot = path.join(newsRoot, 'assets', 'images', 'explainer');
for (const entry of await readdir(imageRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.svg')) continue;
  const file = path.join(imageRoot, entry.name);
  let svg = await readFile(file, 'utf8');
  svg = svg.replace(
    /FMB Explainer Archive · [A-Z][a-z]+ \d{1,2}, \d{4}/g,
    'FMB Explainer · Original publication chronology'
  );
  await writeFile(file, svg, 'utf8');
}

console.log('Normalized FMB Explainer to original archive chronology and removed synthetic archive dates.');
