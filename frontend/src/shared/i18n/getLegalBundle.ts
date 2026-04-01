import type { LegalBundle } from './legalTypes';
import ru from './locales/ru/legalContent';
import en from './locales/en/legalContent';
import es from './locales/es/legalContent';
import th from './locales/th/legalContent';

export function getLegalBundle(lang: string): LegalBundle {
  if (lang === 'ru') return ru;
  if (lang === 'es') return es;
  if (lang === 'th') return th;
  return en;
}
