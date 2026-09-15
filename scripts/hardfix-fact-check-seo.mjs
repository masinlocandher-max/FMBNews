import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const factRoot = path.join(newsRoot, 'fact-check');
const currentPath = path.join(root, 'content', 'fact-check', 'current.json');
const evidenceRoot = path.join(root, 'content', 'fact-check', 'evidence');
const origin = 'https://www.francinemariebautista.com';
const newsOrigin = `${origin}/news/`;

const current = JSON.parse(await readFile(currentPath, 'utf8'));

const escapeAttribute = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const absoluteUrl = (value = '') => {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${origin}${url}`;
  return `${newsOrigin}${url}`;
};

function setTitle(html, title) {
  const tag = `<title>${escapeAttribute(title)}</title>`;
  return /<title>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title>[\s\S]*?<\/title>/i, tag)
    : html.replace('</head>', `${tag}</head>`);
}

function setMeta(html, keyType, key, value) {
  const escaped = escapeAttribute(value);
  const matcher = new RegExp(`<meta\\s+${keyType}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
  const tag = `<meta ${keyType}="${escapeAttribute(key)}" content="${escaped}">`;
  return matcher.test(html) ? html.replace(matcher, tag) : html.replace('</head>', `${tag}</head>`);
}

function setCanonical(html, url) {
  const tag = `<link rel="canonical" href="${escapeAttribute(url)}">`;
  return /<link\s+rel=["']canonical["'][^>]*>/i.test(html)
    ? html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, tag)
    : html.replace('</head>', `${tag}</head>`);
}

function findHeroImage(html) {
  const match = html.match(/<figure\b[^>]*fmb-rights-cleared-figure[^>]*>[\s\S]*?<img\b[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/i);
  if (!match) return { url: '', alt: '' };
  return { url: absoluteUrl(match[1]), alt: match[2] || '' };
}

function patchArticleSchema(html, article, imageUrl) {
  let touched = false;
  html = html.replace(/<script\s+type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, raw) => {
    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
      let localTouch = false;
      for (const node of nodes) {
        if (!node || typeof node !== 'object') continue;
        const type = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
        if (!type.some(value => ['Article', 'NewsArticle', 'AnalysisNewsArticle', 'ReportageNewsArticle'].includes(String(value || '')))) continue;
        node['@type'] = 'NewsArticle';
        node.headline = article.title;
        node.alternativeHeadline = article.seo.title;
        node.description = article.seo.description;
        node.datePublished = article.publishedAt;
        node.dateModified = article.modifiedAt || article.publishedAt;
        node.articleSection = 'FMB Fact Check';
        node.genre = 'Fact Check';
        node.inLanguage = 'en-PH';
        node.isAccessibleForFree = true;
        node.keywords = article.seo.keywords;
        if (imageUrl) node.image = [imageUrl];
        localTouch = true;
      }
      if (!localTouch) return full;
      touched = true;
      return `<script type="application/ld+json"${attrs}>${JSON.stringify(parsed).replaceAll('<', '\\u003c')}</script>`;
    } catch {
      return full;
    }
  });
  if (!touched) throw new Error(`${article.slug}: no Article schema found for SEO enhancement`);
  return html;
}

function claimReview(article, record) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ClaimReview',
    url: `${origin}/news/fact-check/${article.slug}/`,
    claimReviewed: article.seo.claimReviewed,
    author: {
      '@type': 'NewsMediaOrganization',
      name: 'FMB News',
      alternateName: 'Filipino Media Bulletin',
      url: newsOrigin
    },
    itemReviewed: {
      '@type': 'Claim',
      appearance: {
        '@type': 'CreativeWork',
        url: record.claimSource.url
      }
    },
    reviewRating: {
      '@type': 'Rating',
      alternateName: article.rating
    }
  };
}

