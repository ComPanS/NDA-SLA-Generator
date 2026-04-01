/**
 * Runs prerender-landing.mjs with SKIP_PRERENDER=1 (cross-platform).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = spawnSync(process.execPath, ['scripts/prerender-landing.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, SKIP_PRERENDER: '1' },
});
process.exit(r.status ?? 1);
