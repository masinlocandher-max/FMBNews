# FMB News

Standalone repository for **FMB News / Filipino Media Bulletin** and its four editorial products: **FMB News**, **FMB Worldwide**, **FMB Explainer**, and **FMB Daily Brief**.

## Status

**FMBNews is the canonical and self-contained newsroom repository.**

This repository owns the public **`/news/`** application. All newsroom development, publishing logic, visual systems, archive content, CMS integration, assets, personalization, mobile app-style presentation, and deployment configuration live here. It does not import, sync, or depend on another application repository.

## Mobile design handoff

The approved mobile home direction and Claude takeover instructions are documented in:

- `docs/fmb-mobile-home-design-handoff.md`
- `CLAUDE.md`
- `public/assets/images/mobile/README.md`

Desktop remains the publication website. Below 700px, the same `/news/` product is intended to behave as a premium mobile news app without creating a separate repository or deployment.

## Public route

**Canonical public route:** `https://www.francinemariebautista.com/news/`

Cloudflare Workers owns the `/news*` edge route and serves this repository's built application. The newsroom build is fully scoped below `/news/`, including CSS, JavaScript, imagery, brand assets, FMB News, FMB Worldwide, FMB Explainer, FMB Daily Brief, and CMS article rendering.

Requests outside the actual `/news` path boundary are passed through to the site's existing origin. The apex newsroom URL redirects to the canonical `www` hostname.

## Repository structure

- `site/` — FMB News pages, FMB Worldwide, FMB Explainer, FMB Daily Brief, live CMS surfaces, and article reader
- `content/news/` — preserved structured editorial archive
- `public/assets/` — newsroom images, styles, scripts, brand assets, and mobile visual assets
- `src/worker.js` — Cloudflare edge router for `/news`
- `wrangler.jsonc` — Cloudflare Workers + Static Assets deployment configuration
- `scripts/` — standalone build and integrity verification
- `docs/` — newsroom architecture, publishing documentation, and approved design handoffs

## Publishing architecture

- **GitHub `FMBNews`** — newsroom application and versioned static archive
- **Supabase `withlovefmb`** — live publishing/CMS data source
- **Cloudflare Workers + Static Assets** — independent `/news/*` hosting and edge routing
- **FMB News CMS client** — reads published articles and editions directly from Supabase
- **Public identity** — Filipino Media Bulletin
- **Public route** — `/news/`

Publishing or updating a CMS story is a database operation. A Cloudflare deployment is required only for application changes such as design, routing, components, or publishing logic.

## Build and deploy

- `npm run build` — creates the self-contained newsroom in `dist/news/`
- `npm run verify` — checks newsroom products, CMS wiring, Cloudflare routing, scoped assets, and standalone boundaries
- `npm run deploy:cloudflare` — builds, verifies, and deploys through Wrangler

## Integrity rules

CI requires the four FMB products, live CMS pages, article reader, newsroom assets, structured archive, Cloudflare route configuration, and the `/news` asset boundary to remain present. It rejects dependencies on retired repository paths or repository names.
