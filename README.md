# FMB News

Standalone repository for **FMB News / Filipino Media Bulletin**, including **FMB Brief** and **FMB Worldwide**.

## Status

**FMBNews is the canonical and self-contained newsroom repository.**

This repository owns the public **`/news/`** application. All newsroom development, publishing logic, visual systems, archive content, CMS integration, and deployment configuration live here. It does not import, sync, or depend on another application repository.

## Public route

**Canonical public route:** `https://www.francinemariebautista.com/news/`

The repository root deploys the FMB News application and routes visitors into `/news/`. FMB Brief, FMB Worldwide, live editions, and article pages are all children of this newsroom application.

## Repository structure

- `site/` — FMB News pages, FMB Brief, FMB Worldwide, live CMS surfaces, and article reader
- `content/news/` — preserved structured editorial archive
- `public/assets/` — newsroom images, styles, scripts, and brand assets
- `scripts/` — standalone build and integrity verification
- `docs/` — newsroom architecture and publishing documentation

## Publishing architecture

- **GitHub `FMBNews`** — newsroom application and versioned static archive
- **Supabase `withlovefmb`** — live publishing/CMS data source
- **FMB News CMS client** — reads published articles and editions directly from Supabase
- **Public identity** — FMB News / Filipino Media Bulletin
- **Public route** — `/news/`

Publishing or updating a CMS story is a database operation. A website deployment is required only for changes to the application itself, such as design, routing, components, or publishing logic.

## Integrity rules

CI requires the FMB Brief, FMB Worldwide, live CMS pages, article reader, newsroom assets, and structured archive to remain present. It also rejects dependencies on retired repository paths or repository names.
