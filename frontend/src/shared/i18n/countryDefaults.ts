/** Default ISO alpha-2 when geo-hint is unavailable, from UI locale. */
export function defaultCountryFromAppLocale(locale: string): string {
  const l = locale.toLowerCase();
  if (l.startsWith('ru')) return 'RU';
  if (l.startsWith('th')) return 'TH';
  if (l.startsWith('es')) return 'ES';
  return 'US';
}
