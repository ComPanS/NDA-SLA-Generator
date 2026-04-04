/**
 * Single source of truth for indexable public URLs (sitemap) and prerender targets.
 * RU default locale has no prefix; en/es/th use /{locale}/...
 */
import path from 'node:path';

const LOCALES = /** @type {const} */ ([null, 'en', 'es', 'th']);

/** @param {string | null} loc */
/** @param {string} segment empty string = locale home */
function urlFor(loc, segment) {
  if (!loc) {
    return segment ? `/${segment}` : '/';
  }
  return segment ? `/${loc}/${segment}` : `/${loc}`;
}

const PUBLIC_SEGMENTS = /** @type {const} */ ([
  '',
  'lawyers',
  'guest-contract',
  'privacy',
  'terms',
]);

const AUTH_SEGMENTS = /** @type {const} */ (['login', 'register', 'forgot-password']);

export function getSitemapPaths() {
  const paths = [];
  for (const loc of LOCALES) {
    for (const seg of PUBLIC_SEGMENTS) {
      paths.push(urlFor(loc, seg));
    }
  }
  return paths;
}

/** Includes sitemap URLs plus auth pages (typically noindex but need static HTML for crawlers). */
export function getPrerenderPaths() {
  const set = new Set(getSitemapPaths());
  for (const loc of LOCALES) {
    for (const seg of AUTH_SEGMENTS) {
      set.add(urlFor(loc, seg));
    }
  }
  const arr = [...set];
  arr.sort((a, b) => {
    if (a === '/') return -1;
    if (b === '/') return 1;
    return a.localeCompare(b);
  });
  return arr;
}

/** @param {string} distDir */
/** @param {string} urlPath */
export function pathToDistOut(distDir, urlPath) {
  if (urlPath === '/') {
    return path.join(distDir, 'index.html');
  }
  const parts = urlPath.split('/').filter(Boolean);
  return path.join(distDir, ...parts, 'index.html');
}

/** RU unprefixed paths need locale locked in localStorage so prerender matches production. */
/** @param {string} urlPath */
export function lockRuLocale(urlPath) {
  return !/^\/(en|es|th)(\/|$)/.test(urlPath);
}

export const SITE_ORIGIN = 'https://dogovarai.ru';
