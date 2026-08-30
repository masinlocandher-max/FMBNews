import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const roots = [path.join(distRoot, 'news'), path.join(distRoot, 'fmbnews')];
const site = 'https://www.francinemariebautista.com';
const rasterPattern = /\.(?:avif|jpe?g|png|webp)(?:[?#].*)?$/i;
const svgPattern = /\.svg(?:[?#].*)?$/i;

const media = {
  hormuz: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Strait_of_Hormuz_%28MODIS_2020-12-04%29.jpg/1280px-Strait_of_Hormuz_%28MODIS_2020-12-04%29.jpg', width: 1280, height: 838,
    alt: 'Satellite file image of the Strait of Hormuz',
    caption: 'Satellite file image of the Strait of Hormuz. NASA Aqua/MODIS via Wikimedia Commons, public domain.',
    source: 'https://commons.wikimedia.org/wiki/File:Strait_of_Hormuz_(MODIS_2020-12-04).jpg',
  },
  yen: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/10000_yen_banknote_%28Series_E%29%2C_obverse.png/1280px-10000_yen_banknote_%28Series_E%29%2C_obverse.png', width: 1280, height: 613,
    alt: 'Ten-thousand-yen banknote issued by the Bank of Japan',
    caption: 'File image of a Japanese 10,000-yen banknote. Nippon Ginko, Government of Japan, public domain.',
    source: 'https://commons.wikimedia.org/wiki/File:10000_yen_banknote_(Series_E),_obverse.png',
  },
  worldBank: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/World_Bank_building.JPG/1280px-World_Bank_building.JPG', width: 1280, height: 821,
    alt: 'World Bank Group headquarters building in Washington, D.C.',
    caption: 'File photo of the World Bank Group headquarters. AgnosticPreachersKid via Wikimedia Commons, CC BY-SA 3.0.',
    source: 'https://commons.wikimedia.org/wiki/File:World_Bank_building.JPG',
  },
  senz: {
    src: '/assets/images/projects/senz-transparent.png', width: 1536, height: 1024,
    alt: 'Official SENZ Strategic Communications and Digital Solutions brand visual',
    caption: 'Official SENZ brand visual from the FMB&CO. repository.', source: '',
  },
  cognita: {
    src: '/assets/images/cognita/ads/cognita-brand-banner.webp', width: 900, height: 450,
    alt: 'Official Cognita Institute brand visual',
    caption: 'Official Cognita Institute visual supplied in the FMB&CO. repository.', source: '',
  },
  cleopatra: {
    src: '/assets/images/news/cleopatra-barrera-zambales-ocean-feature.jpeg', width: 1536, height: 864,
    alt: 'Cleopatra Barrera in the official Zambales ocean feature image',
    caption: 'Official FMB News feature image supplied for the story.', source: '',
  },
  defense: {
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/20230608-PCO-DND2_Press_Briefing_of_Ms._Daphne_Ose%C3%B1a-Paez_with_Department_of_National_Defense_%28DND%29_Secretary_Gilberto_Teodoro_Jr.jpg?width=1600', width: 1600, height: 1067,
    alt: 'Philippine defense briefing file photo',
    caption: 'File photo from a Department of National Defense briefing. PCO via Wikimedia Commons.',
    source: 'https://commons.wikimedia.org/wiki/File:20230608-PCO-DND2_Press_Briefing_of_Ms._Daphne_Ose%C3%B1a-Paez_with_Department_of_National_Defense_(DND)_Secretary_Gilberto_Teodoro_Jr.jpg',
  },
  gaza: {
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Gaza_City.JPG?width=1280', width: 1280, height: 960,
    alt: 'Gaza City in a file photograph',
    caption: 'File photo of Gaza City. OneArmedMan via Wikimedia Commons, public domain.',
    source: 'https://commons.wikimedia.org/wiki/File:Gaza_City.JPG',
  },
  storm: {
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nokaen_2026-01-17_0635Z.jpg?width=1600', width: 1600, height: 1067,
    alt: 'Satellite file image of a tropical storm near the Philippines',
    caption: 'Illustrative satellite file image near the Philippines. NASA Aqua/MODIS via Wikimedia Commons, public domain.',
    source: 'https://commons.wikimedia.org/wiki/File:Nokaen_2026-01-17_0635Z.jpg',
  },
  ukraine: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Drone_R18%2C_Ukraine.jpg/960px-Drone_R18%2C_Ukraine.jpg', width: 960, height: 640,
    alt: 'Ukrainian R18 drone in a file photograph',
    caption: 'Illustrative file photo of a Ukrainian R18 drone. Territorial Defense Forces of Ukraine via Wikimedia Commons, CC BY 4.0.',
    source: 'https://commons.wikimedia.org/wiki/File:Drone_R18,_Ukraine.jpg',
  },
  electricity: {
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Electricity_pylons_in_the_Philippines_Bulacan_17.jpg?width=1280', width: 1280, height: 853,
    alt: 'Electricity transmission pylons in Bulacan, Philippines',
    caption: 'File photo of electricity pylons in the Philippines. FBenjr123 via Wikimedia Commons, CC BY-SA 4.0.',
    source: 'https://commons.wikimedia.org/wiki/File:Electricity_pylons_in_the_Philippines_Bulacan_17.jpg',
  },
  palace: {
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Palacio_de_Malaca%C3%B1%C3%A1n%2C_Manila%2C_Filipinas%2C_2023-08-27%2C_DD_26.jpg?width=1280', width: 1280, height: 853,
    alt: 'Malacañang Palace in Manila',
    caption: 'File photo of Malacañang Palace. Diego Delso via Wikimedia Commons, CC BY-SA 4.0.',
    source: 'https://commons.wikimedia.org/wiki/File:Palacio_de_Malacañán,_Manila,_Filipinas,_2023-08-27,_DD_26.jpg',
  },
  church: {
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/St._Mary_Magdalene_Church.jpg?width=1280', width: 1280, height: 794,
    alt: 'St. Mary Magdalene Church in Cavite',
    caption: 'File photo of St. Mary Magdalene Church in Cavite. Armanbarbuco via Wikimedia Commons, CC BY-SA 3.0.',
    source: 'https://commons.wikimedia.org/wiki/File:St._Mary_Magdalene_Church.jpg',
  },
  wildfire: {
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/East_Attica_Wildfire%2C_Greece_%28MODIS_2024-08-15%29.jpg?width=1600', width: 1600, height: 1067,
    alt: 'Satellite file image of a major wildfire in East Attica, Greece',
    caption: 'Satellite file image of a major wildfire. NASA MODIS via Wikimedia Commons, public domain.',
    source: 'https://commons.wikimedia.org/wiki/File:East_Attica_Wildfire,_Greece_(MODIS_2024-08-15).jpg',
  },
  manila: {
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Manila_skyline%2C_Philippines.jpg?width=1280', width: 1280, height: 853,
    alt: 'Manila skyline in a file photograph',
    caption: 'File photo of the Manila skyline via Wikimedia Commons.',
    source: 'https://commons.wikimedia.org/wiki/File:Manila_skyline,_Philippines.jpg',
  },
};

