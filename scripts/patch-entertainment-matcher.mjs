// Ensures entertainment desk matching uses whole-word boundaries so incidental
// substrings (e.g. "film" inside unrelated words) do not mis-route desks.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const target = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'render-home-experience.mjs');
const source = await readFile(target, 'utf8');
const oldMatcher = 'return /entertainment|culture|lifestyle|film|music|pageant|celebrity|arts?\\b/.test(haystack);';
const newMatcher = 'return /\\b(?:entertainment|culture|lifestyle|films?|music|pageant\\w*|celebrit(?:y|ies)|arts?)\\b/.test(haystack);';
if (source.includes(newMatcher)) {
  console.log('Entertainment matcher already uses whole-word boundaries.');
} else if (!source.includes(oldMatcher)) {
  throw new Error('Expected entertainment matcher not found in render-home-experience.mjs');
} else {
  await writeFile(target, source.replace(oldMatcher, newMatcher), 'utf8');
  console.log('Patched entertainment matcher to whole-word boundaries.');
}
