/** BCP-47 tags shown in the contract output language dropdown (plus any current value from the document). */
export const OUTPUT_LANGUAGE_PRESET_TAGS: readonly string[] = [
  'ar',
  'az',
  'bg',
  'bn',
  'zh-CN',
  'zh-TW',
  'cs',
  'da',
  'nl',
  'en',
  'en-GB',
  'et',
  'fi',
  'fr',
  'fr-CA',
  'ka',
  'de',
  'el',
  'he',
  'hi',
  'hu',
  'id',
  'it',
  'ja',
  'kk',
  'ko',
  'lv',
  'lt',
  'ms',
  'no',
  'nb',
  'pl',
  'pt',
  'pt-BR',
  'ro',
  'ru',
  'sk',
  'sl',
  'es',
  'es-MX',
  'sv',
  'th',
  'tr',
  'uk',
  'uz',
  'vi',
  'fa',
  'fil',
];

function labelForTag(tag: string, uiLocale: string): string {
  const primary = tag.split('-')[0];
  if (!primary) return tag;
  try {
    const dn = new Intl.DisplayNames([uiLocale], { type: 'language' });
    const name = dn.of(primary);
    if (name) {
      return tag.includes('-') ? `${name} (${tag})` : name;
    }
  } catch {
    /* ignore */
  }
  return tag;
}

/** Menu options: presets, current tag if missing, sorted by localized label. */
export function outputLanguageSelectOptions(
  currentTag: string,
  uiLocale: string,
): Array<{ tag: string; label: string }> {
  const set = new Set<string>(OUTPUT_LANGUAGE_PRESET_TAGS);
  const normalized = currentTag.trim().replace(/_/g, '-');
  if (normalized) {
    set.add(normalized);
  }
  return Array.from(set)
    .map((tag) => ({ tag, label: labelForTag(tag, uiLocale) }))
    .sort((a, b) => a.label.localeCompare(b.label, uiLocale, { sensitivity: 'base' }));
}
