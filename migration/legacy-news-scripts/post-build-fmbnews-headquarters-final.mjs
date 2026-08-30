import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const sourceRoot = path.resolve('.');

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

const targets = [...new Set([
  ...(await htmlFiles(path.join(dist, 'fmbnews'))),
  ...(await htmlFiles(path.join(dist, 'news'))),
])];

await mkdir(path.join(dist, 'assets', 'css'), { recursive: true });
await mkdir(path.join(dist, 'assets', 'js'), { recursive: true });
await writeFile(
  path.join(dist, 'assets', 'css', 'fmbnews-headquarters-final.css'),
  await readFile(path.join(sourceRoot, 'assets', 'css', 'fmbnews-headquarters-final.css'), 'utf8'),
  'utf8',
);
await writeFile(
  path.join(dist, 'assets', 'js', 'fmbnews-headquarters-final.js'),
  await readFile(path.join(sourceRoot, 'assets', 'js', 'fmbnews-headquarters-final.js'), 'utf8'),
  'utf8',
);

const finalCss = '<link rel="stylesheet" href="/assets/css/fmbnews-headquarters-final.css?v=20260808-newsdesk-v6">';
const finalJs = '<script src="/assets/js/fmbnews-headquarters-final.js?v=20260808-newsdesk-v6" defer></script>';
const progress = '<div class="fmb-hq-progress" aria-hidden="true"></div>';
const atmosphere = '<div class="fmb-hq-atmosphere" aria-hidden="true"><i class="fmb-hq-arc fmb-hq-arc--one"></i><i class="fmb-hq-arc fmb-hq-arc--two"></i><i class="fmb-hq-arc fmb-hq-arc--three"></i></div>';
const aboutLink = '<a href="/fmbnews/about/">About</a>';

const editorialLanguage = [
  ['FMB News | Public-Interest Reporting and Analysis', 'FMB News | Important News, Made Clear for Filipinos'],
  ['Philippine perspective. Global consequence.', 'Important news, made clear for Filipinos.'],
  ['Where the Philippines meets the world.', 'We simplify the process,<br>not the truth.'],
  ['Context before noise.<br>Reporting before reaction.', 'We simplify the process.<br>Not the truth.'],
  ['The official newsroom of the FMB ecosystem, built around sourced reporting, context, constructive journalism and clearly labeled perspective.', 'FMB News brings credible evidence together in original reports that help Filipino readers understand what happened and why it matters.'],
  ['The official newsroom of the FMB ecosystem', 'Factual news, gathered from credible evidence and explained for Filipinos.'],
  ['News explained for Filipinos', 'Important news, made clear for Filipinos.'],
  ['Today’s headlines for the Filipino', 'Important news, made clear for Filipinos.'],
  ["Today's headlines for the Filipino", 'Important news, made clear for Filipinos.'],
  ['The Philippines in context', 'Important news, made clear for Filipinos.'],
  ['Philippine perspective', 'Built for Filipinos'],
  ['Reporting with consequence', 'Evidence, context, and what comes next'],
  ['Independent Philippine journalism with a global field of view.', 'Factual news from credible evidence, explained for Filipinos.'],
  ['Reporting on the forces shaping public life, institutions, markets, and the country’s future.', 'We compare credible reporting, official records, public documents, research, and direct statements to show what happened, what is confirmed, and what comes next.'],
  ['Independent reporting and analysis on the forces shaping the Philippines and the world.', 'We gather the evidence, compare the available accounts, and produce original reports written for Filipino readers.'],
  ['Reporting that follows power, consequence, and the public record.', 'We simplify the process, not the truth.'],
  ['News for Filipinos, with context that explains why every story matters.', 'Factual news from credible evidence, explained for Filipinos.'],
  ['News, context, and clear explanations of why today’s events matter to Filipinos.', 'We bring together the facts, context, and Philippine relevance so readers do not have to examine every source alone.'],
  ['Credible reports, clear context, and why every important story matters to Filipinos.', 'Credible evidence, original reporting, and clear explanations of why important stories matter to Filipinos.'],
  ['Credible, independent, and community-centered journalism for Filipinos.', 'Evidence-based news synthesis and original reporting built for Filipinos.'],
  ['Verified facts, useful context, and a clear explanation of why every important story matters.', 'What happened, what the evidence shows, why it matters to Filipinos, and what comes next.'],
  ['Public-interest reporting, source-backed context, constructive reporting and clearly labeled perspective from Francine Marie Bautista and the FMB ecosystem.', 'FMB News gathers facts from credible reporting, official records, public documents, research, and direct statements, then presents original reports written for Filipino readers.'],
  ['Public-interest reporting, source-backed context and clearly labeled perspective.', 'Factual news from credible evidence, explained for Filipinos.'],
  ['Public-interest reporting, source-backed context, constructive reporting and clearly labeled perspective from the FMB ecosystem.', 'FMB News gathers credible evidence and turns it into original, clearly sourced reports for Filipino readers.'],
  ['Top story', 'Lead report'],
  ['Latest news', 'The newsroom'],
  ['<b>Live</b>', '<b>Newsroom</b>'],
  ['<span>Live desk</span>', '<span>News desk</span>'],
  ['aria-label="Live newsroom wire"', 'aria-label="Newsroom wire"'],
];

