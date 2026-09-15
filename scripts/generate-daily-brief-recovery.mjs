import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, 'content', 'news', 'articles');
const BRIEFS_DIR = path.join(ROOT, 'content', 'news', 'morning-special');
const RECOVERY_DIR = path.join(ROOT, 'content', 'news', 'recovery');
const SEED_PATH = path.join(RECOVERY_DIR, 'daily-brief-seed-2026-09-15.json');
const START = '2026-08-18';
const END = '2026-09-15';
const MAX_STORIES = 6;
const BRAND_PHOTO = {
  src: '/assets/images/mobile/fmb-daily-brief-coffee.webp',
  alt: 'FMB Daily Brief coffee visual with the FMB shell emblem',
  caption: 'Approved FMB Daily Brief photographic visual used when a recovered edition has no suitable rights-cleared documentary photograph.',
  credit: 'FMB News',
  sourceUrl: ''
};

fs.mkdirSync(BRIEFS_DIR, { recursive: true });
fs.mkdirSync(RECOVERY_DIR, { recursive: true });

const clean = (value = '') => String(value).replace(/\s+/g, ' ').trim();
const sentence = (value = '') => {
  const v = clean(value);
  if (!v) return '';
  return /[.!?]$/.test(v) ? v : `${v}.`;
};

function dateRange(start, end) {
  const result = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const finish = new Date(`${end}T00:00:00Z`);
  while (cursor <= finish) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function listArticleFiles() {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  const out = [];
  for (const dateDir of fs.readdirSync(ARTICLES_DIR)) {
    const dir = path.join(ARTICLES_DIR, dateDir);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json')) continue;
      out.push({ dateDir, file: path.join(dir, name), rel: path.relative(ROOT, path.join(dir, name)).replaceAll('\\', '/') });
    }
  }
  return out;
}

const articleRecords = listArticleFiles().map((entry) => {
  try {
    return { ...entry, article: readJson(entry.file) };
  } catch {
    return null;
  }
}).filter(Boolean);

function allParagraphs(article) {
  const sections = Array.isArray(article.sections) ? article.sections : [];
  return sections.flatMap((section) => Array.isArray(section.paragraphs) ? section.paragraphs.map(clean).filter(Boolean) : []);
}

function sectionParagraphs(article, pattern) {
  const sections = Array.isArray(article.sections) ? article.sections : [];
  const section = sections.find((item) => pattern.test(clean(item.heading)));
  return section && Array.isArray(section.paragraphs) ? section.paragraphs.map(clean).filter(Boolean) : [];
}

function articleImage(article) {
  const image = article?.image;
  if (!image?.url) return null;
  return {
    src: image.url,
    alt: clean(image.alt || article.headline || 'FMB News story image'),
    caption: clean(image.caption || ''),
    credit: clean(image.credit || image.creator || image.source || 'FMB News'),
    sourceUrl: clean(image.sourcePage || image.sourceUrl || '')
  };
}

function isPhotographicImage(image) {
  if (!image?.src) return false;
  const pathOnly = String(image.src).toLowerCase().split('?')[0].split('#')[0];
  return /\.(jpe?g|webp|avif)$/.test(pathOnly);
}

function sourceList(article) {
  const sources = Array.isArray(article.sources) ? article.sources : [];
  return sources
    .filter((s) => s?.url)
    .slice(0, 4)
    .map((s) => ({
      label: clean([s.publisher, s.title].filter(Boolean).join(' — ')),
      url: s.url
    }));
}

