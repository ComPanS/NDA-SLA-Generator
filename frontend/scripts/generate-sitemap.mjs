/**
 * Writes public/sitemap.xml from scripts/seo-paths.mjs (run before vite build).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSitemapPaths, SITE_ORIGIN } from './seo-paths.mjs';

const __dirnameMe = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirnameMe, '..');
const outFile = path.join(root, 'public', 'sitemap.xml');

const paths = getSitemapPaths();
const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...paths.map((p) => `  <url><loc>${SITE_ORIGIN}${p === '/' ? '/' : p}</loc></url>`),
  '</urlset>',
  '',
];

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, lines.join('\n'), 'utf8');
console.log('[sitemap] wrote', paths.length, 'URLs ->', path.relative(root, outFile));
