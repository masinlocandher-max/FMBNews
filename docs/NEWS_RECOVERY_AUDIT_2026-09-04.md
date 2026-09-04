# FMB News Missed-Publication Recovery Audit

Audit date: 2026-09-04 PHT
Canonical repository: `masinlocandher-max/FMBNews`
Legacy source investigated: `masinlocandher-max/FMB-Ecosystem`

## Finding

The newsroom's scheduled six-hour publication briefs from 2026-08-28 through 2026-09-04 07:00 PHT contained 84 `PUBLISH NOW` article/update slots. Only 16 of those prepared publication packages have an exact corresponding published article record in the current canonical FMB News archive.

**Missed publication entries: 68.**

| Date | PUBLISH NOW entries | Exact published matches | Missed entries |
| --- | ---: | ---: | ---: |
| 2026-08-28 | 6 | 2 | 4 |
| 2026-08-29 | 12 | 6 | 6 |
| 2026-08-30 | 12 | 3 | 9 |
| 2026-08-31 | 12 | 2 | 10 |
| 2026-09-01 | 12 | 1 | 11 |
| 2026-09-02 | 12 | 1 | 11 |
| 2026-09-03 | 12 | 1 | 11 |
| 2026-09-04 through 07:00 PHT | 6 | 0 | 6 |
| **TOTAL** | **84** | **16** | **68** |

## Recovery rule

These 68 entries must **not** be bulk-published blindly. Many are sequential updates of the same developing event. The recovery process must preserve the strongest/latest verified version and classify every missed entry as one of:

- `publish-standalone` — unique report that should become its own article.
- `merge-latest` — earlier update that should be merged into the latest version of the same story.
- `archive-superseded` — historically prepared package that is obsolete and should not be published as a separate current article.
- `needs-verification` — source package needs renewed factual/source validation before publication.

## Known repeated story families

Deduplication is especially important for:

- Tropical Depression / Tropical Storm Pilandok and Habagat updates.
- Lake Mapanuepe boat tragedy updates.
- Central Luzon rainfall, flooding, dam discharge and evacuation updates.
- Visayas / Mindanao power-grid alerts and restoration updates.
- Leptospirosis hospital-capacity and DOH response updates.
- National Heroes Day coverage.
- NLEX / San Simon flood, bridge, toll and dredging developments.
- Senate impeachment-trial updates.

## Repository boundary

All recovered FMB News content belongs only in `masinlocandher-max/FMBNews`.

`masinlocandher-max/FMB-Ecosystem` is a legacy source for historical recovery only. It must not be restored as a deployment source, canonical content source, Vercel source, Cloudflare source, or runtime dependency for FMB News.

## Publication safety

A recovery item must not enter the existing `content/news/articles/<date>/` published archive until its source package has been reconciled and the final article is intentionally marked for publication. Recovery metadata lives under `content/news/recovery/` so the existing production verifier cannot accidentally treat a quarantine item as published content.
