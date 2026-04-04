/**
 * Post-build checks for SEO assets (run after vite build).
 * For live baseline: submit sitemap in GSC / Яндекс.Вебмастер, check «Покрытие», PSI mobile.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSitemapPaths } from './seo-paths.mjs';

const __dirnameMe = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirnameMe, '..', 'dist');
const sitemapPath = path.join(dist, 'sitemap.xml');
const robotsPath = path.join(dist, 'robots.txt');

function fail(msg) {
  console.error('[verify-seo]', msg);
  process.exit(1);
}

if (!fs.existsSync(sitemapPath)) {
  fail(`Missing ${path.relative(process.cwd(), sitemapPath)} — run npm run build (or vite build) first.`);
}

const xml = fs.readFileSync(sitemapPath, 'utf8');
if (!xml.includes('<urlset') || !xml.includes('</urlset>')) {
  fail('dist/sitemap.xml does not look like a valid urlset');
}

const expected = getSitemapPaths().length;
const locCount = (xml.match(/<loc>/g) || []).length;
if (locCount !== expected) {
  fail(`Expected ${expected} <loc> entries, found ${locCount}. Regenerate: node scripts/generate-sitemap.mjs && vite build`);
}

if (!fs.existsSync(robotsPath)) {
  fail(`Missing ${path.relative(process.cwd(), robotsPath)}`);
}
const robots = fs.readFileSync(robotsPath, 'utf8');
if (!robots.includes('Sitemap:')) {
  fail('robots.txt should reference Sitemap:');
}

console.log('[verify-seo] dist/sitemap.xml:', locCount, 'URLs; robots.txt OK.');
console.log('[verify-seo] Deploy checklist: curl -fsSI https://dogovarai.ru/sitemap.xml | head -1');
console.log('[verify-seo] GSC / Вебмастер: add sitemap, inspect URL, Core Web Vitals (CrUX), Метрика — цели.');
