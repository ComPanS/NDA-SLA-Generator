export type AppLocale = 'ru' | 'en' | 'es' | 'th';

export const APP_LOCALES: AppLocale[] = ['ru', 'en', 'es', 'th'];

/** Set when the user explicitly picks a language in the footer; skips geo on next visits. */
export const LOCALE_USER_CHOICE_KEY = 'contractai.localeUserChoice';

export const I18N_NAMESPACES = [
  'common',
  'landing',
  'lawyers',
  'auth',
  'errors',
  'dashboard',
  'contracts',
  'billing',
  'templates',
  'profile',
  'guest',
  'admin',
  'oauth',
  'editor',
] as const;
export type I18nNamespace = (typeof I18N_NAMESPACES)[number];
