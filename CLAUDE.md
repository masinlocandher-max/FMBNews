# Claude Takeover Notes

This repository is the canonical FMB News / Filipino Media Bulletin codebase.

Before changing the mobile experience, read:

`docs/fmb-mobile-home-design-handoff.md`

The user has approved a distinct mobile app-style home inside the same website build. Desktop must remain the publication website. Mobile below 700px should feel like a premium installed news app.

Critical locked rules:

- Keep everything in this `FMBNews` repo. Do not create a separate app repo.
- Preserve current CMS, personalization, passwordless email session, push and Home Screen logic.
- Exact product names: `FMB News`, `FMB Worldwide`, `FMB Explainer`, `FMB Daily Brief`.
- Do not rename `FMB Explainer` to `FMB Explained`.
- No fixed bottom navigation.
- Use the official gold shell-and-pearl emblem.
- The mobile home must use the user-supplied global-newsroom hero art.
- Every visible Latest News card should have an image.
- The FMB Daily Brief home module must include the approved branded plum coffee mug with FMB emblem and steam.
- Mockup headlines are visual placeholders only. Production headlines, times, images and alerts must come from real FMB News data.
- Do not rebuild from scratch. Improve the existing mobile premium layer.
- Run `npm run build` and `npm run verify`, then perform rendered phone QA and desktop regression QA before declaring completion.

Primary current files:

- `public/assets/css/fmb-news-mobile-premium.css`
- `public/assets/js/fmb-news-mobile-premium.js`
- `public/assets/js/fmb-news-mobile-personalization.js`
- `scripts/hardfix-mobile-first-site.mjs`
- `.github/workflows/verify-standalone.yml`
