# FMB News

Standalone repository for **FMB News / Filipino Media Bulletin**, including **FMB Brief** and **FMB Worldwide**.

## Status

**FMBNews is the canonical and self-contained newsroom repository.**

This repository owns the public **`/news/`** application. All newsroom development, publishing logic, visual systems, archive content, CMS integration, assets, and deployment configuration live here. It does not import, sync, or depend on another application repository.

## Public route

**Canonical public route:** `https://www.francinemariebautista.com/news/`

Cloudflare Workers owns the `/news*` edge route and serves this repository's built application. The newsroom build is fully scoped below `/news/`, including CSS, JavaScript, imagery, brand assets, FMB Brief, FMB Worldwide, and CMS article rendering.

Requests outside the actual `/news` path boundary are passed through to the site's existing origin. The apex newsroom URL redirects to the canonical `www` hostname.

## Repository structure

- `site/` — FMB News pages, FMB Brief, FMB Worldwide, live CMS surfaces, and article reader
- `content/news/` — preserved structured editorial archive
- `public/assets/` — newsroom images, styles, scripts, and brand assets
- `src/worker.js` — Cloudflare edge router for `/news`
- `wrangler.jsonc` — Cloudflare Workers + Static Assets deployment configuration
- `scripts/` — standalone build and integrity verification
- `docs/` — newsroom architecture and publishing documentation

## Publishing architecture

- **GitHub `FMBNews`** — newsroom application and versioned static archive
- **Supabase `withlovefmb`** — live publishing/CMS data source
- **Cloudflare Workers + Static Assets** — independent `/news/*` hosting and edge routing
- **FMB News CMS client** — reads published articles and editions directly from Supabase
- **Public identity** — FMB News / Filipino Media Bulletin
- **Public route** — `/news/`

Publishing or updating a CMS story is a database operation. A Cloudflare deployment is required only for application changes such as design, routing, components, or publishing logic.

## Build and deploy

- `npm run build` — creates the self-contained newsroom in `dist/news/`
- `npm run verify` — checks newsroom products, CMS wiring, Cloudflare routing, scoped assets, and standalone boundaries
- `npm run deploy:cloudflare` — builds, verifies, and deploys through Wrangler

## Integrity rules

CI requires FMB Brief, FMB Worldwide, live CMS pages, article reader, newsroom assets, structured archive, Cloudflare route configuration, and the `/news` asset boundary to remain present. It rejects dependencies on retired repository paths or repository names.
