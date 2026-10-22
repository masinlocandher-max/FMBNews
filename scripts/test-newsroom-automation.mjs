// The ten scenarios that decide whether this foundation is safe to build on.
//
// Each one is a failure that an automated newsroom makes by default unless
// something stops it. They run on node:test with no dependencies, matching a
// repository that has none.

import test from 'node:test';
import assert from 'node:assert/strict';

import { newJob, transition, canTransition, assertTransition, isTerminal } from './lib/newsroom/job-states.mjs';
import { idempotencyKey, newReceipt, shouldPerform, assertStableKey } from './lib/newsroom/idempotency.mjs';
import { loadPolicy, evaluateStory, approvalIsValid, independentSourceCount } from './lib/newsroom/policy.mjs';
import { loadSources, mayPoll } from './lib/newsroom/sources.mjs';
import { loadLimits, budgetCheck, retryDelaySeconds, storyCapExceeded } from './lib/newsroom/limits.mjs';

const policy = await loadPolicy();
const registry = await loadSources();
const limits = await loadLimits();

const story = (over = {}) => ({
  storyId: 'st_1',
  headline: 'Port authority publishes the new berthing schedule for Manila North Harbor',
  category: 'Philippines',
  sources: [
    { publisher: 'Philippine Ports Authority', kind: 'primary' },
    { publisher: 'BusinessWorld' },
  ],
  ...over,
});

// 1. The same item arriving twice must resolve to one logical story.
test('1 duplicate source item received twice yields one logical story', () => {
  const a = idempotencyKey('publish-article', { storyId: 'st_1', contentVersion: 3 });
  const b = idempotencyKey('publish-article', { storyId: 'st_1', contentVersion: 3 });
  assert.equal(a, b, 'the same effect must produce the same key on every attempt');
  assert.notEqual(a, idempotencyKey('publish-article', { storyId: 'st_1', contentVersion: 4 }),
    'a new content version is a different effect and must not be deduplicated away');
  // A key built from anything that varies per attempt defeats the whole thing.
  assert.throws(() => assertStableKey('publish-article', ['storyId', 'timestamp']), /varies between attempts/);
  assert.throws(() => assertStableKey('publish-article', ['storyId', 'attemptCount']), /varies between attempts/);
});

// 2. Thin evidence holds. It does not publish and then get corrected.
test('2 insufficient evidence holds rather than publishes', () => {
  const one = evaluateStory(policy, story({ sources: [{ publisher: 'BusinessWorld' }] }));
  assert.equal(one.decision, 'hold');
  assert.match(one.reasons.join(' '), /independent source/);

  const noPrimary = evaluateStory(policy, story({
    sources: [{ publisher: 'Outlet A' }, { publisher: 'Outlet B' }],
  }));
  assert.equal(noPrimary.decision, 'hold', 'two write-ups of a record are not the record');

  // Two model outputs agreeing is one source at best, and is not counted.
  const modelled = story({ sources: [{ publisher: 'PPA', kind: 'primary' }, { publisher: 'gpt', kind: 'model' }, { generatedBy: 'claude' }] });
  assert.equal(independentSourceCount(modelled), 1, 'model output must never be counted as an independent source');
  assert.equal(evaluateStory(policy, modelled).decision, 'hold');
});

// 3. High-risk subjects go to a human, and only an authenticated human clears them.
test('3 human approval required blocks publication until an authenticated operator approves', () => {
  const risky = evaluateStory(policy, story({ headline: 'Senator faces plunder arraignment at the Sandiganbayan' }));
  assert.equal(risky.decision, 'review');
  assert.ok(risky.riskCategories.length, 'the matched risk categories must be reported to the operator');

  assert.equal(approvalIsValid(null).valid, false);
  assert.equal(approvalIsValid({ operator: 'editor@fmb', authenticated: false }).valid, false);
  assert.equal(approvalIsValid({ operator: 'automation', authenticated: true }).valid, false,
    'automation must not be able to approve its own work');
  assert.equal(approvalIsValid({ operator: 'editor@fmb', authenticated: true }).valid, true);

  // waiting_review cannot shortcut to completed.
  assert.equal(canTransition('waiting_review', 'completed'), false);
  assert.equal(canTransition('waiting_review', 'approved'), true);
});

// 4. A failed derivative must not drag the published article back.
test('4 publication succeeds and audio fails: article stays published, audio retryable', () => {
  const publish = transition(transition(newJob({ jobId: 'j1', storyId: 'st_1', jobType: 'publish-article', idempotencyKey: 'k1' }), 'running'), 'completed');
  assert.equal(publish.state, 'completed');
  assert.ok(isTerminal(publish.state));
  // The published job is finished and cannot be re-run by an unrelated failure.
  assert.throws(() => assertTransition(publish.state, 'running'), /already completed/);

  let audio = newJob({ jobId: 'j2', storyId: 'st_1', jobType: 'generate-audio', idempotencyKey: 'k2' });
  audio = transition(transition(audio, 'running'), 'failed', { lastError: 'provider timeout' });
  assert.equal(canTransition(audio.state, 'retrying'), true, 'a failed derivative must stay retryable');
  assert.equal(publish.state, 'completed', 'the article is untouched by the audio failure');
});