const replacements = new Map([
  ['china-air-naval-drills-scarborough-shoal-august-2026', media.defense],
  ['cleopatra-barrera', media.cleopatra],
  ['filipino-centered-training-institution-cognita-vision', media.cognita],
  ['gaza-ceasefire-talks-rare-progress-no-final-deal', media.gaza],
  ['gaza-roadmap-disarmament-withdrawal-hurdles-august-2026', media.gaza],
  ['habagat-western-luzon-august-3-9-2026', media.storm],
  ['iran-denies-current-us-talks-hormuz-august-3-2026', media.hormuz],
  ['kyiv-ballistic-attack-patriot-shortage-august-2026', media.ukraine],
  ['lower-electricity-costs-system-loss-consumer-protection', media.electricity],
  ['marcos-authorizes-release-sara-duterte-tax-records', media.palace],
  ['marcos-tax-relief-workers-small-businesses', media.palace],
  ['middle-east-war-suez-red-sea-shipping-filipino-impact', media.hormuz],
  ['pbbm-sona-2026-accountability-delivery', media.palace],
  ['philippines-weather-habagat-rain-thunderstorms-august-2026', media.storm],
  ['russia-ukraine-missile-drone-attack-children-killed', media.ukraine],
  ['todays-headlines-august-2-2026', media.manila],
  ['todays-headlines-july-27-2026', media.manila],
  ['us-japan-joint-yen-intervention-august-3-2026', media.yen],
  ['virgin-mary-house-replica-alfonso-cavite-pilgrimage', media.church],
  ['why-websites-cost-and-how-senz-makes-them-accessible', media.senz],
  ['wildfires-europe-north-africa-canada-extreme-heat', media.wildfire],
  ['world-bank-philippines-growth-forecast-37-august-2026', media.worldBank],
]);

