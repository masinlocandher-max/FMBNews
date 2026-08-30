import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(repositoryRoot, 'dist', 'news');
const requiredVisualCss = '/assets/css/fmb-sitewide-visual-fixes.css?v=20260726-readability-v2';
const editorialContract = '<style data-newsroom-generated-contract>.news-story-route .nc-story-body,.news-story-route .nc-article-deck{font-family: Georgia, "Times New Roman", Times, serif !important}</style>';

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

function channelCommand() {
  return `<section class="fmb-v2-news-command fmb-news-channel-command" aria-label="FMB News Center channel identity">
  <div class="fmb-news-channel-command-inner">
    <a class="fmb-news-channel-brand" href="/news/" aria-label="FMB News Center home">
      <span class="fmb-news-channel-mark" aria-hidden="true">FMB</span>
      <span class="fmb-news-channel-brand-copy"><strong>News Center</strong><small>Filipino ang Mismong Balita.</small></span>
    </a>
    <p class="fmb-news-channel-description">Public-interest reporting · Context · Source visibility · Corrections</p>
    <nav class="fmb-news-channel-links" aria-label="News Center quick links"><a href="/news/">Headlines</a><a href="/news/#rundown">Latest reports</a><a href="/news/#editorial-standard">Standards</a></nav>
  </div>
</section>`;
}

let updated = 0;
for (const filePath of await walk(newsRoot)) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-(?:channel|story)-route\b/.test(html)) continue;

  html = html.replace(/<body\b([^>]*)\bclass=(["'])([^"']*)\2([^>]*)>/i, (match, before, quote, classes, after) => {
    const classList = new Set(classes.split(/\s+/).filter(Boolean));
    classList.add('fmb-unified-public');
    classList.add('fmb-approved-launch');
    classList.add('newsroom-polish-v3');
    return `<body${before}class=${quote}${[...classList].join(' ')}${quote}${after}>`;
  });

  if (!html.includes(requiredVisualCss)) html = html.replace(/<\/head>/i, `<link rel="stylesheet" href="${requiredVisualCss}">\n</head>`);
  if (/\bnews-story-route\b/.test(html) && !html.includes('data-newsroom-generated-contract')) html = html.replace(/<\/head>/i, `${editorialContract}\n</head>`);

  html = html.replace(/<section\b(?=[^>]*\bclass=["'][^"']*\bfmb-v2-news-command\b[^"']*["'])[^>]*>[\s\S]*?<\/section>\s*/gi, '');
  const livebar = /(<section\b(?=[^>]*\bclass=["'][^"']*\bfmb-news-livebar\b[^"']*["'])[^>]*>[\s\S]*?<\/section>)/i;
  const siteHeader = /(<header\b(?=[^>]*\bclass=["'][^"']*\bnc-site-header\b[^"']*["'])[^>]*>[\s\S]*?<\/header>)/i;

  if (livebar.test(html)) html = html.replace(livebar, `$1\n${channelCommand()}`);
  else if (siteHeader.test(html)) html = html.replace(siteHeader, `$1\n${channelCommand()}`);
  else if (/<body\b[^>]*>/i.test(html)) html = html.replace(/(<body\b[^>]*>)/i, `$1\n${channelCommand()}`);
  else {
    console.warn(`Skipped channel masthead for unrecognized HTML structure: ${filePath}`);
    continue;
  }

  if (!html.includes('Filipino ang Mismong Balita.')) throw new Error(`News Center channel masthead: approved tagline is missing in ${filePath}`);
  if (!/\bclass=["'][^"']*\bfmb-unified-public\b/.test(html)) throw new Error(`News Center compatibility: missing fmb-unified-public in ${filePath}`);
  if (!/\bclass=["'][^"']*\bfmb-approved-launch\b/.test(html)) throw new Error(`News Center compatibility: missing fmb-approved-launch in ${filePath}`);
  if (!/\bclass=["'][^"']*\bnewsroom-polish-v3\b/.test(html)) throw new Error(`News Center compatibility: missing newsroom-polish-v3 in ${filePath}`);
  if (!html.includes(requiredVisualCss)) throw new Error(`News Center compatibility: missing required visual stylesheet in ${filePath}`);

  await writeFile(filePath, html, 'utf8');
  updated += 1;
}

console.log(`Added the News Center masthead and final approved newsroom contract to ${updated} landing and report pages.`);
