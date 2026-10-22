// Does this story publish, hold, or go to a human?
//
// One function answers that, reading config/newsroom-policy.json. It is pure:
// it returns a decision and the reasons behind it, and it performs no action.
// That matters because the decision has to be reviewable after the fact --
// "why did this publish?" must have an answer that is not "the model thought it
// was fine".
//
// Three independent gates, and the strictest wins:
//   1. Is the subject high-risk? Then a human reviews it, full stop -- no
//      evidence quality and no confidence score can buy its way past this.
//   2. Is the evidence sufficient and non-conflicting?
//   3. Is autonomous publishing even switched on?
//
// Independence is counted by PUBLISHER, not by document. Two wire copies of the
// same agency release are one source. Two model outputs agreeing are one
// source, and not a very good one -- which is why a model is never counted here
// at all.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export async function loadPolicy(file = path.join(root, 'config', 'newsroom-policy.json')) {
  return JSON.parse(await readFile(file, 'utf8'));
}

/** Every high-risk category this text trips. Returns [] for ordinary copy. */
export function highRiskCategories(policy, story) {
  const haystack = [
    story.category, story.kicker, story.headline, story.deck,
    ...(Array.isArray(story.keywords) ? story.keywords : []),
  ].filter(Boolean).join(' ').toLowerCase();
  const hits = [];
  for (const [name, terms] of Object.entries(policy.highRiskCategories || {})) {
    if (name.startsWith('_')) continue;
    if (terms.some((t) => haystack.includes(String(t).toLowerCase()))) hits.push(name);
  }
  return hits;
}

/** Distinct publishers among the story's sources. A model is never a source. */
export function independentSourceCount(story) {
  const sources = Array.isArray(story.sources) ? story.sources : [];
  const publishers = new Set();
  for (const s of sources) {
    if (!s) continue;
    if (s.kind === 'model' || s.kind === 'ai' || s.generatedBy) continue;
    const id = String(s.publisher || s.source || s.outlet || s.url || '').trim().toLowerCase();
    if (id) publishers.add(id);
  }
  return publishers.size;
}

export function hasPrimaryRecord(story) {
  const sources = Array.isArray(story.sources) ? story.sources : [];
  return sources.some((s) => s && (s.kind === 'primary' || s.reliabilityClass === 'primary-record' || s.primary === true));
}

/**
 * @returns {{decision: 'publish'|'review'|'hold', reasons: string[], riskCategories: string[]}}
 */
export function evaluateStory(policy, story) {
  const reasons = [];
  const risk = highRiskCategories(policy, story);
  const ev = policy.evidence || {};

  // Gate 2 first, so a held story reports its evidence problem even when it is
  // also high-risk -- the operator needs both facts, not the first one found.
  let insufficient = false;
  const count = independentSourceCount(story);
  const min = Number(ev.minIndependentSources ?? 2);
  if (count < min) {
    insufficient = true;
    reasons.push(`only ${count} independent source(s); policy requires ${min} counted by distinct publisher`);
  }
  if (ev.requirePrimaryRecord && !hasPrimaryRecord(story)) {
    insufficient = true;
    reasons.push('no primary record among the sources; a write-up of a record is not the record');
  }
  if (story.evidenceConflict) {
    reasons.push('sources materially disagree; policy says hold rather than choose between them');
    return { decision: ev.conflictAction || 'hold', reasons, riskCategories: risk };
  }
  if (insufficient) return { decision: 'hold', reasons, riskCategories: risk };

  if (risk.length) {
    reasons.push(`high-risk subject (${risk.join(', ')}); human review is required regardless of evidence quality`);
    return { decision: 'review', reasons, riskCategories: risk };
  }
  if (!policy.autonomousPublishing?.enabled) {
    reasons.push('autonomous publishing is disabled in newsroom-policy.json');
    return { decision: 'review', reasons, riskCategories: risk };
  }
  reasons.push(`${count} independent sources including a primary record; no high-risk category matched`);
  return { decision: 'publish', reasons, riskCategories: risk };
}

/** An approval is only an approval when a real, authenticated operator made it. */
export function approvalIsValid(approval) {
  if (!approval || typeof approval !== 'object') return { valid: false, reason: 'no approval record' };
  if (!approval.operator) return { valid: false, reason: 'approval has no operator attached' };
  if (!approval.authenticated) return { valid: false, reason: 'approval was not made through an authenticated session' };
  if (approval.operator === 'system' || approval.operator === 'automation') {
    return { valid: false, reason: 'automation cannot approve its own work' };
  }
  return { valid: true };
}
