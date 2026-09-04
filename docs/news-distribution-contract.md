# FMB News distribution contract

This contract applies to generated discovery surfaces under the canonical FMB News path.

- `/news/sitemap.xml` contains the exact canonical set of indexable newsroom pages. Utility routes such as search, submit, and offline pages are excluded. `lastmod` is emitted only when the final page carries a real article modification timestamp.
- `/news/news-sitemap.xml` contains only published FMB News reports whose publication time is within the previous 48 hours. An empty News sitemap is valid when no report is genuinely fresh. Old stories are never re-dated to keep this sitemap populated.
- `/news/feed.xml` is RSS 2.0, contains up to the latest 50 published FMB News reports, preserves publication order, and uses canonical report URLs as permanent GUIDs.
- Every indexable newsroom HTML page advertises `/news/feed.xml` using RSS autodiscovery.
- CI compares generated distribution output with the final built newsroom and source article records. It rejects duplicate/off-network URLs, fake future freshness, stale News entries, mismatched headlines, incorrect feed ordering, missing canonicals, and missing RSS discovery.
- The Cloudflare deployment workflow verifies the three public distribution endpoints after Worker deployment before declaring cutover successful.

These rules are production/distribution infrastructure only. They must not change the frozen FMB News visual system.