function bodyHasClass(html, name) {
  const body = html.match(/<body\b[^>]*>/i)?.[0] || '';
  const classes = body.match(/\bclass=(["'])(.*?)\1/i)?.[2]?.split(/\s+/) || [];
  return classes.includes(name);
}

function removePreviousArchitecture(html) {
  return html
    .replace(/<div class=["']fmb-hq-progress["'][^>]*><\/div>\s*/gi, '')
    .replace(/<div class=["']fmb-hq-atmosphere["'][^>]*>[\s\S]*?<\/div>\s*/gi, '')
    .replace(/<div class=["']fmb-hq-segment["'][^>]*><\/div>\s*/gi, '')
    .replace(/<div class=["']fmb-control-strip["'][^>]*>[\s\S]*?<\/div>\s*/gi, '');
}

function addBodyClassAndArchitecture(html) {
  const bodyTag = html.match(/<body[^>]*>/i)?.[0] || '';
  const hasTopOutsideBody = /\bid=(['"])top\1/i.test(html.replace(bodyTag, ''));
  return html.replace(/<body([^>]*)>/i, (full, attributes) => {
    let next = full;
    if (hasTopOutsideBody) next = next.replace(/\s+id=(['"])top\1/i, '');
    else if (!/\bid=(['"])/i.test(next)) next = next.replace(/<body/i, '<body id="top"');
    if (/class=(["'])/i.test(next)) {
      next = next.replace(/class=(["'])(.*?)\1/i, (_match, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add('fmb-hq-universe');
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    } else {
      next = `<body class="fmb-hq-universe"${attributes}>`;
    }
    return `${next}${progress}${atmosphere}`;
  });
}

function addSectionArchitecture(html) {
  return html;
}

function addAboutNavigation(html) {
  if (/href=(['"])\/(?:fmbnews|news)\/about\/\1/i.test(html)) return html;

  let next = html.replace(
    /(<nav\b[^>]*class=["'][^"']*\bfnc-nav\b[^"']*["'][^>]*>)([\s\S]*?)(<\/nav>)/i,
    (_full, open, links, close) => `${open}${links}${aboutLink}${close}`,
  );

  if (next === html) {
    next = html.replace(
      /(<nav\b[^>]*class=["'][^"']*\bnc-site-links\b[^"']*["'][^>]*>)([\s\S]*?)(<\/nav>)/i,
      (_full, open, links, close) => `${open}${links}${aboutLink}${close}`,
    );
  }

  if (next === html) {
    next = html.replace(
      /(<nav\b[^>]*class=["'][^"']*\bnc-topic-rail\b[^"']*["'][^>]*>[\s\S]*?<div\b[^>]*>)([\s\S]*?)(<\/div>\s*<\/nav>)/i,
      (_full, open, links, close) => `${open}${links}<a href="/fmbnews/about/">About FMB News</a>${close}`,
    );
  }

  return next;
}

for (const file of targets) {
  let html = await readFile(file, 'utf8');

  html = removePreviousArchitecture(html)
    .replace(/<link[^>]+href=["'][^"']*fmbnews-headquarters-final\.css[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<script[^>]+src=["'][^"']*fmbnews-headquarters-final\.js[^"']*["'][^>]*><\/script>\s*/gi, '')
    .replaceAll('FMB News Center', 'FMB News')
    .replaceAll('FMB&amp;CO. News', 'FMB News')
    .replaceAll('FMB&CO. News', 'FMB News')
    .replaceAll('Hourly Newsroom Cycle', 'Newsroom Briefing');

  for (const [from, to] of editorialLanguage) html = html.split(from).join(to);

  const isRedirect = /http-equiv=(['"])refresh\1/i.test(html) || /<meta\b[^>]*(?:name|property)=(['"])robots\1[^>]*content=(['"])[^'"]*noindex/i.test(html);
  if (!isRedirect && bodyHasClass(html, 'news-story-route') && !html.includes('nc-philippine-stakes')) {
    const why = '<section class="nc-philippine-stakes" aria-label="Why this matters to Filipinos"><p>Why this matters to Filipinos</p><p>FMB News connects the verified facts and evidence in this report to the decisions, costs, opportunities, and risks that may affect Filipinos, Philippine communities, and the country.</p></section>';
    const beforeWhy = html;
    html = html.replace(/<div\b([^>]*)class=(['"])([^'"]*\bnc-story-body\b[^'"]*)\2([^>]*)>/i, (tag) => `${tag}${why}`);
    if (html === beforeWhy) html = html.replace(/<main\b[^>]*>/i, (main) => `${main}${why}`);
  }

  html = html
    .replaceAll('nc-why-filipinos', 'nc-philippine-stakes')
    .replaceAll('The Philippine stakes', 'Why this matters to Filipinos')
    .replaceAll('Why this story matters to Filipinos', 'Why this matters to Filipinos')
    .replaceAll('This report examines the implications for Philippine policy, institutions, economic security, communities, culture, and the country’s position in the region and the world.', 'FMB News connects the verified facts and evidence in this report to the decisions, costs, opportunities, and risks that may affect Filipinos, Philippine communities, and the country.')
    .replaceAll('This report is not only about what happened. It explains how the issue may affect Filipino rights, safety, livelihood, public services, communities, culture, or the country’s future.', 'FMB News connects the verified facts and evidence in this report to the decisions, costs, opportunities, and risks that may affect Filipinos, Philippine communities, and the country.');

  html = addAboutNavigation(html);
  html = addBodyClassAndArchitecture(html);
  html = addSectionArchitecture(html);
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  if (relative.endsWith('/about/index.html')) {
    if (!html.includes('fmbnews-about.css')) {
      html = html.replace('</head>', '<link rel="stylesheet" href="/assets/css/fmbnews-about.css?v=20260807-core"></head>');
    }
  }
  html = html.replace('</head>', `${finalCss}${finalJs}</head>`);
  await writeFile(file, html, 'utf8');
}

const sitemapPath = path.join(dist, 'sitemap.xml');
const aboutUrl = 'https://www.francinemariebautista.com/fmbnews/about/';
let sitemap = await readFile(sitemapPath, 'utf8');
if (!sitemap.includes(aboutUrl)) {
  const entry = `  <url><loc>${aboutUrl}</loc><lastmod>2026-08-07</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
  sitemap = sitemap.replace('</urlset>', `${entry}</urlset>`);
  await writeFile(sitemapPath, sitemap, 'utf8');
}

const publishedNewsroom = await readFile(path.join(dist, 'fmbnews', 'index.html'), 'utf8');

for (const file of targets) {
  const html = await readFile(file, 'utf8');
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  const route = '/' + relative.replace(/index\.html$/,'');
  const isLanding = bodyHasClass(html, 'fmb-news-landing');
  const isArticle = bodyHasClass(html, 'news-story-route');
  if (isArticle && !publishedNewsroom.includes(`href="${route}"`)) continue;
  const isRedirect = /http-equiv=(['"])refresh\1/i.test(html) || /<meta\b[^>]*(?:name|property)=(['"])robots\1[^>]*content=(['"])[^'"]*noindex/i.test(html);
  const failures = [];
  if (!html.includes('fmbnews-headquarters-final.css')) failures.push('final stylesheet missing');
  if (!html.includes('fmbnews-headquarters-final.js')) failures.push('final motion system missing');
  if (!html.includes('fmb-hq-universe')) failures.push('visual universe body class missing');
  if (!html.includes('fmb-hq-atmosphere')) failures.push('signal atmosphere missing');
  if (!isRedirect && !html.includes('fmbnews-clean-v1.css')) failures.push('publication stylesheet missing');
  if (/FMB News Center|FMB(?:&|&amp;)CO\. News/.test(html)) failures.push('legacy identity remains');
  if (/Global consequence|Where the Philippines meets the world|The official newsroom of the FMB ecosystem/i.test(html)) failures.push('old positioning language remains');
  if (!isRedirect && isLanding && !html.includes('Moving headlines')) failures.push('moving headlines label missing');
  if (!isRedirect && isLanding && !html.includes('data-pht-time')) failures.push('live Philippine time missing');
  if (!isRedirect && isLanding && !html.includes('The news that matters.')) failures.push('FMB News positioning missing');
  if (!isRedirect && isLanding && !html.includes('fnc-identity-band')) failures.push('compact identity band missing');
  if (!isRedirect && isLanding && !html.includes('fnc-desk-grid')) failures.push('intentional front desk grid missing');
  if (!isRedirect && isLanding && !html.includes('fnc-developing')) failures.push('developing stories column missing');
  if (!isRedirect && isLanding && !html.includes('fnc-briefings')) failures.push('latest briefings rail missing');
  if (!isRedirect && isLanding && !html.includes('fnc-report-columns')) failures.push('balanced report columns missing');
  if (!isRedirect && isLanding && !html.includes('data-fnc-result-card')) failures.push('complete searchable report index missing');
  if (!isRedirect && isLanding && !html.includes('fmb-news-white-transparent-2026.webp')) failures.push('white transparent footer logo missing');
  if (!isRedirect && isArticle && !html.includes('Why this matters to Filipinos')) failures.push('Filipino relevance module missing');
  if (!isRedirect && relative.endsWith('/about/index.html')) {
    if (!html.includes('fmbnews-about.css')) failures.push('about page stylesheet missing');
    if (!html.includes('Our mission') || !html.includes('Our vision')) failures.push('mission or vision missing');
    if (!html.includes('What happened?') || !html.includes('What is the context?') || !html.includes('Why does it matter to Filipinos?') || !html.includes('What should readers watch next?')) failures.push('four-question editorial method missing');
    if (!html.includes('Evidence first') || !html.includes('Context always')) failures.push('editorial principles missing');
  }
  if (failures.length) throw new Error(`FMB News visual-universe audit failed for ${relative}: ${failures.join(', ')}`);
}

if (!sitemap.includes(aboutUrl)) throw new Error('FMB News about page is missing from the sitemap.');

console.log(`Applied the FMB News visual system, evidence-based Filipino editorial mission, and About page navigation to ${targets.length} production pages without removing editorial content.`);
