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

## Static archive and live CMS

The repository holds **both** a versioned static archive and live CMS
behaviour, and both are load-bearing. The static archive is permanent history
and the fallback when Supabase is unavailable; the CMS is what publishes
without a rebuild.

They interact, and the interaction is not fully characterised here because the
live schema could not be read from this environment. What is known from the
running code: the Worker serves `/news/read/:slug` from `news_articles` and
injects metadata at the edge, while dated routes are served from built static
files; when the CMS is unreachable the static newsroom stays intact.

**The open question, recorded rather than guessed at:** a correction must
ultimately change the article a reader actually receives. Where a story exists
both as a built static route and as a CMS row, it must be established which one
wins at read time, and a correction must reach that one. Until that is
characterised against the live schema, corrections stay a human-run procedure.
Do not automate correction propagation across the archive/CMS boundary before
this is resolved — a correction that lands in the copy nobody reads is worse
than no automation at all, because it looks done.

## Failure recovery

- A job that dies mid-flight is detectable: `startedAt` set, `completedAt`
  null, past its timeout.
- Retries are bounded by `perJob.maxAttempts` with increasing backoff, then the
  job fails and waits for a person. A job that retries forever is an outage
  nobody is paged for.
- An unconfirmed external attempt reconciles against the provider before any
  resend.
- Budget pause never stops publication of approved work, site serving,
  correction notices, or delivery reconciliation.
