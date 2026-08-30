# FMB News CMS architecture

## Goal

Publishing or updating editorial content must not require rebuilding the full FMB website.

The standalone newsroom uses Supabase project `withlovefmb` as the publishing data source and keeps the migrated static archive as a permanent fallback/history layer.

## Data model

### `public.news_articles`

Existing newsroom article table. It remains the source for individual FMB News reports.

The standalone CMS adds fields for the richer structured article format already used in `content/news/articles/`:

- `kicker`
- `deck`
- `keywords[]`
- `content_json`
- `sources_json`
- `image_metadata`
- `audit_metadata`
- `canonical_path`
- `content_version`

Existing editorial controls remain in force, including status, verification, Filipino-impact fields, human review constraints, and admin/staff RLS.

### `public.news_editions`

Parent record for products that are editions rather than individual articles:

- `brief` — FMB Brief
- `worldwide` — FMB Worldwide

FMB Worldwide editions can store a rolling `window_start` and `window_end`.

### `public.news_edition_entries`

Ordered entries belonging to an edition. Entries can store:

- country / section
- category
- headline
- verified fact
- why it matters
- reputation / communications implication
- opportunity / risk
- source links
- image metadata

## Public access model

All newsroom tables use Row Level Security.

- Anonymous visitors can read only published articles and published editions.
- Signed-in users can read unpublished newsroom material only when `private.is_fmb_staff()` authorizes them.
- Insert, update, and delete operations require `private.is_fmb_admin()`.
- The browser uses only the Supabase publishable key. Secret/service-role credentials must never be committed or sent to browsers.

## Frontend behavior

`public/assets/js/fmb-news-cms.js` progressively enhances the migrated newsroom:

- Homepage story grid can load newly published `news_articles`.
- Homepage FMB Brief feature can point to the latest published database edition.
- FMB Worldwide landing can display the latest published Worldwide entries.
- `/news/read/:slug` routes through the generic CMS article reader.
- `/news/world/live/` renders the latest Worldwide database edition.
- `/news/fmb-brief/live/` renders the latest FMB Brief database edition.

If Supabase has no published CMS content or a request fails, the existing static newsroom/archive remains intact.

## Migration integrity

The pre-cutover reconciliation is stored in `migration/reconciliation-report.txt` and must remain in the repository. It verified all migrated rendered pages, structured article files, News images, and local asset references before the temporary migration bridge was removed.

## Production cutover

The legacy News files in `FMB-Ecosystem` remain a rollback copy until the independent FMBNews deployment is live and the public `/news/` route has been verified against it. After that cutover, content publishing should occur through Supabase; Vercel deployment is reserved for application/design changes.
