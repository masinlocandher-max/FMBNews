# FMB News AI newsroom architecture

Phase 1. This document describes a foundation that **decides but does not act**.
Nothing in `scripts/lib/newsroom/` contacts a source, calls a provider, writes
to Supabase, or publishes anything. Live publication stays under human
editorial control, and `scripts/verify-newsroom-automation.mjs` fails the build
if `autonomousPublishing.enabled` is flipped without the gate being updated in
the same change.

## What already existed, and is reused rather than rebuilt

The newsroom is not a greenfield. Before adding anything, these were confirmed
in the running system, not in documentation:

| Capability | Where |
| --- | --- |
| Worker routing and the `/news*` boundary | `src/worker.js`, `wrangler.jsonc` |
| Supabase CMS read path | `src/worker.js` `lookupPublishedArticle()`, six client runtimes |
| Live tables | `news_articles`, `news_editions`, `news_edition_entries`, `fmb_news_subscribers` |
| Passwordless auth | `auth/v1/otp`, `auth/v1/token`, `auth/v1/user` |
| Subscriber capture | `public/assets/js/fmb-news-newsletter.js` |
| Push / PWA | `public/assets/js/fmb-news-pwa.js`, `site/sw.js` |
| Article contract | `content/news/articles/**.json`, `schemaVersion` |
| Editorial gate | `scripts/verify-editorial-production.mjs` |
| Photography rights gate | `scripts/verify-article-photography.mjs` + rights-cleared ledger |
| Distribution | sitemap, news sitemap, RSS, and their CI contract |

The repository has **zero npm dependencies**. Everything added in Phase 1 keeps
that property: configuration is JSON, modules are ES modules on the Node
standard library, and the tests run on `node:test`.

## The article contract is not re-invented

Automation drafts into the existing record, which carries `schemaVersion`,
`status`, `slug`, `headline`, `seoTitle`, `seoDescription`, `keywords`,
`category`, `kicker`, `deck`, `publishedAt`, `updatedAt`, `author`,
`articleType`, `sections[]`, `sources[]`, `image{kind,url,source,creator,license,credit,caption,alt,width,height,sourceUrl}`
and `audit{sourceCheckedAt, verificationNotes[]}`.

The editorial lenses in live use are kept as they are: **What happened**,
**Context**, **Why this matters** (and its Filipino-impact variant), **What to
watch next**, and **What remains unclear**. A second article schema would mean
two sets of SEO, canonical, source and image rules drifting apart, and the
existing verifiers only understand one of them.

## Pipeline

Each stage is a separate job with its own durable row. They are deliberately
not one function: a stage that fails must be resumable without re-running the
stages before it, and `publish` completing must not be undone by `audio`
failing afterwards.

```
SOURCE INTAKE -> NORMALISATION -> DUPLICATE DETECTION -> EVIDENCE EXTRACTION
  -> STORY SELECTION -> ARTICLE DRAFT -> FACT/EVIDENCE CHECK
  -> EDITORIAL POLICY CHECK -> HUMAN REVIEW (when required) -> PUBLICATION
  -> AUDIO -> NEWSLETTER -> SOCIAL DERIVATIVES -> DELIVERY VERIFICATION
  -> ANALYTICS -> CORRECTION PROPAGATION
```

## The four modules, and what each refuses to do

`scripts/lib/newsroom/sources.mjs` — the register. Answers one question: may
automation contact this source now? `APPROVED` only. `CANDIDATE` is readable by
a human and never polled. `DISABLED` is not contacted at all, including by a
manual retry, because the usual reason a source is disabled is that someone
asked us to stop.

`scripts/lib/newsroom/policy.mjs` — publish, review, or hold. Three gates, and
the strictest wins. High-risk subjects go to a human regardless of evidence
quality; no confidence score buys past that. **Independence is counted by
publisher, not by document**: two wire copies of one agency release are one
source, and model output is not counted at all.

`scripts/lib/newsroom/job-states.mjs` — a nine-state machine whose legal
transitions are data, so the illegal ones can be tested. `completed` and
`cancelled` are sealed. `waiting_review` cannot reach `completed` directly,
because an approval is its own recorded act with an operator attached.

`scripts/lib/newsroom/limits.mjs` — every ceiling in one place. A retry limit
written as a literal inside the retry loop is a limit nobody finds when the bill
arrives.

## Infrastructure: nothing new

No Queues, D1, KV, R2 or Workflows are added. Phase 1 needs none of them, and
the brief is explicit that a new Cloudflare primitive needs a documented reason
first. When durable job execution is actually built, the reason, the chosen
primitive and the alternative rejected belong in this file before the binding
is added to `wrangler.jsonc`.

## Database: no migrations proposed

The live CMS is Supabase project `wjnavdpppnhxbuydkrkd`. **Its schema could not
be read**: the Supabase account reachable from this environment holds different
projects, so the real column definitions are unavailable. The brief says not to
guess table definitions from documentation, so Phase 1 proposes **no
migrations**. The column names recorded above were taken from the `select=`
lists the running client actually sends, which is evidence of what exists, not
of what the full schema is.

Operational concepts that may eventually need storage — jobs, source items,
evidence, reviews, media assets, deliveries, corrections — are described in
`docs/ai-newsroom-operations.md` as data shapes, with no DDL, so that whoever
can read the live schema can check for an existing equivalent before creating
anything.
