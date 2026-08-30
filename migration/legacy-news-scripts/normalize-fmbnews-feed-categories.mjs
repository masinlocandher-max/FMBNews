import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const categoryAliases = new Map([
  ['Nation', 'National'],
]);

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(full);
  }
  return files;
}

function normalizeHeading(heading) {
  const text = String(heading || '').trim();
  if (/^what we know\b/i.test(text)) return `Context: ${text}`;
  if (/^key facts\b/i.test(text)) return `Context: ${text}`;
  if (/^impact\b/i.test(text)) return 'Why this matters';
  if (/^why it matters\b/i.test(text)) return 'Why this matters';
  if (/^next steps?\b/i.test(text)) return 'What comes next';
  if (/^what to watch\b/i.test(text) && !/^what to watch next\b/i.test(text)) return 'What to watch next';
  return text;
}

function ensureContextHeading(sections) {
  if (sections.some((section) => /\b(?:context|background)\b/i.test(String(section?.heading || '')))) return false;
  const why = sections.find((section) => /^why (?:this )?matters\b/i.test(String(section?.heading || '')));
  if (why) {
    why.heading = `${why.heading} · Context`;
    return true;
  }
  const candidate = sections.find((section) => !/^what happened\b/i.test(String(section?.heading || '')));
  if (candidate) {
    candidate.heading = `Context: ${candidate.heading}`;
    return true;
  }
  return false;
}

export async function normalizeFmbNewsFeedCategories(contentRoot) {
  let changedFiles = 0;
  let changedCategories = 0;
  let changedHeadings = 0;
  for (const file of await walk(contentRoot)) {
    let raw;
    try {
      raw = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      continue;
    }
    let changed = false;
    const normalizedCategory = categoryAliases.get(raw?.category);
    if (normalizedCategory) {
      raw.category = normalizedCategory;
      changedCategories += 1;
      changed = true;
    }
    if (Array.isArray(raw?.sections)) {
      for (const section of raw.sections) {
        const next = normalizeHeading(section?.heading);
        if (next && next !== section?.heading) {
          section.heading = next;
          changedHeadings += 1;
          changed = true;
        }
      }
      if (ensureContextHeading(raw.sections)) {
        changedHeadings += 1;
        changed = true;
      }
    }
    if (!changed) continue;
    await writeFile(file, JSON.stringify(raw, null, 2) + '\n', 'utf8');
    changedFiles += 1;
  }
  console.log(`Normalized ${changedCategories} FMB News legacy categories and ${changedHeadings} editorial headings across ${changedFiles} file(s).`);
}
