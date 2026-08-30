# FMB News

Standalone repository for **FMB News / Filipino Media Bulletin**, including FMB Brief and FMB Worldwide.

## Migration status

This repository is being migrated from `masinlocandher-max/FMB-Ecosystem` using a copy-first, cutover-second process. The legacy source remains in the ecosystem until this standalone repository is verified and the public `/news/` route is safely cut over.

## Target publishing architecture

- FMBNews: newsroom frontend, FMB Brief, FMB Worldwide, SEO and article renderer
- Supabase `withlovefmb`: publishing/CMS data source
- Public identity: FMB News / Filipino Media Bulletin
- Public route: `https://www.francinemariebautista.com/news/`

Publishing content should ultimately be a CMS/database operation, not a full FMB ecosystem deployment.
