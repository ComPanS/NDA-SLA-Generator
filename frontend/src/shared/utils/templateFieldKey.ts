/** Latin slug for template field `key`; Cyrillic and other scripts yield a short fallback. */
export function slugifyTemplateFieldKey(label: string, index: number): string {
  const trimmed = label.trim();
  const ascii = trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
  if (ascii.length >= 1) return ascii;
  return `field_${index + 1}`;
}

export function assignUniqueTemplateFieldKeys(
  fields: Array<{ id?: string; label: string; key: string }>,
): string[] {
  const used = new Set<string>();
  return fields.map((f, idx) => {
    const k = f.key.trim();
    if (f.id && k.length >= 1) {
      let candidate = k;
      let n = 2;
      while (used.has(candidate)) {
        candidate = `${k}_${n++}`;
      }
      used.add(candidate);
      return candidate;
    }
    const base = slugifyTemplateFieldKey(f.label, idx);
    let candidate = base;
    let n = 2;
    while (used.has(candidate)) {
      candidate = `${base}_${n++}`;
    }
    used.add(candidate);
    return candidate;
  });
}