function topicTokens(article) {
  const text = `${article.slug || ''} ${article.headline || ''}`.toLowerCase()
    .replace(/continuation|update|developing|september|august|2026/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ');
  const stop = new Set(['the','a','an','and','or','of','to','in','on','for','with','as','after','from','at','by','new','says','philippines','philippine']);
  return new Set(text.split(/\s+/).filter((t) => t.length > 2 && !stop.has(t)));
}

function similarity(a, b) {
  const A = topicTokens(a);
  const B = topicTokens(b);
  const union = new Set([...A, ...B]);
  if (!union.size) return 0;
  let intersection = 0;
  for (const token of A) if (B.has(token)) intersection++;
  return intersection / union.size;
}

function priority(article) {
  const text = `${article.category || ''} ${article.kicker || ''} ${article.headline || ''}`.toLowerCase();
  let score = 0;
  const boosts = [
    [/politic|election|senate|impeach|president|court|justice|arrest|government|congress/, 35],
    [/disaster|typhoon|storm|flood|earthquake|fire|death|missing|emergency|security/, 34],
    [/econom|fuel|oil|price|inflation|jobs|wage|budget|trade|business/, 30],
    [/china|west philippine sea|asean|diplom|foreign|global|war|shipping/, 26],
    [/health|education|transport|agriculture|food|energy/, 22],
    [/technology|science|environment|climate/, 18],
    [/sport|entertainment|culture|film|music/, 8]
  ];
  for (const [pattern, value] of boosts) if (pattern.test(text)) score += value;
  if (article.developing) score += 3;
  if (article.image?.url) score += 8;
  if (Array.isArray(article.sources) && article.sources.length >= 2) score += 6;
  return score;
}

function dedupe(records) {
  const sorted = [...records].sort((a, b) => new Date(b.article.updatedAt || b.article.publishedAt || 0) - new Date(a.article.updatedAt || a.article.publishedAt || 0));
  const kept = [];
  for (const record of sorted) {
    if (kept.some((existing) => similarity(record.article, existing.article) >= 0.52)) continue;
    kept.push(record);
  }
  return kept;
}

function chooseForDate(date) {
  const sameDay = articleRecords.filter((record) => {
    const a = record.article;
    return record.dateDir === date && a?.status === 'published' && a?.headline && sourceList(a).length && articleImage(a);
  });
  const pool = sameDay.length ? sameDay : articleRecords.filter((record) => {
    const a = record.article;
    const published = clean(a?.publishedAt).slice(0, 10);
    return published < date && a?.status === 'published' && a?.headline && sourceList(a).length && articleImage(a);
  }).sort((a, b) => new Date(b.article.publishedAt || 0) - new Date(a.article.publishedAt || 0)).slice(0, 12);

  return dedupe(pool)
    .sort((a, b) => priority(b.article) - priority(a.article) || new Date(b.article.publishedAt || 0) - new Date(a.article.publishedAt || 0))
    .slice(0, MAX_STORIES);
}

function storyFromArticle(record, rank, date) {
  const a = record.article;
  const context = sectionParagraphs(a, /^context$/i);
  const why = sectionParagraphs(a, /why this matters/i);
  const happened = sectionParagraphs(a, /what happened/i);
  const watch = sectionParagraphs(a, /what to watch/i);
  const fallback = allParagraphs(a);
  const body = [];
  const candidates = [
    happened[0],
    context[0],
    why[0],
    watch[0],
    ...fallback
  ].map(sentence).filter(Boolean);
  for (const p of candidates) {
    if (!body.includes(p)) body.push(p);
    if (body.length === 4) break;
  }
  const image = articleImage(a);
  return {
    id: `FMB-DB-${date.replaceAll('-', '')}-${String(rank).padStart(3, '0')}`,
    kicker: clean(a.kicker || a.category || 'FMB News'),
    headline: clean(a.headline),
    deck: clean(a.deck || a.seoDescription || body[0] || ''),
    body,
    sources: sourceList(a),
    image,
    sourceArticle: record.rel
  };
}

function findImageFromArticlePath(relPath) {
  const absolute = path.join(ROOT, relPath);
  if (!fs.existsSync(absolute)) return null;
  return articleImage(readJson(absolute));
}

function findImageByKeyword(keyword) {
  const k = keyword.toLowerCase();
  const matches = articleRecords
    .filter((r) => `${r.article.slug || ''} ${r.article.headline || ''}`.toLowerCase().includes(k) && articleImage(r.article))
    .sort((a, b) => new Date(b.article.publishedAt || 0) - new Date(a.article.publishedAt || 0));
  return matches.length ? articleImage(matches[0].article) : null;
}

function normalizeSeedSource(source) {
  const label = clean(source?.label || '');
  let url = source?.url || '';
  if (url === 'https://businessmirror.com.ph/' && /big-time pump price hikes/i.test(label)) {
    url = 'https://businessmirror.com.ph/2026/09/14/big-time-pump-price-hikes-gas-at-%E2%82%B15-68-diesel-at-%E2%82%B14-31/';
  }
  return { label, url };
}

function currentSeedStories(date) {
  if (date !== '2026-09-15' || !fs.existsSync(SEED_PATH)) return [];
  const seed = readJson(SEED_PATH);
  return (seed.stories || []).slice(0, MAX_STORIES).map((s, index) => {
    const image = s.imageFromArticle ? findImageFromArticlePath(s.imageFromArticle) : findImageByKeyword(s.imageKeyword || '');
    if (!image) throw new Error(`Missing image for September 15 seed story: ${s.headline}`);
    return {
      id: `FMB-DB-20260915-${String(index + 1).padStart(3, '0')}`,
      kicker: clean(s.kicker || 'FMB News'),
      headline: clean(s.headline),
      deck: clean(s.deck),
      body: (s.body || []).map(sentence).filter(Boolean),
      sources: (s.sources || []).filter((x) => x?.url).map(normalizeSeedSource),
      image,
      sourceArticle: null
    };
  });
}

function chooseHero(stories) {
  const photographic = stories.map((story) => story.image).find(isPhotographicImage);
  return photographic || { ...BRAND_PHOTO };
}

function buildEdition(date) {
  const current = currentSeedStories(date);
  const selected = current.length ? [] : chooseForDate(date);
  const stories = current.length ? current : selected.map((record, index) => storyFromArticle(record, index + 1, date));
  const hero = chooseHero(stories);
  const archive = date !== '2026-09-15';
  const leadNames = stories.slice(0, 3).map((s) => s.headline).filter(Boolean);
  return {
    date,
    publishedAt: `${date}T07:00:00+08:00`,
    editionLabel: archive ? 'FMB Daily Brief · Archive Recovery' : 'FMB Daily Brief',
    title: archive ? 'The Stories That Defined the Day' : 'What You Need to Know This Morning',
    deck: archive
      ? `Recovered FMB Daily Brief for ${date}, reconstructed from FMB News' verified article archive. ${leadNames.length ? `Key coverage includes ${leadNames.join('; ')}.` : ''}`
      : 'The consequential Philippine and regional developments to know as Tuesday begins.',
    timezone: 'Asia/Manila',
    recovery: {
      reconstructed: archive,
      reconstructedAt: '2026-09-15T03:30:00+08:00',
      note: archive ? 'Historical recovery edition. It was reconstructed after the original publication date and must not be represented as having been published contemporaneously.' : 'Prepared from fresh September 15 verification sources.'
    },
    hero,
    stories
  };
}

const manifest = {
  schemaVersion: 1,
  generatedAt: '2026-09-15T03:30:00+08:00',
  branchPurpose: 'Recover missing FMB Daily Brief editions without changing main.',
  range: { start: START, end: END },
  editorialRule: 'Historical editions are reconstructed from FMB News published article records and explicitly marked as archive recovery. Every edition is required to carry a photographic hero. September 15 uses a separately verified current-news seed.',
  editions: []
};

for (const date of dateRange(START, END)) {
  const edition = buildEdition(date);
  const target = path.join(BRIEFS_DIR, `${date}.json`);
  fs.writeFileSync(target, `${JSON.stringify(edition, null, 2)}\n`, 'utf8');
  manifest.editions.push({
    date,
    file: path.relative(ROOT, target).replaceAll('\\', '/'),
    storyCount: edition.stories.length,
    status: date === '2026-09-15' ? 'current-prepared' : 'archive-recovered',
    photographicHero: isPhotographicImage(edition.hero),
    sourceArticles: edition.stories.map((s) => s.sourceArticle).filter(Boolean)
  });
}

const manifestPath = path.join(RECOVERY_DIR, 'daily-brief-recovery-manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const incomplete = manifest.editions.filter((e) => e.storyCount === 0 || !e.photographicHero);
if (incomplete.length) {
  throw new Error(`Recovery failed completeness/photo QA for: ${incomplete.map((e) => e.date).join(', ')}`);
}

console.log(`Prepared ${manifest.editions.length} Daily Brief editions (${START} through ${END}) with photographic heroes.`);
console.log(`Manifest: ${path.relative(ROOT, manifestPath)}`);
