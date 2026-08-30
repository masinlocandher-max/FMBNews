import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const briefSourceRoot = path.join(root, 'apps', 'withlovefmb', 'content', 'news', 'morning-special');
const articleSourceRoot = path.join(root, 'apps', 'withlovefmb', 'content', 'news', 'articles');
const socialRoot = path.join(dist, 'assets', 'images', 'news', 'social');
const canonicalOrigin = 'https://www.francinemariebautista.com';
const migratedDates = ['2026-08-11','2026-08-12','2026-08-13','2026-08-14','2026-08-15','2026-08-16','2026-08-17'];
const fallbackPattern = /(?:fmb-news-editorial-fallback|newsroom-editorial-fallback|editorial-fallback|fmb-news-(?:primary-logo|white-transparent|official)|(?:^|[-_/])(?:logo|wordmark|masthead)(?:[-_.?/]|$))/i;

const esc = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const publicBriefCopy = (value) => String(value ?? '')
  .replace(/Today[’']s Morning Special/gi, 'FMB Brief')
  .replace(/Morning Special/gi, 'FMB Brief');

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function walk(directory, extension) {
  const files = [];
  let entries = [];
  try { entries = await readdir(directory, { withFileTypes: true }); } catch (error) {
    if (error?.code === 'ENOENT') return files;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target, extension));
    else if (entry.isFile() && (!extension || entry.name.endsWith(extension))) files.push(target);
  }
  return files;
}