function breadcrumbs(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'FMB News', item: newsOrigin },
      { '@type': 'ListItem', position: 2, name: 'FMB Fact Check', item: `${newsOrigin}fact-check/` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${newsOrigin}fact-check/${article.slug}/` }
    ]
  };
}

let enhanced = 0;
for (const article of current) {
  if (!article?.seo?.title || !article?.seo?.description || !article?.seo?.claimReviewed || !Array.isArray(article?.seo?.keywords) || !article.seo.keywords.length) {
    throw new Error(`${article.slug}: incomplete SEO contract`);
  }
  if (article.seo.claimReviewed.length > 75) throw new Error(`${article.slug}: claimReviewed exceeds 75 characters`);

  const page = path.join(factRoot, article.slug, 'index.html');
  const record = JSON.parse(await readFile(path.join(evidenceRoot, `${article.slug}.json`), 'utf8'));
  let html = await readFile(page, 'utf8');
  const canonical = `${newsOrigin}fact-check/${article.slug}/`;
  const displayTitle = `${article.seo.title} | FMB News`;
  const hero = findHeroImage(html);
  if (!hero.url) throw new Error(`${article.slug}: localized Fact Check hero image missing before SEO pass`);

  html = setTitle(html, displayTitle);
  html = setCanonical(html, canonical);
  html = setMeta(html, 'name', 'description', article.seo.description);
  html = setMeta(html, 'name', 'robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
  html = setMeta(html, 'property', 'og:type', 'article');
  html = setMeta(html, 'property', 'og:site_name', 'FMB News');
  html = setMeta(html, 'property', 'og:locale', 'en_PH');
  html = setMeta(html, 'property', 'og:title', article.seo.title);
  html = setMeta(html, 'property', 'og:description', article.seo.description);
  html = setMeta(html, 'property', 'og:url', canonical);
  html = setMeta(html, 'property', 'og:image', hero.url);
  html = setMeta(html, 'property', 'og:image:alt', hero.alt || article.title);
  html = setMeta(html, 'property', 'article:published_time', article.publishedAt);
  html = setMeta(html, 'property', 'article:modified_time', article.modifiedAt || article.publishedAt);
  html = setMeta(html, 'property', 'article:section', 'FMB Fact Check');
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = setMeta(html, 'name', 'twitter:title', article.seo.title);
  html = setMeta(html, 'name', 'twitter:description', article.seo.description);
  html = setMeta(html, 'name', 'twitter:image', hero.url);
  html = setMeta(html, 'name', 'twitter:image:alt', hero.alt || article.title);
  html = patchArticleSchema(html, article, hero.url);

  if (!html.includes('data-fmb-claim-review')) {
    const script = `<script type="application/ld+json" data-fmb-claim-review>${JSON.stringify(claimReview(article, record)).replaceAll('<', '\\u003c')}</script>`;
    html = html.replace('</head>', `${script}</head>`);
  }
  if (!html.includes('data-fmb-fact-check-breadcrumbs')) {
    const script = `<script type="application/ld+json" data-fmb-fact-check-breadcrumbs>${JSON.stringify(breadcrumbs(article)).replaceAll('<', '\\u003c')}</script>`;
    html = html.replace('</head>', `${script}</head>`);
  }

  await writeFile(page, html, 'utf8');
  enhanced += 1;
}

const archivePath = path.join(factRoot, 'index.html');
let archive = await readFile(archivePath, 'utf8');
const archiveCanonical = `${newsOrigin}fact-check/`;
const archiveTitle = 'Philippines Fact Checks | FMB Fact Check';
const archiveDescription = 'Independent Philippines fact checks from FMB News, reviewing viral claims, public statements, court records, government documents and primary-source evidence.';
archive = setTitle(archive, `${archiveTitle} | FMB News`);
archive = setCanonical(archive, archiveCanonical);
archive = setMeta(archive, 'name', 'description', archiveDescription);
archive = setMeta(archive, 'property', 'og:type', 'website');
archive = setMeta(archive, 'property', 'og:site_name', 'FMB News');
archive = setMeta(archive, 'property', 'og:locale', 'en_PH');
archive = setMeta(archive, 'property', 'og:title', archiveTitle);
archive = setMeta(archive, 'property', 'og:description', archiveDescription);
archive = setMeta(archive, 'property', 'og:url', archiveCanonical);
archive = setMeta(archive, 'name', 'twitter:card', 'summary');
archive = setMeta(archive, 'name', 'twitter:title', archiveTitle);
archive = setMeta(archive, 'name', 'twitter:description', archiveDescription);

if (!archive.includes('data-fmb-fact-check-collection')) {
  const collection = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${archiveCanonical}#page`,
        url: archiveCanonical,
        name: archiveTitle,
        description: archiveDescription,
        inLanguage: 'en-PH',
        isPartOf: { '@id': `${newsOrigin}#website` },
        about: { '@id': `${newsOrigin}#organization` }
      },
      {
        '@type': 'ItemList',
        '@id': `${archiveCanonical}#current-fact-checks`,
        name: 'Latest FMB Fact Checks',
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: current.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: article.title,
          url: `${newsOrigin}fact-check/${article.slug}/`
        }))
      }
    ]
  };
  archive = archive.replace('</head>', `<script type="application/ld+json" data-fmb-fact-check-collection>${JSON.stringify(collection).replaceAll('<', '\\u003c')}</script></head>`);
}

await writeFile(archivePath, archive, 'utf8');
console.log(`Fact Check SEO enhanced: ${enhanced} current articles plus the archive received search-intent metadata, social cards, NewsArticle enrichment, ClaimReview markup and breadcrumbs.`);
