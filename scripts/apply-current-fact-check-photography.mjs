import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const factRoot = path.join(newsRoot, 'fact-check');
const photoPath = path.join(root, 'content', 'fact-check', 'photography.json');
const outDir = path.join(newsRoot, 'assets', 'images', 'rights-cleared');

const EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif'
};

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const exists = async (target) => { try { await access(target); return true; } catch { return false; } };
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function download(slug, url) {
  let pause = 900;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'FMBNewsBuild/1.0 (Filipino Media Bulletin; +https://www.francinemariebautista.com/news/)',
        accept: 'image/avif,image/webp,image/*,*/*;q=0.8'
      }
    });
    if (response.ok) return response;
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 4) throw new Error(`Fact Check photograph for ${slug} failed: HTTP ${response.status}`);
    const retryAfter = Number(response.headers.get('retry-after'));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : pause);
    pause *= 2;
  }
  throw new Error(`Fact Check photograph for ${slug} failed after retries`);
}

const entries = JSON.parse(await readFile(photoPath, 'utf8'));
await mkdir(outDir, { recursive: true });

let applied = 0;
let fetched = 0;
for (const [slug, entry] of Object.entries(entries)) {
  for (const field of ['url', 'sourceUrl', 'credit', 'caption', 'alt']) {
    if (!entry?.[field] || !String(entry[field]).trim()) throw new Error(`${slug}: photography record missing ${field}`);
  }
  if (!/^https:\/\/commons\.wikimedia\.org\//i.test(entry.sourceUrl)) throw new Error(`${slug}: photography source must be a Wikimedia Commons file page`);
  if (!/(CC[ -]|public[ -]domain|CC0)/i.test(entry.credit)) throw new Error(`${slug}: photography credit must state a reusable licence`);

  const page = path.join(factRoot, slug, 'index.html');
  if (!await exists(page)) throw new Error(`${slug}: Fact Check page does not exist before photography pass`);

  if (fetched) await sleep(350);
  const response = await download(slug, entry.url);
  fetched += 1;
  const type = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const ext = EXT[type];
  if (!ext) throw new Error(`${slug}: unsupported photography content type ${type || 'unknown'}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 20_000) throw new Error(`${slug}: downloaded photograph looks incomplete (${bytes.length} bytes)`);

  const file = `${slug}.${ext}`;
  await writeFile(path.join(outDir, file), bytes);
  const src = `/assets/images/rights-cleared/${file}`;
  const figure = `<figure class="article-figure fmb-rights-cleared-figure"><img src="${src}" alt="${esc(entry.alt)}" fetchpriority="high" decoding="async"><figcaption>${esc(entry.caption)}<br><em>${esc(entry.credit)}</em> · <a href="${esc(entry.sourceUrl)}" rel="noopener noreferrer">Source and licence</a></figcaption></figure>`;

  let html = await readFile(page, 'utf8');
  if (html.includes('fmb-rights-cleared-figure')) continue;
  const h1 = /<h1\b[^>]*>[\s\S]*?<\/h1>/i;
  if (!h1.test(html)) throw new Error(`${slug}: article headline not found for photo insertion`);
  html = html.replace(h1, match => `${match}${figure}`);
  await writeFile(page, html, 'utf8');
  applied += 1;
}

console.log(`Current Fact Check photography applied: ${applied}/${Object.keys(entries).length} licensed contextual photographs localized with visible credit and source.`);
