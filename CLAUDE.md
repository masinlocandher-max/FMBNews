# Claude Takeover Notes

This repository is the canonical FMB News / Filipino Media Bulletin codebase.

Before changing Home, mobile navigation, publication styling, or any shared visual layer, read:

`docs/fmb-news-approved-editorial-design.md`

That document is the current visual source of truth. It supersedes older mobile directions that used the plum/gold app concept, required the generic global-newsroom hero as the visible Home hero, or prohibited fixed bottom navigation.

Critical locked rules:

- Keep everything in this `FMBNews` repo. Do not create a separate app repo or deploy FMB News from Vercel/FMB-Ecosystem.
- Preserve the current article/archive renderer, CMS, personalization, passwordless email session, push, Home Screen/PWA logic, Fact Check gate, Explainer, horoscope and crossword.
- Exact editorial product names remain `FMB News`, `FMB Worldwide`, `FMB Explainer`, `FMB Fact Check`, and `FMB Daily Brief` where those products are presented.
- Do not rename `FMB Explainer` to `FMB Explained`.
- Desktop Home uses the approved warm-ivory / newsroom-black / signal-red newspaper composition and `FMB NEWS.` serif masthead.
- Mobile uses the approved newsroom-black / off-white / signal-red app composition with centered `FMB NEWS.`, search right, real current story hero and one `.fmb-editorial-mobile-dock` for Home / World / Sports / Briefing / Menu.
- Below 700px there is exactly one primary navigation: the dock. The app bar carries the wordmark and search and nothing else, and exactly one control (`[data-fmb-dock-menu]`) opens the Menu panel. The earlier composition also specified an app-bar hamburger and a `Home / World / Sports / Briefing / Fact Check` text rail; both were removed because both duplicated the dock — the rail repeated four of the dock's five items, and the hamburger opened the same panel as the dock's Menu. `.fmb-mobile-product-rail` and `[data-fmb-shell-menu]` must not return.
- The retired bottom-navigation implementations remain forbidden. The approved `.fmb-editorial-mobile-dock` is intentional and must not be removed because of superseded notes. Since it is the only navigation on a phone it must stay in the accessibility tree: never `hidden` or `aria-hidden`, 44px touch targets, and a Menu button carrying `aria-haspopup="dialog"` with a live `aria-expanded`.
- Production headlines, images, times and alerts must come from real FMB News data. Mockup copy is never factual source material.
- Every visible Latest News item on mobile must retain a real image or the newsroom's explicit fallback when no legitimate asset exists.
- The FMB News fallback is a ROTATING POOL of branded plates, not one repeated image. `scripts/lib/editorial-fallback-pool.mjs` is the only source of truth for that pool. The plate is chosen by an FNV-1a hash of the story's own seed (slug, canonical path, or headline), so it looks arbitrary across the corpus and is identical on every build — never `Math.random()`, which would rewrite hundreds of pages per build and make rendering bugs unreproducible. Explainer and Daily Brief keep their own designated product assets.
- A fallback plate is NOT a photograph. It depicts no event, is never evidence, and must never count as photographic coverage. `fmb-news-fallback-*` stays in the `PLACEHOLDER` pattern in both `verify-article-photography.mjs` and `report-photography-worklist.mjs`. Removing it makes 305 uncovered articles read as covered (measured: 310/320 instead of the true 15/320) and invites lowering the baseline on a fiction.
- The three client runtimes (`fmb-news-image-hardfix.js`, `fmb-news-cms.js`, `fmb-news-mobile-live-feed.js`) each carry a copy of the pool list so a failed image can be replaced without another request. `verify-images.mjs` compares every copy against the module, in order, and checks each plate is present in the build and is real artwork.
- A published article carries a real photograph. See `docs/fmb-news-article-photography.md`. Photographs are cleared through `content/news/rights-cleared-image-overrides.json` with creator, licence, source page, caption and alt text, and `scripts/verify-article-photography.mjs` gates the build. An image-search Creative Commons filter finds candidates; it is never the clearance — cite the host where the licence lives with the file. Never raise a number in `content/news/photography-coverage-baseline.json` to make a build pass.
- Do not rebuild the product from scratch. Use the current canonical architecture and the working improvements already merged into main.
- Do not add another homepage override stylesheet or late compatibility hardfix. `render-home-experience.mjs` owns Home markup; `fmb-news-editorial-reference-v2.css` is the final desktop Home visual authority; `fmb-news-mobile-navigation-lock.css` is the last mobile visual authority.
- Keep content-hashed design/theme assets. Do not return to hand-maintained cache-busting versions for visual authority files.
- Run `npm run build`, `npm run verify`, and `npm run test:mobile:browser`, then perform rendered phone and desktop regression QA before declaring completion.

Primary visual/architecture files:

- `docs/fmb-news-approved-editorial-design.md`
- `scripts/render-home-experience.mjs`
- `scripts/apply-brand-system.mjs`
- `scripts/hardfix-mobile-first-site.mjs`
- `public/assets/css/fmb-news-editorial-reference-v2.css`
- `public/assets/css/fmb-news-mobile-navigation-lock.css`
- `public/assets/js/fmb-news-mobile-global.js`
- `public/assets/js/fmb-news-mobile-personalization.js`
- `.github/workflows/verify-standalone.yml`
