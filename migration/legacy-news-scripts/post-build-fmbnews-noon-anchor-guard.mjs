import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const landingPath = path.join(root, 'dist', 'news', 'index.html');
let html = await readFile(landingPath, 'utf8');

const marker = '<div class="nc-rundown-head">';
const anchor = '<article class="nc-rundown-story" data-anchor-guard="true"><a href="/news/"><span class="nc-rundown-number">LATEST</span><div><p>FMB News</p><h3>Latest verified reports</h3><span>Newsroom</span></div></a></article>';
const markerIndex = html.indexOf(marker);
const articleAfterMarker = markerIndex >= 0 ? html.indexOf('<article class="nc-rundown-story"', markerIndex) : -1;

if (markerIndex < 0) {
  const fallback = `<section class="nc-rundown">${marker}</div>${anchor}</section>`;
  if (html.includes('</main>')) html = html.replace('</main>', `${fallback}</main>`);
  else if (html.includes('</body>')) html = html.replace('</body>', `${fallback}</body>`);
  else html += fallback;
  await writeFile(landingPath, html, 'utf8');
  console.log('Created resilient FMB News rundown insertion anchor.');
} else if (articleAfterMarker < 0) {
  const insertAt = markerIndex + marker.length;
  html = `${html.slice(0, insertAt)}</div>${anchor}${html.slice(insertAt)}`;
  await writeFile(landingPath, html, 'utf8');
  console.log('Repaired incomplete FMB News rundown insertion anchor.');
} else {
  console.log('FMB News rundown insertion anchor already present.');
}
