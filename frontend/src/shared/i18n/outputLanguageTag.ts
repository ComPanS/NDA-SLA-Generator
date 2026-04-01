/** Mirrors backend `outputLanguageSchema`: BCP-47–style tags (e.g. ru, en, zh-CN). */
const OUTPUT_LANGUAGE_TAG_RE = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]+)*$/;

export function normalizeOutputLanguageTag(value: string | undefined | null): string {
  const raw = String(value ?? 'ru')
    .trim()
    .replace(/_/g, '-');
  if (raw.length < 2 || raw.length > 32) return 'ru';
  if (!OUTPUT_LANGUAGE_TAG_RE.test(raw)) return 'ru';
  return raw;
}

export function isValidOutputLanguageTag(value: string): boolean {
  const raw = value.trim().replace(/_/g, '-');
  if (raw.length < 2 || raw.length > 32) return false;
  return OUTPUT_LANGUAGE_TAG_RE.test(raw);
}
