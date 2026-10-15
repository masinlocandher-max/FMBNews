# FMB News article scaffold

Use this contract for every new structured report under `content/news/articles/`.
Verify, render, and hardfix share `scripts/lib/editorial-section-canon.mjs`.
Do not invent alternate lens headings.

## Required section headings (exact)

1. **What happened** — or **What changed** for a same-event continuation
2. Optional freeform analysis sections (for example `What the records say`)
3. **Context**
4. **Why this matters** — put Filipino framing in the paragraph, not the heading
5. Optional `Earlier FMB coverage`
6. **What to watch next**

Accepted aliases rewritten at build / `npm run validate:content` when the target
lens is missing:

- Why → `Why this matters`: `Why it matters`, `Why it matters to Filipinos`, `Why this matters to Filipinos`
- Context → `Context`: `Background`
- Watch → `What to watch next`: `What happens next`, `What to watch`

Before a full build, run:

```bash
npm run validate:content
```

That normalizes known aliases and fails fast on missing lenses, thin decks, or QA hosts — no photography fetch and no HTML render.

## Sources

- Cite the publisher’s **live** HTTPS site, or an internal `/news/` continuity link.
- Never cite `qa.`, `staging.`, `dev.`, `test.`, `uat.`, `preview.`, or `beta.` hosts.
- Known safe rewrites (also applied at build):
  - `qa.philstar.com` → `www.philstar.com`
  - `staging.pagasa.dost.gov.ph` → `www.pagasa.dost.gov.ph`
- Modern reports need at least two external HTTPS sources.

## Imagery

- Prefer a rights-cleared photograph recorded in `content/news/rights-cleared-image-overrides.json`.
- If there is no photograph, omit a one-off SVG. The build assigns a rotating
  branded plate from `scripts/lib/editorial-fallback-pool.mjs` by story seed.
- A fallback plate is not a photograph and must never count as photographic coverage.

## Metadata floor (modern / post–2026-09-01)

- `seoTitle` 20–85 characters
- `seoDescription` 60–190 characters
- `deck` 55–280 characters
- `articleType` `NewsArticle` or `Article`
- body ≥ 100 words across sections
- `audit.sourceCheckedAt` ISO timestamp

## Reader UI

Canon sections render as the article lenses (Verified facts / Context / Why this
matters / What to watch next). Freeform sections stay in the body. Keeping the
headings above prevents empty lenses and duplicated giant body headings.
