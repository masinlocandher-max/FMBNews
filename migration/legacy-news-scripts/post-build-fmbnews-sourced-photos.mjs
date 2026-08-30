import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const newsLandingPath = path.join(newsRoot, 'index.html');
const fmbNewsLandingPath = path.join(distRoot, 'fmbnews', 'index.html');
const photoCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-photo-credits.css');
const genericEditionImage = '/assets/images/news/fmb-news-august-3-2026.svg';
const genericEditionImageAbsolute = `https://www.francinemariebautista.com${genericEditionImage}`;
const styleStart = '<!-- FMB_NEWS_PHOTO_CREDITS_START -->';
const styleEnd = '<!-- FMB_NEWS_PHOTO_CREDITS_END -->';

const photos = new Map([
  ['tropical-depression-luis-northern-luzon-august-3-2026', {
    image: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nokaen_2026-01-17_0635Z.jpg?width=1600',
    source: 'https://commons.wikimedia.org/wiki/File:Nokaen_2026-01-17_0635Z.jpg',
    alt: 'Satellite file image of a tropical storm near the Philippines',
    credit: 'Illustrative satellite file image of a tropical storm near the Philippines. NASA Aqua/MODIS via Wikimedia Commons, public domain.',
    width: 1600,
    height: 1067,
  }],
  ['teodoro-officials-duty-west-philippine-sea-august-2026', {
    image: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/20230608-PCO-DND2_Press_Briefing_of_Ms._Daphne_Ose%C3%B1a-Paez_with_Department_of_National_Defense_%28DND%29_Secretary_Gilberto_Teodoro_Jr.jpg?width=1600',
    source: 'https://commons.wikimedia.org/wiki/File:20230608-PCO-DND2_Press_Briefing_of_Ms._Daphne_Ose%C3%B1a-Paez_with_Department_of_National_Defense_(DND)_Secretary_Gilberto_Teodoro_Jr.jpg',
    alt: 'Defense Secretary Gilberto Teodoro speaking at a Presidential Communications Office briefing',
    credit: 'File photo: Defense Secretary Gilberto Teodoro at a Presidential Communications Office briefing. PCO via Wikimedia Commons.',
    width: 1600,
    height: 1067,
  }],
  ['alex-eala-first-wta-500-final-washington-2026', {
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Alex_Eala_%282024_US_Open%29_01.jpg/960px-Alex_Eala_%282024_US_Open%29_01.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Alex_Eala_(2024_US_Open)_01.jpg',
    alt: 'Filipina tennis player Alex Eala at the 2024 US Open',
    credit: 'File photo: Alex Eala at the 2024 US Open. Robbie Mendelson / Wikimedia Commons, CC BY 2.0.',
    width: 960,
    height: 640,
  }],
  ['us-pauses-new-iran-strike-hormuz-talks-august-2026', {
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Strait_of_Hormuz_%28MODIS_2020-12-04%29.jpg/1280px-Strait_of_Hormuz_%28MODIS_2020-12-04%29.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Strait_of_Hormuz_(MODIS_2020-12-04).jpg',
    alt: 'Satellite file image of the Strait of Hormuz',
    credit: 'Satellite file image of the Strait of Hormuz. NASA Aqua/MODIS via Wikimedia Commons, public domain.',
    width: 1280,
    height: 838,
  }],
  ['ukraine-drone-attacks-russia-eight-dead-august-2026', {
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Drone_R18%2C_Ukraine.jpg/960px-Drone_R18%2C_Ukraine.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Drone_R18,_Ukraine.jpg',
    alt: 'Ukrainian R18 drone in a file photograph',
    credit: 'Illustrative file photo of a Ukrainian R18 drone. Territorial Defense Forces of Ukraine via Wikimedia Commons, CC BY 4.0.',
    width: 960,
    height: 640,
  }],
  ['indonesia-ferry-fire-five-dead-41-missing-august-2026', {
    image: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Pelabuhan_ferry.jpg?width=1600',
    source: 'https://commons.wikimedia.org/wiki/File:Pelabuhan_ferry.jpg',
    alt: 'Ferry at an Indonesian port in a file photograph',
    credit: 'Illustrative file photo of a ferry at an Indonesian port. Ryan Wijaya / Wikimedia Commons, CC BY 2.0.',
    width: 1600,
    height: 1067,
  }],
  ['athens-firefighting-helicopters-collide-europe-wildfires-2026', {
    image: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/East_Attica_Wildfire%2C_Greece_%28MODIS_2024-08-15%29.jpg?width=1600',
    source: 'https://commons.wikimedia.org/wiki/File:East_Attica_Wildfire,_Greece_(MODIS_2024-08-15).jpg',
    alt: 'Satellite file image of a major wildfire in East Attica, Greece',
    credit: 'Satellite file image of a major East Attica wildfire. NASA MODIS Land Rapid Response Team via Wikimedia Commons, public domain.',
    width: 1600,
    height: 1067,
  }],
]);

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function caption(photo) {
  return `${escapeHtml(photo.credit)} <a href="${escapeHtml(photo.source)}" target="_blank" rel="noopener noreferrer">Source</a>`;
}