function required(value, label, source) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${source}: ${label} is required`);
  return value.trim();
}

function validDate(value, label, source) {
  const text = required(value, label, source);
  if (Number.isNaN(new Date(text).getTime())) throw new Error(`${source}: ${label} is invalid`);
  return text;
}

function validHttpUrl(value, label, source) {
  const text = required(value, label, source);
  let parsed;
  try { parsed = new URL(text); } catch { throw new Error(`${source}: ${label} is not a valid URL`); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`${source}: ${label} must use HTTP(S)`);
  return parsed.href;
}

function briefRoute(date) {
  const parsed = new Date(`${date}T12:00:00+08:00`);
  const month = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Manila', month:'long' }).format(parsed).toLowerCase();
  const day = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Manila', day:'numeric' }).format(parsed);
  const year = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Manila', year:'numeric' }).format(parsed);
  return `/news/fmb-brief-${month}-${day}-${year}/`;
}

function longDate(date) {
  return new Intl.DateTimeFormat('en-PH', { timeZone:'Asia/Manila', weekday:'long', day:'numeric', month:'long', year:'numeric' })
    .format(new Date(`${date}T12:00:00+08:00`));
}

function shortDate(date) {
  return new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Manila', day:'2-digit', month:'short', year:'numeric' })
    .format(new Date(`${date}T12:00:00+08:00`));
}

function clockPht(value) {
  return new Intl.DateTimeFormat('en-PH', { timeZone:'Asia/Manila', hour:'numeric', minute:'2-digit', hour12:true })
    .format(new Date(value)).replace(' ', '').toLowerCase();
}

function toLocalAsset(url) {
  if (typeof url !== 'string' || !url) return '';
  if (url.startsWith('/assets/')) return path.join(dist, url.slice(1));
  try {
    const parsed = new URL(url);
    if (parsed.origin === canonicalOrigin && parsed.pathname.startsWith('/assets/')) return path.join(dist, parsed.pathname.slice(1));
  } catch {}
  return '';
}

async function createSafeSocialCrop(inputFile, outputFile, focusX = 50, focusY = 50) {
  const image = sharp(inputFile, { failOn:'error' }).rotate();
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error(`Cannot determine dimensions for ${inputFile}`);
  const targetRatio = 1200 / 630;
  let left = 0;
  let top = 0;
  let cropWidth = meta.width;
  let cropHeight = meta.height;
  const fx = Math.max(0, Math.min(100, Number(focusX) || 50)) / 100;
  const fy = Math.max(0, Math.min(100, Number(focusY) || 50)) / 100;
  if ((meta.width / meta.height) > targetRatio) {
    cropWidth = Math.max(1, Math.round(meta.height * targetRatio));
    const desiredCenter = meta.width * fx;
    left = Math.round(Math.max(0, Math.min(meta.width - cropWidth, desiredCenter - cropWidth / 2)));
  } else if ((meta.width / meta.height) < targetRatio) {
    cropHeight = Math.max(1, Math.round(meta.width / targetRatio));
    const desiredCenter = meta.height * fy;
    top = Math.round(Math.max(0, Math.min(meta.height - cropHeight, desiredCenter - cropHeight / 2)));
  }
  await mkdir(path.dirname(outputFile), { recursive:true });
  await sharp(inputFile, { failOn:'error' })
    .rotate()
    .extract({ left, top, width:cropWidth, height:cropHeight })
    .resize(1200, 630, { fit:'fill' })
    .webp({ quality:88, effort:5 })
    .toFile(outputFile);
  return { width:1200, height:630, sourceWidth:meta.width, sourceHeight:meta.height, focusX:Number(focusX) || 50, focusY:Number(focusY) || 50 };
}

function replaceMeta(html, selector, value) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*${selector})[^>]*>`, 'i');
  const match = html.match(pattern);
  if (!match) return html;
  const nextTag = match[0].replace(/\bcontent=(['"])[\s\S]*?\1/i, `content="${esc(value)}"`);
  return html.replace(match[0], nextTag);
}

function ensureMeta(html, tag) {
  return html.includes(tag.match(/(?:property|name)="([^"]+)"/)?.[1] || '__never__') ? html : html.replace('</head>', `${tag}</head>`);
}

function applySocialMeta(html, socialUrl) {
  const absolute = `${canonicalOrigin}${socialUrl}`;
  html = replaceMeta(html, `property=(['"])og:image\\1`, absolute);
  html = ensureMeta(html, `<meta property="og:image" content="${absolute}">`);
  html = replaceMeta(html, `name=(['"])twitter:image\\1`, absolute);
  if (!/<meta\b[^>]*name=(['"])twitter:image\1/i.test(html)) html = html.replace('</head>', `<meta name="twitter:image" content="${absolute}"></head>`);
  html = replaceMeta(html, `property=(['"])og:image:width\\1`, '1200');
  if (!/<meta\b[^>]*property=(['"])og:image:width\1/i.test(html)) html = html.replace('</head>', '<meta property="og:image:width" content="1200"></head>');
  html = replaceMeta(html, `property=(['"])og:image:height\\1`, '630');
  if (!/<meta\b[^>]*property=(['"])og:image:height\1/i.test(html)) html = html.replace('</head>', '<meta property="og:image:height" content="630"></head>');
  if (!/<meta\b[^>]*name=(['"])twitter:card\1/i.test(html)) html = html.replace('</head>', '<meta name="twitter:card" content="summary_large_image"></head>');
  else html = replaceMeta(html, `name=(['"])twitter:card\\1`, 'summary_large_image');
  return html;
}

function briefHead(brief, socialUrl) {
  const route = briefRoute(brief.date);
  const canonical = `${canonicalOrigin}${route}`;
  const title = publicBriefCopy(brief.title);
  const description = publicBriefCopy(brief.deck);
  const social = `${canonicalOrigin}${socialUrl}`;
  return `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)} | FMB Brief</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#35113f"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:site_name" content="FMB News"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${social}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(brief.hero.alt)}"><meta property="article:published_time" content="${esc(brief.publishedAt)}"><meta property="article:section" content="FMB Brief"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${social}"><link rel="stylesheet" href="/assets/css/fmb-news-final.css?v=20260807"><link rel="stylesheet" href="/assets/css/fmb-brief.css?v=20260820"><link rel="stylesheet" href="/assets/css/fmb-news-identity-lockup.css?v=20260820"><script src="/assets/js/fmb-news-approved.js?v=20260807" defer></script><script type="application/ld+json">${JSON.stringify({ '@context':'https://schema.org','@type':'NewsArticle',headline:title,datePublished:brief.publishedAt,dateModified:brief.publishedAt,inLanguage:'en-PH',isAccessibleForFree:true,image:social,author:{'@type':'Organization',name:'FMB News Desk'},publisher:{'@type':'Organization',name:'FMB News — Filipino Media Bulletin',url:`${canonicalOrigin}/news/`},mainEntityOfPage:canonical }).replaceAll('<','\\u003c')}</script></head>`;
}

function header() {
  return `<header class="brief-network"><div class="brief-shell brief-network-row"><a class="brief-news-logo" href="/news/" aria-label="FMB News, Filipino Media Bulletin"><img data-fmb-asset="logo" alt="FMB News, Filipino Media Bulletin"></a><nav aria-label="FMB News sections"><a href="/news/">News</a><a href="/news/fmb-brief/" aria-current="page">FMB Brief</a><a href="/news/#stories">Philippines</a><a href="/news/#stories">World</a><a href="/news/about/">About</a></nav><a class="brief-menu-link" href="/news/fmb-brief/">All Briefs</a></div></header>`;
}

function footer() {
  return `<footer class="brief-footer"><div class="brief-shell brief-footer-row"><div><a class="brief-news-logo" href="/news/" aria-label="FMB News, Filipino Media Bulletin"><img data-fmb-asset="logo" alt="FMB News, Filipino Media Bulletin"></a><p>FMB Brief is the distinct daily newsletter from FMB News, Filipino Media Bulletin.</p></div><nav><a href="/news/">FMB News</a><a href="/news/fmb-brief/">Brief Archive</a><a href="/news/about/">About</a></nav></div></footer>`;
}

function renderBrief(brief, socialUrl) {
  const title = publicBriefCopy(brief.title);
  const deck = publicBriefCopy(brief.deck);
  const cutoff = clockPht(brief.publishedAt);
  const sources = (story) => story.sources.map((source) => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>`).join('');
  const rundown = brief.stories.slice(0, 6).map((story) => `<div><small>${esc(story.kicker)}</small><strong>${esc(story.headline)}</strong></div>`).join('');
  return `<!doctype html><html lang="en-PH">${briefHead(brief,socialUrl)}<body class="brief-route"><div class="brief-edition-bar"><div class="brief-shell brief-edition-row"><strong>FMB Brief</strong><span>${esc(longDate(brief.date))} · Cutoff ${esc(cutoff)} PHT</span></div></div>${header()}<main><section class="brief-mast"><div class="brief-shell"><div class="brief-mast-top"><h1 class="brief-wordmark">FMB Brief<span>The daily newsletter from FMB News</span></h1><div class="brief-datebox"><strong>${esc(longDate(brief.date).replace(/^[^,]+,\s*/,''))}</strong><span>Philippines + World · ${esc(cutoff)} PHT</span></div></div><div class="brief-intro"><h1>${esc(title.replace(/^FMB Brief:\s*/i,''))}</h1><p class="deck">${esc(deck)}</p></div></div></section><figure class="brief-shell brief-hero"><img src="${esc(brief.hero.src)}" alt="${esc(brief.hero.alt)}" fetchpriority="high"><figcaption class="brief-credit">${esc(brief.hero.caption)} ${esc(brief.hero.credit)}. <a href="${esc(brief.hero.sourceUrl)}" target="_blank" rel="noopener noreferrer">Photo source</a>${brief.hero.licenseUrl ? ` · <a href="${esc(brief.hero.licenseUrl)}" target="_blank" rel="noopener noreferrer">License</a>` : ''}</figcaption></figure><div class="brief-shell"><section class="brief-rundown">${rundown}</section><div class="brief-content"><div class="brief-stream">${brief.stories.map((story) => `<section class="brief-story"><div class="brief-section-label">${esc(story.kicker)}</div><h2>${esc(story.headline)}</h2><p><strong>${esc(story.deck)}</strong></p>${story.body.map((paragraph) => `<p>${esc(publicBriefCopy(paragraph))}</p>`).join('')}<div class="brief-source"><b>Sources:</b>${sources(story)}</div></section>`).join('')}</div><aside class="brief-side"><section class="brief-side-card"><h3>The signal</h3><p>${esc(deck)}</p></section><section class="brief-side-card"><h3>About this edition</h3><p>FMB Brief is one daily briefing, separate from the individual reports and explainers published by FMB News.</p></section><section class="brief-side-card"><h3>Editorial standard</h3><p>Facts, attributed reporting, analysis and uncertainty remain clearly distinguished. Source links are preserved so readers can inspect the evidence behind the brief.</p></section></aside></div><section class="brief-watch"><p class="label">FMB Brief</p><h2>One issue, not another feed.</h2><p>The important developments are gathered here once a day. Individual FMB News articles remain separate, allowing readers to go deeper without turning the daily brief into a duplicate newsroom feed.</p></section></div></main>${footer()}</body></html>`;
}

async function loadMigratedBriefs() {
  const briefs = [];
  for (const date of migratedDates) {
    const source = path.join(briefSourceRoot, `${date}.json`);
    const raw = JSON.parse(await readFile(source, 'utf8'));
    validDate(raw.publishedAt, 'publishedAt', source);
    if (raw.date !== date) throw new Error(`${source}: date mismatch`);
    const hero = raw.hero || {};
    required(hero.src, 'hero.src', source);
    required(hero.alt, 'hero.alt', source);
    required(hero.caption, 'hero.caption', source);
    required(hero.credit, 'hero.credit', source);
    validHttpUrl(hero.sourceUrl, 'hero.sourceUrl', source);
    if (fallbackPattern.test(hero.src)) throw new Error(`${source}: generic fallback cannot serve FMB Brief`);
    if (!Array.isArray(raw.stories) || !raw.stories.length) throw new Error(`${source}: stories are required`);
    const stories = raw.stories.map((story, index) => ({
      kicker: required(story.kicker, `stories[${index}].kicker`, source),
      headline: required(story.headline, `stories[${index}].headline`, source),
      deck: required(story.deck, `stories[${index}].deck`, source),
      body: Array.isArray(story.body) ? story.body.map((paragraph, p) => required(paragraph, `stories[${index}].body[${p}]`, source)) : [],
      sources: Array.isArray(story.sources) ? story.sources.map((item, s) => ({ label:required(item.label, `stories[${index}].sources[${s}].label`, source), url:validHttpUrl(item.url, `stories[${index}].sources[${s}].url`, source) })) : [],
    }));
    if (stories.some((story) => !story.body.length || !story.sources.length)) throw new Error(`${source}: each story needs body text and sources`);
    briefs.push({ date, publishedAt:raw.publishedAt, title:required(raw.title,'title',source), deck:required(raw.deck,'deck',source), hero, stories });
  }
  return briefs;
}

async function publishMigratedBriefs() {
  const briefs = await loadMigratedBriefs();
  const manifest = [];
  for (const brief of briefs) {
    const heroFile = toLocalAsset(brief.hero.src);
    if (!heroFile || !(await exists(heroFile))) throw new Error(`${brief.date}: hero image asset is missing from dist (${brief.hero.src})`);
    const socialUrl = `/assets/images/news/social/fmb-brief-${brief.date}-1200x630.webp`;
    const socialFile = path.join(dist, socialUrl.slice(1));
    const crop = await createSafeSocialCrop(heroFile, socialFile, brief.hero.focusX ?? 50, brief.hero.focusY ?? 50);
    const route = briefRoute(brief.date);
    const output = path.join(dist, route.replace(/^\//,''), 'index.html');
    await mkdir(path.dirname(output), { recursive:true });
    await writeFile(output, renderBrief(brief, socialUrl), 'utf8');
    manifest.push({ type:'fmb-brief', date:brief.date, route, socialUrl, sourceImage:brief.hero.src, ...crop });
  }
  return { briefs, manifest };
}

function archiveEntry(brief, socialUrl) {
  const route = briefRoute(brief.date);
  const title = publicBriefCopy(brief.title).replace(/^FMB Brief:\s*/i,'');
  return `<a class="brief-issue" href="${route}"><time datetime="${brief.date}">${esc(shortDate(brief.date))}</time><div><h2>${esc(title)}</h2><p>${esc(publicBriefCopy(brief.deck))}</p></div><img src="${esc(socialUrl)}" alt="${esc(brief.hero.alt)}" loading="lazy"></a>`;
}

async function updateBriefArchive(briefs, manifest) {
  const file = path.join(newsRoot, 'fmb-brief', 'index.html');
  let html = await readFile(file, 'utf8');
  for (const date of migratedDates) {
    const route = briefRoute(date).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`<a\\b[^>]*href=["']${route}["'][^>]*>[\\s\\S]*?<\\/a>`, 'gi'), '');
  }
  const rows = [...briefs].sort((a,b) => b.date.localeCompare(a.date)).map((brief) => {
    const item = manifest.find((entry) => entry.date === brief.date);
    return archiveEntry(brief, item.socialUrl);
  }).join('');
  const insertion = /(?=<a class="brief-issue" href="\/news\/(?:todays-headlines-august-2-2026|fmb-brief-august-10-2026)\/)/i;
  if (insertion.test(html)) html = html.replace(insertion, rows);
  else html = html.replace('</div></div></section><section class="brief-method">', `${rows}</div></div></section><section class="brief-method">`);
  if (!html.includes('fmb-news-identity-lockup.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/assets/css/fmb-news-identity-lockup.css?v=20260820"></head>');
  await writeFile(file, html, 'utf8');
}

function articlePublicRoute(slug) { return `/news/${slug}/`; }

async function generateArticleSocialImages() {
  const manifest = [];
  const repairQueue = [];
  for (const file of await walk(articleSourceRoot, '.json')) {
    const raw = JSON.parse(await readFile(file, 'utf8'));
    if (raw.status && raw.status !== 'published') continue;
    const slug = raw.slug || path.basename(file, '.json');
    const image = raw.image || {};
    const reasons = [];
    if (image.kind === 'editorial-fallback' || fallbackPattern.test(image.url || '')) reasons.push('generic editorial fallback');
    if (!image.credit) reasons.push('missing visible image credit metadata');
    if (!image.sourceUrl) reasons.push('missing image source URL');
    if (reasons.length) {
      repairQueue.push({ slug, headline:raw.headline || raw.seoTitle || slug, publishedAt:raw.publishedAt || null, currentImage:image.url || null, reasons, priority:raw.publishedAt || '' });
      continue;
    }
    const articleFile = path.join(dist, 'news', slug, 'index.html');
    if (!(await exists(articleFile))) continue;
    let html = await readFile(articleFile, 'utf8');
    const ogImage = html.match(/<meta\b[^>]*property=(['"])og:image\1[^>]*content=(['"])([^'"]+)\2/i)?.[3] || image.url || '';
    if (fallbackPattern.test(ogImage)) {
      repairQueue.push({ slug, headline:raw.headline || raw.seoTitle || slug, publishedAt:raw.publishedAt || null, currentImage:ogImage, reasons:['public page still resolves to generic fallback'], priority:raw.publishedAt || '' });
      continue;
    }
    const sourceFile = toLocalAsset(ogImage) || toLocalAsset(image.url);
    if (!sourceFile || !(await exists(sourceFile))) {
      repairQueue.push({ slug, headline:raw.headline || raw.seoTitle || slug, publishedAt:raw.publishedAt || null, currentImage:ogImage || image.url || null, reasons:['share-image source is not a local build asset'], priority:raw.publishedAt || '' });
      continue;
    }
    const socialUrl = `/assets/images/news/social/${slug}-1200x630.webp`;
    const socialFile = path.join(dist, socialUrl.slice(1));
    const crop = await createSafeSocialCrop(sourceFile, socialFile, image.focusX ?? 50, image.focusY ?? 50);
    html = applySocialMeta(html, socialUrl);
    await writeFile(articleFile, html, 'utf8');
    manifest.push({ type:'article', slug, route:articlePublicRoute(slug), socialUrl, sourceImage:ogImage || image.url, ...crop });
  }
  repairQueue.sort((a,b) => String(b.priority).localeCompare(String(a.priority)) || a.slug.localeCompare(b.slug));
  await writeFile(path.join(newsRoot, 'image-repair-queue.json'), JSON.stringify({ generatedAt:new Date().toISOString(), policy:'Keep articles public while replacing generic fallback imagery with related, rights-cleared editorial photographs. New articles should not enter the queue.', count:repairQueue.length, items:repairQueue }, null, 2), 'utf8');
  return { manifest, repairQueue };
}

async function redirectLegacyMorningSpecialRoutes() {
  let redirected = 0;
  for (const file of await walk(newsRoot, '.html')) {
    const relative = path.relative(newsRoot, file).replaceAll(path.sep,'/');
    if (relative.startsWith('fmb-brief')) continue;
    const html = await readFile(file, 'utf8');
    if (!/Morning Special/i.test(html)) continue;
    const date = html.match(/2026-08-(?:11|12|13|14|15|16|17)/)?.[0];
    if (!date) continue;
    const target = briefRoute(date);
    const redirect = `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${canonicalOrigin}${target}"><meta http-equiv="refresh" content="0;url=${target}"><title>FMB Brief</title></head><body><p>This edition is now in <a href="${target}">FMB Brief</a>.</p><script>location.replace(${JSON.stringify(target)});</script></body></html>`;
    await writeFile(file, redirect, 'utf8');
    redirected += 1;
  }
  return redirected;
}

async function updateSitemap(briefs, manifest) {
  const file = path.join(dist, 'sitemap.xml');
  if (!(await exists(file))) return;
  let xml = await readFile(file, 'utf8');
  for (const brief of briefs) {
    const route = briefRoute(brief.date);
    const loc = `${canonicalOrigin}${route}`;
    if (xml.includes(`<loc>${loc}</loc>`)) continue;
    const social = manifest.find((item) => item.date === brief.date)?.socialUrl || brief.hero.src;
    const entry = `  <url><loc>${loc}</loc><lastmod>${brief.date}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority><image:image><image:loc>${canonicalOrigin}${social}</image:loc><image:title>${esc(publicBriefCopy(brief.title))}</image:title></image:image></url>\n`;
    xml = xml.replace('</urlset>', `${entry}</urlset>`);
  }
  await writeFile(file, xml, 'utf8');
}

async function auditFinalBrief() {
  const failures = [];
  const archive = await readFile(path.join(newsRoot,'fmb-brief','index.html'),'utf8');
  if (/Morning Special/i.test(archive)) failures.push('FMB Brief archive still exposes Morning Special branding');
  for (const date of migratedDates) {
    const route = briefRoute(date);
    if (!archive.includes(`href="${route}"`)) failures.push(`${date}: missing from visible FMB Brief archive`);
    const file = path.join(dist, route.replace(/^\//,''), 'index.html');
    if (!(await exists(file))) { failures.push(`${date}: public FMB Brief route missing`); continue; }
    const html = await readFile(file,'utf8');
    if (/Morning Special/i.test(html)) failures.push(`${date}: legacy Morning Special wording remains`);
    if (!/Filipino Media Bulletin/i.test(html)) failures.push(`${date}: Filipino Media Bulletin identity missing`);
    if (!/<meta\b[^>]*property=(['"])og:image:width\1[^>]*content=(['"])1200\2/i.test(html)) failures.push(`${date}: social image width metadata missing`);
    if (!/<meta\b[^>]*property=(['"])og:image:height\1[^>]*content=(['"])630\2/i.test(html)) failures.push(`${date}: social image height metadata missing`);
    if (!/<figcaption\b[^>]*class=(['"])[^'"]*brief-credit[^'"]*\1/i.test(html)) failures.push(`${date}: visible image credit missing`);
  }
  if (failures.length) throw new Error(`FMB Brief finalization audit failed:\n${failures.join('\n')}`);
}

await rm(socialRoot, { recursive:true, force:true });
await mkdir(socialRoot, { recursive:true });
const migrated = await publishMigratedBriefs();
await updateBriefArchive(migrated.briefs, migrated.manifest);
const articleSocial = await generateArticleSocialImages();
const redirected = await redirectLegacyMorningSpecialRoutes();
await updateSitemap(migrated.briefs, migrated.manifest);
await auditFinalBrief();
const socialManifest = {
  generatedAt:new Date().toISOString(),
  standard:{ width:1200, height:630, ratio:'1.91:1', format:'webp', focalPolicy:'focusX/focusY centered inside the crop; 50/50 default', purpose:'Dedicated Open Graph / Twitter preview imagery. Article display images remain independent.' },
  migratedBriefs:migrated.manifest,
  articles:articleSocial.manifest,
  repairQueueCount:articleSocial.repairQueue.length,
};
await writeFile(path.join(newsRoot,'social-image-manifest.json'), JSON.stringify(socialManifest,null,2), 'utf8');
console.log(`FMB Brief finalization complete: migrated ${migrated.briefs.length} August 11–17 edition(s), redirected ${redirected} legacy Morning Special route(s), generated ${migrated.manifest.length + articleSocial.manifest.length} dedicated 1200×630 social image(s), and queued ${articleSocial.repairQueue.length} article image repair(s) without unpublishing them.`);
