// Cost and retry ceilings, read from config/newsroom-limits.json.
//
// Centralised on purpose. A retry ceiling that lives as a literal inside the
// retry loop is a ceiling nobody can find when the bill arrives.
//
// The one rule worth stating out loud: a budget pause must never become an
// editorial outage. Expensive GENERATION stops at the ceiling. Publishing an
// already-approved story, serving the site, sending a correction, and
// reconciling a delivery never stop, because a newsroom that cannot issue a
// correction because it ran out of model credit is worse than one that spends
// a little more than it meant to.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export async function loadLimits(file = path.join(root, 'config', 'newsroom-limits.json')) {
  return JSON.parse(await readFile(file, 'utf8'));
}

export function limitsProblems(limits) {
  const p = [];
  const job = limits?.perJob;
  if (!job) return ['newsroom-limits.json has no perJob section'];
  if (!Array.isArray(job.backoffSeconds)) p.push('perJob.backoffSeconds must be an array');
  else if (job.backoffSeconds.length !== job.maxAttempts - 1) {
    p.push(`perJob.backoffSeconds has ${job.backoffSeconds.length} entries; ${job.maxAttempts} attempts means ${job.maxAttempts - 1} retries, so it needs that many`);
  } else if (job.backoffSeconds.some((v, i, a) => i && v <= a[i - 1])) {
    p.push('perJob.backoffSeconds must increase: a flat or shrinking backoff is a retry storm');
  }
  const b = limits?.budget;
  if (!b) p.push('newsroom-limits.json has no budget section');
  else {
    if (!(b.alertAtPercent < b.pauseAtPercent)) p.push('budget.alertAtPercent must be below pauseAtPercent, or the alert never arrives before the pause');
    if (!(b.dailyUsd > 0) || !(b.monthlyUsd > 0)) p.push('budget.dailyUsd and budget.monthlyUsd must both be positive');
    if (b.monthlyUsd < b.dailyUsd) p.push('budget.monthlyUsd is below dailyUsd');
  }
  if (!Array.isArray(limits?.neverPausedByBudget) || !limits.neverPausedByBudget.length) {
    p.push('newsroom-limits.json must list neverPausedByBudget: a cost ceiling must not be able to stop a correction going out');
  }
  return p;
}

export function retryDelaySeconds(limits, attemptCount) {
  const { maxAttempts, backoffSeconds } = limits.perJob;
  if (attemptCount >= maxAttempts) return null; // give up; the job fails for a human to see
  return backoffSeconds[Math.min(attemptCount - 1, backoffSeconds.length - 1)];
}

/** @returns {{allowed:boolean, reason:string, alert?:boolean}} */
export function budgetCheck(limits, { jobType, spentTodayUsd = 0, spentMonthUsd = 0 }) {
  if ((limits.neverPausedByBudget || []).includes(jobType)) {
    return { allowed: true, reason: `${jobType} is exempt: a cost ceiling must not cause an editorial outage` };
  }
  const { dailyUsd, monthlyUsd, alertAtPercent, pauseAtPercent } = limits.budget;
  const dayPct = (spentTodayUsd / dailyUsd) * 100;
  const monPct = (spentMonthUsd / monthlyUsd) * 100;
  const worst = Math.max(dayPct, monPct);
  if (worst >= pauseAtPercent) {
    return { allowed: false, reason: `budget ceiling reached (${worst.toFixed(0)}% of ${dayPct >= monPct ? 'daily' : 'monthly'}); expensive generation is paused` };
  }
  return { allowed: true, alert: worst >= alertAtPercent, reason: `${worst.toFixed(0)}% of budget used` };
}

export function storyCapExceeded(limits, counter, kind) {
  const cap = limits.perStory?.[kind];
  if (cap === undefined) throw new Error(`No perStory cap named "${kind}" in newsroom-limits.json`);
  return counter >= cap;
}
