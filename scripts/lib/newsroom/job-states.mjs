// The newsroom job state machine.
//
// Durable, resumable, and deliberately boring. Every stage of the pipeline --
// intake, normalisation, dedupe, evidence, selection, draft, fact check, policy
// check, review, publication, audio, newsletter, social, delivery
// verification, analytics, correction -- is a separate job with its own row.
// Nothing here holds state in memory between calls, because a worker that is
// restarted mid-pipeline must be able to pick up exactly where it stopped.
//
// Why a table of legal transitions rather than `if` statements scattered
// through the stages: a job that can move from any state to any state is not a
// state machine, it is a variable. The single most expensive failure in an
// automated newsroom is a story that publishes twice because a retry found the
// job in a state nobody thought to exclude. Making the transitions data means
// the illegal ones can be TESTED, which is what scripts/test-newsroom-automation.mjs
// does.

export const JOB_STATES = Object.freeze([
  'queued',
  'running',
  'waiting_review',
  'approved',
  'held',
  'failed',
  'retrying',
  'completed',
  'cancelled',
]);

// A job that has reached one of these is finished. Nothing may move it again.
export const TERMINAL_STATES = Object.freeze(['completed', 'cancelled']);

const TRANSITIONS = Object.freeze({
  queued: ['running', 'cancelled', 'held'],
  running: ['waiting_review', 'approved', 'completed', 'failed', 'held'],
  // waiting_review cannot go straight to completed: approval is its own
  // recorded act, with an operator attached to it.
  waiting_review: ['approved', 'held', 'cancelled'],
  approved: ['running', 'completed', 'cancelled'],
  held: ['queued', 'waiting_review', 'cancelled'],
  failed: ['retrying', 'cancelled', 'held'],
  retrying: ['running', 'failed', 'cancelled'],
  completed: [],
  cancelled: [],
});

export function isTerminal(state) {
  return TERMINAL_STATES.includes(state);
}

export function canTransition(from, to) {
  if (!JOB_STATES.includes(from) || !JOB_STATES.includes(to)) return false;
  return TRANSITIONS[from].includes(to);
}

/** Throws rather than returning false: an illegal transition is a bug in a
 *  caller, not a condition to branch on. */
export function assertTransition(from, to) {
  if (!JOB_STATES.includes(from)) throw new Error(`Unknown job state "${from}"`);
  if (!JOB_STATES.includes(to)) throw new Error(`Unknown job state "${to}"`);
  if (isTerminal(from)) {
    throw new Error(`Job is already ${from}; it cannot move to ${to}. Terminal states are final so a retry cannot re-run finished work.`);
  }
  if (!canTransition(from, to)) {
    throw new Error(`Illegal job transition ${from} -> ${to}. Legal from ${from}: ${TRANSITIONS[from].join(', ') || '(none)'}`);
  }
  return true;
}

/** The record shape a durable job store must be able to hold. Field names are
 *  fixed here so a future table, a KV blob and a test fixture all agree. */
export function newJob({ jobId, storyId, jobType, idempotencyKey, provider = null, requiresHumanReview = false }) {
  for (const [k, v] of Object.entries({ jobId, storyId, jobType, idempotencyKey })) {
    if (!v || typeof v !== 'string') throw new Error(`newJob requires a non-empty ${k}`);
  }
  return {
    jobId,
    storyId,
    jobType,
    state: 'queued',
    inputVersion: null,
    outputVersion: null,
    attemptCount: 0,
    provider,
    startedAt: null,
    completedAt: null,
    lastError: null,
    nextRetryAt: null,
    requiresHumanReview,
    operator: null,
    idempotencyKey,
  };
}

/** Advance a job, enforcing the machine. Returns a new object; the input is not
 *  mutated, so a failed transition cannot leave a half-updated record behind. */
export function transition(job, to, patch = {}) {
  assertTransition(job.state, to);
  const next = { ...job, ...patch, state: to };
  if (to === 'running' && job.state !== 'approved') next.attemptCount = job.attemptCount + 1;
  if (to === 'running' && !next.startedAt) next.startedAt = patch.startedAt ?? null;
  if (isTerminal(to)) next.completedAt = patch.completedAt ?? null;
  return next;
}
