import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'news'), { recursive: true });
await cp(path.join(root, 'site'), path.join(dist, 'news'), { recursive: true });
await cp(path.join(root, 'public', 'assets'), path.join(dist, 'assets'), { recursive: true });
console.log('Built standalone FMB News snapshot into dist/.');
