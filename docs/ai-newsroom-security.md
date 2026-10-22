# FMB News AI newsroom security

## Secrets

`.env.example` carries **names only**. `scripts/verify-newsroom-automation.mjs`
fails the build if any line there has a value, and scans `config/` and
`scripts/lib/newsroom/` for secret-shaped literals — OpenAI-style keys, JWTs,
`service_role`, Resend keys, live payment secrets.

| Variable | Lives in | Reaches a browser? |
| --- | --- | --- |
| `SUPABASE_URL` | public | yes, by design |
| `SUPABASE_PUBLISHABLE_KEY` | public | yes, by design — protected by RLS, not by secrecy |
| `OPENAI_API_KEY` | Worker secret / CI | never |
| `ELEVENLABS_API_KEY` | Worker secret / CI | never |
| `ELEVENLABS_VOICE_ID` | Worker secret / CI | never |
| `RESEND_API_KEY` | Worker secret / CI | never |

The publishable key is public on purpose and is already in the client. Its
safety comes entirely from Row Level Security, which is why no new table may
ship without an explicit access model.

**ElevenLabs must never be called from the browser.** The site does not
synthesise speech when a reader presses Play; it serves a stored file. That is
an architectural decision, not a preference: a narration key in client
JavaScript is a key anyone can extract and spend.

## Supabase access model

Preserved as-is: RLS on every newsroom table, admin/staff separation through
`private.is_fmb_staff()` and `private.is_fmb_admin()`, anonymous read limited
to published material, publishable key in the browser, secret credentials
server-side only.

Any new newsroom table must declare its access model before it is created.
Drafts, raw source material, review notes, evidence, deliveries, payments and
subscriber records must not be readable anonymously. The default for anything
operational is: not public.

## What AI is not allowed to be

AI may monitor, extract, summarise, compare, rank, draft, and prepare metadata,
narration scripts, newsletter copy and social derivatives.

AI is **not a source of truth**. Every factual claim stays traceable to
evidence. Two model outputs agreeing is not corroboration — it is one unreliable
source counted twice, which is why `policy.mjs` does not count model output as
a source at all.

Automation cannot approve its own work: `approvalIsValid()` rejects an approval
whose operator is `system` or `automation`, or that did not come through an
authenticated session.

## Always human-reviewed

Allegations against identifiable people · crime · courts and legal disputes ·
elections and politics · health guidance · financial guidance · disaster and
safety instructions · material involving minors · conflicting sources ·
uncertain image rights · major corrections.

These are matched in `config/newsroom-policy.json` and enforced ahead of every
other consideration. No evidence quality and no confidence score moves a story
out of this set.

## Images

The existing rights system is unchanged and automation does not get an
exception from it. Automation may *propose* a photograph; it may not *clear*
one. Clearance stays in `content/news/rights-cleared-image-overrides.json` with
creator, licence, source page, caption and alt text, gated by
`scripts/verify-article-photography.mjs`.

Forbidden, for automation exactly as for a person: hotlinking a publisher's
article image; treating an image-search filter as proof of licence; scraping
images from a source article; counting fallback artwork as photographic
coverage; dropping a caption or credit to fit a layout. The coverage baselines
in `content/news/photography-coverage-baseline.json` may only ever be lowered.

## Commercial separation

A sponsor may buy placement. A sponsor may not influence a newsroom
conclusion, a Fact Check rating, a correction, or the decision to publish.
Commercial state is stored separately from editorial judgement and is never an
input to it. Sponsored content is labelled as such.
