# FMB Fact Check — evidence records

An item in `content/fact-check/master/` is a **draft**. Every one of the 123 says
so in its own `EDITORIAL STATUS` field:

    FULL-LENGTH FMB ARTICLE DRAFT. FINAL PUBLICATION REQUIRES INDEPENDENT
    SOURCE VERIFICATION AND SOURCE LINKS.

A draft does not publish. To publish a fact check, add `<slug>.json` here
carrying the evidence FMB actually checked:

```json
{
  "slug": "example-claim-slug",
  "claimSource": {
    "url": "https://…",
    "capturedAt": "2026-09-04",
    "description": "The post as it circulated, archived."
  },
  "rating": "FALSE",
  "ratingReachedBy": "FMB",
  "evidence": [
    {
      "kind": "primary",
      "title": "CHED list of recognised higher education institutions",
      "publisher": "Commission on Higher Education",
      "url": "https://…",
      "checkedOn": "2026-09-04",
      "supports": "No such degree or conferring institution exists."
    }
  ],
  "derivedFrom": null
}
```

Enforced by `scripts/verify-fact-check.mjs`:

- At least one `evidence` entry of `kind: "primary"` with a resolvable URL —
  statutes, court decisions, official government records, agency releases,
  public datasets, the original post or statement, election records, budget and
  procurement documents, scientific or institutional records.
- `claimSource.url`, so a reader can see what was actually checked.
- `rating` must match the master item's rating; a disagreement is a hard error.
- `ratingReachedBy` must be `"FMB"`. A rating taken from another fact-checking
  organisation is not an FMB fact check.
- `derivedFrom` must be filled in whenever substantive prose, structure,
  conclusions or the rating came from another publisher, and the page must name
  that publisher. Attribution is never removed to make an item look original.

Secondary reporting (Reuters, AP, AFP, Philippine news organisations) belongs in
`evidence` with `kind: "secondary"` for corroboration and context. It cannot by
itself satisfy the primary-evidence requirement, and rewriting another
publisher's article is not independent verification.
