# FMB News AI newsroom integrations

Every provider sits behind an adapter. Provider-specific logic lives in one
module per provider and nowhere else, so swapping one does not mean editing the
pipeline, and so a provider outage has one place to be handled.

## Idempotency: the contract every adapter obeys

`scripts/lib/newsroom/idempotency.mjs` derives a key from the fields that
identify **what** an effect is, never **when** it was attempted.

| Effect | Key fields |
| --- | --- |
| `publish-article` | `storyId`, `contentVersion` |
| `generate-audio` | `storyId`, `scriptVersion`, `voiceId` |
| `send-newsletter` | `editionId`, `recipientId` |
| `post-social` | `storyId`, `channel`, `derivativeVersion` |
| `payment-webhook` | `providerEventId` |
| `correction-notice` | `correctionId`, `channel` |

A key containing a timestamp, attempt number, nonce or random value is rejected
by `assertStableKey()`. Those are the names people reach for without thinking,
and every one of them turns a retry into a duplicate.

The third state is the one that gets skipped: an attempt recorded but never
confirmed. `shouldPerform()` returns `reconcile` there — **ask the provider what
it already has** before sending anything. A timeout is not evidence that
nothing happened.

## ElevenLabs

The site must never synthesise speech at read time.

```
APPROVED SCRIPT -> GENERATE ONCE -> STORE MEDIA -> SAVE METADATA -> SERVE STORED AUDIO
```

The adapter handles timeout, bounded retry on the stored idempotency key, voice
and model configuration, character usage and cost accounting against
`newsroom-limits.json`, and a pronunciation layer for the things a generic
English voice gets wrong in this newsroom: Filipino personal and place names,
peso values, dates in Philippine style, agency acronyms (PAGASA, DSWD, BARMM,
NDRRMC), and Filipino-English code switching inside one sentence.

Every narration carries the synthetic-audio disclosure from
`newsroom-policy.json`. A material correction changes `scriptVersion`, which
changes the key, which forces regeneration — and until the new narration
exists, the old one must not be presented as current.

## Newsletter

Audit before replacing: subscriber capture exists today in
`public/assets/js/fmb-news-newsletter.js` and `fmb_news_subscribers`, and
passwordless authentication (`auth/v1/otp`) is part of the architecture and
stays.

Four concepts are kept distinct, because collapsing them is how someone who
unsubscribed receives mail: **persistence** (the record exists) · **consent**
(they agreed, when, to what) · **preferences** (what they chose) · **delivery
state** (what happened to one send).

Prepared: consent workflow with double opt-in, unsubscribe, suppression list,
delivery events, failed delivery, edition id, recipient id, duplicate-send
prevention via the per-recipient key, and a correction email path.

## Social distribution

No platform API is assumed. Each channel records: supported format ·
authentication method · required account permissions · whether a publishing API
is actually available · media requirements · rate-limit behaviour · result id ·
failure reason · retry policy.

Where an account cannot legally or technically auto-publish, the channel is
marked **assisted** and produces a prepared draft for a person to post.
A channel that cannot publish is never reported as published — a false success
is worse than a visible gap, because it stops anyone going to look.

## Commercial

Prepared only; no pricing, no payments activated. Organisational subscriptions,
sponsorship inventory, entitlements, campaign delivery, invoice and payment
states, sponsor reporting, renewal tracking. Payment webhooks are keyed on the
provider's own event id so a redelivered webhook cannot grant access twice.

Commercial state stays separate from editorial judgement, in storage and in
code.
