import { z } from 'zod';
import systemTemplatesCatalogJson from './systemTemplates.catalog.json';
import systemTemplatesI18nJson from './systemTemplates.i18n.json';
import type { SiteUiLanguage } from './siteLocale';

/** Same shape as nested types in contracts generate pipeline */
export type ContractFieldDraft = {
  templateFieldId?: string;
  groupLabel: string;
  groupOrder: number;
  label: string;
  key: string;
  value: string;
  order: number;
};

export type ContractSectionDraft = {
  templateSectionId?: string;
  title: string;
  order: number;
};

export const SYSTEM_TEMPLATE_ID_PREFIX = 'system-' as const;

const fieldSchema = z.object({
  label: z.string().min(1),
  key: z.string().min(1),
  default_value: z.string().optional(),
  order: z.number().int().optional(),
});

const groupSchema = z.object({
  label: z.string().min(1),
  order: z.number().int().optional(),
  fields: z.array(fieldSchema).default([]),
});

const sectionSchema = z.object({
  title: z.string().min(1),
  order: z.number().int().optional(),
});

/** Запись каталога (база на русском в корне — как в legacy JSON). */
const systemTemplateLegacyRowSchema = z.object({
  id: z
    .string()
    .min(1)
    .refine((s) => s.startsWith(SYSTEM_TEMPLATE_ID_PREFIX), 'id must start with system-'),
  sort_order: z.number().int().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  default_country_code: z.string().length(2).optional().nullable(),
  default_output_language: z.string().min(2).max(35).optional().nullable(),
  groups: z.array(groupSchema).default([]),
  sections: z.array(sectionSchema).default([]),
});

export type SystemTemplateLegacyRow = z.infer<typeof systemTemplateLegacyRowSchema>;

type LocaleBlock = {
  name: string;
  description?: string;
  content: string;
  groups: z.infer<typeof groupSchema>[];
  sections: z.infer<typeof sectionSchema>[];
};

const i18nOverlaySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  groupLabels: z.array(z.string()).optional(),
  fields: z
    .array(
      z.object({
        label: z.string().min(1),
        default_value: z.string().optional(),
      }),
    )
    .optional(),
  sectionTitles: z.array(z.string()).optional(),
});

const i18nBundleSchema = z.object({
  en: z.record(z.string(), i18nOverlaySchema).optional(),
  es: z.record(z.string(), i18nOverlaySchema).optional(),
  th: z.record(z.string(), i18nOverlaySchema).optional(),
});

export type SystemTemplateRecord = SystemTemplateLegacyRow;

/** API shape aligned with `toTemplate` (frontend `Template`) */
export type SystemTemplateApiDto = {
  id: string;
  name: string;
  description?: string;
  content: string;
  is_active: boolean;
  is_system: boolean;
  default_country_code?: string;
  default_output_language?: string;
  created_at: string;
  updated_at: string;
  groups: Array<{
    id: string;
    template_id: string;
    label: string;
    order: number;
    created_at: string;
    updated_at: string;
    fields: Array<{
      id: string;
      template_id: string;
      group_id: string;
      label: string;
      key: string;
      type: 'text';
      default_value: string;
      order: number;
      created_at: string;
      updated_at: string;
    }>;
  }>;
  sections: Array<{
    id: string;
    template_id: string;
    title: string;
    order: number;
    created_at: string;
    updated_at: string;
  }>;
};

const STATIC_ISO = '2020-01-01T00:00:00.000Z';

let cachedLegacyRows: SystemTemplateLegacyRow[] | null = null;
let cachedI18nBundle: z.infer<typeof i18nBundleSchema> | null = null;

function loadLegacyRows(): SystemTemplateLegacyRow[] {
  if (cachedLegacyRows) return cachedLegacyRows;
  const raw = systemTemplatesCatalogJson as unknown;
  const parsed = z.array(systemTemplateLegacyRowSchema).safeParse(raw);
  if (!parsed.success) {
    console.error('systemTemplates.catalog.json validation failed', parsed.error.flatten());
    throw new Error('Invalid systemTemplates.catalog.json');
  }
  cachedLegacyRows = parsed.data.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return cachedLegacyRows;
}

function loadI18nBundle(): z.infer<typeof i18nBundleSchema> {
  if (cachedI18nBundle) return cachedI18nBundle;
  const raw = systemTemplatesI18nJson as unknown;
  const parsed = i18nBundleSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('systemTemplates.i18n.json validation failed', parsed.error.flatten());
    throw new Error('Invalid systemTemplates.i18n.json');
  }
  cachedI18nBundle = parsed.data;
  return cachedI18nBundle;
}

function legacyRuBlock(row: SystemTemplateLegacyRow): LocaleBlock {
  return {
    name: row.name,
    description: row.description,
    content: row.content,
    groups: row.groups,
    sections: row.sections,
  };
}

function mergeOverlay(legacy: SystemTemplateLegacyRow, overlay: z.infer<typeof i18nOverlaySchema>): LocaleBlock {
  const groups = legacy.groups.map((g, gi) => {
    const label = overlay.groupLabels?.[gi] ?? g.label;
    return {
      ...g,
      label,
      fields: g.fields.map((f, fi) => {
        const o = overlay.fields?.[fi];
        return {
          ...f,
          label: o?.label ?? f.label,
          ...(o?.default_value !== undefined ? { default_value: o.default_value } : {}),
        };
      }),
    };
  });
  const sections = legacy.sections.map((s, si) => ({
    ...s,
    title: overlay.sectionTitles?.[si] ?? s.title,
  }));
  return {
    name: overlay.name,
    description: overlay.description ?? legacy.description,
    content: overlay.content,
    groups,
    sections,
  };
}

