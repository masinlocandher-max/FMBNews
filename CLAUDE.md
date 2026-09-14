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
- Mobile uses the approved newsroom-black / off-white / signal-red app composition with hamburger left, centered `FMB NEWS.`, search right, text section rail, real current story hero and one `.fmb-editorial-mobile-dock` for Home / World / Sports / Briefing / Menu.
- The retired bottom-navigation implementations remain forbidden. The approved `.fmb-editorial-mobile-dock` is intentional and must not be removed because of superseded notes.
- Production headlines, images, times and alerts must come from real FMB News data. Mockup copy is never factual source material.
- Every visible Latest News item on mobile must retain a real image or the newsroom's explicit fallback when no legitimate asset exists.
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
