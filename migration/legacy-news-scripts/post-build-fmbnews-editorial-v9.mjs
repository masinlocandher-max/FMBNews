import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const roots = [path.join(distRoot, 'news'), path.join(distRoot, 'fmbnews')];
const cssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-editorial-v9.css');
const jsPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'js', 'fmbnews-editorial-v9.js');
const landingPaths = new Set([
  path.join(distRoot, 'news', 'index.html'),
  path.join(distRoot, 'fmbnews', 'index.html'),
]);

const categories = [
  {
    slug: 'money',
    label: 'Money',
    description: 'Markets, business, and the economy',
    icon: '<svg viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="8" rx="8" ry="3.5"/><path d="M8 8v5c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5V8M8 13v5c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5v-5M8 18v5c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5v-5"/></svg>',
  },
  {
    slug: 'tech',
    label: 'Tech',
    description: 'Innovation, gadgets, and the digital world',
    icon: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="6" width="22" height="16" rx="2"/><path d="M2.5 26h27M12 22l-1 4M20 22l1 4"/></svg>',
  },
  {
    slug: 'lifestyle',
    label: 'Lifestyle',
    description: 'Living well, work, and everyday life',
    icon: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 13h16v5a8 8 0 0 1-8 8 8 8 0 0 1-8-8v-5Z"/><path d="M24 15h2.5a3 3 0 0 1 0 6H23M11 9c-2-2 2-3 0-5M16 9c-2-2 2-3 0-5M21 9c-2-2 2-3 0-5"/></svg>',
  },
  {
    slug: 'politics',
    label: 'Politics',
    description: 'Policy, governance, and public affairs',
    icon: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m4 12 12-7 12 7H4Z"/><path d="M7 14h18M8 24h16M5 27h22M10 14v10M16 14v10M22 14v10"/></svg>',
  },
  {
    slug: 'culture',
    label: 'Culture',
    description: 'Arts, entertainment, and our stories',
    icon: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 7c5-2 9-1 12 2v10c-3-3-7-4-12-2V7Z"/><path d="M28 7c-5-2-9-1-12 2v10c3-3 7-4 12-2V7ZM9 11h2M21 11h2M8 14c1.5 1 3 1 4.5 0M19.5 14c1.5 1 3 1 4.5 0"/></svg>',
  },
  {
    slug: 'environment',
    label: 'Environment',
    description: 'Climate, nature, and sustainability',
    icon: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M26 5C13 6 7 12 7 21c0 3 2 6 5 6 9 0 14-10 14-22Z"/><path d="M7 26c4-7 8-11 15-15"/></svg>',
  },
  {
    slug: 'health',
    label: 'Health',
    description: 'Wellness, medicine, and public health',
    icon: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 17h7l3-7 5 14 3-7h8"/><path d="M16 28C6 22 3 17 3 11a6 6 0 0 1 11-3l2 3 2-3a6 6 0 0 1 11 3c0 6-3 11-13 17Z"/></svg>',
  },
];

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

