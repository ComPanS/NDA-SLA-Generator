import type { Request } from 'express';

/** Соответствует `supportedLngs` фронта (`frontend/src/shared/i18n/i18n.ts`). */
export const SITE_UI_LANGUAGES = ['ru', 'en', 'es', 'th'] as const;
export type SiteUiLanguage = (typeof SITE_UI_LANGUAGES)[number];

export function isSiteUiLanguage(s: string): s is SiteUiLanguage {
  return (SITE_UI_LANGUAGES as readonly string[]).includes(s);
}

/** Первичный тег BCP-47 → один из языков интерфейса. */
export function normalizeSiteUiLanguage(raw: string | undefined | null): SiteUiLanguage {
  if (!raw || typeof raw !== 'string') return 'en';
  const primary = raw.trim().toLowerCase().split('-')[0] ?? 'en';
  if (isSiteUiLanguage(primary)) return primary;
  return 'en';
}

/**
 * Язык UI для системных шаблонов: query `lang`, затем `Accept-Language`, иначе `en`.
 */
export function siteUiLanguageFromRequest(req: Request): SiteUiLanguage {
  const q = req.query.lang;
  if (typeof q === 'string' && isSiteUiLanguage(q)) {
    return q;
  }
  const accept = req.headers['accept-language'];
  if (typeof accept === 'string') {
    for (const part of accept.split(',')) {
      const tag = part.split(';')[0]?.trim().toLowerCase();
      if (!tag) continue;
      const primary = tag.split('-')[0] ?? '';
      if (isSiteUiLanguage(primary)) return primary;
    }
  }
  return 'en';
}
