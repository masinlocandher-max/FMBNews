import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const files = [];
for (const month of ['08', '09']) {
  const dir = 'content/news/morning-special';
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith(`2026-${month}-`) || !name.endsWith('.json')) continue;
    if (name < '2026-08-18.json' || name > '2026-09-15.json') continue;
    files.push(`${dir}/${name}`);
  }
}
files.sort();
files.push('content/news/recovery/daily-brief-recovery-manifest.json');

if (files.length !== 30) {
  throw new Error(`Expected 29 editions plus manifest, got ${files.length}`);
}

const archive = '/tmp/fmb-daily-brief-recovery.tgz';
execFileSync('tar', ['-czf', archive, ...files], { stdio: 'inherit' });
const encoded = fs.readFileSync(archive).toString('base64');
console.log('FMB_DAILY_BRIEF_RECOVERY_BEGIN');
console.log(encoded);
console.log('FMB_DAILY_BRIEF_RECOVERY_END');
console.error('Intentional recovery-export failure: keeps generated archive off main while allowing retrieval from verifier diagnostics.');
process.exit(1);
