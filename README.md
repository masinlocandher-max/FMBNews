# FMB News

Standalone repository for **FMB News / Filipino Media Bulletin**, including **FMB Brief** and **FMB Worldwide**.

## Status

**FMBNews is the canonical newsroom repository.**

The FMB News newsroom source, structured editorial content, imagery, FMB Brief, FMB Worldwide, News-specific CSS/JS, approved brand data, and all shared assets still referenced by migrated articles have been moved from `masinlocandher-max/FMB-Ecosystem` into this repository.

A final source-to-target reconciliation was completed before disconnecting the migration bridge. The permanent report is stored at `migration/reconciliation-report.txt`.

### Reconciliation result

- Rendered newsroom HTML: **40 / 40**
- Rendered index pages: **40 / 40**
- Structured article files: **216 / 216**
- News image files: **65 / 65**
- Local `/assets/` references checked: **48**
- Missing referenced local assets: **0**
- Rendered newsroom tree: **byte-for-byte identical**
- Structured editorial content: **byte-for-byte identical**
- News image library: **byte-for-byte identical**
- Standalone build and verifier: **PASS**

The temporary migration, hydration, reconciliation workflows and trigger files have been removed. Normal development in this repository no longer depends on `FMB-Ecosystem`.

## Public cutover safety

The old News source remains physically present in `FMB-Ecosystem` only as a rollback copy while the current public production route still belongs to the existing mother-site deployment. Do **not** delete that rollback copy until the independent FMB News deployment is live and `https://www.francinemariebautista.com/news/` has been cut over and verified in production.

New FMB News development and publishing architecture work must happen in **`masinlocandher-max/FMBNews`**.

## Repository structure

- `site/` — FMB News pages, including FMB Brief and FMB Worldwide
- `content/news/` — structured editorial source content and newsroom metadata
- `public/assets/` — all local assets required by the standalone newsroom
- `scripts/` — minimal standalone build and verification
- `migration/` — provenance, audit report, and preserved legacy build scripts for reference only

## Target publishing architecture

- **FMBNews** — newsroom frontend, FMB Brief, FMB Worldwide, SEO and article renderer
- **Supabase `withlovefmb`** — publishing/CMS data source
- **Public identity** — FMB News / Filipino Media Bulletin
- **Public route** — `https://www.francinemariebautista.com/news/`

The next architecture step is to make article publishing a Supabase CMS operation so publishing or updating a story does not require a full website deployment.
