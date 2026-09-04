import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const SITE = 'https://www.francinemariebautista.com';
const NEWS = `${SITE}/news/`;
const ORG_ID = `${NEWS}#organization`;
const WEBSITE_ID = `${NEWS}#website`;
const FMB_PERSON_ID = 'https://francinemariebautista.com/#person';
const FMB_PROFILE = 'https://francinemariebautista.com/profile/';

async function walk(dir) {
  const files = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return files; }
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (entry.isFile() && entry.name === 'index.html') files.push(target);
  }
  return files;
}

const organization = () => ({
  '@type': 'NewsMediaOrganization',
  '@id': ORG_ID,
  name: 'FMB News',
  alternateName: 'Filipino Media Bulletin',
  url: NEWS,
  logo: {
    '@type': 'ImageObject',
    url: `${NEWS}assets/images/fmb-approved/fmb-news-official-transparent.webp`,
  },
  publishingPrinciples: `${NEWS}editorial-standards/`,
  ethicsPolicy: `${NEWS}editorial-standards/`,
  correctionsPolicy: `${NEWS}corrections/`,
  actionableFeedbackPolicy: `${NEWS}corrections/`,
  contactPoint: [{
    '@type': 'ContactPoint',
    contactType: 'corrections and editorial feedback',
    email: 'withlovefmb@gmail.com',
    availableLanguage: ['en', 'fil'],
  }],
});

const website = () => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: NEWS,
  name: 'FMB News',
  alternateName: 'Filipino Media Bulletin',
  inLanguage: 'en-PH',
  publisher: { '@id': ORG_ID },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${NEWS}search/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

function typeIncludes(node, wanted) {
  const type = node?.['@type'];
  const list = Array.isArray(type) ? type : [type];
  return list.some(value => wanted.includes(String(value || '')));
}

function patchArticleNode(node) {
  if (!node || typeof node !== 'object' || !typeIncludes(node, ['Article', 'NewsArticle', 'AnalysisNewsArticle', 'ReportageNewsArticle'])) return node;

  node.publisher = { '@id': ORG_ID };
  node.inLanguage = node.inLanguage || 'en-PH';
  if (node.isAccessibleForFree === undefined) node.isAccessibleForFree = true;

  const authorName = typeof node.author === 'string'
    ? node.author
    : (!Array.isArray(node.author) && node.author && typeof node.author === 'object' ? node.author.name : '');

  if (String(authorName || '').trim().toLowerCase() === 'francine marie bautista') {
    node.author = {
      '@type': 'Person',
      '@id': FMB_PERSON_ID,
      name: 'Francine Marie Bautista',
      url: FMB_PROFILE,
    };
  } else if (authorName && !Array.isArray(node.author)) {
    node.author = {
      '@type': 'Organization',
      name: authorName,
      url: `${NEWS}about/`,
    };
  }

  return node;
}

function patchArticleSchemas(html) {
  return html.replace(/<script\s+type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, raw) => {
    try {
      const parsed = JSON.parse(raw);
      let touched = false;
      if (typeIncludes(parsed, ['Article', 'NewsArticle', 'AnalysisNewsArticle', 'ReportageNewsArticle'])) {
        patchArticleNode(parsed);
        touched = true;
      }
      if (Array.isArray(parsed?.['@graph'])) {
        for (const node of parsed['@graph']) {
          if (typeIncludes(node, ['Article', 'NewsArticle', 'AnalysisNewsArticle', 'ReportageNewsArticle'])) {
            patchArticleNode(node);
            touched = true;
          }
        }
      }
      if (!touched) return full;
      return `<script type="application/ld+json"${attrs}>${JSON.stringify(parsed).replaceAll('<', '\\u003c')}</script>`;
    } catch {
      return full;
    }
  });
}

function normalizeRobots(html) {
  const existing = html.match(/<meta\s+name=["']robots["'][^>]*>/i)?.[0] || '';
  if (/noindex/i.test(existing)) return html;
  const tag = '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">';
  if (existing) return html.replace(existing, tag);
  return html.replace('</head>', `${tag}</head>`);
}

function addPublisherMeta(html) {
  if (/<meta\s+name=["']publisher["']/i.test(html)) return html;
  return html.replace('</head>', '<meta name="publisher" content="FMB News"></head>');
}

function addDiscoveryGraph(html, relative) {
  if (html.includes('data-fmb-discovery-schema')) return html;

  const graph = [organization(), website()];
  let page = null;

  if (relative === 'index.html') {
    page = {
      '@type': 'CollectionPage',
      '@id': `${NEWS}#page`,
      url: NEWS,
      name: 'FMB News | Filipino Media Bulletin',
      description: 'Verified facts, visible sources, meaningful context, and clear explanations for Filipino readers.',
      inLanguage: 'en-PH',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': ORG_ID },
    };
  } else if (relative === 'about/index.html') {
    page = {
      '@type': 'AboutPage',
      '@id': `${NEWS}about/#page`,
      url: `${NEWS}about/`,
      name: 'About FMB News',
      inLanguage: 'en-PH',
      isPartOf: { '@id': WEBSITE_ID },
      mainEntity: { '@id': ORG_ID },
    };
  } else if (relative === 'editorial-standards/index.html') {
    page = {
      '@type': 'WebPage',
      '@id': `${NEWS}editorial-standards/#page`,
      url: `${NEWS}editorial-standards/`,
      name: 'FMB News Editorial Standards',
      inLanguage: 'en-PH',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': ORG_ID },
    };
  } else if (relative === 'corrections/index.html') {
    page = {
      '@type': 'WebPage',
      '@id': `${NEWS}corrections/#page`,
      url: `${NEWS}corrections/`,
      name: 'FMB News Corrections Policy',
      inLanguage: 'en-PH',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': ORG_ID },
    };
  }

  if (!page) return html;
  graph.push(page);
  const script = `<script type="application/ld+json" data-fmb-discovery-schema>${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')}</script>`;
  return html.replace('</head>', `${script}</head>`);
}

function addTrustLinks(html, relative) {
  if (relative !== 'index.html') return html;

  if (!html.includes('/news/editorial-standards/')) {
    html = html.replace(
      '<a href="/news/about/">About FMB News</a>',
      '<a href="/news/about/">About FMB News</a><a href="/news/editorial-standards/">Editorial Standards</a>'
    );
  }

  html = html.replace(
    /<a href="mailto:withlovefmb@gmail\.com\?subject=FMB%20News%20Correction">Corrections<\/a>/i,
    '<a href="/news/corrections/">Corrections</a>'
  );

  return html;
}

let pages = 0;
let articleSchemas = 0;
for (const file of await walk(newsRoot)) {
  const relative = path.relative(newsRoot, file).replaceAll('\\', '/');
  let html = await readFile(file, 'utf8');
  const beforeArticles = html;
  html = patchArticleSchemas(html);
  if (html !== beforeArticles) articleSchemas++;
  html = normalizeRobots(html);
  html = addPublisherMeta(html);
  html = addDiscoveryGraph(html, relative);
  html = addTrustLinks(html, relative);
  await writeFile(file, html, 'utf8');
  pages++;
}

console.log(`AI/search discovery hardening applied to ${pages} FMB News pages; ${articleSchemas} pages received normalized publisher/author article schema. Editorial standards and corrections policies are exposed as canonical trust surfaces.`);
