/**
 * Post-build prerender for public landing routes (/, /en, /es, /th).
 * Serves the built app via vite preview, captures fully hydrated HTML in Chromium
 * (including PageMeta head updates), writes locale-specific files and index-shell.html.
 *
 * Set SKIP_PRERENDER=1 to skip (copies shell only; locale landings fall back to SPA shell).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirnameMe = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirnameMe, '..');
const dist = path.join(root, 'dist');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

/** Keep in sync with LOCALE_USER_CHOICE_KEY in src/shared/i18n/constants.ts */
const LOCALE_USER_CHOICE_KEY = 'contractai.localeUserChoice';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForOk(url, maxAttempts = 80) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.ok || (res.status >= 300 && res.status < 400)) return;
    } catch {
      /* retry */
    }
    await sleep(250);
  }
  throw new Error(`Preview server did not respond: ${url}`);
}

function startPreview(port) {
  return spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: root,
    env: { ...process.env, BROWSER: 'none' },
    stdio: 'inherit',
  });
}

async function killPreview(proc) {
  if (!proc?.pid) return;
  proc.kill('SIGTERM');
  await sleep(800);
  if (!proc.killed) {
    try {
      proc.kill('SIGKILL');
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  const indexPath = path.join(dist, 'index.html');
  const shellPath = path.join(dist, 'index-shell.html');

  if (!fs.existsSync(indexPath)) {
    throw new Error(`Missing ${indexPath}; run vite build first`);
  }

  fs.copyFileSync(indexPath, shellPath);

  if (process.env.SKIP_PRERENDER === '1') {
    console.log('[prerender] SKIP_PRERENDER=1 — kept SPA shell as index.html; index-shell.html copied for nginx fallback.');
    return;
  }

  const port = process.env.PRERENDER_PREVIEW_PORT || '4179';
  const base = `http://127.0.0.1:${port}`;

  const preview = startPreview(port);

  try {
    await waitForOk(base);

    const browser = await chromium.launch();
    const context = await browser.newContext();

    const jobs = [
      { path: '/', out: indexPath, lockRuLocale: true },
      { path: '/en', out: path.join(dist, 'en', 'index.html'), lockRuLocale: false },
      { path: '/es', out: path.join(dist, 'es', 'index.html'), lockRuLocale: false },
      { path: '/th', out: path.join(dist, 'th', 'index.html'), lockRuLocale: false },
    ];

    for (const job of jobs) {
      const page = await context.newPage();
      if (job.lockRuLocale) {
        await page.addInitScript(() => {
          localStorage.setItem(LOCALE_USER_CHOICE_KEY, 'ru');
        });
      }

      await page.goto(`${base}${job.path}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
      await page.waitForSelector('main h1', { timeout: 90_000 });
      await page.waitForFunction(
        () => document.querySelectorAll('link[rel="alternate"][hreflang]').length >= 5,
        { timeout: 45_000 },
      );
      await sleep(400);

      let html = await page.content();
      await page.close();

      const publicBase =
        (process.env.VITE_SITE_URL || process.env.PRERENDER_PUBLIC_BASE || '').trim().replace(/\/+$/, '');
      if (publicBase && /^https?:\/\//i.test(publicBase)) {
        const previewOrigin = `http://127.0.0.1:${port}`;
        if (html.includes(previewOrigin)) {
          html = html.split(previewOrigin).join(publicBase);
        }
      }

      fs.mkdirSync(path.dirname(job.out), { recursive: true });
      fs.writeFileSync(job.out, html, 'utf8');
      console.log('[prerender]', job.path, '->', path.relative(dist, job.out));
    }

    await browser.close();
    console.log('[prerender] done.');
  } finally {
    await killPreview(preview);
  }
}

main().catch((err) => {
  console.error('[prerender] failed:', err);
  process.exit(1);
});