function imageTag(photo, eager = false) {
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<img src="${escapeHtml(photo.image)}" width="${photo.width}" height="${photo.height}" ${loading} decoding="async" alt="${escapeHtml(photo.alt)}">`;
}

function injectPhotoCss(html, css) {
  const clean = html.replace(new RegExp(`${styleStart}[\\s\\S]*?${styleEnd}\\s*`, 'g'), '');
  return clean.replace('</head>', `${styleStart}\n<style data-fmbnews-photo-credits>\n${css}\n</style>\n${styleEnd}\n</head>`);
}

function findArticleBounds(html, slug) {
  const mainStart = html.indexOf('<main');
  const searchStart = mainStart >= 0 ? mainStart : 0;
  let slugIndex = html.indexOf(slug, searchStart);

  while (slugIndex >= 0) {
    const start = html.lastIndexOf('<article', slugIndex);
    const endStart = html.indexOf('</article>', slugIndex);
    const previousArticleEnd = html.lastIndexOf('</article>', slugIndex);
    if (start >= searchStart && endStart >= 0 && previousArticleEnd < start) {
      return [start, endStart + '</article>'.length];
    }
    slugIndex = html.indexOf(slug, slugIndex + slug.length);
  }

  return null;
}

function applyLandingPhotos(html) {
  let next = html;
  let count = 0;
  for (const [slug, photo] of photos) {
    const bounds = findArticleBounds(next, slug);
    if (!bounds) continue;
    const [start, end] = bounds;
    const block = next.slice(start, end);
    const eager = /\bnc-lead-broadcast\b/.test(block);
    const updated = block
      .replace(/<img\b[^>]*src=(['"])[^'"]*fmb-news-august-3-2026\.svg\1[^>]*>/i, imageTag(photo, eager))
      .replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/i, `<figcaption>${caption(photo)}</figcaption>`);
    if (updated !== block) count += 1;
    next = `${next.slice(0, start)}${updated}${next.slice(end)}`;
  }
  return { html: next, count };
}

function applyArticlePhoto(html, slug) {
  const photo = photos.get(slug);
  if (!photo) return { html, changed: false };

  let next = html
    .replaceAll(genericEditionImageAbsolute, photo.image)
    .replaceAll(genericEditionImage, photo.image);

  const doubleQuoted = next.indexOf('<section class="nc-story-media"');
  const singleQuoted = next.indexOf("<section class='nc-story-media'");
  const start = doubleQuoted >= 0 && singleQuoted >= 0
    ? Math.min(doubleQuoted, singleQuoted)
    : Math.max(doubleQuoted, singleQuoted);
  if (start < 0) return { html: next, changed: next !== html };
  const endStart = next.indexOf('</section>', start);
  if (endStart < 0) return { html: next, changed: next !== html };
  const end = endStart + '</section>'.length;
  const block = next.slice(start, end)
    .replace(/<img\b[^>]*>/i, imageTag(photo, true))
    .replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/i, `<figcaption>${caption(photo)}</figcaption>`);
  next = `${next.slice(0, start)}${block}${next.slice(end)}`;
  return { html: next, changed: next !== html };
}

async function walkHtml(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

const css = await readFile(photoCssPath, 'utf8');
const sourceLanding = await readFile(newsLandingPath, 'utf8');
const landingResult = applyLandingPhotos(sourceLanding);
const landing = injectPhotoCss(landingResult.html, css);
await writeFile(newsLandingPath, landing, 'utf8');
await writeFile(fmbNewsLandingPath, landing, 'utf8');

let articleCount = 0;
let photoCount = 0;
for (const filePath of await walkHtml(newsRoot)) {
  if (filePath === newsLandingPath) continue;
  const source = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(source)) continue;
  const slug = path.basename(path.dirname(filePath));
  const result = applyArticlePhoto(source, slug);
  const updated = injectPhotoCss(result.html, css);
  await writeFile(filePath, updated, 'utf8');
  articleCount += 1;
  if (result.changed) photoCount += 1;
}

console.log(`Added unique sourced photography to ${landingResult.count} front-page stories and ${photoCount} report pages; retained visible credits across ${articleCount} News articles.`);