function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function bodyHasClass(html, className) {
  const classes = html.match(/<body\b[^>]*class=(['"])([^'"]*)\1/i)?.[2] ?? '';
  return new RegExp(`(?:^|\\s)${className}(?:\\s|$)`).test(classes);
}

function absoluteUrl(value = '') {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith('/') ? value : `/${value}`, site).href;
}

function imageType(src = '') {
  const clean = src.split(/[?#]/)[0].toLowerCase();
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.webp')) return 'image/webp';
  if (clean.endsWith('.avif')) return 'image/avif';
  return 'image/jpeg';
}

function metaContent(html, key, attr = 'property') {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta\\b[^>]*${attr}=(['"])${escaped}\\1[^>]*content=(['"])([^'"]*)\\2[^>]*>`, 'i'))?.[3]
    ?? html.match(new RegExp(`<meta\\b[^>]*content=(['"])([^'"]*)\\1[^>]*${attr}=(['"])${escaped}\\3[^>]*>`, 'i'))?.[2]
    ?? '';
}

function upsertMeta(html, key, value, attr = 'property') {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(value)}">`;
  const pattern = new RegExp(`<meta\\b[^>]*${attr}=(['"])${escaped}\\1[^>]*>`, 'i');
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/<\/head>/i, `${tag}</head>`);
}

function canonicalUrl(html, slug) {
  return html.match(/<link\b[^>]*rel=(['"])canonical\1[^>]*href=(['"])([^'"]+)\2[^>]*>/i)?.[3]
    ?? html.match(/<link\b[^>]*href=(['"])([^'"]+)\1[^>]*rel=(['"])canonical\3[^>]*>/i)?.[2]
    ?? `${site}/news/${slug}/`;
}

function stripTags(value = '') { return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function titleText(html) {
  return metaContent(html, 'og:title') || stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '') || stripTags(html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '').replace(/\s*\|.*$/, '') || 'FMB News report';
}
function descriptionText(html) { return metaContent(html, 'og:description') || metaContent(html, 'description', 'name') || 'Read the latest report from FMB News.'; }

function findArticleImage(html) {
  const classes = ['nc-story-media', 'fn10-article-media', 'senz-article-hero'];
  for (const className of classes) {
    const block = html.match(new RegExp(`<section\\b[^>]*class=(['"])[^'"]*\\b${className}\\b[^'"]*\\1[^>]*>[\\s\\S]*?<\\/section>`, 'i'))?.[0] ?? '';
    if (!block) continue;
    const attrs = block.match(/<img\b([^>]*)>/i)?.[1] ?? '';
    if (!attrs) continue;
    const src = attrs.match(/\bsrc=(['"])([^'"]+)\1/i)?.[2] ?? '';
    if (!src) continue;
    return { src, width: Number(attrs.match(/\bwidth=(['"])(\d+)\1/i)?.[2]) || 0, height: Number(attrs.match(/\bheight=(['"])(\d+)\1/i)?.[2]) || 0, alt: attrs.match(/\balt=(['"])([^'"]*)\1/i)?.[2] ?? '' };
  }
  return null;
}

function genericPhotoFor(slug, html) {
  const text = `${slug} ${titleText(html)} ${descriptionText(html)}`;
  if (/weather|storm|rain|habagat|typhoon|luis/i.test(text)) return media.storm;
  if (/gaza|israel|palestin/i.test(text)) return media.gaza;
  if (/ukraine|kyiv|russia|drone|missile/i.test(text)) return media.ukraine;
  if (/electric|power|energy|system loss/i.test(text)) return media.electricity;
  if (/marcos|sona|president|tax relief/i.test(text)) return media.palace;
  if (/china|scarborough|west philippine|defense|ayungin/i.test(text)) return media.defense;
  if (/iran|hormuz|suez|red sea|middle east/i.test(text)) return media.hormuz;
  if (/wildfire|heat|drought/i.test(text)) return media.wildfire;
  if (/church|virgin|pilgrim|cavite/i.test(text)) return media.church;
  if (/senz|website|marketing|business/i.test(text)) return media.senz;
  if (/cognita|training|education/i.test(text)) return media.cognita;
  return media.manila;
}

function pictureMarkup(photo, className = 'fn10-article-media') {
  const source = photo.source ? ` <a href="${escapeHtml(photo.source)}" target="_blank" rel="noopener noreferrer">Source</a>` : '';
  return `<section class="${className}" aria-label="Article image"><div class="wrap"><figure class="news-visual"><img src="${escapeHtml(photo.src)}" width="${photo.width}" height="${photo.height}" fetchpriority="high" decoding="async" sizes="(max-width: 660px) calc(100vw - 32px), 1200px" alt="${escapeHtml(photo.alt)}"><figcaption>${escapeHtml(photo.caption)}${source}</figcaption></figure></div></section>`;
}

function replaceArticleImage(html, photo) {
  const mediaPattern = /<section\b[^>]*class=(['"])[^'"]*\bnc-story-media\b[^'"]*\1[^>]*>[\s\S]*?<\/section>/i;
  if (mediaPattern.test(html)) return html.replace(mediaPattern, pictureMarkup(photo, 'nc-story-media'));
  const senzPattern = /<section\b[^>]*class=(['"])[^'"]*\bsenz-article-hero\b[^'"]*\1[^>]*>[\s\S]*?<\/section>/i;
  if (senzPattern.test(html)) return html.replace(senzPattern, (hero) => `${hero}${pictureMarkup(photo)}`);
  return html.replace(/<main\b[^>]*>/i, (main) => `${main}${pictureMarkup(photo)}`);
}

function addShareBar(html, canonical, title) {
  const encodedUrl = encodeURIComponent(canonical);
  const encodedTitle = encodeURIComponent(title);
  const bar = `<aside class="fn10-share-bar" aria-label="Share this FMB News report"><span class="fn10-share-label">Share this report</span><div class="fn10-share-links"><a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer">Facebook</a><a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener noreferrer">X</a><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer">LinkedIn</a><button type="button" data-fn10-share data-share-url="${escapeHtml(canonical)}" data-share-title="${escapeHtml(title)}">Share</button><span class="fn10-share-status" data-fn10-share-status aria-live="polite"></span></div></aside>`;
  let next = html.replace(/<aside\b[^>]*class=(['"])[^'"]*\bfn10-share-bar\b[^'"]*\1[^>]*>[\s\S]*?<\/aside>\s*/gi, '');
  const heroPattern = /<section\b[^>]*class=(['"])[^'"]*(?:nc-article-hero|senz-article-hero)[^'"]*\1[^>]*>[\s\S]*?<\/section>/i;
  if (heroPattern.test(next)) return next.replace(heroPattern, (hero) => `${hero}${bar}`);
  return next.replace(/<main\b[^>]*>/i, (main) => `${main}${bar}`);
}

function addShareScript(html) {
  const script = `<script data-fmb-news-share-v10>(()=>{const button=document.querySelector('[data-fn10-share]');if(!button)return;button.addEventListener('click',async()=>{const url=button.dataset.shareUrl||location.href;const title=button.dataset.shareTitle||document.title;const status=document.querySelector('[data-fn10-share-status]');try{if(navigator.share){await navigator.share({title,url});if(status)status.textContent='Shared.';}else{await navigator.clipboard.writeText(url);if(status)status.textContent='Link copied.';}}catch(error){if(error&&error.name==='AbortError')return;try{await navigator.clipboard.writeText(url);if(status)status.textContent='Link copied.';}catch{if(status)status.textContent='Copy the address from your browser.';}}});})();</script>`;
  return html.replace(/<script\b[^>]*data-fmb-news-share-v10[^>]*>[\s\S]*?<\/script>\s*/gi, '').replace(/<\/body>/i, `${script}</body>`);
}

function alignSocialMetadata(html, image, canonical, title, description) {
  const src = absoluteUrl(image.src);
  const entries = [
    ['og:type', 'article', 'property'], ['og:site_name', 'FMB News · FMB&CO.', 'property'], ['og:title', title, 'property'], ['og:description', description, 'property'], ['og:url', canonical, 'property'],
    ['og:image', src, 'property'], ['og:image:secure_url', src, 'property'], ['og:image:type', imageType(src), 'property'], ['og:image:width', String(image.width || 1200), 'property'], ['og:image:height', String(image.height || 630), 'property'], ['og:image:alt', image.alt || title, 'property'],
    ['twitter:card', 'summary_large_image', 'name'], ['twitter:title', title, 'name'], ['twitter:description', description, 'name'], ['twitter:image', src, 'name'], ['twitter:image:alt', image.alt || title, 'name'],
  ];
  let next = html;
  for (const [key, value, attr] of entries) next = upsertMeta(next, key, value, attr);
  return next;
}

function updateLandingCards(html, articleImages) {
  let next = html;
  for (const [slug, photo] of articleImages) {
    const pattern = new RegExp(`<article\\b[^>]*>[\\s\\S]*?href=(['"])/news/${slug}/\\1[\\s\\S]*?<\\/article>`, 'i');
    const match = next.match(pattern);
    if (!match) continue;
    let article = match[0];
    const imgTag = article.match(/<img\b[^>]*>/i)?.[0] ?? '';
    const src = imgTag.match(/\bsrc=(['"])([^'"]+)\1/i)?.[2] ?? '';
    if (imgTag && !svgPattern.test(src)) continue;
    const newImg = `<img src="${escapeHtml(photo.src)}" width="${photo.width || 1200}" height="${photo.height || 630}" loading="lazy" decoding="async" sizes="(max-width: 660px) 50vw, 33vw" alt="${escapeHtml(photo.alt || 'FMB News report image')}">`;
    article = imgTag ? article.replace(imgTag, newImg) : article.replace(/<figure\b([^>]*)>/i, `<figure$1>${newImg}`);
    article = article.replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/i, `<figcaption>${escapeHtml(photo.caption || 'FMB News file image.')}</figcaption>`);
    next = next.replace(match[0], article);
  }
  return next;
}

async function walkHtml(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walkHtml(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  return files;
}

const files = [...new Set((await Promise.all(roots.map(walkHtml))).flat())];
const articleFiles = files.filter((filePath) => /[\\/]news[\\/][^\\/]+[\\/]index\.html$/i.test(filePath));
const landingFiles = files.filter((filePath) => /[\\/](?:news|fmbnews)[\\/]index\.html$/i.test(filePath));
const articleImages = new Map();
let articles = 0;
let inserted = 0;
let replaced = 0;
let preserved = 0;

for (const filePath of articleFiles) {
  let html = await readFile(filePath, 'utf8');
  if (!bodyHasClass(html, 'news-story-route') || !bodyHasClass(html, 'news-signal-v10')) continue;
  const slug = path.basename(path.dirname(filePath));
  let image = findArticleImage(html);
  const needsImage = !image;
  const needsRaster = Boolean(image && svgPattern.test(image.src));

  if (needsImage || needsRaster) {
    const photo = replacements.get(slug) ?? genericPhotoFor(slug, html);
    html = replaceArticleImage(html, photo);
    image = { src: photo.src, width: photo.width, height: photo.height, alt: photo.alt, caption: photo.caption };
    if (needsImage) inserted += 1; else replaced += 1;
  } else {
    preserved += 1;
  }

  if (!image || (!rasterPattern.test(image.src) && !/^https?:\/\//i.test(image.src))) throw new Error(`FMB News article does not have a shareable raster image: ${filePath}`);

  const canonical = canonicalUrl(html, slug);
  const title = titleText(html);
  const description = descriptionText(html);
  html = alignSocialMetadata(html, image, canonical, title, description);
  html = addShareBar(html, canonical, title);
  html = addShareScript(html);

  for (const marker of ['og:image:width', 'og:image:height', 'twitter:image', 'fn10-share-bar', 'data-fmb-news-share-v10']) {
    if (!html.includes(marker)) throw new Error(`FMB News social sharing marker ${marker} missing: ${filePath}`);
  }

  articleImages.set(slug, { ...image, caption: replacements.get(slug)?.caption ?? 'FMB News file image.' });
  await writeFile(filePath, html, 'utf8');
  articles += 1;
}

let landings = 0;
for (const filePath of landingFiles) {
  let html = await readFile(filePath, 'utf8');
  if (!bodyHasClass(html, 'news-signal-v10')) continue;
  html = updateLandingCards(html, articleImages);
  await writeFile(filePath, html, 'utf8');
  landings += 1;
}

if (landings !== 2 || articles < 1 || articleImages.size !== articles) throw new Error(`FMB News media safeguard incomplete: ${landings} landing routes and ${articles} social-ready articles.`);

console.log(`Guaranteed visible raster media and social-ready cards across ${articles} FMB News reports; inserted ${inserted} missing image(s), replaced ${replaced} non-social editorial SVG(s), preserved ${preserved} existing raster photo(s) exactly, and synchronized ${landings} landing route(s).`);