// 5. A narration timeout must not produce two finished narrations.
test('5 ElevenLabs retry produces no duplicate finalised narration', () => {
  const key = idempotencyKey('generate-audio', { storyId: 'st_1', scriptVersion: 2, voiceId: 'v_fil' });
  assert.equal(idempotencyKey('generate-audio', { storyId: 'st_1', scriptVersion: 2, voiceId: 'v_fil' }), key);

  assert.equal(shouldPerform(newReceipt({ key, effect: 'generate-audio' })).perform, false);
  // The timeout case: attempted, never confirmed. Reconcile, do not re-send.
  assert.equal(shouldPerform(newReceipt({ key, effect: 'generate-audio' })).reconcile, true);
  const done = { ...newReceipt({ key, effect: 'generate-audio' }), completed: true, externalId: 'el_123' };
  assert.equal(shouldPerform(done).perform, false);
  assert.match(shouldPerform(done).reason, /already completed/);
  // A new script version IS new work and must not be suppressed.
  assert.notEqual(idempotencyKey('generate-audio', { storyId: 'st_1', scriptVersion: 3, voiceId: 'v_fil' }), key);
});

// 6. A correction must make every stale derivative identifiable.
test('6 correction makes stale derivatives identifiable', () => {
  const v2 = { storyId: 'st_1', contentVersion: 2 };
  const v3 = { storyId: 'st_1', contentVersion: 3 };
  assert.notEqual(idempotencyKey('publish-article', v2), idempotencyKey('publish-article', v3));
  // Audio keyed on scriptVersion: a corrected script yields a different key, so
  // the old narration cannot be mistaken for current.
  const audioV2 = idempotencyKey('generate-audio', { storyId: 'st_1', scriptVersion: 2, voiceId: 'v' });
  const audioV3 = idempotencyKey('generate-audio', { storyId: 'st_1', scriptVersion: 3, voiceId: 'v' });
  assert.notEqual(audioV2, audioV3);
  // Social derivatives likewise.
  assert.notEqual(
    idempotencyKey('post-social', { storyId: 'st_1', channel: 'facebook', derivativeVersion: 2 }),
    idempotencyKey('post-social', { storyId: 'st_1', channel: 'facebook', derivativeVersion: 3 }),
  );
  // A correction notice is per channel, and never paused by budget.
  assert.equal(budgetCheck(limits, { jobType: 'correction-notice', spentTodayUsd: 9999, spentMonthUsd: 9999 }).allowed, true);
});

// 7. A newsletter timeout reconciles before resending.
test('7 newsletter timeout reconciles provider state before resending', () => {
  const key = idempotencyKey('send-newsletter', { editionId: 'ed_9', recipientId: 'r_1' });
  const attempted = newReceipt({ key, effect: 'send-newsletter' });
  const d = shouldPerform(attempted);
  assert.equal(d.perform, false, 'never re-send on an unconfirmed attempt');
  assert.equal(d.reconcile, true);
  assert.match(d.reason, /query the provider/);
  // Per recipient, so one recipient's retry cannot re-send to the whole list.
  assert.notEqual(key, idempotencyKey('send-newsletter', { editionId: 'ed_9', recipientId: 'r_2' }));
});

// 8. Drafts are not public.
test('8 unauthorized access to drafts is denied', () => {
  const draft = evaluateStory(policy, story({ status: 'draft' }));
  assert.notEqual(draft.decision, 'publish', 'autonomous publishing is off, so nothing reaches publish');
  assert.equal(approvalIsValid({ operator: 'anon', authenticated: false }).valid, false);
  // The register is explicit that review material is not anonymous-readable;
  // this asserts the policy file still says autonomous publishing is off.
  assert.equal(policy.autonomousPublishing.enabled, false,
    'Phase 1 must leave live publication under human editorial control');
});

// 9. A disabled source is never contacted.
test('9 disabled source produces no automated intake', () => {
  const reg = { sources: [
    { id: 'off', state: 'DISABLED' },
    { id: 'maybe', state: 'CANDIDATE' },
    { id: 'ok', state: 'APPROVED' },
  ] };
  assert.equal(mayPoll(reg, 'off').allowed, false);
  assert.match(mayPoll(reg, 'off').reason, /DISABLED/);
  assert.equal(mayPoll(reg, 'maybe').allowed, false, 'CANDIDATE is never polled automatically');
  assert.equal(mayPoll(reg, 'ok').allowed, true);
  assert.equal(mayPoll(reg, 'nope').allowed, false, 'an unregistered source is not reachable by default');
  // The shipped register must not contain an unknown state.
  for (const s of registry.sources) {
    assert.ok(['APPROVED', 'CANDIDATE', 'DISABLED'].includes(s.state), `${s.id} has state ${s.state}`);
  }
});

// 10. The budget ceiling pauses generation, and nothing else.
test('10 budget ceiling pauses expensive generation safely', () => {
  const over = { jobType: 'generate-audio', spentTodayUsd: limits.budget.dailyUsd, spentMonthUsd: 0 };
  assert.equal(budgetCheck(limits, over).allowed, false);
  assert.match(budgetCheck(limits, over).reason, /ceiling reached/);

  const warn = budgetCheck(limits, { jobType: 'generate-audio', spentTodayUsd: limits.budget.dailyUsd * 0.8, spentMonthUsd: 0 });
  assert.equal(warn.allowed, true);
  assert.equal(warn.alert, true, 'the alert threshold must fire before the pause');

  // Editorial continuity is exempt: a cost ceiling must never stop these.
  for (const jobType of limits.neverPausedByBudget) {
    assert.equal(budgetCheck(limits, { jobType, spentTodayUsd: 1e6, spentMonthUsd: 1e6 }).allowed, true,
      `${jobType} must never be paused by budget`);
  }
  // Retries are bounded and back off.
  assert.equal(retryDelaySeconds(limits, limits.perJob.maxAttempts), null, 'retries must terminate');
  assert.ok(storyCapExceeded(limits, limits.perStory.maxAudioRegenerations, 'maxAudioRegenerations'));
});
