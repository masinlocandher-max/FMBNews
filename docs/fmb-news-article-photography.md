# FMB News article photography

A published article carries a real photograph. This is a newsroom rule, and it
is enforced by the build rather than by memory: `scripts/verify-article-photography.mjs`
runs in `npm run verify` and fails when a new article ships without one.

## How a photograph gets onto an article

One file is the source of truth: `content/news/rights-cleared-image-overrides.json`,
keyed by article slug.

```json
"aquino-bridge-tarlac-collapse-habagat-august-29-2026": {
  "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/....jpg",
  "sourceUrl": "https://commons.wikimedia.org/wiki/File:....jpg",
  "credit": "Photo: Kleomarlo / Wikimedia Commons, CC BY-SA 3.0",
  "caption": "File photograph of Aquino Bridge in Tarlac City from 2013. It does not depict the August 2026 collapse.",
  "alt": "Aquino Bridge in Tarlac City used as a contextual file photograph"
}
```

The build then does the rest:

1. `fetch-rights-cleared-photography.mjs` copies the file into the build. Local,
   never hot-linked — production pages serve FMB's own copy.
2. `apply-rights-cleared-photography.mjs` puts it on the article with the
   caption and credit, before the guaranteed-image fallback can fire.
3. `verify-article-photography.mjs` checks it all and gates the build.

To see what still needs a photograph, newest first:

```
npm run photo:worklist -- --bucket news --limit 60
```

## Sourcing: the one rule that matters

**An image search filter is how you find a candidate. It is never the
clearance.**

Google Images' Tools → Usage Rights → Creative Commons filter reports what the
*hosting page* claims. An agency photograph reposted on a blog under a "CC"
banner is still an agency photograph, and the blog cannot license it to you.

So: find it however you like, then open the file on a host where the licence
lives with the file — Wikimedia Commons, Flickr, Openverse, a government
archive — read the licence on that page, and record that page as `sourceUrl`.
The verifier enforces this with an allowlist of licence-bearing hosts and
refuses everything else, naming the host it rejected. Getty, Shutterstock,
Alamy, Inquirer, Rappler, GMA, Pinterest, Instagram and personal blogs all
fail, by design.

If a host genuinely publishes per-file licence terms and is missing, add it to
`LICENCE_BEARING_HOSTS` in the verifier — deliberately, having checked.

## What the credit must say

The credit must name the creator **and** the licence, because CC BY and CC BY-SA
require both to travel with the image. `Photo: Name / Host, CC BY-SA 4.0`.
Public domain and CC0 are recorded the same way. The verifier rejects a credit
that names no terms.

## What the caption must say

A file photograph is normal and legitimate. A file photograph presented as if it
shows the event is not.

When the picture does not depict the event being reported, the caption says so
in plain words — the ledger already does this well:

> "It illustrates monsoon flood risk and does not depict the August 30, 2026
> flooding."

The caption is carried through to the page verbatim for exactly this reason.

## The coverage baseline

`content/news/photography-coverage-baseline.json` records, per product, how many
published articles carry **no** photograph. The gate fails when a measured count
rises above its number.

That number may only go **down**, and only alongside the cleared photographs
that earned the reduction. Raising it to make a build pass switches the rule
off, which is the one thing this file exists to prevent.

Measured 2026-09-15 across 537 built article routes:

| Product   | With a photograph | Total |
| --------- | ----------------- | ----- |
| news      | 19                | 320   |
| explainer | 0                 | 206   |
| brief     | 0                 | 11    |

FMB Explainer runs 205 original FMB-owned editorial illustrations, which is its
own approved standard; its baseline reflects that rather than a backlog.
