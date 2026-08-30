import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourceRoot = path.resolve('apps/withlovefmb/content/news/articles');
const tempRoot = path.resolve('.tmp/fmb-news-articles');
const imageRoot = path.resolve('dist/assets/images/news');

const contentTypeExtensions = new Map([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/svg+xml', 'svg'],
]);

async function jsonFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await jsonFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(full);
  }
  return files;
}

function extensionFor(response, sourceUrl) {
  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (contentTypeExtensions.has(contentType)) return contentTypeExtensions.get(contentType);
  const ext = path.extname(new URL(sourceUrl).pathname).slice(1).toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return ext === 'jpeg' ? 'jpg' : ext;
  throw new Error(`Unsupported news image content type: ${contentType || 'unknown'} (${sourceUrl})`);
}

export async function prepareFmbNewsLocalImages() {
  await rm(tempRoot, { recursive: true, force: true });
  await mkdir(path.dirname(tempRoot), { recursive: true });
  await cp(sourceRoot, tempRoot, { recursive: true });
  await mkdir(imageRoot, { recursive: true });

  const files = await jsonFiles(tempRoot);
  let localized = 0;
  for (const file of files) {
    const raw = JSON.parse(await readFile(file, 'utf8'));
    const imageUrl = raw?.image?.url;
    if (typeof imageUrl !== 'string' || !/^https?:\/\//i.test(imageUrl)) continue;

    const response = await fetch(imageUrl, {
      redirect: 'follow',
      headers: { 'user-agent': 'FMBNewsBuild/1.0 (+https://www.francinemariebautista.com/news/about/)' },
    });
    if (!response.ok) throw new Error(`${raw.slug || path.basename(file)} image download failed: HTTP ${response.status}`);

    const ext = extensionFor(response, imageUrl);
    const localUrl = `/assets/images/news/${raw.slug}.${ext}`;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1024) throw new Error(`${raw.slug || path.basename(file)} image download is unexpectedly small (${bytes.length} bytes)`);

    await writeFile(path.resolve('dist', localUrl.slice(1)), bytes);
    raw.image.url = localUrl;
    await writeFile(file, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
    localized += 1;
  }

  console.log(`Prepared ${localized} locally hosted rights-cleared FMB News image(s) for structured publication.`);
  return tempRoot;
}
