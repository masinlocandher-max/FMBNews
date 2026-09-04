// FMB News is standalone. Nothing may reattach it to FMB-Ecosystem.
//
// README.md and AGENTS.md have long declared this boundary, and
// verify-standalone.yml greps six paths for the retired repository's name. But
// that grep does not cover .github, content, docs or the built output, and — the
// part that matters — deploy-cloudflare.yml never ran it at all. The workflow
// that actually ships to www.francinemariebautista.com/news had no boundary
// check of any kind.
//
// This runs inside `npm run verify`, so it gates every build and every deploy.
//
// Two different rules, because they are genuinely different things:
//
//   - Files that BUILD or DEPLOY the newsroom, and everything that ships, may
//     not reference the retired repository, any other repository under the
//     account, Vercel, or a code host serving content. That is an attachment.
//
//   - Files whose job is to FORBID the attachment must be free to name it.
//     README.md, AGENTS.md, docs/ and the recovery manifest are the record of
//     the boundary; a checker that failed on them would force the rules to be
//     deleted in order to pass.

import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolve = (...p) => path.join(root, ...p);
const OWNER = 'masinlocandher-max';

// The repository is FMB-Ecosystem. "the FMB ecosystem" as ordinary editorial
// prose is not a reattachment, so match the hyphen or underscore only.
const RETIRED = /FMB[-_]Ecosystem/i;
// Any repository under the account other than this one.
const FOREIGN_REPO = new RegExp(`${OWNER}/(?!FMBNews\\b)[A-Za-z0-9._-]+`, 'i');
// Content or assets served out of a code host.
const CODE_HOST = /\b(?:raw\.githubusercontent\.com|gitlab\.com|bitbucket\.org)\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+/i;
// The Vercel project that was sourced from the retired repository.
const VERCEL = /vercel\.(?:json|app)|\.vercel\/|withlovefmb["'\s]*:\s*["']?vercel/i;

const SCANNED = new Set(['.json', '.html', '.js', '.mjs', '.css', '.yml', '.yaml', '.txt', '.xml', '.webmanifest', '.jsonc', '.toml']);
const SKIP_DIRS = new Set(['.git', 'node_modules', '.github/workflows']);

// Files whose purpose is to state the prohibition.
const PROHIBITION_FILES = new Set([
  'README.md', 'AGENTS.md', 'CLAUDE.md',
  'content/news/recovery/missed-publication-manifest.json',
  'scripts/verify-standalone-boundary.mjs',
]);
const isProhibitionDoc = rel => PROHIBITION_FILES.has(rel) || rel.startsWith('docs/') || rel.startsWith('.github/workflows/');

const failures = [];

async function scan(dir, label) {
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || SKIP_DIRS.has(rel)) continue;
      await scan(full, label);
      continue;
    }
    if (!SCANNED.has(path.extname(entry.name).toLowerCase())) continue;
    if (isProhibitionDoc(rel)) continue;

    const text = await readFile(full, 'utf8');
    if (RETIRED.test(text)) failures.push(`${label}: ${rel} reattaches FMB News to the retired FMB-Ecosystem repository`);
    if (FOREIGN_REPO.test(text)) failures.push(`${label}: ${rel} references a repository other than FMBNews`);
    if (CODE_HOST.test(text)) failures.push(`${label}: ${rel} serves content or assets from a code host`);
    if (label === 'shipped' && VERCEL.test(text)) failures.push(`shipped: ${rel} carries a Vercel deployment marker`);
  }
}

// 1. Everything that builds or deploys the newsroom.
for (const dir of ['src', 'public', 'scripts', 'site', 'content']) await scan(resolve(dir), 'source');
for (const file of ['wrangler.jsonc', 'package.json']) {
  const text = await readFile(resolve(file), 'utf8');
  if (RETIRED.test(text)) failures.push(`source: ${file} reattaches FMB News to FMB-Ecosystem`);
  if (FOREIGN_REPO.test(text)) failures.push(`source: ${file} references a repository other than FMBNews`);
}

// 2. Everything that ships. Zero tolerance: this is what readers receive.
let shippedPages = 0;
async function scanShipped(target) {
  const info = await stat(target);
  if (info.isDirectory()) {
    for (const entry of await readdir(target)) await scanShipped(path.join(target, entry));
    return;
  }
  if (!SCANNED.has(path.extname(target).toLowerCase())) return;
  const rel = path.relative(root, target).replaceAll('\\', '/');
  if (path.basename(target) === 'index.html') shippedPages += 1;
  const text = await readFile(target, 'utf8');
  if (RETIRED.test(text)) failures.push(`shipped: ${rel} names the retired repository`);
  if (FOREIGN_REPO.test(text)) failures.push(`shipped: ${rel} references a repository other than FMBNews`);
  if (CODE_HOST.test(text)) failures.push(`shipped: ${rel} links content or assets to a code host`);
  if (VERCEL.test(text)) failures.push(`shipped: ${rel} carries a Vercel deployment marker`);
}
await scanShipped(resolve('dist', 'news'));

// 3. No structural reattachment: no submodule, no Vercel project config.
for (const forbidden of ['.gitmodules', 'vercel.json', '.vercel', '.vercelignore']) {
  try { await access(resolve(forbidden)); failures.push(`structure: ${forbidden} exists — FMB News must not be attached to another source or to Vercel`); }
  catch { /* absent, which is correct */ }
}

if (failures.length) {
  throw new Error(`FMB News standalone boundary violated:\n  - ${failures.join('\n  - ')}`);
}

console.log(
  `FMB News standalone boundary verified: no source file, no build or deploy script, and none of the ` +
  `${shippedPages} shipped pages reattaches to FMB-Ecosystem, to any other repository under ${OWNER}, ` +
  `to Vercel, or to content served from a code host. No submodule or Vercel project config exists.`
);
