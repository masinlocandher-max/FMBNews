# FMB Fact Check — 123-item preparation queue

Status at preparation time:

- Corpus: 123
- Published: 0
- Held: 123
- Canonical source list: `content/fact-check/HELD.json`
- Release gate: `scripts/verify-fact-check.mjs`

## Important editorial rule

The rating stored in the draft corpus is **not yet a published FMB verdict**.

Every item remains HELD until FMB independently verifies the exact circulating claim, records the claim source, checks at least one primary source, adds appropriate corroborating evidence, reaches the rating independently, reconciles the article copy with the evidence, checks image rights, and passes final editorial review plus the repository Fact Check verifier.

Do not publish a draft merely because its current draft rating says `FALSE`, `MISLEADING`, `TRUE`, or `VERIFIED FACT`.

## Preparation output

Run:

```bash
node scripts/prepare-fact-check-backlog.mjs
```

This produces:

- `content/fact-check/PREPARED.json`
- `content/fact-check/PREPARED.csv`

The generated queue includes all 123 held claims and does not alter the publication ledger.

## Verification batches

The queue is divided into seven manageable editorial batches:

1. Items 1–20
2. Items 21–40
3. Items 41–60
4. Items 61–80
5. Items 81–100
6. Items 101–120
7. Items 121–123

Batching is for workflow only. It does not imply priority or publication order.

## Required evidence packet per claim

Each claim must ultimately have `content/fact-check/evidence/<slug>.json` containing:

```json
{
  "slug": "claim-slug",
  "claimSource": {
    "url": "https://…",
    "capturedAt": "YYYY-MM-DD",
    "description": "Exact circulated post, video, statement or report that FMB checked."
  },
  "rating": "FALSE",
  "ratingReachedBy": "FMB",
  "evidence": [
    {
      "kind": "primary",
      "title": "Primary record title",
      "publisher": "Primary institution",
      "url": "https://…",
      "checkedOn": "YYYY-MM-DD",
      "supports": "What this record establishes."
    },
    {
      "kind": "secondary",
      "title": "Corroborating report",
      "publisher": "Credible newsroom",
      "url": "https://…",
      "checkedOn": "YYYY-MM-DD",
      "supports": "Context or corroboration."
    }
  ],
  "derivedFrom": null
}
```

## Verification checklist

For every claim:

- capture the exact claim as circulated
- save or archive the source URL
- identify the material factual proposition being checked
- find the strongest available primary record
- use credible secondary reporting for context/corroboration when useful
- verify names, dates, figures, quotations and chronology
- identify missing context or manipulated framing
- independently determine the rating
- document uncertainty explicitly
- reconcile headline, claim text and verdict with the evidence
- verify image provenance and reuse rights
- complete final editorial review
- run `npm run build`
- run `npm run verify`

## Rating discipline

Approved rating vocabulary currently enforced by the repository:

- `TRUE`
- `VERIFIED FACT`
- `MISLEADING`
- `FALSE`

Do not change a rating merely to make a verifier pass. If independent verification contradicts the draft rating, stop and correct the underlying master/evidence workflow deliberately rather than bypassing the gate.

## Publication threshold

A claim is publishable only when all of the following are true:

1. exact claim source is recorded
2. at least one primary evidence URL has been checked
3. material facts are independently verified
4. the rating was reached by FMB
5. attribution is preserved where work derives from another publisher
6. article text accurately reflects the evidence
7. image/visual use is defensible
8. final editorial review is complete
9. the Fact Check verifier passes

Until then the release decision is:

`DO_NOT_PUBLISH_YET`

## Goal

Turn the existing 123-item backlog into an evidence-backed, auditable FMB Fact Check library without sacrificing accuracy for volume.
