import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const slug = 'multifaceted-impact-all-purpose-kween-yasmin-filipino-digital-culture';
const articlePath = path.join(root, 'dist', 'news', slug, 'index.html');
const canonical = `https://www.francinemariebautista.com/news/${slug}/`;
const title = 'The Multifaceted Impact of the All-Purpose Kween: Understanding Kween Yasmin’s Place in Filipino Digital Culture';
const description = 'A fun but evidence-based FMB News cultural study of Kween Yasmin, Filipino digital culture, meme circulation, creator entrepreneurship, internet celebrity and the meaning of the All-Purpose Kween.';
const image = 'https://www.francinemariebautista.com/assets/images/fmbnews/kween-yasmin-multifaceted-impact.jpeg';
const imageWidth = 1536;
const imageHeight = 768;
const published = '2026-08-11T08:38:00+08:00';
const modified = new Date().toISOString();

const esc = (value) => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function upsertMeta(html, attr, key, value) {
  const re = new RegExp(`<meta\\s+${attr}=["']${key.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\$&')}["']\\s+content=["'][^"']*["']\\s*\\/?\\s*>`, 'i');
  const tag = `<meta ${attr}="${esc(key)}" content="${esc(value)}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `${tag}\n</head>`);
}

let html = await readFile(articlePath, 'utf8');

html = upsertMeta(html, 'name', 'description', description);
html = upsertMeta(html, 'name', 'robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
html = upsertMeta(html, 'name', 'author', 'FMB News');
html = upsertMeta(html, 'name', 'keywords', 'Kween Yasmin, Yasmin Marie Asistido, All-Purpose Kween, Filipino digital culture, Filipino internet culture, Philippine memes, creator economy Philippines, viral Filipino personalities');
html = upsertMeta(html, 'property', 'og:site_name', 'FMB News');
html = upsertMeta(html, 'property', 'og:locale', 'en_PH');
html = upsertMeta(html, 'property', 'og:url', canonical);
html = upsertMeta(html, 'property', 'og:type', 'article');
html = upsertMeta(html, 'property', 'og:title', title);
html = upsertMeta(html, 'property', 'og:description', description);
html = upsertMeta(html, 'property', 'og:image', image);
html = upsertMeta(html, 'property', 'og:image:secure_url', image);
html = upsertMeta(html, 'property', 'og:image:type', 'image/jpeg');
html = upsertMeta(html, 'property', 'og:image:width', String(imageWidth));
html = upsertMeta(html, 'property', 'og:image:height', String(imageHeight));
html = upsertMeta(html, 'property', 'og:image:alt', 'The Multifaceted Impact of the All-Purpose Kween featuring Kween Yasmin');
html = upsertMeta(html, 'property', 'article:section', 'Culture');
html = upsertMeta(html, 'property', 'article:published_time', published);
html = upsertMeta(html, 'property', 'article:modified_time', modified);
html = upsertMeta(html, 'name', 'twitter:card', 'summary_large_image');
html = upsertMeta(html, 'name', 'twitter:title', title);
html = upsertMeta(html, 'name', 'twitter:description', description);
html = upsertMeta(html, 'name', 'twitter:image', image);
html = upsertMeta(html, 'name', 'twitter:image:alt', 'The Multifaceted Impact of the All-Purpose Kween featuring Kween Yasmin');

if (!html.includes('data-fmb-kween-schema')) {
  const graph = {
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'NewsArticle',
        '@id':`${canonical}#article`,
        url:canonical,
        headline:title,
        description,
        image:[{ '@type':'ImageObject', url:image, width:imageWidth, height:imageHeight }],
        datePublished:published,
        dateModified:modified,
        inLanguage:'en-PH',
        articleSection:['Culture','Digital Culture','Feature Essay'],
        keywords:['Kween Yasmin','Yasmin Marie Asistido','All-Purpose Kween','Filipino digital culture','Filipino internet culture','creator economy Philippines'],
        about:{ '@id':'https://www.francinemariebautista.com/news/kween-yasmin/#person' },
        author:{ '@id':'https://www.francinemariebautista.com/fmbnews/#organization' },
        publisher:{ '@id':'https://www.francinemariebautista.com/fmbnews/#organization' },
        mainEntityOfPage:{ '@id':`${canonical}#webpage` },
        isPartOf:{ '@id':'https://www.francinemariebautista.com/fmbnews/#page' }
      },
      {
        '@type':'Person',
        '@id':'https://www.francinemariebautista.com/news/kween-yasmin/#person',
        name:'Kween Yasmin',
        alternateName:'Yasmin Marie Asistido',
        description:'Filipino digital personality, performer, creator and entrepreneur discussed in this FMB News cultural feature.'
      },
      {
        '@type':'Organization',
        '@id':'https://www.francinemariebautista.com/fmbnews/#organization',
        name:'FMB News',
        url:'https://www.francinemariebautista.com/fmbnews/'
      },
      {
        '@type':'WebPage',
        '@id':`${canonical}#webpage`,
        url:canonical,
        name:title,
        description,
        primaryImageOfPage:{ '@type':'ImageObject', url:image, width:imageWidth, height:imageHeight },
        breadcrumb:{ '@id':`${canonical}#breadcrumb` }
      },
      {
        '@type':'BreadcrumbList',
        '@id':`${canonical}#breadcrumb`,
        itemListElement:[
          { '@type':'ListItem', position:1, name:'FMB News', item:'https://www.francinemariebautista.com/fmbnews/' },
          { '@type':'ListItem', position:2, name:'Culture', item:'https://www.francinemariebautista.com/news/' },
          { '@type':'ListItem', position:3, name:'The Multifaceted Impact of the All-Purpose Kween', item:canonical }
        ]
      }
    ]
  };
  html = html.replace('</head>', `<script type="application/ld+json" data-fmb-kween-schema>${JSON.stringify(graph)}</script>\n</head>`);
}

if (!html.includes('data-fmb-kween-internal-links')) {
  const links = `<aside data-fmb-kween-internal-links style="margin-top:48px;padding:24px;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-family:Arial,sans-serif"><strong>Explore FMB News</strong><p><a href="/fmbnews/">Latest FMB News</a> · <a href="/news/">News and feature archive</a> · <a href="/aboutfmb/">About FMB</a></p></aside>`;
  html = html.replace('</main>', `${links}</main>`);
}

await writeFile(articlePath, html, 'utf8');
console.log(`Applied strategic SEO to ${canonical}`);
