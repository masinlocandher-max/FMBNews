# FMB News AI newsroom operations

## The job record

Durable, one row per stage per story. Held in a store that survives a worker
restart — never only in memory, because a pipeline that forgets where it was
re-runs work that already had an external effect.

| Field | Why it exists |
| --- | --- |
| `jobId` | identity |
| `storyId` | what it is about |
| `jobType` | which stage |
| `state` | one of the nine below |
| `inputVersion` / `outputVersion` | which content version it consumed and produced; this is what makes a stale derivative identifiable after a correction |
| `attemptCount` | bounded by `perJob.maxAttempts` |
| `provider` | which external service, when one is involved |
| `startedAt` / `completedAt` | latency, and detecting jobs that died mid-flight |
| `lastError` | an error class, never a payload containing subscriber content |
| `nextRetryAt` | from `perJob.backoffSeconds` |
| `requiresHumanReview` | set by the policy check, never cleared by automation |
| `operator` | who approved, when approval applies |
| `idempotencyKey` | the external-effect key, stable across attempts |

States: `queued` · `running` · `waiting_review` · `approved` · `held` ·
`failed` · `retrying` · `completed` · `cancelled`.

`completed` and `cancelled` are terminal and sealed. `waiting_review` may not
jump to `completed`.

## Data shapes that may need storage

Described as shapes, not DDL: the live schema could not be read from this
environment, so whoever can read it must check for an existing equivalent
before creating any of these. Several may already exist under other names.

- **source items** — raw intake, keyed by source id plus the publisher's own
  item id, so the same item arriving twice is one row.
- **evidence** — a claim, the source it came from, and the quote or record that
  supports it. This is what makes "why did this publish?" answerable later.
- **reviews** — operator, decision, timestamp, and what was shown at the time.
- **media assets** — generated narration, its script version, and its state.
- **deliveries** — one row per channel per recipient per edition, carrying the
  idempotency key and the provider's own id.
- **corrections** — see `docs/ai-newsroom-recovery.md`.

## Operations dashboard

Mobile-first, behind the **existing** passwordless auth and staff checks. Not a
second authentication system.

**Today** — stories found, drafting, held, awaiting review, published; audio
generated; newsletter status; social delivery status; failed jobs.

**Attention required** — evidence conflict · missing source · missing image
rights · human review needed · audio failed · newsletter failed · social failed
· correction pending · budget threshold reached.

**Controls** — approve · reject · hold · retry · cancel · pause automation ·
pause one channel · open evidence · open public story.

The dashboard shows job state and editorial material. It does not show API
keys, full tokens, payment details, or subscriber personal data; an operator
does not need any of those to decide whether a story is ready.

## Observability

Every job emits a structured record: `jobId`, `storyId`, `stage`, `provider`,
`attempt`, `status`, `latencyMs`, `usage` when the provider reports it, and an
`errorClass`.

Never logged: API keys, passwords, full authentication tokens, subscriber
addresses or message bodies. An error class is enough to diagnose a failure;
the payload that caused it is not needed and is the thing that leaks.

## Cost control

All ceilings live in `config/newsroom-limits.json`:
per-story AI calls, draft revisions and audio regenerations; per-job attempts,
backoff and timeout; daily and monthly budget with an alert threshold below the
pause threshold.

The exemption list is the part that matters. Publishing an already-approved
story, serving the site, sending a correction notice and reconciling a delivery
are **never** paused by budget. A cost ceiling that can stop a correction going
out has turned a billing control into an editorial failure.
