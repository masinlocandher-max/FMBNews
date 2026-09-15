// The FMB News editorial fallback pool.
//
// When a story carries no photograph of its own, the page shows one of the
// publication's own branded plates instead of a single repeated placeholder.
// Three plates rotate: the archipelago at sunrise, the skyline at night, and
// the world map. An archive page of twenty stories used to show the same grey
// colophon twenty times; now it reads as a publication.
//
// TWO RULES GOVERN THIS POOL, AND NEITHER IS OPTIONAL.
//
// 1. A plate is NOT a photograph. These are brand artwork. They do not depict
//    any event, they are never evidence, and they must never be counted as
//    photographic coverage. verify-article-photography.mjs treats every file
//    named fmb-news-fallback-* as a placeholder for exactly this reason: if it
//    did not, adding these would have made 305 uncovered articles look covered
//    overnight and let the coverage baseline be lowered on a fiction.
//
// 2. The choice is random ACROSS the corpus, fixed FOR a given story. The pick
//    is a hash of the story's own seed -- its slug, or its headline -- so the
//    spread looks arbitrary to a reader while every build produces byte-for-byte
//    the same page. A Math.random() pick would rewrite hundreds of pages on
//    every build, churn the deploy diff, and make a rendering bug unreproducible.

export const FALLBACK_DIR = '/assets/images/news/';

export const EDITORIAL_FALLBACK_POOL = [
  {
    file: 'fmb-news-fallback-archipelago.jpg',
    alt: 'FMB News, Filipino Media Bulletin: the Philippine flag above an island coastline at sunrise.',
  },
  {
    file: 'fmb-news-fallback-skyline.jpg',
    alt: 'FMB News, Filipino Media Bulletin: a city skyline at night reflected across open water.',
  },
  {
    file: 'fmb-news-fallback-global.jpg',
    alt: 'FMB News, Filipino Media Bulletin: a world map and globe centred on the Philippines.',
  },
];

export const FALLBACK_FILES = EDITORIAL_FALLBACK_POOL.map((plate) => plate.file);
export const FALLBACK_URLS = FALLBACK_FILES.map((file) => `${FALLBACK_DIR}${file}`);

// FNV-1a. Small, dependency-free, and spreads short similar strings (which is
// what slugs are) far better than summing char codes.
export function fallbackSeedHash(seed = '') {
  let hash = 0x811c9dc5;
  const text = String(seed);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

// The plate for a given story. `seed` should be something stable and specific
// to that story -- a slug, a canonical path, or the headline. An empty seed
// still returns a real plate rather than throwing, because a missing image is
// never a reason to fail a page.
export function pickEditorialFallback(seed = '') {
  return EDITORIAL_FALLBACK_POOL[fallbackSeedHash(seed) % EDITORIAL_FALLBACK_POOL.length];
}

export function editorialFallbackUrl(seed = '') {
  return `${FALLBACK_DIR}${pickEditorialFallback(seed).file}`;
}