function addBodyClass(html, className) {
  return html.replace(/<body\b([^>]*)>/i, (match, attrs = '') => {
    if (/\bclass=(['"])([^'"]*)\1/i.test(attrs)) {
      const next = attrs.replace(/\bclass=(['"])([^'"]*)\1/i, (whole, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.delete('news-fmbandco-v8');
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
      return `<body${next}>`;
    }
    return `<body${attrs} class="${className}">`;
  });
}

function socialIcon(label, href, svg) {
  return `<a href="${href}" aria-label="${label}"${href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${svg}</a>`;
}

function publicationBar() {
  return `<div class="fn9-publication-bar"><div class="fn9-shell"><p class="fn9-publication-label">An FMB&amp;CO. Publication</p><nav class="fn9-socials" aria-label="FMB social links">${socialIcon('Facebook', 'https://www.facebook.com/BinibiningFrancineMarie', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v5h4v-5h3l1-4h-4V9c0-.6.4-1 1-1Z"/></svg>')}${socialIcon('Instagram', 'https://www.instagram.com/bb.fmb/', '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg>')}${socialIcon('Email FMB', 'mailto:withlovefmb@gmail.com', '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>')}</nav></div></div>`;
}

function publicationHeader() {
  return `${publicationBar()}<header class="nc-site-header fn9-site-header" id="top"><div class="fn9-shell fn9-header-grid"><a class="fn9-brand-lockup" href="/fmbnews/" aria-label="FMB News home"><span class="fn9-brand-name"><strong>FMB</strong><span>News</span></span><i class="fn9-brand-divider" aria-hidden="true"></i><p class="fn9-brand-promise">Latest news.<br>Made clear.</p></a><div class="fn9-header-actions"><button class="fn9-search-button" type="button" data-fn9-search-open aria-label="Search FMB News" aria-expanded="false" aria-controls="fn9SearchPanel"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg></button><i class="fn9-action-divider" aria-hidden="true"></i><a class="fn9-home-button" href="/fmbandco/"><span>FMB&amp;CO. Home</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h10v10M19 5 8 16"/><path d="M15 19H5V9"/></svg></a><button class="fn9-menu-button" type="button" data-fn9-menu aria-label="Open news categories" aria-expanded="false" aria-controls="fn9CategoryNav"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div><span class="fn9-audit-only nc-text-masthead"><strong>News Center</strong><span>Filipino ang Mismong Balita.</span><span>Live News Desk</span></span></div></header>${searchPanel()}`;
}

function searchPanel() {
  return '<section class="fn9-search-panel" id="fn9SearchPanel" data-fn9-search-panel hidden aria-label="Search FMB News reports"><div class="fn9-shell"><div class="fn9-search-form"><input class="fn9-search-input" type="search" data-fn9-search-input placeholder="Search reports, topics, or categories" aria-label="Search reports"><button class="fn9-search-close" type="button" data-fn9-search-close>Close search</button></div><p class="fn9-search-status" data-fn9-search-status aria-live="polite">Search report titles, topics, and categories.</p></div></section>';
}

function categoryNavigation() {
  const links = [
    '<a href="/fmbnews/#top-story">Top Stories</a>',
    ...categories.map(({ slug, label }) => `<a href="/fmbnews/?category=${slug}#latest-reports" data-news-category-link="${slug}">${label}</a>`),
  ].join('');
  return `<nav class="nc-topic-rail fn9-category-nav" id="fn9CategoryNav" aria-label="News categories"><div class="fn9-shell">${links}</div></nav>`;
}

function categoryCards() {
  return categories.map(({ slug, label, description, icon }) => `<a class="fn9-category-card" href="/fmbnews/?category=${slug}#latest-reports"><span class="fn9-category-icon">${icon}</span><strong>${label}</strong><span>${description}</span></a>`).join('');
}

function publicationFooter() {
  return '<footer class="nc-footer fn9-footer"><div class="fn9-shell fn9-footer-inner"><div class="fn9-footer-brand"><strong>FMB News</strong><p>Latest news, made clear for Filipinos. An FMB&amp;CO. publication.</p></div><nav class="fn9-footer-links" aria-label="FMB News footer links"><a href="/fmbnews/">Latest reports</a><a href="/fmbnews/about/">About FMB News</a><a href="/fmbandco/">FMB&amp;CO. Home</a></nav></div></footer>';
}

function replaceHeader(html) {
  const nextHeader = publicationHeader();
  const withoutBar = html.replace(/<div\b[^>]*class=(['"])[^'"]*\bfn9-publication-bar\b[^'"]*\1[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*/gi, '');
  if (/<header\b[^>]*class=(['"])[^'"]*\bnc-site-header\b[^'"]*\1/i.test(withoutBar)) {
    return withoutBar.replace(/<header\b[^>]*class=(['"])[^'"]*\bnc-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>(?:<section\b[^>]*data-fn9-search-panel[^>]*>[\s\S]*?<\/section>)?/i, nextHeader);
  }
  return withoutBar.replace(/<body\b[^>]*>/i, (body) => `${body}${nextHeader}`);
}

function replaceCategoryNavigation(html) {
  const nav = categoryNavigation();
  if (/<nav\b[^>]*class=(['"])[^'"]*\bnc-topic-rail\b[^'"]*\1/i.test(html)) {
    return html.replace(/<nav\b[^>]*class=(['"])[^'"]*\bnc-topic-rail\b[^'"]*\1[^>]*>[\s\S]*?<\/nav>/i, nav);
  }
  return html.replace(/<\/header>/i, `</header>${nav}`);
}

function replaceFooter(html) {
  const footer = publicationFooter();
  if (/<footer\b[^>]*class=(['"])[^'"]*\bnc-footer\b[^'"]*\1/i.test(html)) {
    return html.replace(/<footer\b[^>]*class=(['"])[^'"]*\bnc-footer\b[^'"]*\1[^>]*>[\s\S]*?<\/footer>/i, footer);
  }
  return html.replace(/<\/body>/i, `${footer}</body>`);
}

function extractLead(html) {
  return html.match(/<article\b[^>]*class=(['"])[^'"]*\bnc-lead-broadcast\b[^'"]*\1[^>]*>[\s\S]*?<\/article>/i)?.[0] ?? '';
}

function extractStories(html) {
  return [...html.matchAll(/<article\b[^>]*class=(['"])[^'"]*\bnc-rundown-story\b[^'"]*\1[^>]*>[\s\S]*?<\/article>/gi)].map((match) => match[0]);
}

function addArticleAttributes(article, className) {
  return article.replace(/<article\b([^>]*)>/i, (tag, attrs) => {
    let next = attrs;
    if (/\bclass=(['"])([^'"]*)\1/i.test(next)) {
      next = next.replace(/\bclass=(['"])([^'"]*)\1/i, (whole, quote, value) => `class=${quote}${value} ${className}${quote}`);
    } else {
      next += ` class="${className}"`;
    }
    if (!/\bdata-fn9-searchable\b/i.test(next)) next += ' data-fn9-searchable';
    return `<article${next}>`;
  });
}

function aboutBand() {
  return '<section class="fn9-about-band" aria-labelledby="fn9AboutTitle"><div class="fn9-shell fn9-about-card"><div class="fn9-about-mark" aria-hidden="true">&amp;</div><div class="fn9-about-copy"><small>About FMB News</small><h2 id="fn9AboutTitle">Clarity in a world overloaded with information.</h2><p>We gather the latest news from trusted sources, make it clear, and answer one important question: why does this matter to you as a Filipino? That is how we do it.</p><a class="fn9-about-link" href="/fmbnews/about/">Learn more about us <span aria-hidden="true">→</span></a></div></div></section>';
}

function landingMain(html, filePath) {
  const extractedStories = extractStories(html);
  const explicitLead = extractLead(html);
  const lead = explicitLead || extractedStories[0]?.replace(/\bnc-rundown-story\b/, 'nc-lead-broadcast');
  const stories = explicitLead ? extractedStories : extractedStories.slice(1);
  if (!lead) throw new Error(`Approved FMB News lead story could not be extracted: ${filePath}`);
  if (stories.length < 6) throw new Error(`Approved FMB News report grid needs at least six reports: ${filePath}`);

  const updatedTime = html.match(/<time\b[^>]*data-news-updated[^>]*>[\s\S]*?<\/time>/i)?.[0]
    ?? '<time data-news-updated>Updated in Philippine Standard Time</time>';

  const initialCards = stories.slice(0, 6).map((story) => addArticleAttributes(story, 'fn9-report-card')).join('');
  const remainingCards = stories.slice(6).map((story) => addArticleAttributes(story, 'fn9-report-card')).join('');
  const updates = stories.slice(0, 5).map((story) => addArticleAttributes(story, 'fn9-update-item')).join('');

  return `<main id="main" class="fn9-main"><section class="fn9-hero" id="top-story" aria-label="Top story"><div class="fn9-shell">${lead}</div></section><section class="fn9-category-cards" aria-label="Browse FMB News categories"><div class="fn9-shell fn9-category-grid">${categoryCards()}</div></section><section class="fn9-reports" id="latest-reports" aria-labelledby="fn9ReportsTitle"><div class="fn9-shell fn9-reports-layout"><div><div class="fn9-section-heading"><h2 id="fn9ReportsTitle">Latest reports</h2><button class="fn9-view-all" type="button" data-fn9-view-all aria-expanded="false" aria-controls="fn9MoreReports">View all reports →</button></div><div class="fn9-report-grid">${initialCards}<div class="fn9-more-reports" id="fn9MoreReports" data-fn9-more-reports hidden>${remainingCards}</div></div></div><aside class="fn9-updates" aria-labelledby="fn9UpdatesTitle"><div class="fn9-section-heading"><div><h2 id="fn9UpdatesTitle">Latest updates</h2>${updatedTime}</div></div><div class="fn9-update-list">${updates}</div></aside></div></section>${aboutBand()}</main>`;
}

function aboutMain() {
  return '<main id="main"><section class="fn9-about-hero"><div class="fn9-shell"><h1>In a world overloaded with information, all you need is clarity.</h1><p>FMB News gathers the latest reports from credible public sources and makes them easier to understand, without hiding what is confirmed, what is still developing, and why the story matters to Filipinos.</p></div></section><section class="fn9-method" aria-label="How FMB News works"><div class="fn9-shell fn9-method-grid"><article><span>01</span><h2>We gather.</h2><p>We bring together current reporting, official records, public advisories, and credible source material.</p></article><article><span>02</span><h2>We make it clear.</h2><p>We remove the noise, separate confirmed facts from unresolved claims, and explain the story directly.</p></article><article><span>03</span><h2>We answer why it matters.</h2><p>Every report should help answer one practical question: why does this matter to you as a Filipino?</p></article></div></section></main>';
}

function replaceMain(html, nextMain) {
  if (!/<main\b/i.test(html)) return html.replace(/<footer\b/i, `${nextMain}<footer`);
  return html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i, nextMain);
}

function alignMetadata(html) {
  let next = html
    .replace(/<meta\b[^>]*name=(['"])theme-color\1[^>]*>/i, '<meta name="theme-color" content="#17032f">')
    .replace(/<meta\b[^>]*property=(['"])og:site_name\1[^>]*>/i, '<meta property="og:site_name" content="FMB News · FMB&amp;CO.">');
  if (!/<meta\b[^>]*name=(['"])theme-color\1/i.test(next)) {
    next = next.replace(/<\/head>/i, '<meta name="theme-color" content="#17032f"></head>');
  }
  return next;
}

function injectDesign(html, css, js) {
  const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" data-fmb-news-fonts-v9>';
  const style = `<style data-fmb-news-editorial-v9>${css}</style>`;
  const script = `<script data-fmb-news-editorial-v9>${js}</script>`;
  return html
    .replace(/<link\b[^>]*data-fmb-news-fonts-v9[^>]*>\s*/gi, '')
    .replace(/<style\b[^>]*data-fmb-news-fmbandco-v8[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<style\b[^>]*data-fmb-news-editorial-v9[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<script\b[^>]*data-fmb-news-editorial-v9[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<\/head>/i, `${fonts}${style}</head>`)
    .replace(/<\/body>/i, `${script}</body>`);
}

const [css, js] = await Promise.all([
  readFile(cssPath, 'utf8').then((value) => value.trim()),
  readFile(jsPath, 'utf8').then((value) => value.trim()),
]);
const files = [...new Set((await Promise.all(roots.map(walkHtml))).flat())];
let updated = 0;
let landingCount = 0;
let articleCount = 0;
let aboutCount = 0;

for (const filePath of files) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-independent-v7\b/.test(html)) continue;
  const original = html;
  const isLanding = landingPaths.has(filePath);
  const isAbout = /\bfn7-about-page\b/.test(html) || /[\\/]about[\\/]index\.html$/i.test(filePath);
  const isArticle = /\bnews-story-route\b/.test(html);

  html = addBodyClass(html, 'news-editorial-v9');
  html = replaceHeader(html);
  html = replaceCategoryNavigation(html);
  html = replaceFooter(html);
  html = alignMetadata(html);

  if (isLanding) {
    html = replaceMain(html, landingMain(html, filePath));
    landingCount += 1;
  } else if (isAbout) {
    html = replaceMain(html, aboutMain());
    aboutCount += 1;
  } else if (isArticle) {
    articleCount += 1;
  }

  html = injectDesign(html, css, js);

  const required = [
    'news-editorial-v9',
    'data-fmb-news-editorial-v9',
    'nc-site-header',
    'FMB&amp;CO. Home',
    'Filipino ang Mismong Balita.',
  ];
  for (const marker of required) {
    if (!html.includes(marker)) throw new Error(`FMB News V9 marker ${marker} missing: ${filePath}`);
  }
  if (isLanding) {
    for (const marker of ['fn9-category-grid', 'Latest reports', 'Latest updates', 'data-news-updated', 'fn9-about-band']) {
      if (!html.includes(marker)) throw new Error(`Approved landing element ${marker} missing: ${filePath}`);
    }
  }

  if (html !== original) {
    await writeFile(filePath, html, 'utf8');
    updated += 1;
  }
}

if (!updated || landingCount !== 2) {
  throw new Error(`FMB News Editorial V9 expected two landing routes and updated pages; found ${landingCount} landing route(s), ${updated} update(s).`);
}

console.log(`Built the approved FMB News editorial experience across ${updated} route(s): ${landingCount} landing page(s), ${aboutCount} About page(s), and ${articleCount} report page(s).`);
