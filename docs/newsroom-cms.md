# FMB News CMS architecture

## Goal

Publishing or updating editorial content must not require rebuilding the full FMB website.

The standalone newsroom uses Supabase project `withlovefmb` as the publishing data source and keeps the versioned static archive as a permanent history/fallback layer.

## Data model

### `public.news_articles`

Existing newsroom article table. It is the source for individual FMB News reports.

The standalone CMS preserves the richer structured article format used in `content/news/articles/` through fields for kicker, deck, keywords, structured content, source metadata, image metadata, audit metadata, canonical path, and content version.

Existing editorial controls remain in force, including status, verification, Filipino-impact fields, human review constraints, and admin/staff RLS.

### `public.news_editions`

Parent record for products that are editions rather than individual articles:

- `brief` — FMB Brief
- `worldwide` — FMB Worldwide

FMB Worldwide editions can store a rolling `window_start` and `window_end`.

### `public.news_edition_entries`

Ordered entries belonging to an edition. Entries can store country or section, category, headline, verified fact, why it matters, reputation/communications implication, opportunity/risk, source links, and image metadata.

## Public access model

All newsroom tables use Row Level Security.

- Anonymous visitors can read only published articles and published editions.
- Signed-in users can read unpublished newsroom material only when `private.is_fmb_staff()` authorizes them.
- Insert, update, and delete operations require `private.is_fmb_admin()`.
- The browser uses only the Supabase publishable key. Secret/service-role credentials must never be committed or sent to browsers.

## Frontend behavior

`public/assets/js/fmb-news-cms.js` progressively enhances the newsroom:

- Homepage story grid can load newly published `news_articles`.
- Homepage FMB Brief feature can point to the latest published database edition.
- FMB Worldwide landing can display the latest published Worldwide entries.
- `/news/read/:slug` routes through the generic CMS article reader.
- `/news/world/live/` renders the latest Worldwide database edition.
- `/news/fmb-brief/live/` renders the latest FMB Brief database edition.

If Supabase has no published CMS content or a request fails, the repository's static newsroom/archive remains intact.

## Repository boundary

`FMBNews` is self-contained and owns `/news/`. It must not import, sync, hydrate, or fetch application code or editorial content from another application repository. CI enforces that boundary.

## Deployment model

Content publishing occurs through Supabase. A hosting deployment is reserved for application changes such as design, routing, components, or publishing logic. The canonical public application route is `/news/`.
