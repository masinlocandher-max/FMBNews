import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const heldPath = path.join(root, 'content', 'fact-check', 'HELD.json');
const outJson = path.join(root, 'content', 'fact-check', 'PREPARED.json');
const outCsv = path.join(root, 'content', 'fact-check', 'PREPARED.csv');

const held = JSON.parse(await readFile(heldPath, 'utf8'));

if (!Array.isArray(held.items)) throw new Error('HELD.json has no items array');
if (held.items.length !== held.total) throw new Error(`HELD.json count mismatch: ${held.items.length} vs ${held.total}`);

const batchSize = 20;
const now = new Date().toISOString();

const items = held.items.map((item, index) => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  draftRating: item.rating,
  publicationStatus: 'HELD',
  verificationStatus: 'REQUIRES_EVIDENCE',
  batch: Math.floor(index / batchSize) + 1,
  currentHoldReasons: item.reasons || [],
  claimSource: {
    url: null,
    capturedAt: null,
    description: null
  },
  evidence: {
    primary: [],
    secondary: []
  },
  derivedFrom: null,
  verificationChecklist: {
    exactClaimCaptured: false,
    claimSourceArchived: false,
    primaryEvidenceChecked: false,
    secondaryCorroborationChecked: false,
    namesDatesFiguresChecked: false,
    contextChecked: false,
    ratingIndependentlyReachedByFMB: false,
    articleCopyReconciledWithEvidence: false,
    imageRightsChecked: false,
    finalEditorialReview: false
  },
  releaseDecision: 'DO_NOT_PUBLISH_YET',
  notes: 'Draft rating is not a published FMB verdict until independent evidence is attached and the Fact Check verifier passes.'
}));

const prepared = {
  generatedAt: now,
  source: 'content/fact-check/HELD.json',
  total: items.length,
  publishedAtPreparation: held.published,
  heldAtPreparation: held.held,
  batchSize,
  batches: Math.ceil(items.length / batchSize),
  editorialRule: 'No item may publish until FMB independently verifies the claim, records the circulated claim source, attaches at least one primary evidence URL, reaches its own rating, and passes scripts/verify-fact-check.mjs.',
  items
};

await writeFile(outJson, JSON.stringify(prepared, null, 2) + '\n');

const esc = value => {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const header = [
  'id', 'batch', 'slug', 'title', 'draftRating', 'publicationStatus',
  'verificationStatus', 'releaseDecision', 'holdReasons', 'claimSourceUrl',
  'primaryEvidenceCount', 'secondaryEvidenceCount', 'finalEditorialReview'
];

const rows = items.map(item => [
  item.id,
  item.batch,
  item.slug,
  item.title,
  item.draftRating,
  item.publicationStatus,
  item.verificationStatus,
  item.releaseDecision,
  item.currentHoldReasons.join(' | '),
  item.claimSource.url,
  item.evidence.primary.length,
  item.evidence.secondary.length,
  item.verificationChecklist.finalEditorialReview
]);

const csv = [header, ...rows].map(row => row.map(esc).join(',')).join('\n') + '\n';
await writeFile(outCsv, csv);

console.log(`Prepared ${items.length} held FMB Fact Check drafts into ${prepared.batches} verification batches.`);
console.log(`JSON: ${path.relative(root, outJson)}`);
console.log(`CSV:  ${path.relative(root, outCsv)}`);
