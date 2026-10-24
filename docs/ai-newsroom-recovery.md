# FMB News AI newsroom recovery and corrections

A correction is a first-class workflow event, not an edit. The test of a
correction system is not whether the article changes — it is whether everything
derived from the article is findable afterwards.

## The correction record

- the **article version** affected
- the **claims** corrected, individually
- timestamp, reason, and the **reviewer** who approved it
- the **published replacement version**
- which **narration** is affected
- which **newsletter** carried the stale text
- which **social derivatives** carried it

## How stale derivatives become findable

Every derivative is keyed on the version it was made from:
narration on `scriptVersion`, social posts on `derivativeVersion`, publication
on `contentVersion`. A correction increments the version, which changes the key,
which means the old derivative can never be mistaken for current and the new one
is not suppressed as a duplicate.

If a correction materially changes the narration, the previous audio must stop
being presented as current. A stale narration is worse than no narration: a
reader who listens has no way to know they are hearing a retracted claim.

## Email cannot be recalled

Mail that has been delivered is delivered. The system records that fact rather
than pretending otherwise, and the decision becomes whether a correction notice
is required — which is an editorial judgement, made by a person, not a flag an
automation sets.

## Static archive and live CMS — resolved, except one condition

Both layers are load-bearing and neither is removed. What was previously
written here as "needs investigation" has now been established from the
repository and the running client. Only one question genuinely requires live
schema access, and it is stated exactly, with a command that answers it.

### Established: the route namespaces are disjoint

| Content | Static route | Live CMS route |
| --- | --- | --- |
| Article | `/news/<slug>/` (365 built) | `/news/read/<slug>/` (Worker + `news_articles`) |
| Worldwide edition | `/news/world/<date>/` | `/news/world/live/` |
| Daily Brief edition | `/news/fmb-brief-<date>/` | `/news/fmb-brief/live/` |

Measured in the built output: `data-cms-article` appears on exactly **one**
page (`/news/read/`) and `data-cms-edition` on exactly **two** (the two `/live/`
routes). No single URL is rendered by both systems, so in the ordinary case a
correction has exactly **one** destination:

- a CMS story is corrected in its `news_articles` row and `/news/read/<slug>/`
  serves it within the Worker's 60s cache TTL, with no rebuild;
- a static story is corrected in `content/news/articles/<date>/<file>.json` and
  reaches readers on the next build and deploy.

### The one condition that is NOT established

`src/worker.js` `canonicalArticleUrl()` takes a row's `canonical_path` and,
when it begins with `/news/`, emits it verbatim as that page's canonical URL.
The resolved reader page is served `X-Robots-Tag: index, follow`
(`src/worker.js:259`) — it is indexable.

So **if** a published `news_articles` row carries a `canonical_path` pointing at
a static route, that one story has two live indexable URLs which both declare
the static copy canonical. Then:

- a correction written to the CMS row changes `/news/read/<slug>/` only;
- a correction written to the JSON and rebuilt changes `/news/<slug>/` only;
- either way search engines are pointed at the static copy.

Whether any such row exists cannot be determined from this repository: it
depends on the `canonical_path` values in the live database, and the Supabase
account reachable from the build environment does not hold project
`wjnavdpppnhxbuydkrkd`.

### The command that answers it

```
SUPABASE_URL=… SUPABASE_PUBLISHABLE_KEY=… node scripts/audit-cms-canonical-overlap.mjs
```

Read-only, published rows only, under the existing RLS. It needs **no
service-role key** — the publishable key is sufficient and is already public in
the client. It is deliberately outside `npm run verify`, because a build must
not depend on a network round trip.

It reports two overlaps and exits:

- **0 — clean.** No row claims a static canonical and no slug exists in both
  layers. Every correction has one destination and correction propagation can
  be automated. *This is the Phase-2 prerequisite, and it is met.*
- **3 — overlap.** Each listed slug is one story with two live copies. Resolve
  the duplication first — retire the static copy, or stop the row claiming a
  static `canonical_path` — because automating propagation over an unresolved
  duplicate writes the copy nobody is directed to.
- **2** — credentials absent.

Until it returns 0, correction propagation across the archive/CMS boundary
stays a human procedure.

## Failure recovery

- A job that died mid-flight is detectable: `startedAt` set, `completedAt`
  null, past `perJob.timeoutSeconds`.
- Retries are bounded by `perJob.maxAttempts` with increasing backoff, then the
  job fails and waits for a person. A job that retries forever is an outage
  nobody is paged for.
- An external attempt that was recorded but never confirmed reconciles against
  the provider before any resend. A timeout is not evidence that nothing
  happened.
- Budget pause never stops publication of approved work, site serving,
  correction notices, or delivery reconciliation.
