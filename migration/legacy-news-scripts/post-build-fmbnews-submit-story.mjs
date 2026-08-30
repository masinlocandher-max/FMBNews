import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const submitHref = 'mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News';

async function walk(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walk(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

const files = [...new Set((await Promise.all(newsRoots.map(walk))).flat())];
if (!files.length) throw new Error('FMB News final compatibility pass found no generated routes.');

let changed = 0;
let standalone = 0;
for (const file of files) {
  const original = await readFile(file, 'utf8');
  let next = original;

  // Preserve the established shared masthead/footer treatment where it already exists.
  // Standalone hourly articles use their own valid newsroom header and must not fail
  // production merely because they do not contain the legacy shared-logo hooks.
  if (!/data-fmb-news-logo/i.test(next)) {
    standalone += 1;
    continue;
  }

  // Replace obsolete live-video calls to action with the newsroom submission address.
  next = next.replace(/<a\b([^>]*)href=(['"])[^'"]*(?:live_videos|watch-live)[^'"]*\2([^>]*)>[\s\S]*?<\/a>/gi,
    `<a$1href="${submitHref}"$3 data-fmb-story-submission>Submit your story</a>`);

  if (next !== original) {
    await writeFile(file, next, 'utf8');
    changed += 1;
  }
}

console.log(`FMB News compatibility pass reviewed ${files.length} routes, updated ${changed}, and preserved ${standalone} standalone newsroom articles.`);
