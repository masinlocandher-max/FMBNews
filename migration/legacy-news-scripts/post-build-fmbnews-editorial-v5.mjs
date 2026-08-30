import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const fmbNewsRoot = path.join(distRoot, 'fmbnews');
const artworkRoot = path.join(distRoot, 'assets', 'images', 'news', 'editorial-v5');
const siteOrigin = 'https://www.francinemariebautista.com';
const genericImagePattern = /(?:https:\/\/www\.francinemariebautista\.com)?\/assets\/images\/news\/fmb-news-[^"'<>\s]+\.svg/i;

const photos = new Map([
  ['alex-eala-pegula-washington-final-suspended-rain-august-2026', {
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Alex_Eala_%282024_US_Open%29_01.jpg/1280px-Alex_Eala_%282024_US_Open%29_01.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Alex_Eala_(2024_US_Open)_01.jpg',
    alt: 'Filipina tennis player Alex Eala at the 2024 US Open',
    credit: 'File photo: Alex Eala at the 2024 US Open. Robbie Mendelson / Wikimedia Commons, CC BY 2.0.',
    width: 1280,
    height: 853,
  }],
  ['us-iran-talks-monday-hormuz-no-deadline-august-2026', {
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Strait_of_Hormuz_%28MODIS_2020-12-04%29.jpg/1280px-Strait_of_Hormuz_%28MODIS_2020-12-04%29.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Strait_of_Hormuz_(MODIS_2020-12-04).jpg',
    alt: 'Satellite file image of the Strait of Hormuz',
    credit: 'Satellite file image of the Strait of Hormuz. NASA Aqua/MODIS via Wikimedia Commons, public domain.',
    width: 1280,
    height: 838,
  }],
  ['oil-prices-fall-us-pauses-iran-strike-august-3-2026', {
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Strait_of_Hormuz_%28MODIS_2020-12-04%29.jpg/1280px-Strait_of_Hormuz_%28MODIS_2020-12-04%29.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Strait_of_Hormuz_(MODIS_2020-12-04).jpg',
    alt: 'Satellite file image of the Strait of Hormuz',
    credit: 'Satellite file image of the Strait of Hormuz. NASA Aqua/MODIS via Wikimedia Commons, public domain.',
    width: 1280,
    height: 838,
  }],
  ['subic-first-locally-built-hyundai-tanker-august-2026', {
    image: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Agila_Subic_Shipyard_(Subic,_Zambales;_05-21-2023).jpg?width=1600',
    source: 'https://commons.wikimedia.org/wiki/File:Agila_Subic_Shipyard_(Subic,_Zambales;_05-21-2023).jpg',
    alt: 'File photograph of the Agila Subic Shipyard in Zambales',
    credit: 'File photo: Agila Subic Shipyard in Subic, Zambales. Patrickroque01 / Wikimedia Commons, CC BY-SA 4.0.',
    width: 1600,
    height: 1200,
  }],
  ['luis-affects-6316-families-august-3-2026', {
    image: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Penha_2026-02-05_0441Z.jpg?width=1600',
    source: 'https://commons.wikimedia.org/wiki/File:Penha_2026-02-05_0441Z.jpg',
    alt: 'Illustrative satellite file image of a tropical storm approaching the Philippines',
    credit: 'Illustrative satellite file image of a tropical storm near the Philippines. NOAA-20 VIIRS via Wikimedia Commons, public domain.',
    width: 1600,
    height: 1000,
  }],
  ['coa-testimony-sara-confidential-funds-august-3-2026', {
    image: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Vice_President_Sara_Duterte_portrait_(cropped).jpg?width=1200',
    source: 'https://commons.wikimedia.org/wiki/File:Vice_President_Sara_Duterte_portrait_(cropped).jpg',
    alt: 'Official portrait of Vice President Sara Duterte',
    credit: 'File photo: Official portrait of Vice President Sara Duterte. Office of the Vice President via Wikimedia Commons.',
    width: 1200,
    height: 1580,
  }],
  ['spokane-wildfires-60000-evacuated-august-2026', {
    image: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/MODIS_-_Washington_state_wildfires_2015-08-22.jpg?width=1600',
    source: 'https://commons.wikimedia.org/wiki/File:MODIS_-_Washington_state_wildfires_2015-08-22.jpg',
    alt: 'Illustrative satellite file image of wildfire smoke over Washington state',
    credit: 'Illustrative file image of wildfire smoke over Washington state. NASA Terra/MODIS via Wikimedia Commons, public domain.',
    width: 1600,
    height: 960,
  }],
]);

const palettes = {
  Philippines: ['#1e0c2b', '#5d2875', '#b58b35'],
  World: ['#101927', '#213d65', '#8aa4c6'],
  Sports: ['#24112c', '#7a2e69', '#d4a2c7'],
  Culture: ['#2d1326', '#7a3f5d', '#d5aa7c'],
  Business: ['#111d2e', '#2b5678', '#b58b35'],
  Technology: ['#14162b', '#433c7d', '#a9a2e8'],
  default: ['#1e0c2b', '#4b205f', '#b58b35'],
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeXml(value = '') {
  return escapeHtml(value);
}

function textOnly(value = '') {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function addBodyClass(html) {
  return html.replace(/<body\b([^>]*)>/i, (match, attrs) => {
    if (/\bnews-editorial-v5\b/.test(attrs)) return match;
    if (/class=(['"])(.*?)\1/i.test(attrs)) {
      return `<body${attrs.replace(/class=(['"])(.*?)\1/i, (_m, quote, classes) => `class=${quote}${classes} news-editorial-v5${quote}`)}>`;
    }
    return `<body${attrs} class="news-editorial-v5">`;
  });
}

function extractTagText(block, tags = ['h1', 'h2', 'h3']) {
  for (const tag of tags) {
    const match = block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    if (match) return textOnly(match[1]);
  }
  return '';
}

function extractSection(block) {
  const kicker = block.match(/<(?:p|span)\b[^>]*class=(['"])[^'"]*(?:nc-kicker|nc-lead-meta)[^'"]*\1[^>]*>([\s\S]*?)<\/(?:p|span)>/i);
  const value = textOnly(kicker?.[2] || '');
  return value.split(/[·|]/)[0].trim() || 'FMB News';
}

function wrapTitle(title) {
  const words = title.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > 30 && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
    if (lines.length === 2) break;
  }
  if (line && lines.length < 3) lines.push(line);
  const consumed = lines.join(' ').split(/\s+/).length;
  if (consumed < words.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:]?$/, '')}…`;
  }
  return lines.slice(0, 3);
}

function artworkSvg(title, section) {
  const palette = palettes[section] || palettes.default;
  const lines = wrapTitle(title || 'FMB News report');
  const lineMarkup = lines.map((line, index) => `<text x="110" y="${360 + index * 92}" fill="#ffffff" font-family="Georgia,Times New Roman,serif" font-size="72" font-weight="700">${escapeXml(line)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-label="Editorial visual for ${escapeXml(title)}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette[0]}"/><stop offset=".68" stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[0]}"/></linearGradient><radialGradient id="r" cx="82%" cy="18%" r="68%"><stop stop-color="${palette[2]}" stop-opacity=".42"/><stop offset="1" stop-color="${palette[2]}" stop-opacity="0"/></radialGradient></defs><rect width="1600" height="900" fill="url(#g)"/><rect width="1600" height="900" fill="url(#r)"/><path d="M1050 -120L1660 490M1190 -160L1660 310M980 900L1600 280" stroke="#fff" stroke-opacity=".08" stroke-width="2"/><circle cx="1390" cy="150" r="180" fill="none" stroke="#fff" stroke-opacity=".09" stroke-width="2"/><text x="110" y="120" fill="#ffffff" fill-opacity=".78" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" letter-spacing="7">FMB NEWS</text><text x="110" y="190" fill="${palette[2]}" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" letter-spacing="4">${escapeXml(section.toUpperCase())}</text><rect x="110" y="240" width="104" height="7" rx="3.5" fill="${palette[2]}"/>${lineMarkup}<text x="110" y="790" fill="#ffffff" fill-opacity=".72" font-family="Arial,Helvetica,sans-serif" font-size="21" letter-spacing="3">CONTEXT · SOURCES · PUBLIC VALUE</text><rect x="110" y="825" width="1380" height="1" fill="#fff" fill-opacity=".18"/></svg>`;
}

async function ensureArtwork(slug, title, section) {
  const fileName = `${slug}.svg`;
  const filePath = path.join(artworkRoot, fileName);
  await writeFile(filePath, artworkSvg(title, section), 'utf8');
  return {
    image: `/assets/images/news/editorial-v5/${fileName}`,
    source: null,
    alt: `FMB News editorial visual for ${title}`,
    credit: 'Original FMB News editorial visual.',
    width: 1600,
    height: 900,
  };
}

function imageTag(media, eager = false) {
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<img src="${escapeHtml(media.image)}" width="${media.width}" height="${media.height}" ${loading} decoding="async" alt="${escapeHtml(media.alt)}">`;
}

function caption(media) {
  const source = media.source
    ? ` <a href="${escapeHtml(media.source)}" target="_blank" rel="noopener noreferrer">Source</a>`
    : '';
  return `${escapeHtml(media.credit)}${source}`;
}

function markFigure(block, kind) {
  return block.replace(/<figure\b([^>]*)>/i, (match, attrs) => {
    if (/data-media-kind=/i.test(attrs)) return match;
    return `<figure${attrs} data-media-kind="${kind}">`;
  });
}

function replaceMediaBlock(block, media, eager = false) {
  let next = block.replace(/<img\b[^>]*>/i, imageTag(media, eager));
  if (/<figcaption\b/i.test(next)) {
    next = next.replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/i, `<figcaption>${caption(media)}</figcaption>`);
  } else {
    next = next.replace(/<\/figure>/i, `<figcaption>${caption(media)}</figcaption></figure>`);
  }
  return markFigure(next, media.source ? 'photo' : 'editorial-art');
}

function findArticleBounds(html, slug) {
  let slugIndex = html.indexOf(`/news/${slug}/`);
  while (slugIndex >= 0) {
    const start = html.lastIndexOf('<article', slugIndex);
    const endStart = html.indexOf('</article>', slugIndex);
    const previousEnd = html.lastIndexOf('</article>', slugIndex);
    if (start >= 0 && endStart >= 0 && previousEnd < start) return [start, endStart + 10];
    slugIndex = html.indexOf(`/news/${slug}/`, slugIndex + slug.length + 8);
  }
  return null;
}

async function upgradeLanding(html) {
  let next = addBodyClass(html);
  const slugs = [...new Set([...next.matchAll(/href=(['"])\/news\/([^/'"?#]+)\/\1/gi)].map((match) => match[2]))];
  let upgraded = 0;
  for (const slug of slugs) {
    const bounds = findArticleBounds(next, slug);
    if (!bounds) continue;
    const [start, end] = bounds;
    const block = next.slice(start, end);
    const imageMatch = block.match(/<img\b[^>]*src=(['"])([^'"]+)\1[^>]*>/i);
    if (!imageMatch || !genericImagePattern.test(imageMatch[2])) continue;
    const title = extractTagText(block, ['h2', 'h3']) || 'FMB News report';
    const section = extractSection(block);
    const media = photos.get(slug) || await ensureArtwork(slug, title, section);
    const upgradedBlock = replaceMediaBlock(block, media, /\bnc-lead-broadcast\b/.test(block));
    next = `${next.slice(0, start)}${upgradedBlock}${next.slice(end)}`;
    upgraded += 1;
  }
  return { html: next, upgraded };
}

function replaceGenericReferences(html, media) {
  const absolute = media.image.startsWith('http') ? media.image : `${siteOrigin}${media.image}`;
  const token = '__FMB_NEWS_EDITORIAL_IMAGE__';
  return html
    .replace(/https:\/\/www\.francinemariebautista\.com\/assets\/images\/news\/fmb-news-[^"'<>\s]+\.svg/g, token)
    .replace(/\/assets\/images\/news\/fmb-news-[^"'<>\s]+\.svg/g, media.image)
    .replaceAll(token, absolute);
}

async function upgradeArticle(html, slug) {
  let next = addBodyClass(html);
  const mediaSectionStart = next.search(/<section\b[^>]*class=(['"])[^'"]*nc-story-media[^'"]*\1/i);
  if (mediaSectionStart < 0) return { html: next, upgraded: false };
  const mediaSectionEndStart = next.indexOf('</section>', mediaSectionStart);
  if (mediaSectionEndStart < 0) return { html: next, upgraded: false };
  const mediaSectionEnd = mediaSectionEndStart + 10;
  const block = next.slice(mediaSectionStart, mediaSectionEnd);
  const imageMatch = block.match(/<img\b[^>]*src=(['"])([^'"]+)\1[^>]*>/i);
  if (!imageMatch || !genericImagePattern.test(imageMatch[2])) return { html: next, upgraded: false };

  const title = extractTagText(next, ['h1']) || 'FMB News report';
  const section = extractSection(next);
  const media = photos.get(slug) || await ensureArtwork(slug, title, section);
  next = `${next.slice(0, mediaSectionStart)}${replaceMediaBlock(block, media, true)}${next.slice(mediaSectionEnd)}`;
  next = replaceGenericReferences(next, media);
  return { html: next, upgraded: true };
}

async function walkHtml(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walkHtml(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

await mkdir(artworkRoot, { recursive: true });

let landingCount = 0;
for (const landingPath of [path.join(newsRoot, 'index.html'), path.join(fmbNewsRoot, 'index.html')]) {
  try {
    const source = await readFile(landingPath, 'utf8');
    const result = await upgradeLanding(source);
    await writeFile(landingPath, result.html, 'utf8');
    landingCount += result.upgraded;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

let articleCount = 0;
for (const filePath of await walkHtml(newsRoot)) {
  if (filePath === path.join(newsRoot, 'index.html')) continue;
  const source = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(source)) continue;
  const slug = path.basename(path.dirname(filePath));
  const result = await upgradeArticle(source, slug);
  await writeFile(filePath, result.html, 'utf8');
  if (result.upgraded) articleCount += 1;
}

console.log(`Applied FMB News Editorial V5 to all generated routes, upgraded ${landingCount} landing visuals and ${articleCount} article visuals.`);
