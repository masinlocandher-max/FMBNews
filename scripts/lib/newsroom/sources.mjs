// The source register, and the one question it answers: may automation contact
// this source right now?
//
// "Technically reachable" is not "approved". Only APPROVED sources are polled;
// CANDIDATE is readable by a human operator and never fetched automatically;
// DISABLED must not be contacted at all, including by a manual retry, because
// the usual reason a source is disabled is that someone asked us to stop.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const SOURCE_STATES = Object.freeze(['APPROVED', 'CANDIDATE', 'DISABLED']);

export const REQUIRED_SOURCE_FIELDS = Object.freeze([
  'id', 'publisher', 'state', 'sourceType', 'officialUrl', 'topics', 'geography',
  'reliabilityClass', 'retrievalMethod', 'pollIntervalSeconds', 'attribution',
  'contentReuse', 'imageReuse', 'lastSuccessfulCheck',
]);

export async function loadSources(file = path.join(root, 'config', 'newsroom-sources.json')) {
  return JSON.parse(await readFile(file, 'utf8'));
}

/** Structural problems in the register itself. The verifier turns these into a
 *  failed build so a malformed entry cannot sit unnoticed in production. */
export function registryProblems(registry, limits = null) {
  const problems = [];
  const sources = Array.isArray(registry?.sources) ? registry.sources : null;
  if (!sources) return ['newsroom-sources.json has no "sources" array'];
  const seen = new Set();
  for (const s of sources) {
    const label = s?.id || '(entry with no id)';
    for (const f of REQUIRED_SOURCE_FIELDS) {
      if (s?.[f] === undefined) problems.push(`${label}: missing required field "${f}"`);
    }
    if (s?.id) {
      if (seen.has(s.id)) problems.push(`${label}: duplicate source id`);
      seen.add(s.id);
    }
    if (s?.state && !SOURCE_STATES.includes(s.state)) {
      problems.push(`${label}: state "${s.state}" is not one of ${SOURCE_STATES.join('/')}`);
    }
    // An approved source with no reuse terms is the exact situation the
    // register exists to prevent: polling something without knowing what may
    // be done with what comes back.
    if (s?.state === 'APPROVED') {
      if (!s.contentReuse) problems.push(`${label}: APPROVED without recorded contentReuse terms`);
      if (!s.attribution || s.attribution.required === undefined) {
        problems.push(`${label}: APPROVED without recorded attribution requirements`);
      }
      if (s.imageReuse === undefined) problems.push(`${label}: APPROVED without a recorded imageReuse status`);
    }
    if (limits && typeof s?.pollIntervalSeconds === 'number') {
      const floor = limits.intake?.minPollIntervalSeconds;
      if (floor && s.pollIntervalSeconds < floor) {
        problems.push(`${label}: pollIntervalSeconds ${s.pollIntervalSeconds} is below the ${floor}s floor in newsroom-limits.json`);
      }
    }
  }
  return problems;
}

/** The gate every intake job calls. Never bypass it with a direct fetch. */
export function mayPoll(registry, sourceId) {
  const source = (registry?.sources || []).find((s) => s.id === sourceId);
  if (!source) return { allowed: false, reason: `"${sourceId}" is not in the source register` };
  if (source.state === 'DISABLED') {
    return { allowed: false, reason: `"${sourceId}" is DISABLED and must not be contacted, including by manual retry` };
  }
  if (source.state === 'CANDIDATE') {
    return { allowed: false, reason: `"${sourceId}" is a CANDIDATE: readable by an operator, never polled automatically` };
  }
  if (source.state !== 'APPROVED') return { allowed: false, reason: `"${sourceId}" has unknown state "${source.state}"` };
  return { allowed: true, source };
}
