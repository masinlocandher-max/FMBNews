import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const out = path.join(dist, 'assets', 'images', 'news');

const stories = [
  {
    route: '/news/luis-weakens-low-pressure-area-habagat-hazards-august-4-2026/',
    name: 'fmb-news-luis-lpa-habagat-august-4-2026.jpg',
    source: null,
    category: 'WEATHER UPDATE',
    lines: ['LUIS WEAKENS,', 'BUT HABAGAT', 'HAZARDS REMAIN'],
    credit: 'EDITORIAL ILLUSTRATION: FMB NEWS'
  },
  {
    route: '/news/alex-eala-first-wta-title-washington-august-4-2026/',
    name: 'fmb-news-alex-eala-wta-title-august-4-2026.jpg',
    source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Alex_Eala.jpg/1280px-Alex_Eala.jpg',
    category: 'FILIPINO ACHIEVEMENT',
    lines: ['ALEX EALA WINS', 'FIRST FILIPINO', 'WTA SINGLES TITLE'],
    credit: 'PHOTO: PHILIPPINE SPORTS COMMISSION VIA WIKIMEDIA COMMONS'
  },
  {
    route: '/news/iran-pause-lifts-markets-oil-falls-august-4-2026/',
    name: 'fmb-news-markets-oil-fall-august-4-2026.jpg',
    source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Strait_of_Hormuz_%28MODIS_2020-12-04%29.jpg/1280px-Strait_of_Hormuz_%28MODIS_2020-12-04%29.jpg',
    category: 'MONEY · GLOBAL MARKETS',
    lines: ['IRAN PAUSE LIFTS', 'GLOBAL MARKETS', 'AS OIL FALLS'],
    credit: 'PHOTO: NASA AQUA/MODIS VIA WIKIMEDIA COMMONS'
  },
  {
    route: '/news/europe-wildfires-drought-heat-emergency-august-4-2026/',
    name: 'fmb-news-europe-wildfires-drought-august-4-2026.jpg',
    source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Europe_satellite_orthographic.jpg/1280px-Europe_satellite_orthographic.jpg',
    category: 'ENVIRONMENT · CLIMATE',
    lines: ['WILDFIRES AND', 'DROUGHT DEEPEN', 'EUROPE EMERGENCY'],
    credit: 'PHOTO: NASA IMAGERY VIA WIKIMEDIA COMMONS'
  }
];

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');
const local = (name) => `/assets/images/news/${name}`;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function fallback() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111b45"/><stop offset=".55" stop-color="#263b69"/><stop offset="1" stop-color="#17032f"/></linearGradient></defs><rect width="1080" height="1080" fill="url(#g)"/><g opacity=".65" stroke="#b9d9ff" stroke-width="5"><path d="M115 155L20 470M225 110L108 505M340 145L205 560M472 96L332 535M595 130L448 585M725 95L572 542M850 140L690 585M982 104L822 552"/></g></svg>`);
}

