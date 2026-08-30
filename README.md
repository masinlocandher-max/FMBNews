# FMB News

Standalone repository for **FMB News / Filipino Media Bulletin**, including **FMB Brief** and **FMB Worldwide**.

## Status

**Standalone source migration verified.**

The canonical FMB News newsroom source, structured editorial content, News imagery, FMB Brief, FMB Worldwide, News-specific CSS/JS, approved brand data, and reference copies of the former legacy newsroom scripts were migrated from `masinlocandher-max/FMB-Ecosystem` into this repository.

The standalone GitHub Actions build and route verification pass successfully.

From this point forward, new FMB News product development should happen in **`masinlocandher-max/FMBNews`** rather than adding more newsroom build logic to the mother ecosystem repository.

## Safety / cutover

The old News source remains in `FMB-Ecosystem` temporarily as a rollback copy. Do **not** delete it until the independent News deployment is live and `https://www.francinemariebautista.com/news/` has been safely cut over and verified.

A manual-only legacy sync workflow is retained under `.github/workflows/migrate-fmb-news.yml` for emergency reconciliation before cutover. It no longer runs automatically.

## Repository structure

- `site/` — FMB News pages, including FMB Brief and FMB Worldwide
- `content/news/` — structured editorial source content and newsroom metadata
- `public/assets/` — News-only images, styles, scripts, and approved brand assets
- `scripts/` — minimal standalone build and verification
- `migration/` — source snapshot metadata and preserved legacy build scripts for reference only

## Target publishing architecture

- **FMBNews** — newsroom frontend, FMB Brief, FMB Worldwide, SEO and article renderer
- **Supabase `withlovefmb`** — publishing/CMS data source
- **Public identity** — FMB News / Filipino Media Bulletin
- **Public route** — `https://www.francinemariebautista.com/news/`

The next architecture step is to make article publishing a Supabase CMS operation so publishing or updating a story does not require a full website deployment.
