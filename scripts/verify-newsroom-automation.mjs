// The newsroom automation foundation, gated.
//
// Configuration that nothing checks is configuration that drifts. This fails
// the build when the source register, the policy or the limits lose an
// invariant the automation depends on -- including the two that matter most in
// Phase 1: autonomous publishing stays off, and no real secret is committed.
//
// It does NOT run any automation, contact any source, or call any provider. It
// reads three JSON files and the modules that interpret them.

import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSources, registryProblems, SOURCE_STATES } from './lib/newsroom/sources.mjs';
import { loadLimits, limitsProblems } from './lib/newsroom/limits.mjs';
import { loadPolicy } from './lib/newsroom/policy.mjs';
import { EFFECT_FIELDS, assertStableKey } from './lib/newsroom/idempotency.mjs';
import { JOB_STATES, canTransition } from './lib/newsroom/job-states.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const must = (v, m) => { if (!v) throw new Error(m); };

const registry = await loadSources();
const limits = await loadLimits();
const policy = await loadPolicy();

// --- the register ----------------------------------------------------------
const regProblems = registryProblems(registry, limits);
must(!regProblems.length, `Source register problems:\n  ${regProblems.join('\n  ')}`);
must(
  Object.keys(registry.states || {}).length === SOURCE_STATES.length,
  `newsroom-sources.json must document exactly the ${SOURCE_STATES.length} states the code implements (${SOURCE_STATES.join('/')}).`,
);

// --- the limits ------------------------------------------------------------
const limProblems = limitsProblems(limits);
must(!limProblems.length, `Limits problems:\n  ${limProblems.join('\n  ')}`);

// --- the policy ------------------------------------------------------------
//
// Phase 1 is explicitly a preparation phase. If this flips to true, it should
// be because somebody decided to, in a reviewed commit -- not because a config
// edit went unnoticed. The gate states the expectation out loud.
must(
  policy.autonomousPublishing?.enabled === false,
  'config/newsroom-policy.json has autonomousPublishing.enabled = true. Phase 1 leaves live publication under human editorial control; '
  + 'turning this on is a deliberate, separate decision and this gate must be updated in the same change that makes it.',
);
must(
  Number(policy.evidence?.minIndependentSources) >= 2,
  'policy.evidence.minIndependentSources must stay at 2 or more. One source is not corroboration, and this number may not be lowered to let automation publish more easily.',
);
must(policy.evidence?.requirePrimaryRecord === true, 'policy.evidence.requirePrimaryRecord must stay true: a write-up of a record is not the record.');
must(policy.imageRights?.requireClearedLedgerEntry === true,
  'policy.imageRights.requireClearedLedgerEntry must stay true. Automation may propose a photograph; clearance stays in the rights-cleared ledger with creator, licence and source page.');
must(policy.sponsorship?.mustBeLabelled === true, 'policy.sponsorship.mustBeLabelled must stay true.');
const riskCount = Object.keys(policy.highRiskCategories || {}).filter((k) => !k.startsWith('_')).length;
must(riskCount >= 8, `Only ${riskCount} high-risk categories are defined. The brief names allegations, crime, courts, elections, politics, health, financial and safety as the minimum set.`);

// --- idempotency contract --------------------------------------------------
for (const [effect, fields] of Object.entries(EFFECT_FIELDS)) {
  must(Array.isArray(fields) && fields.length, `Effect "${effect}" declares no identifying fields.`);
  assertStableKey(effect, fields); // throws if a per-attempt field crept in
}
for (const required of ['publish-article', 'generate-audio', 'send-newsletter', 'post-social', 'payment-webhook']) {
  must(EFFECT_FIELDS[required], `No idempotency contract for "${required}". Every external action needs one or a retry can duplicate it.`);
}
// Audio and social keys must carry a version, or a corrected story would reuse
// the stale derivative's key and never regenerate.
must(EFFECT_FIELDS['generate-audio'].some((f) => /version/i.test(f)), 'generate-audio must key on a script version so a correction forces a new narration.');
must(EFFECT_FIELDS['post-social'].some((f) => /version/i.test(f)), 'post-social must key on a derivative version so a correction is not suppressed as a duplicate.');
must(EFFECT_FIELDS['send-newsletter'].includes('recipientId'), 'send-newsletter must key per recipient, or one retry re-sends to the whole list.');

// --- job state machine -----------------------------------------------------
for (const terminal of ['completed', 'cancelled']) {
  for (const to of JOB_STATES) {
    must(!canTransition(terminal, to), `${terminal} must be terminal, but a transition to ${to} is allowed. A retry could re-run finished work.`);
  }
}
must(!canTransition('waiting_review', 'completed'), 'waiting_review must not reach completed directly: approval is its own recorded act with an operator attached.');
must(!canTransition('queued', 'completed'), 'queued must not reach completed without running.');

// --- secrets ---------------------------------------------------------------
//
// Names only. A value in .env.example is a committed credential, whatever it
// was meant to be.
const envExample = await readFile(path.join(root, '.env.example'), 'utf8');
for (const line of envExample.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const [name, ...rest] = t.split('=');
  const value = rest.join('=').trim();
  must(value === '', `.env.example must contain names only: "${name}" has a value. Committing a real key here publishes it.`);
}
const required = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY'];
for (const name of required) must(envExample.includes(`${name}=`), `.env.example lost ${name}, which the existing CMS integration needs.`);

// No secret-shaped literal may appear in the newsroom modules or config.
const SECRET_SHAPES = [
  [/sk-[A-Za-z0-9]{16,}/, 'an OpenAI-style secret key'],
  [/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, 'a JWT'],
  [/service_role/, 'a service-role reference'],
  [/\bre_[A-Za-z0-9]{16,}/, 'a Resend key'],
  [/\bsk_live_[A-Za-z0-9]{10,}/, 'a live payment secret'],
];
const scanned = [];
for (const dir of ['config', 'scripts/lib/newsroom']) {
  for (const entry of await readdir(path.join(root, dir))) {
    const rel = path.join(dir, entry);
    const body = await readFile(path.join(root, rel), 'utf8');
    scanned.push(rel);
    for (const [re, what] of SECRET_SHAPES) {
      must(!re.test(body), `${rel} contains ${what}. Secrets belong in the deployment environment, never in the repository.`);
    }
  }
}

// --- docs ------------------------------------------------------------------
for (const doc of ['architecture', 'operations', 'security', 'integrations', 'recovery']) {
  await access(path.join(root, 'docs', `ai-newsroom-${doc}.md`));
}

console.log(
  `Newsroom automation foundation verified: ${registry.sources.length} registered source(s) `
  + `(${registry.sources.filter((s) => s.state === 'APPROVED').length} approved), `
  + `${Object.keys(EFFECT_FIELDS).length} idempotent effect contracts, ${JOB_STATES.length}-state job machine with terminal states sealed, `
  + `${riskCount} high-risk categories always human-reviewed, autonomous publishing OFF, ${scanned.length} file(s) scanned and no secret committed.`,
);