function overlay(category, lines, credit) {
  const title = lines.map((line, index) => `<text x="60" y="${360 + index * 86}" fill="${index === 2 ? '#e6ad2b' : '#fff'}" font-family="Arial,sans-serif" font-size="70" font-weight="800">${esc(line)}</text>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#09052d" stop-opacity=".94"/><stop offset=".62" stop-color="#170934" stop-opacity=".68"/><stop offset="1" stop-color="#070b24" stop-opacity=".34"/></linearGradient></defs><rect width="1080" height="1080" fill="url(#s)"/><g transform="translate(58 48)"><path d="M0 72A72 72 0 0 1 72 0" fill="none" stroke="#fff" stroke-width="16"/><path d="M24 72A48 48 0 0 1 72 24" fill="none" stroke="#e6ad2b" stroke-width="16"/><text x="99" y="48" fill="#fff" font-family="Georgia,serif" font-size="66" font-weight="700">FMB</text><text x="101" y="86" fill="#c697ff" font-family="Arial,sans-serif" font-size="25" font-weight="700" letter-spacing="11">NEWS</text></g><text x="60" y="184" fill="#fff" font-family="Arial,sans-serif" font-size="20" font-weight="800" letter-spacing="3">CLEAR NEWS. REAL IMPACT.</text><rect x="60" y="224" width="430" height="42" rx="21" fill="#5b2c91"/><text x="275" y="252" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="18" font-weight="800">${esc(category)}</text>${title}<text x="60" y="810" fill="#fff" font-family="Arial,sans-serif" font-size="19" font-weight="700">4 AUGUST 2026</text><text x="60" y="850" fill="#fff" fill-opacity=".82" font-family="Arial,sans-serif" font-size="14">${esc(credit)}</text><rect y="948" width="1080" height="132" fill="#070b24"/><rect y="946" width="1080" height="3" fill="#e6ad2b"/><text x="58" y="1003" fill="#fff" font-family="Georgia,serif" font-size="30" font-weight="700">FMB NEWS</text><text x="250" y="1000" fill="#fff" font-family="Arial,sans-serif" font-size="18">Clear news. Real impact. Always for Filipinos.</text><text x="1022" y="1045" text-anchor="end" fill="#e6ad2b" font-family="Arial,sans-serif" font-size="18">francinemariebautista.com/fmbnews</text></svg>`);
}

async function remote(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'FMB-News-Cover-Builder/1.0' },
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`Cover source returned ${response.status}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function htmlFiles(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await htmlFiles(file));
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(file);
  }
  return result;
}

function replaceRouteImage(html, route, imagePath) {
  const routePattern = escapeRegex(route);
  const anchorPattern = new RegExp(`(<a\\b[^>]*href=["']${routePattern}["'][^>]*>[\\s\\S]*?<img\\b[^>]*\\bsrc=["'])[^"']+(["'][^>]*>)`, 'g');
  return html.replace(anchorPattern, `$1${imagePath}$2`);
}

function replaceArticlePrimaryImages(html, imagePath) {
  return html
    .replace(/(<meta\s+property=["']og:image["']\s+content=["'])[^"']+(["'])/g, `$1https://www.francinemariebautista.com${imagePath}$2`)
    .replace(/(<meta\s+name=["']twitter:image["']\s+content=["'])[^"']+(["'])/g, `$1https://www.francinemariebautista.com${imagePath}$2`)
    .replace(/(<(?:figure|div)\b[^>]*(?:nc-story-media|fn10-article-media|news-visual)[^>]*>[\s\S]*?<img\b[^>]*\bsrc=["'])[^"']+(["'][^>]*>)/, `$1${imagePath}$2`);
}

await mkdir(out, { recursive: true });
for (const story of stories) {
  let background;
  try {
    background = story.source ? await remote(story.source) : fallback();
  } catch (error) {
    console.warn(String(error));
    background = fallback();
  }
  const destination = path.join(out, story.name);
  await sharp(background)
    .resize(1080, 1080, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlay(story.category, story.lines, story.credit) }])
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(destination);
  if ((await stat(destination)).size < 15000) throw new Error(`Invalid cover ${story.name}`);
}

let changed = 0;
for (const file of await htmlFiles(dist)) {
  let html = await readFile(file, 'utf8');
  const before = html;
  for (const story of stories) {
    html = replaceRouteImage(html, story.route, local(story.name));
    const normalized = file.split(path.sep).join('/');
    if (normalized.includes(story.route.replace(/^\//, ''))) {
      html = replaceArticlePrimaryImages(html, local(story.name));
    }
  }
  if (html !== before) {
    await writeFile(file, html, 'utf8');
    changed += 1;
  }
}

const landing = await readFile(path.join(dist, 'fmbnews', 'index.html'), 'utf8');
for (const story of stories) {
  if (!landing.includes(local(story.name))) throw new Error(`Landing missing ${story.name}`);
}

console.log(`Generated ${stories.length} branded covers and updated ${changed} HTML files.`);