function pickOverlayForLang(
  bundle: z.infer<typeof i18nBundleSchema>,
  templateId: string,
  lang: SiteUiLanguage,
): z.infer<typeof i18nOverlaySchema> | undefined {
  if (lang === 'ru') return undefined;
  const primary = bundle[lang]?.[templateId];
  if (primary) return primary;
  return bundle.en?.[templateId];
}

function localeBlockFor(legacy: SystemTemplateLegacyRow, lang: SiteUiLanguage): LocaleBlock {
  if (lang === 'ru') {
    return legacyRuBlock(legacy);
  }
  const overlay = pickOverlayForLang(loadI18nBundle(), legacy.id, lang);
  if (!overlay) {
    return legacyRuBlock(legacy);
  }
  return mergeOverlay(legacy, overlay);
}

function toSystemRecord(legacy: SystemTemplateLegacyRow, lang: SiteUiLanguage): SystemTemplateRecord {
  const loc = localeBlockFor(legacy, lang);
  return {
    id: legacy.id,
    sort_order: legacy.sort_order,
    name: loc.name,
    description: loc.description,
    content: loc.content,
    default_country_code: legacy.default_country_code,
    default_output_language: legacy.default_output_language,
    groups: loc.groups,
    sections: loc.sections,
  };
}

export function loadSystemTemplateRecords(lang: SiteUiLanguage = 'ru'): SystemTemplateRecord[] {
  return loadLegacyRows().map((row) => toSystemRecord(row, lang));
}

export function isSystemTemplateId(id: string): boolean {
  return id.startsWith(SYSTEM_TEMPLATE_ID_PREFIX);
}

export function getSystemTemplateRecordById(
  id: string,
  lang: SiteUiLanguage = 'ru',
): SystemTemplateRecord | null {
  if (!isSystemTemplateId(id)) return null;
  const legacy = loadLegacyRows().find((t) => t.id === id) ?? null;
  if (!legacy) return null;
  return toSystemRecord(legacy, lang);
}

export function recordToApiDto(record: SystemTemplateRecord): SystemTemplateApiDto {
  const tplId = record.id;
  return {
    id: tplId,
    name: record.name,
    description: record.description || undefined,
    content: record.content,
    is_active: true,
    is_system: true,
    default_country_code: record.default_country_code?.toUpperCase() || undefined,
    default_output_language: record.default_output_language?.trim() || undefined,
    created_at: STATIC_ISO,
    updated_at: STATIC_ISO,
    groups: record.groups.map((g, gIdx) => {
      const gid = `${tplId}-g${gIdx}`;
      return {
        id: gid,
        template_id: tplId,
        label: g.label,
        order: g.order ?? gIdx,
        created_at: STATIC_ISO,
        updated_at: STATIC_ISO,
        fields: g.fields.map((f, fIdx) => ({
          id: `${tplId}-f${gIdx}-${fIdx}`,
          template_id: tplId,
          group_id: gid,
          label: f.label,
          key: f.key,
          type: 'text' as const,
          default_value: f.default_value ?? '',
          order: f.order ?? fIdx,
          created_at: STATIC_ISO,
          updated_at: STATIC_ISO,
        })),
      };
    }),
    sections: record.sections.map((s, sIdx) => ({
      id: `${tplId}-s${sIdx}`,
      template_id: tplId,
      title: s.title,
      order: s.order ?? sIdx,
      created_at: STATIC_ISO,
      updated_at: STATIC_ISO,
    })),
  };
}

export function listSystemTemplatesApi(lang: SiteUiLanguage = 'ru'): SystemTemplateApiDto[] {
  return loadLegacyRows().map((row) => recordToApiDto(toSystemRecord(row, lang)));
}

export function contractFieldDraftsFromSystemRecord(record: SystemTemplateRecord): ContractFieldDraft[] {
  const groups = record.groups || [];
  return groups.flatMap((group, groupIdx) =>
    (group.fields || []).map((field, fieldIdx) => ({
      templateFieldId: `${record.id}-f${groupIdx}-${fieldIdx}`,
      groupLabel: group.label,
      groupOrder: group.order ?? groupIdx,
      label: field.label,
      key: field.key,
      value: field.default_value ?? '',
      order: field.order ?? fieldIdx,
    })),
  );
}

export function contractSectionDraftsFromSystemRecord(
  record: SystemTemplateRecord,
): ContractSectionDraft[] {
  return (record.sections || []).map((s, idx) => ({
    templateSectionId: `${record.id}-s${idx}`,
    title: s.title,
    order: s.order ?? idx,
  }));
}

/** Defaults for country / output language when request omits them */
export function systemRecordDefaults(record: SystemTemplateRecord): {
  countryCode: string | null;
  outputLanguage: string | null;
} {
  return {
    countryCode: record.default_country_code ? record.default_country_code.toUpperCase() : null,
    outputLanguage: record.default_output_language?.trim() || null,
  };
}

export function userPromptWithTemplateBase(baseContent: string, userPrompt: string): string {
  return `${baseContent}\n\n${userPrompt}`;
}
