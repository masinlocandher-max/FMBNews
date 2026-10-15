// Shared editorial section canon for FMB News structured reports.
//
// Verify, render, and hardfix must agree on which headings are the opening
// facts lens, Context, Why this matters, and What to watch next. When they
// drift, CI can pass while the article page leaves "Why it matters to Filipinos"
// as a giant body h2 and leaves the Why lens empty. Keep the classifiers here.

export const CANON_WHY = 'Why this matters';
export const CANON_CONTEXT = 'Context';
export const CANON_WATCH = 'What to watch next';

/** Opening facts / change section (Verified-facts lens). */
export const OPENING_HEADING_RE =
  /^(what happened|what changed|verified facts|latest national toll|sunday forecast)$/i;

/** Why-this-matters lens, including common authoring variants. */
export const WHY_HEADING_RE =
  /^(why this matters|why it matters)(\s+to filipinos)?$/i;

export const CONTEXT_HEADING_RE = /^context$/i;
export const WATCH_HEADING_RE = /^what to watch next$/i;

/** Any heading that belongs in a lens, not the freeform body. */
export const LENS_HEADING_RE =
  /^(what happened|what changed|verified facts|latest national toll|sunday forecast|context|why this matters|why it matters(?:\s+to filipinos)?|what to watch next)$/i;

/** Known authoring aliases that hardfix rewrites to the display canon. */
export const WHY_HEADING_ALIASES = new Set([
  'why it matters',
  'why this matters to filipinos',
  'why it matters to filipinos',
]);

/**
 * Staging / QA hosts that must never be cited. The map rewrites the hostname
 * only when the same path is known to exist on the publisher's live site.
 */
export const NON_PRODUCTION_HOST_RE =
  /^(qa|staging|stage|dev|test|uat|preview|beta)\./i;

export const LIVE_HOST_REWRITES = Object.freeze({
  'qa.philstar.com': 'www.philstar.com',
  'staging.pagasa.dost.gov.ph': 'www.pagasa.dost.gov.ph',
});

export function normalizeHeading(heading = '') {
  return String(heading || '').trim();
}

export function headingKey(heading = '') {
  return normalizeHeading(heading).toLowerCase();
}

export function isOpeningHeading(heading) {
  return OPENING_HEADING_RE.test(headingKey(heading));
}

export function isContextHeading(heading) {
  return CONTEXT_HEADING_RE.test(headingKey(heading));
}

export function isWhyHeading(heading) {
  return WHY_HEADING_RE.test(headingKey(heading));
}

export function isWatchHeading(heading) {
  return WATCH_HEADING_RE.test(headingKey(heading));
}

export function isLensHeading(heading) {
  return LENS_HEADING_RE.test(headingKey(heading));
}

export function findSection(story, predicate) {
  return (story?.sections || []).find((section) => predicate(section?.heading)) || null;
}

export function bodySections(story) {
  return (story?.sections || []).filter((section) => !isLensHeading(section?.heading));
}

/** Rewrite a Why-variant heading to the canonical display string. */
export function canonicalizeWhyHeading(heading) {
  const key = headingKey(heading);
  if (WHY_HEADING_ALIASES.has(key) || key === 'why this matters') return CANON_WHY;
  return normalizeHeading(heading);
}

/**
 * Normalize source URL hostnames. Returns { url, rewritten, blocked }.
 * Unmapped non-production hosts are blocked so verify/hardfix can refuse them.
 */
export function normalizeSourceUrl(url = '') {
  const raw = String(url || '').trim();
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { url: raw, rewritten: false, blocked: false };
  }
  if (parsed.protocol !== 'https:') {
    return { url: raw, rewritten: false, blocked: false };
  }
  const host = parsed.hostname.toLowerCase();
  if (LIVE_HOST_REWRITES[host]) {
    parsed.hostname = LIVE_HOST_REWRITES[host];
    return { url: parsed.toString(), rewritten: true, blocked: false };
  }
  if (NON_PRODUCTION_HOST_RE.test(host)) {
    return { url: raw, rewritten: false, blocked: true };
  }
  return { url: raw, rewritten: false, blocked: false };
}

/**
 * Apply in-place content normalizations for a published story.
 * Returns a summary of changes; mutates `story` when changes are made.
 */
export function normalizeStoryRecord(story, { editorialFallbackUrl, pickEditorialFallback } = {}) {
  const summary = {
    whyHeadings: 0,
    sourceHosts: 0,
    fallbackPlates: 0,
    blockedSources: [],
  };
  if (!story || typeof story !== 'object') return summary;

  for (const section of story.sections || []) {
    const before = normalizeHeading(section.heading);
    const after = canonicalizeWhyHeading(before);
    if (after !== before) {
      section.heading = after;
      summary.whyHeadings += 1;
    }
  }

  for (const src of story.sources || []) {
    const result = normalizeSourceUrl(src.url);
    if (result.rewritten) {
      src.url = result.url;
      summary.sourceHosts += 1;
    } else if (result.blocked) {
      summary.blockedSources.push(result.url);
    }
  }

  const image = story.image || {};
  const imageUrl = String(image.url || '');
  if (
    typeof editorialFallbackUrl === 'function' &&
    /fmb-news-editorial-fallback\.svg(?:$|\?)/i.test(imageUrl)
  ) {
    const seed = story.slug || story.headline || imageUrl;
    const plate = typeof pickEditorialFallback === 'function' ? pickEditorialFallback(seed) : null;
    image.url = editorialFallbackUrl(seed);
    image.kind = 'editorial-fallback';
    if (plate?.alt) image.alt = plate.alt;
    image.source = image.source || 'FMB News';
    image.creator = image.creator || 'FMB News';
    image.license = image.license || 'FMB-owned editorial artwork';
    image.credit = image.credit || 'Editorial graphic: FMB News';
    if (!image.caption || /editorial graphic/i.test(image.caption)) {
      image.caption =
        'FMB News branded editorial plate. This is publication artwork, not a photograph of the reported event.';
    }
    image.sourceUrl = image.sourceUrl || 'https://www.francinemariebautista.com/news/';
    story.image = image;
    summary.fallbackPlates += 1;
  }

  return summary;
}
