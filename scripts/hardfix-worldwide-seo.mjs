import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const worldRoot = path.join(root, 'dist', 'news', 'world');
const SITE = 'https://www.francinemariebautista.com';
const NEWS = `${SITE}/news/`;
const WORLD = `${NEWS}world/`;
const ORG_ID = `${NEWS}#organization`;
const WEBSITE_ID = `${NEWS}#website`;
const RESTORED_AT = '2026-09-16T03:26:42+08:00';
const BACKFILL_DAYS = new Set(Array.from({ length: 10 }, (_, index) => index + 5));
const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const escapeJson = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const decode = value => String(value || '')
  .replace(/<[^>]+>/g, ' ')
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&nbsp;', ' ')
  .replace(/\s+/g, ' ')
  .trim();

function canonical(html) {
  return html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i)?.[1]
    || html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["'][^>]*>/i)?.[1]
    || null;
}

function title(html) {
  return decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
}

function meta(html, key, value) {
  const pattern = new RegExp(`<meta\\s+${key}=["']${value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i');
  return decode(html.match(pattern)?.[1]);
}

function editionDate(slug) {
  const match = slug.match(/^([a-z]+)-(\d{1,2})-(\d{4})$/i);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  if (!month) return null;
  return `${match[3]}-${String(month).padStart(2, '0')}-${String(match[2]).padStart(2, '0')}`;
}

function addTwitterCards(html) {
  const ogTitle = meta(html, 'property', 'og:title') || title(html);
  const ogDescription = meta(html, 'property', 'og:description') || meta(html, 'name', 'description');
  const ogImage = meta(html, 'property', 'og:image');
  const tags = [
    ['twitter:card', 'summary_large_image'],
    ['twitter:title', ogTitle],
    ['twitter:description', ogDescription],
    ['twitter:image', ogImage],
  ].filter(([, content]) => content);
  for (const [name, content] of tags) {
    if (new RegExp(`<meta\\s+name=["']${name}["']`, 'i').test(html)) continue;
    const safe = content.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    html = html.replace('</head>', `<meta name="${name}" content="${safe}"></head>`);
  }
  return html;
}

function storiesFrom(html, pageUrl) {
  const stories = [];
  for (const match of html.matchAll(/<article\s+class=["']story["']\s+id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/article>/gi)) {
    const headline = decode(match[2].match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1]);
    if (!headline) continue;
    stories.push({ id: match[1], headline, url: `${pageUrl}#${match[1]}` });
  }
  return stories;
}

function injectSchema(html, graph) {
  html = html.replace(/<script\s+type=["']application\/ld\+json["']\s+data-fmb-worldwide-seo[^>]*>[\s\S]*?<\/script>/gi, '');
  const script = `<script type="application/ld+json" data-fmb-worldwide-seo>${escapeJson({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
  return html.replace('</head>', `${script}</head>`);
}

async function getEditions() {
  const editions = [];
  for (const entry of await readdir(worldRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const date = editionDate(entry.name);
    if (!date) continue;
    const file = path.join(worldRoot, entry.name, 'index.html');
    let html;
    try { html = await readFile(file, 'utf8'); } catch { continue; }
    const pageUrl = canonical(html);
    if (!pageUrl) continue;
    editions.push({ slug: entry.name, date, file, html, url: pageUrl, name: title(html) || `FMB Worldwide | ${date}` });
  }
  editions.sort((a, b) => b.date.localeCompare(a.date));
  return editions;
}

const editions = await getEditions();
const restored = editions.filter(({ slug, date, html }) => {
  const day = Number(slug.match(/-(\d{1,2})-2026$/)?.[1]);
  return date.startsWith('2026-09-') && BACKFILL_DAYS.has(day) && /Archive Backfill/i.test(html);
});

if (restored.length !== BACKFILL_DAYS.size) {
  throw new Error(`Worldwide SEO expected 10 September 5-14 archive backfills, found ${restored.length}.`);
}

for (const edition of restored) {
  let html = addTwitterCards(edition.html);
  const description = meta(html, 'name', 'description');
  const image = meta(html, 'property', 'og:image');
  const stories = storiesFrom(html, edition.url);
  if (!stories.length) throw new Error(`Worldwide SEO found no stories in ${edition.slug}.`);

  const pageId = `${edition.url}#page`;
  const storyListId = `${edition.url}#stories`;
  const graph = [
    {
      '@type': 'CollectionPage',
      '@id': pageId,
      url: edition.url,
      name: edition.name,
      description,
      inLanguage: 'en-PH',
      isPartOf: { '@id': `${WORLD}#page` },
      publisher: { '@id': ORG_ID },
      datePublished: RESTORED_AT,
      dateModified: RESTORED_AT,
      temporalCoverage: edition.date,
      ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: image } } : {}),
      mainEntity: { '@id': storyListId },
    },
    {
      '@type': 'ItemList',
      '@id': storyListId,
      name: `Stories in ${edition.name}`,
      numberOfItems: stories.length,
      itemListElement: stories.map((story, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: story.headline,
        url: story.url,
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${edition.url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'FMB News', item: NEWS },
        { '@type': 'ListItem', position: 2, name: 'FMB Worldwide', item: WORLD },
        { '@type': 'ListItem', position: 3, name: edition.name, item: edition.url },
      ],
    },
  ];

  html = injectSchema(html, graph);
  await writeFile(edition.file, html, 'utf8');
}

const indexFile = path.join(worldRoot, 'index.html');
let indexHtml = await readFile(indexFile, 'utf8');
indexHtml = addTwitterCards(indexHtml);
const indexUrl = canonical(indexHtml) || WORLD;
const indexDescription = meta(indexHtml, 'name', 'description');
const indexImage = meta(indexHtml, 'property', 'og:image');
const archiveList = editions.map((edition, index) => ({
  '@type': 'ListItem',
  position: index + 1,
  item: {
    '@type': 'CollectionPage',
    '@id': `${edition.url}#page`,
    url: edition.url,
    name: edition.name,
    temporalCoverage: edition.date,
  },
}));

indexHtml = injectSchema(indexHtml, [
  {
    '@type': 'CollectionPage',
    '@id': `${WORLD}#page`,
    url: indexUrl,
    name: title(indexHtml) || 'FMB Worldwide',
    description: indexDescription,
    inLanguage: 'en-PH',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORG_ID },
    dateModified: RESTORED_AT,
    ...(indexImage ? { primaryImageOfPage: { '@type': 'ImageObject', url: indexImage } } : {}),
    mainEntity: { '@id': `${WORLD}#editions` },
  },
  {
    '@type': 'ItemList',
    '@id': `${WORLD}#editions`,
    name: 'FMB Worldwide editions',
    numberOfItems: archiveList.length,
    itemListElement: archiveList,
  },
  {
    '@type': 'BreadcrumbList',
    '@id': `${WORLD}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'FMB News', item: NEWS },
      { '@type': 'ListItem', position: 2, name: 'FMB Worldwide', item: WORLD },
    ],
  },
]);
await writeFile(indexFile, indexHtml, 'utf8');

for (const edition of editions) {
  if (restored.some(item => item.slug === edition.slug)) continue;
  const social = addTwitterCards(edition.html);
  if (social !== edition.html) await writeFile(edition.file, social, 'utf8');
}

for (const edition of restored) {
  const checked = await readFile(edition.file, 'utf8');
  const raw = checked.match(/<script\s+type=["']application\/ld\+json["']\s+data-fmb-worldwide-seo[^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!raw) throw new Error(`Worldwide SEO schema missing from ${edition.slug}.`);
  JSON.parse(raw);
  if (!/twitter:card/i.test(checked)) throw new Error(`Worldwide Twitter card metadata missing from ${edition.slug}.`);
}

console.log(`Worldwide SEO hardened: ${restored.length} truthful archive schemas, ${editions.length} edition social cards, archive ItemList, breadcrumbs, canonical linkage, and crawl-safe restoration dates.`);
