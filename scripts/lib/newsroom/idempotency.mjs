// Idempotency for every external action the newsroom can take.
//
// This is the module that stops the newsroom embarrassing itself. Automation
// retries; networks time out after the remote side has already succeeded. The
// failure that matters is not "the call failed" -- it is "the call succeeded,
// we never heard, we called again, and the newsletter went out twice."
//
// The rule: an external effect is identified by WHAT it is, not by WHEN it was
// attempted. Two attempts at the same effect produce the same key, so the
// second one finds the first one's receipt and stops. A key must therefore
// never include a timestamp, a random value, or an attempt counter -- which is
// exactly what assertStableKey() refuses, because every one of those mistakes
// looks reasonable while you are writing it.
//
// Keys are derived with SHA-256 over a sorted, typed field list so that two
// callers building the same effect from different code paths still agree.

import { createHash } from 'node:crypto';

/** Fields that identify each kind of external effect. Anything not listed is
 *  deliberately excluded from the key: it may vary between attempts. */
export const EFFECT_FIELDS = Object.freeze({
  'publish-article': ['storyId', 'contentVersion'],
  'generate-audio': ['storyId', 'scriptVersion', 'voiceId'],
  'send-newsletter': ['editionId', 'recipientId'],
  'post-social': ['storyId', 'channel', 'derivativeVersion'],
  'payment-webhook': ['providerEventId'],
  'correction-notice': ['correctionId', 'channel'],
});

// Matched against the field name split into words, because the names that
// actually appear in code are camelCase -- `attemptCount`, `retryAt`,
// `requestId`. An earlier version of this used a case-insensitive
// `[^a-z]` boundary, which under the /i flag also excludes A-Z, so
// "attemptCount" did not match and the guard silently let it through. The
// test for scenario 1 caught it.
const FORBIDDEN_WORDS = new Set(['timestamp', 'time', 'now', 'attempt', 'attempts', 'retry', 'retries', 'random', 'nonce', 'uuid', 'request', 'guid', 'at']);

function nameWords(field) {
  return String(field)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

/** A key built from a varying field is not an idempotency key; it is a unique
 *  id with extra steps, and it guarantees the duplicate it was meant to stop. */
export function assertStableKey(effect, fields) {
  for (const f of fields) {
    if (nameWords(f).some((w) => FORBIDDEN_WORDS.has(w))) {
      throw new Error(
        `"${f}" varies between attempts and must not be part of the ${effect} idempotency key. `
        + 'A key identifies the effect, not the attempt: including a timestamp, attempt number or random value '
        + 'makes every retry look like new work, which is the duplicate this module exists to prevent.',
      );
    }
  }
  return true;
}

export function idempotencyKey(effect, payload) {
  const fields = EFFECT_FIELDS[effect];
  if (!fields) {
    throw new Error(`Unknown external effect "${effect}". Add it to EFFECT_FIELDS with the fields that identify it, so its retries can be deduplicated.`);
  }
  assertStableKey(effect, fields);
  const missing = fields.filter((f) => payload[f] === undefined || payload[f] === null || payload[f] === '');
  if (missing.length) {
    throw new Error(`${effect} idempotency key needs ${missing.join(', ')}. A key with a missing part collides with every other incomplete key.`);
  }
  // Sorted and type-tagged: "1" and 1 must not produce the same key, and field
  // order must not depend on how the caller happened to build the object.
  const canonical = fields
    .slice()
    .sort()
    .map((f) => `${f}=${typeof payload[f]}:${String(payload[f])}`)
    .join('\u0000');
  return `${effect}_${createHash('sha256').update(canonical).digest('hex').slice(0, 32)}`;
}

/** The receipt an effect store must hold. `completed` is what a retry checks
 *  BEFORE calling a provider -- not after. */
export function newReceipt({ key, effect, externalId = null }) {
  if (!key || !effect) throw new Error('A receipt needs both a key and an effect.');
  return { key, effect, externalId, completed: false, recordedAt: null };
}

/** The decision a caller makes before every external call.
 *
 *  `reconcile` is the case people forget: an attempt that started but has no
 *  receipt may still have succeeded remotely. The honest answer there is not
 *  "try again" -- it is "ask the provider what it already has". */
export function shouldPerform(receipt) {
  if (!receipt) return { perform: true, reason: 'no prior attempt recorded' };
  if (receipt.completed) {
    return { perform: false, reason: `already completed${receipt.externalId ? ` as ${receipt.externalId}` : ''}` };
  }
  return {
    perform: false,
    reconcile: true,
    reason: 'an attempt was recorded but never confirmed; query the provider for existing state before sending anything',
  };
}
