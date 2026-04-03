import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import sanitizeHtml, { Attributes, IFrame } from 'sanitize-html';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { toDocument } from '../lib/mappers';
import { generateText } from '../lib/yandex';
import { getClientIp, isLoopbackIp } from '../lib/requestIp';
import {
  checkContractLimit,
  checkClarificationLimit,
  checkFeatureAccess,
  getUserPlan,
  incrementContractUsage,
  incrementClarificationUsage,
} from '../lib/limits';
import { SINGLE_CONTRACT_PRICE, singleContractPricesToApi } from '../config/subscriptions';
import {
  buildRiskPrompt,
  buildRefinePrompt,
  composeContractGeneratePrompt,
  makePromptContext,
  normalizeCountryCode,
  normalizeOutputLanguage,
} from '../lib/contractPrompts';
import { logContractPipelineError } from '../lib/contractPipelineLog';
import {
  contractFieldDraftsFromSystemRecord,
  contractSectionDraftsFromSystemRecord,
  getSystemTemplateRecordById,
  isSystemTemplateId,
  systemRecordDefaults,
  userPromptWithTemplateBase,
} from '../lib/systemTemplates';
import { mergeIncomingFieldsIntoDrafts, mergeIncomingSectionsIntoDrafts } from '../lib/mergeContractDrafts';
import { siteUiLanguageFromRequest } from '../lib/siteLocale';

const router = Router();

const isoCountryCodeSchema = z
  .string()
  .length(2)
  .transform((s) => s.toUpperCase())
  .refine((s) => /^[A-Z]{2}$/.test(s), 'Invalid country code');

/** BCP-47 language tag, e.g. ru, en, de, fr, zh-CN */
const outputLanguageSchema = z
  .string()
  .trim()
  .min(2)
  .max(32)
  .regex(/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]+)*$/, 'Invalid language tag')
  .transform((s) => s.replace(/_/g, '-'));

// Public stats endpoint for landing page
router.get('/public-stats', async (_req, res) => {
  try {
    const contractsTotal = await prisma.document.count();
    return res.json({ contracts_total: contractsTotal + 200 });
  } catch (error) {
    console.error('Failed to fetch public stats', error);
    return res.status(500).json({ error: 'Failed to fetch public stats' });
  }
});

type DocWithRelations = Prisma.DocumentGetPayload<{
  include: {
    template: { select: { id: true; name: true } };
    versions: { include: { riskAssessment: true } };
    fields: true;
    sections: true;
  };
}>;

type DocWithVersions = Prisma.DocumentGetPayload<{
  include: { versions: { include: { riskAssessment: true } } };
}>;

type TemplateWithFields = Prisma.TemplateGetPayload<{
  include: { groups: { include: { fields: true } }; sections: true };
}>;

type ContractFieldDraft = {
  templateFieldId?: string;
  groupLabel: string;
  groupOrder: number;
  label: string;
  key: string;
  value: string;
  order: number;
};

type ContractSectionDraft = {
  templateSectionId?: string;
  title: string;
  order: number;
};

function pruneVersions<T extends { versions?: Array<{ version: number }> }>(
  doc: T,
  allowHistory: boolean,
): T {
  if (!doc || allowHistory) return doc;
  if (!doc.versions || doc.versions.length <= 1) return doc;
  const latest = doc.versions[doc.versions.length - 1];
  return { ...doc, versions: [latest] };
}

function contractFieldsFromTemplate(template: TemplateWithFields): ContractFieldDraft[] {
  const groups = template.groups || [];
  return groups.flatMap((group, groupIdx) =>
    (group.fields || []).map((field, fieldIdx) => ({
      templateFieldId: field.id,
      groupLabel: group.label,
      groupOrder: group.order ?? groupIdx,
      label: field.label,
      key: field.key,
      value: field.defaultValue ?? '',
      order: field.order ?? fieldIdx,
    })),
  );
}

function contractSectionsFromTemplate(template: TemplateWithFields): ContractSectionDraft[] {
  return (template.sections || []).map((s, idx) => ({
    templateSectionId: s.id,
    title: s.title,
    order: s.order ?? idx,
  }));
}

function logColumnsDebug(_label: string, _html?: string) {
  void _label;
  void _html;
  // logging disabled
}

const MAX_TITLE_LENGTH = 200;
const MAX_REGEX_ESCAPE_LENGTH = 1024;

export function sanitizeGeneratedHtml(raw: string, title: string): string {
  let content = raw.trim();

  // Сжимаем слишком длинные цепочки нижних подчёркиваний до 30 символов
  content = content.replace(/_{31,}/g, '______________________________');

  const trimmedTitle = title.trim();
  const safeTitle =
    trimmedTitle.length > MAX_TITLE_LENGTH ? trimmedTitle.slice(0, MAX_TITLE_LENGTH) : trimmedTitle;
  const lowerSafeTitle = safeTitle.toLowerCase();

  const isWhitespace = (char: string) => /\s/.test(char);

  const trimLeadingWhitespace = (input: string) => {
    let idx = 0;
    while (idx < input.length && isWhitespace(input[idx])) {
      idx += 1;
    }
    return { trimmed: input.slice(idx), offset: idx };
  };

  const collapsePlainTitlePrefix = (value: string) => {
    if (!safeTitle) return value;
    const { trimmed, offset } = trimLeadingWhitespace(value);
    let remainder = trimmed;
    let occurrences = 0;
    let consumed = 0;

    while (remainder.toLowerCase().startsWith(lowerSafeTitle)) {
      occurrences += 1;
      remainder = remainder.slice(safeTitle.length);
      consumed += safeTitle.length;
      while (remainder.length && isWhitespace(remainder[0])) {
        remainder = remainder.slice(1);
        consumed += 1;
      }
    }

    if (occurrences > 1) {
      const suffix = trimmed.slice(consumed).trimStart();
      return `${value.slice(0, offset)}${safeTitle}\n${suffix}`;
    }

    return value;
  };

  const stripLeadingPlainTitleLine = (value: string) => {
    if (!safeTitle) return value;
    const { trimmed, offset } = trimLeadingWhitespace(value);
    if (!trimmed.toLowerCase().startsWith(lowerSafeTitle)) {
      return value;
    }

    let cursor = safeTitle.length;
    while (
      cursor < trimmed.length &&
      isWhitespace(trimmed[cursor]) &&
      trimmed[cursor] !== '\n' &&
      trimmed[cursor] !== '\r'
    ) {
      cursor += 1;
    }

    const nextChar = trimmed[cursor];
    if (nextChar === '\r' && trimmed[cursor + 1] === '\n') {
      return `${value.slice(0, offset)}${trimmed.slice(cursor + 2)}`;
    }
    if (nextChar === '\n') {
      return `${value.slice(0, offset)}${trimmed.slice(cursor + 1)}`;
    }

    return value;
  };

  const removeTitleAfterH1 = (value: string) => {
    if (!safeTitle) return value;
    const lowerValue = value.toLowerCase();
    const closeIdx = lowerValue.indexOf('</h1>');
    if (closeIdx === -1) return value;

    const after = value.slice(closeIdx + '</h1>'.length);
    const { trimmed, offset } = trimLeadingWhitespace(after);
    const lowerTrimmed = trimmed.toLowerCase();

    if (lowerTrimmed.startsWith(lowerSafeTitle)) {
      const remaining = trimmed.slice(safeTitle.length).trimStart();
      return `${value.slice(0, closeIdx + '</h1>'.length)}${after.slice(0, offset)}${remaining}`;
    }

    if (lowerTrimmed.startsWith('<p')) {
      const openEnd = trimmed.indexOf('>');
      const closeTagIdx = trimmed.toLowerCase().indexOf('</p>');
      if (openEnd !== -1 && closeTagIdx !== -1 && closeTagIdx > openEnd) {
        const paragraphContent = trimmed.slice(openEnd + 1, closeTagIdx).trim();
        if (paragraphContent.toLowerCase() === lowerSafeTitle) {
          const afterParagraph = trimmed.slice(closeTagIdx + '</p>'.length).trimStart();
          return `${value.slice(0, closeIdx + '</h1>'.length)}${after.slice(0, offset)}${afterParagraph}`;
        }
      }
    }

    return value;
  };

  // Убираем обёртку ```html ... ```
  if (content.startsWith('```')) {
    content = content
      .replace(/^```[a-zA-Z]*\s*/, '')
      .replace(/```$/, '')
      .trim();
  }

  // Если модель вернула лишние бэктики в конце
  content = content.replace(/```$/, '').trim();

  // Если пришёл полный HTML с <body>, берем только содержимое body
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    content = bodyMatch[1].trim();
  } else {
    // Убираем обертки doctype/html/head/body если они есть
    content = content
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<\/?html[^>]*>/gi, '')
      .replace(/<\/?body[^>]*>/gi, '')
      .trim();
  }

  // Если модель продублировала <h1> с тем же заголовком, оставим первый
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  const matches = [...content.matchAll(h1Regex)];
  if (matches.length > 1) {
    const first = matches[0][0];
    // Удаляем все последующие h1
    content = first + content.replace(first, '').replace(h1Regex, '');
  }

  // Убираем дублирование заголовка без тэгов в начале (часто модель повторяет)
  const textOnly = content.replace(/<[^>]+>/g, '').trim();
  if (
    safeTitle &&
    textOnly.toLowerCase().startsWith(lowerSafeTitle) &&
    textOnly.toLowerCase().slice(lowerSafeTitle.length).trimStart().startsWith(lowerSafeTitle)
  ) {
    content = collapsePlainTitlePrefix(content);
  }

  // Если сразу после h1 идёт тот же заголовок текстом или в параграфе — уберём дубль
  content = removeTitleAfterH1(content);

  // Удаляем явный дубликат названия на первой строке без тегов
  content = stripLeadingPlainTitleLine(content);

  // Нормализуем первый <h1>: если он есть — переписываем текст на точное название договора
  content = content.replace(/<title[^>]*>[\s\S]*?<\/title>/i, '');

  // Исправление: <ol><li>2.2.1. Текст</li></ol> даёт "1. 2.2.1." — браузер добавляет свою нумерацию.
  // Конвертируем ol с кастомной нумерацией (1.1, 2.2.1 и т.д.) в <p>, чтобы не было дублирования.
  content = content.replace(/<ol(?:\s[^>]*)?>([\s\S]*?)<\/ol>/gi, (match, inner) => {
    if (/<ol[\s>]|<ul[\s>]/i.test(inner)) return match; // вложенные списки — не трогаем
    const liMatches = inner.match(/<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi);
    if (!liMatches || liMatches.length === 0) return match;
    const customNumRe = /^\d+(\.\d+)+\.\s*/;
    const allCustom = liMatches.every((li: string) => {
      const m = li.match(/<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/i);
      const innerContent = m ? m[1] : '';
      const text = innerContent.replace(/<[^>]+>/g, '').trim();
      return customNumRe.test(text);
    });
    if (!allCustom) return match;
    const fixed = inner.replace(
      /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi,
      (_: string, c: string) => `<p>${c}</p>`,
    );
    return fixed;
  });

  const sanitized = sanitizeHtml(content, {
    allowedTags: [
      'h1',
      'h2',
      'h3',
      'h4',
      'p',
      'strong',
      'em',
      'b',
      'i',
      'u',
      'ol',
      'ul',
      'li',
      'br',
      'hr',
      'blockquote',
      'code',
      'pre',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'span',
      'div',
      'section',
      'article',
      'header',
      'footer',
      'figure',
      'figcaption',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      '*': [
        'class',
        'style',
        'data-columns',
        'data-list-style',
        'data-gutter',
        'data-equal-width',
        'data-area-height',
        'data-span-columns',
        'data-column-break',
      ],
    },
    allowedStyles: {
      '*': {
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
        'font-size': [/^\d+(px|pt)$/],
        'column-count': [/^\d+$/],
        'column-gap': [/^\d+(px|pt)$/],
        'column-span': [/^all$/],
      },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    transformTags: {
      a: (tagName: string, attribs: Attributes) => {
        const rel = attribs.rel?.includes('noopener') ? attribs.rel : 'noopener noreferrer';
        const updatedAttribs: Attributes = {
          ...attribs,
          rel,
        };
        if (attribs.target === '_blank') {
          updatedAttribs.target = '_blank';
        } else {
          delete updatedAttribs.target;
        }
        return {
          tagName,
          attribs: updatedAttribs,
        };
      },
    },
    exclusiveFilter: (frame: IFrame) => frame.tag === 'a' && !frame.attribs.href,
  });

  return sanitized.trim();
}

function escapeRegExp(value: string) {
  const safeValue =
    value.length > MAX_REGEX_ESCAPE_LENGTH ? value.slice(0, MAX_REGEX_ESCAPE_LENGTH) : value;
  // Escaping is limited to a bounded input to avoid ReDoS when used in dynamic patterns.
  return safeValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

void escapeRegExp;

function sanitizeFilename(title: string) {
  const slug = title
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug.length ? slug.slice(0, 100) : 'document';
}

function extractTitleFromHtml(html: string, fallback: string): string {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const raw = h1Match ? h1Match[1] : '';
  const text = raw.replace(/<[^>]+>/g, '').trim();
  const cleaned = text.replace(/^СОГЛАШЕНИЕ О КОНФИДЕНЦИАЛЬНОСТИ[:\\s-]*/i, '').trim();
  return cleaned || fallback;
}

const contractFieldSchema = z.object({
  id: z.string().uuid().optional(),
  template_field_id: z.string().uuid().optional(),
  group_label: z.string().min(1),
  group_order: z.number().int().optional(),
  label: z.string().min(1),
  key: z.string().min(1),
  value: z.string().optional(),
  order: z.number().int().optional(),
});

const contractSectionSchema = z.object({
  id: z.string().uuid().optional(),
  template_section_id: z.string().uuid().optional(),
  title: z.string().min(1),
  order: z.number().int().optional(),
});

const updateFieldsSchema = z.object({
  fields: z.array(contractFieldSchema).min(1),
});

const updateSectionsSchema = z.object({
  sections: z.array(contractSectionSchema).min(1),
});

const createFieldSchema = contractFieldSchema.omit({ id: true });
const createSectionSchema = contractSectionSchema.omit({ id: true });

const generateSchema = z.object({
  title: z.string().min(1),
  template_id: z.string().optional(),
  prompt: z.string().min(1),
  format_mode: z.string().optional(),
  risk_check: z.boolean().optional(),
  country_code: isoCountryCodeSchema.optional(),
  output_language: outputLanguageSchema.optional(),
  fields: z.array(createFieldSchema).optional(),
  sections: z.array(createSectionSchema).optional(),
});

const refineSchema = z.object({
  prompt: z.string().min(1),
  format_mode: z.string().optional(),
  risk_check: z.boolean().optional(),
  country_code: isoCountryCodeSchema.optional(),
  output_language: outputLanguageSchema.optional(),
});

const guestGenerateSchema = z.object({
  title: z.string().min(1),
  prompt: z.string().min(1),
  /** Только `system-*` id из файла каталога. */
  template_id: z
    .string()
    .optional()
    .refine((v) => !v || isSystemTemplateId(v), 'Guests may only use system templates'),
  risk_check: z.boolean().optional(),
  country_code: isoCountryCodeSchema.optional(),
  output_language: outputLanguageSchema.optional(),
  fields: z.array(createFieldSchema).optional(),
  sections: z.array(createSectionSchema).optional(),
});

const guestExportSchema = z.object({
  title: z.string().min(1),
  html: z.string().min(1),
});

const guestClarifySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  prompt: z.string().min(1),
  risk_check: z.boolean().optional(),
  country_code: isoCountryCodeSchema.optional(),
  output_language: outputLanguageSchema.optional(),
});

const guestImportSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  risk_assessment: z.string().nullable().optional(),
  country_code: isoCountryCodeSchema.optional(),
  output_language: outputLanguageSchema.optional(),
  fields: z.array(createFieldSchema).optional(),
  sections: z.array(createSectionSchema).optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(['draft', 'final']),
});

const docIdParamsSchema = z.object({
  id: z.string().uuid(),
});

router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  const parsedId = docIdParamsSchema.safeParse(req.params);
  if (!parsedId.success) {
    return res.status(400).json({ detail: 'Invalid document id' });
  }
  const docId = parsedId.data.id;
  const docRaw = (await prisma.document.findUnique({
    where: { id: docId },
    include: {
      template: { select: { id: true, name: true } },
      versions: { orderBy: { version: 'asc' }, include: { riskAssessment: true } },
      fields: { orderBy: [{ groupOrder: 'asc' }, { order: 'asc' }] },
      sections: { orderBy: { order: 'asc' } },
    },
  })) as DocWithRelations | null;

  if (!docRaw || docRaw.ownerId !== req.userId) {
    return res.status(404).json({ detail: 'Document not found' });
  }

  const plan = await getUserPlan(req.userId);
  const doc = pruneVersions(docRaw, plan === 'pro');

  return res.json({ document: toDocument(doc) });
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }

  const docsRaw = await prisma.document.findMany({
    where: { ownerId: req.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      template: { select: { id: true, name: true } },
      versions: { orderBy: { version: 'asc' }, include: { riskAssessment: true } },
      fields: { orderBy: [{ groupOrder: 'asc' }, { order: 'asc' }] },
      sections: { orderBy: { order: 'asc' } },
    },
  });

  const plan = await getUserPlan(req.userId);
  const allowHistory = plan === 'pro';
  const docs = docsRaw.map((d) => pruneVersions(d, allowHistory));

  return res.json({ documents: docs.map(toDocument) });
});

router.post('/guest/generate', async (req, res) => {
  const ip = getClientIp(req);
  if (!ip) {
    return res.status(400).json({ detail: 'Не удалось определить IP адрес' });
  }

  const guestActor = `ip:${ip}`;

  const skipGuestIpCap =
    env.guestContractDisableIpCap ||
    (process.env.NODE_ENV !== 'production' && isLoopbackIp(ip));

  if (!skipGuestIpCap) {
    const existing = await prisma.guestAccess.findUnique({ where: { ip } });
    if (existing) {
      return res.status(429).json({
        detail: 'Лимит бесплатного договора использован. Зарегистрируйтесь для продолжения.',
      });
    }
  }

  const parsed = guestGenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }

  const {
    title,
    prompt,
    fields: incomingFields,
    sections: incomingSections,
    template_id: guestTemplateId,
  } = parsed.data;

  let guestSystemRecord = null as ReturnType<typeof getSystemTemplateRecordById>;
  if (guestTemplateId) {
    const guestLang = siteUiLanguageFromRequest(req);
    guestSystemRecord = getSystemTemplateRecordById(guestTemplateId, guestLang);
    if (!guestSystemRecord) {
      return res.status(404).json({ detail: 'Template not found' });
    }
  }

  const guestSysDefaults = guestSystemRecord ? systemRecordDefaults(guestSystemRecord) : null;
  const promptCtx = makePromptContext(
    parsed.data.country_code ?? guestSysDefaults?.countryCode ?? null,
    parsed.data.output_language ?? guestSysDefaults?.outputLanguage ?? null,
  );

  const userPrompt = guestSystemRecord
    ? userPromptWithTemplateBase(guestSystemRecord.content, prompt)
    : prompt;

  const fieldCopies: ContractFieldDraft[] = guestSystemRecord
    ? contractFieldDraftsFromSystemRecord(guestSystemRecord)
    : [];

  const sectionCopies: ContractSectionDraft[] = guestSystemRecord
    ? contractSectionDraftsFromSystemRecord(guestSystemRecord)
    : [];

  mergeIncomingFieldsIntoDrafts(fieldCopies, incomingFields);
  mergeIncomingSectionsIntoDrafts(sectionCopies, incomingSections);

  let content: string;
  let exportTitle: string;
  let riskAssessmentText: string | null = null;

  try {
    const finalPrompt = composeContractGeneratePrompt(
      promptCtx,
      title,
      fieldCopies,
      sectionCopies,
      userPrompt,
    );
    const rawContent = await generateText(finalPrompt);
    logColumnsDebug('guest-generate raw', rawContent);

    content = sanitizeGeneratedHtml(rawContent, title);
    logColumnsDebug('guest-generate sanitized', content);
    exportTitle = extractTitleFromHtml(content, title);

    if (parsed.data.risk_check) {
      try {
        const riskPrompt = buildRiskPrompt(promptCtx, title, content);
        riskAssessmentText = (await generateText(riskPrompt)).trim();
      } catch (error) {
        logContractPipelineError('guest-generate', guestActor, '09_risk_assessment', error);
      }
    }
  } catch (error) {
    logContractPipelineError('guest-generate', guestActor, 'llm_or_sanitize', error);
    return res.status(500).json({ detail: 'Не удалось сгенерировать договор' });
  }

  if (!skipGuestIpCap) {
    try {
      await prisma.guestAccess.create({
        data: {
          ip,
          userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
        },
      });
    } catch (error: unknown) {
      const maybePrismaError = error as { code?: string };
      if (maybePrismaError?.code === 'P2002') {
        return res.status(429).json({
          detail: 'Лимит бесплатного договора использован. Зарегистрируйтесь для продолжения.',
        });
      }
      logContractPipelineError('guest-generate', guestActor, '11_guest_access_create', error);
      return res.status(500).json({ detail: 'Не удалось зафиксировать попытку' });
    }
  }

  return res.json({ content, title: exportTitle, risk_assessment: riskAssessmentText });
});

router.post('/guest/export/:fmt', async (req, res) => {
  const fmt = String(req.params.fmt);
  if (!['docx', 'pdf'].includes(fmt)) {
    return res.status(400).json({ detail: 'Unsupported format' });
  }

  const parsed = guestExportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }

  const { html, title } = parsed.data;
  const exportTitle = extractTitleFromHtml(html, title);

  try {
    const { exportToDocx, exportToPdf } = await import('../lib/export');

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    const safeName = sanitizeFilename(exportTitle);

    if (fmt === 'docx') {
      buffer = await exportToDocx(html, exportTitle);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      filename = `${safeName}.docx`;
    } else {
      buffer = await exportToPdf(html, exportTitle);
      contentType = 'application/pdf';
      filename = `${safeName}.pdf`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (error) {
    console.error('Guest export error:', error);
    return res.status(500).json({ detail: 'Failed to export document' });
  }
});

router.post('/guest/clarify', async (req, res) => {
  const parsed = guestClarifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }

  const { title, content: baseContent, prompt, risk_check } = parsed.data;
  const clarifyCtx = makePromptContext(
    parsed.data.country_code ?? null,
    parsed.data.output_language ?? null,
  );
  const refinePrompt = buildRefinePrompt(clarifyCtx, baseContent, prompt);

  const rawContent = await generateText(refinePrompt);
  logColumnsDebug('guest-clarify raw', rawContent);
  const updatedContent = sanitizeGeneratedHtml(rawContent, title);
  logColumnsDebug('guest-clarify sanitized', updatedContent);

  let riskAssessmentText: string | null = null;
  if (risk_check) {
    try {
      const riskPrompt = buildRiskPrompt(clarifyCtx, title, updatedContent);
      riskAssessmentText = (await generateText(riskPrompt)).trim();
    } catch (error) {
      console.error('Guest clarify risk assessment failed:', error);
    }
  }

  return res.json({
    content: updatedContent,
    risk_assessment: riskAssessmentText,
  });
});

router.post('/guest/import', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }

  const impActor = req.userId;

  const parsed = guestImportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }

  const limitCheck = await checkContractLimit(req.userId);
  if (!limitCheck.allowed) {
    return res.status(402).json({
      detail: 'Достигнут лимит договоров на этот месяц',
      code: 'LIMIT_REACHED',
      limit_type: 'contracts',
      current_usage: limitCheck.currentUsage,
      limit: limitCheck.limit,
      upgrade_options: limitCheck.upgradeOptions,
      single_contract_price: SINGLE_CONTRACT_PRICE,
      single_contract_prices_by_currency: singleContractPricesToApi(),
    });
  }

  const {
    title,
    content,
    fields: incomingFields,
    sections: incomingSections,
    risk_assessment,
  } = parsed.data;

  const fieldCopies: ContractFieldDraft[] = [];
  if (incomingFields && incomingFields.length) {
    for (const [idx, field] of incomingFields.entries()) {
      fieldCopies.push({
        templateFieldId: field.template_field_id,
        groupLabel: field.group_label,
        groupOrder: field.group_order ?? idx,
        label: field.label,
        key: field.key,
        value: field.value ?? '',
        order: field.order ?? idx,
      });
    }
  }

  const sectionCopies: ContractSectionDraft[] = [];
  if (incomingSections && incomingSections.length) {
    for (const [idx, section] of incomingSections.entries()) {
      sectionCopies.push({
        templateSectionId: section.template_section_id,
        title: section.title,
        order: section.order ?? idx,
      });
    }
  }

  try {
    const sanitizedContent = sanitizeGeneratedHtml(content, title);
    const importCountry = normalizeCountryCode(parsed.data.country_code ?? null);
    const importLang = normalizeOutputLanguage(parsed.data.output_language ?? null);

    const document = await prisma.document.create({
      data: {
        title,
        ownerId: req.userId,
        jurisdictionCountry: importCountry,
        outputLanguage: importLang,
        status: 'draft',
        versions: {
          create: {
            version: 1,
            content: sanitizedContent,
            riskAssessment: risk_assessment
              ? {
                  create: { summary: risk_assessment },
                }
              : undefined,
          },
        },
        fields: fieldCopies.length
          ? {
              create: fieldCopies,
            }
          : undefined,
        sections: sectionCopies.length
          ? {
              create: sectionCopies,
            }
          : undefined,
      },
      include: {
        template: { select: { id: true, name: true } },
        versions: { include: { riskAssessment: true } },
        fields: true,
        sections: true,
      },
    });

    await incrementContractUsage(req.userId);
    return res.json({ document: toDocument(document) });
  } catch (error) {
    logContractPipelineError('guest-import', impActor, 'pipeline', error);
    return res.status(500).json({ detail: 'Не удалось импортировать договор' });
  }
});

router.post('/generate', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }

  const genActor = req.userId;

  // Check contract limit
  const limitCheck = await checkContractLimit(req.userId);
  if (!limitCheck.allowed) {
    return res.status(402).json({
      detail: 'Достигнут лимит договоров на этот месяц',
      code: 'LIMIT_REACHED',
      limit_type: 'contracts',
      current_usage: limitCheck.currentUsage,
      limit: limitCheck.limit,
      upgrade_options: limitCheck.upgradeOptions,
      single_contract_price: SINGLE_CONTRACT_PRICE,
      single_contract_prices_by_currency: singleContractPricesToApi(),
    });
  }

  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }
  const {
    title,
    prompt,
    template_id,
    fields: incomingFields,
    sections: incomingSections,
  } = parsed.data;

  // Check feature access for sections
  const hasSectionsAccess = await checkFeatureAccess(req.userId, 'sections');
  const hasRiskCheckAccess = await checkFeatureAccess(req.userId, 'riskCheck');

  let prismaTemplate: TemplateWithFields | null = null;
  let systemRecord = null as ReturnType<typeof getSystemTemplateRecordById>;

  if (template_id) {
    if (isSystemTemplateId(template_id)) {
      const genLang = siteUiLanguageFromRequest(req);
      systemRecord = getSystemTemplateRecordById(template_id, genLang);
      if (!systemRecord) {
        return res.status(404).json({ detail: 'Template not found' });
      }
    } else if (z.string().uuid().safeParse(template_id).success) {
      prismaTemplate = await prisma.template.findFirst({
        where: { id: template_id, createdById: req.userId, isActive: true },
        include: {
          groups: { include: { fields: true }, orderBy: { order: 'asc' } },
          sections: { orderBy: { order: 'asc' } },
        },
      });
      if (!prismaTemplate) {
        return res.status(404).json({ detail: 'Template not found' });
      }
    } else {
      return res.status(400).json({ detail: 'Invalid template_id' });
    }
  }

  const userPrompt =
    prismaTemplate != null
      ? `${prismaTemplate.content}\n\n${prompt}`
      : systemRecord != null
        ? userPromptWithTemplateBase(systemRecord.content, prompt)
        : prompt;

  const sysDefaults = systemRecord ? systemRecordDefaults(systemRecord) : null;
  const promptCtx = makePromptContext(
    parsed.data.country_code ??
      prismaTemplate?.defaultCountryCode ??
      sysDefaults?.countryCode ??
      null,
    parsed.data.output_language ?? sysDefaults?.outputLanguage ?? null,
  );

  const fieldCopies: ContractFieldDraft[] = prismaTemplate
    ? contractFieldsFromTemplate(prismaTemplate)
    : systemRecord
      ? contractFieldDraftsFromSystemRecord(systemRecord)
      : [];

  const sectionCopies: ContractSectionDraft[] =
    hasSectionsAccess && prismaTemplate
      ? contractSectionsFromTemplate(prismaTemplate)
      : hasSectionsAccess && systemRecord
        ? contractSectionDraftsFromSystemRecord(systemRecord)
        : [];

  mergeIncomingFieldsIntoDrafts(fieldCopies, incomingFields);
  mergeIncomingSectionsIntoDrafts(sectionCopies, hasSectionsAccess ? incomingSections : undefined);

  const sectionsSource = sectionCopies;

  try {
    const finalPrompt = composeContractGeneratePrompt(
      promptCtx,
      title,
      fieldCopies,
      sectionsSource,
      userPrompt,
    );
    const rawContent = await generateText(finalPrompt);
    logColumnsDebug('contract-generate raw', rawContent);

    const content = sanitizeGeneratedHtml(rawContent, title);
    logColumnsDebug('contract-generate sanitized', content);

    let riskAssessmentText: string | null = null;

    if (hasRiskCheckAccess && parsed.data.risk_check) {
      try {
        const riskPrompt = buildRiskPrompt(promptCtx, title, content);
        riskAssessmentText = (await generateText(riskPrompt)).trim();
      } catch (error) {
        logContractPipelineError('generate', genActor, '11_risk_assessment', error);
      }
    }

    const document = await prisma.document.create({
      data: {
        title,
        ownerId: req.userId,
        templateId: prismaTemplate?.id ?? null,
        jurisdictionCountry: promptCtx.countryCode,
        outputLanguage: promptCtx.outputLanguage,
        status: 'draft',
        versions: {
          create: {
            version: 1,
            content,
            riskAssessment: riskAssessmentText
              ? {
                  create: {
                    summary: riskAssessmentText,
                  },
                }
              : undefined,
          },
        },
        fields: fieldCopies.length
          ? {
              create: fieldCopies.map((f) => ({
                groupLabel: f.groupLabel,
                groupOrder: f.groupOrder,
                label: f.label,
                key: f.key,
                value: f.value,
                order: f.order,
                templateFieldId: prismaTemplate ? f.templateFieldId ?? null : null,
              })),
            }
          : undefined,
        sections: sectionsSource.length
          ? {
              create: sectionsSource.map((s) => ({
                title: s.title,
                order: s.order,
                templateSectionId: prismaTemplate ? s.templateSectionId ?? null : null,
              })),
            }
          : undefined,
      },
      include: {
        template: { select: { id: true, name: true } },
        versions: { include: { riskAssessment: true } },
        fields: true,
        sections: true,
      },
    });

    await incrementContractUsage(req.userId);

    return res.json({ document: toDocument(document) });
  } catch (error) {
    logContractPipelineError('generate', genActor, 'pipeline', error);
    return res.status(500).json({ detail: 'Не удалось создать договор' });
  }
});

router.post('/:id/refine', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }

  const hasRiskCheckAccess = await checkFeatureAccess(req.userId, 'riskCheck');

  const parsed = refineSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }
  const parsedId = docIdParamsSchema.safeParse(req.params);
  if (!parsedId.success) {
    return res.status(400).json({ detail: 'Invalid document id' });
  }
  const docId = parsedId.data.id;
  const doc = (await prisma.document.findUnique({
    where: { id: docId },
    include: {
      template: { select: { id: true, name: true } },
      versions: { orderBy: { version: 'asc' }, include: { riskAssessment: true } },
      fields: true,
      sections: true,
    },
  })) as DocWithRelations | null;
  if (!doc || doc.ownerId !== req.userId) {
    return res.status(404).json({ detail: 'Document not found' });
  }
  // Check AI clarification limit (per document)
  const limitCheck = await checkClarificationLimit(req.userId, doc.id);
  if (!limitCheck.allowed) {
    return res.status(402).json({
      detail: 'Достигнут лимит документов с уточнениями от нейросети на этот месяц',
      code: 'LIMIT_REACHED',
      limit_type: 'clarifications',
      current_usage: limitCheck.currentUsage,
      limit: limitCheck.limit,
      upgrade_options: limitCheck.upgradeOptions,
    });
  }
  const nextVersion = (doc.versions?.reduce((m, v) => Math.max(m, v.version), 0) || 0) + 1;
  const baseContent = doc.versions?.[doc.versions.length - 1]?.content || '';
  const storedCountry =
    'jurisdictionCountry' in doc && typeof doc.jurisdictionCountry === 'string'
      ? doc.jurisdictionCountry
      : 'RU';
  const storedLang =
    'outputLanguage' in doc && typeof doc.outputLanguage === 'string'
      ? doc.outputLanguage
      : 'ru';
  const nextCountry =
    parsed.data.country_code !== undefined
      ? normalizeCountryCode(parsed.data.country_code)
      : normalizeCountryCode(storedCountry);
  const nextLang =
    parsed.data.output_language !== undefined
      ? normalizeOutputLanguage(parsed.data.output_language)
      : normalizeOutputLanguage(storedLang);
  const refineCtx = makePromptContext(nextCountry, nextLang);
  const refinePrompt = buildRefinePrompt(refineCtx, baseContent, parsed.data.prompt);

  const rawContent = await generateText(refinePrompt);
  logColumnsDebug('contract-clarify raw', rawContent);
  const content = sanitizeGeneratedHtml(rawContent, doc.title);
  logColumnsDebug('contract-clarify sanitized', content);
  let riskAssessmentText: string | null = null;

  if (hasRiskCheckAccess && parsed.data.risk_check) {
    try {
      const riskPrompt = buildRiskPrompt(refineCtx, doc.title, content);
      riskAssessmentText = (await generateText(riskPrompt)).trim();
    } catch (error) {
      console.error('Risk assessment generation failed (refine):', error);
    }
  }
  const updated = (await prisma.document.update({
    where: { id: doc.id },
    data: {
      jurisdictionCountry: nextCountry,
      outputLanguage: nextLang,
      versions: {
        create: {
          version: nextVersion,
          content,
          riskAssessment: riskAssessmentText
            ? {
                create: {
                  summary: riskAssessmentText,
                },
              }
            : undefined,
        },
      },
    },
    include: {
      template: { select: { id: true, name: true } },
      versions: { include: { riskAssessment: true } },
    },
  })) as DocWithRelations;

  // Increment clarification usage counter
  await incrementClarificationUsage(req.userId, doc.id);

  return res.json({ document: toDocument(updated) });
});

router.put('/:id/fields', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  const parsed = updateFieldsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }

  const parsedId = docIdParamsSchema.safeParse(req.params);
  if (!parsedId.success) {
    return res.status(400).json({ detail: 'Invalid document id' });
  }
  const docId = parsedId.data.id;
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc || doc.ownerId !== req.userId) {
    return res.status(404).json({ detail: 'Document not found' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const field of parsed.data.fields) {
        const data = {
          templateFieldId: field.template_field_id,
          groupLabel: field.group_label,
          groupOrder: field.group_order ?? 0,
          label: field.label,
          key: field.key,
          value: field.value ?? '',
          order: field.order ?? 0,
        };

        if (field.id) {
          await tx.contractField.update({
            where: { id: field.id },
            data,
          });
        } else {
          await tx.contractField.upsert({
            where: { documentId_key: { documentId: doc.id, key: field.key } },
            update: data,
            create: {
              ...data,
              documentId: doc.id,
            },
          });
        }
      }
    });

    const updated = (await prisma.document.findUnique({
      where: { id: docId },
      include: {
        template: { select: { id: true, name: true } },
        versions: { orderBy: { version: 'desc' }, include: { riskAssessment: true } },
        fields: { orderBy: [{ groupOrder: 'asc' }, { order: 'asc' }] },
      },
    })) as DocWithRelations | null;

    return res.json({ document: updated ? toDocument(updated) : null });
  } catch (error) {
    console.error('Update contract fields error:', error);
    return res.status(500).json({ detail: 'Failed to update fields' });
  }
});

router.put('/:id/sections', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  const parsed = updateSectionsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }

  const parsedId = docIdParamsSchema.safeParse(req.params);
  if (!parsedId.success) {
    return res.status(400).json({ detail: 'Invalid document id' });
  }
  const docId = parsedId.data.id;
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc || doc.ownerId !== req.userId) {
    return res.status(404).json({ detail: 'Document not found' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.contractSection.deleteMany({ where: { documentId: doc.id } });
      await tx.contractSection.createMany({
        data: parsed.data.sections.map((s, idx) => ({
          documentId: doc.id,
          templateSectionId: s.template_section_id,
          title: s.title,
          order: s.order ?? idx,
        })),
      });
    });

    const updated = (await prisma.document.findUnique({
      where: { id: docId },
      include: {
        template: { select: { id: true, name: true } },
        versions: { orderBy: { version: 'asc' }, include: { riskAssessment: true } },
        fields: { orderBy: [{ groupOrder: 'asc' }, { order: 'asc' }] },
        sections: { orderBy: { order: 'asc' } },
      },
    })) as DocWithRelations | null;

    return res.json({ document: updated ? toDocument(updated) : null });
  } catch (error) {
    console.error('Update contract sections error:', error);
    return res.status(500).json({ detail: 'Failed to update sections' });
  }
});

const updateContentSchema = z.object({
  content: z.string().min(1, 'content is required'),
});

router.patch('/:id/content', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }

  const parsedId = docIdParamsSchema.safeParse(req.params);
  if (!parsedId.success) {
    return res.status(400).json({ detail: 'Invalid document id' });
  }

  const parsedBody = updateContentSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ detail: parsedBody.error.flatten() });
  }

  const docId = parsedId.data.id;
  const doc = (await prisma.document.findUnique({
    where: { id: docId },
    include: {
      versions: { orderBy: { version: 'asc' }, include: { riskAssessment: true } },
    },
  })) as DocWithVersions | null;

  if (!doc || doc.ownerId !== req.userId) {
    return res.status(404).json({ detail: 'Document not found' });
  }

  const latestVersion = doc.versions?.[doc.versions.length - 1];
  if (!latestVersion) {
    return res.status(400).json({ detail: 'Document has no versions to update' });
  }

  const sanitizedContent = sanitizeGeneratedHtml(parsedBody.data.content, doc.title);
  const extractedTitle = extractTitleFromHtml(sanitizedContent, doc.title);

  const updated = (await prisma.$transaction(async (tx) => {
    await tx.document.update({
      where: { id: doc.id },
      data: {
        title: extractedTitle,
      },
    });

    await tx.documentVersion.update({
      where: { id: latestVersion.id },
      data: {
        content: sanitizedContent,
        updatedAt: new Date(),
      },
    });

    return (await tx.document.findUnique({
      where: { id: doc.id },
      include: {
        template: { select: { id: true, name: true } },
        versions: { orderBy: { version: 'asc' }, include: { riskAssessment: true } },
        fields: true,
        sections: true,
      },
    })) as DocWithRelations | null;
  })) as DocWithRelations | null;

  if (!updated) {
    return res.status(500).json({ detail: 'Failed to update document' });
  }

  return res.json({ document: toDocument(updated) });
});

router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }

  const schema = z.object({ title: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }

  const parsedId = docIdParamsSchema.safeParse(req.params);
  if (!parsedId.success) {
    return res.status(400).json({ detail: 'Invalid document id' });
  }
  const docId = parsedId.data.id;
  const existing = await prisma.document.findUnique({ where: { id: docId } });
  if (!existing || existing.ownerId !== req.userId) {
    return res.status(404).json({ detail: 'Document not found' });
  }

  const updated = (await prisma.document.update({
    where: { id: docId },
    data: { title: parsed.data.title },
    include: {
      template: { select: { id: true, name: true } },
      versions: { orderBy: { version: 'asc' }, include: { riskAssessment: true } },
      fields: { orderBy: [{ groupOrder: 'asc' }, { order: 'asc' }] },
      sections: { orderBy: { order: 'asc' } },
    },
  })) as DocWithRelations;

  return res.json({ document: toDocument(updated) });
});

router.patch('/:id/status', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }

  // Check status update access
  const hasStatusAccess = await checkFeatureAccess(req.userId, 'statuses');
  if (!hasStatusAccess) {
    return res.status(403).json({
      detail: 'Изменение статуса договора доступно на тарифах Basic и выше',
      code: 'FEATURE_RESTRICTED',
      feature: 'statuses',
    });
  }

  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }

  const parsedId = docIdParamsSchema.safeParse(req.params);
  if (!parsedId.success) {
    return res.status(400).json({ detail: 'Invalid document id' });
  }
  const docId = parsedId.data.id;
  const existing = await prisma.document.findUnique({ where: { id: docId } });
  if (!existing || existing.ownerId !== req.userId) {
    return res.status(404).json({ detail: 'Document not found' });
  }

  const updated = (await prisma.document.update({
    where: { id: docId },
    data: { status: parsed.data.status },
    include: {
      template: { select: { id: true, name: true } },
      versions: { orderBy: { version: 'asc' }, include: { riskAssessment: true } },
      fields: { orderBy: [{ groupOrder: 'asc' }, { order: 'asc' }] },
      sections: { orderBy: { order: 'asc' } },
    },
  })) as DocWithRelations;

  return res.json({ document: toDocument(updated) });
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  const parsedId = docIdParamsSchema.safeParse(req.params);
  if (!parsedId.success) {
    return res.status(400).json({ detail: 'Invalid document id' });
  }
  const docId = parsedId.data.id;
  const existing = await prisma.document.findUnique({ where: { id: docId } });
  if (!existing || existing.ownerId !== req.userId) {
    return res.status(404).json({ detail: 'Document not found' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.contractField.deleteMany({ where: { documentId: docId } });
      await tx.contractSection.deleteMany({ where: { documentId: docId } });
      await tx.documentVersion.deleteMany({ where: { documentId: docId } });
      await tx.document.delete({ where: { id: docId } });
    });
    return res.status(204).send();
  } catch (error: unknown) {
    console.error('Delete document error:', error);
    const maybePrismaError = error as { code?: string };
    if (maybePrismaError?.code === 'P2003') {
      return res.status(409).json({ detail: 'Cannot delete document due to linked records' });
    }
    return res.status(500).json({ detail: 'Failed to delete document' });
  }
});

router.post('/:id/export/:fmt', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  const fmt = String(req.params.fmt);
  const parsedId = docIdParamsSchema.safeParse(req.params);
  if (!parsedId.success) {
    return res.status(400).json({ detail: 'Invalid document id' });
  }
  const docId = parsedId.data.id;
  if (!['docx', 'pdf'].includes(fmt)) {
    return res.status(400).json({ detail: 'Unsupported format' });
  }

  // Check DOCX export access
  if (fmt === 'docx') {
    const hasDocxAccess = await checkFeatureAccess(req.userId, 'docxExport');
    if (!hasDocxAccess) {
      return res.status(403).json({
        detail: 'Экспорт в DOCX доступен на тарифах Basic и выше',
        code: 'FEATURE_RESTRICTED',
        feature: 'docxExport',
      });
    }
  }

  const doc = (await prisma.document.findUnique({
    where: { id: docId },
    include: {
      versions: { orderBy: { version: 'desc' }, take: 1, include: { riskAssessment: true } },
    },
  })) as DocWithVersions | null;
  if (!doc || doc.ownerId !== req.userId) {
    return res.status(404).json({ detail: 'Document not found' });
  }

  const content = doc.versions[0]?.content || '';
  const exportTitle = extractTitleFromHtml(content, doc.title);

  try {
    // Динамический импорт для избежания проблем с ESM
    const { exportToDocx, exportToPdf } = await import('../lib/export');

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    const safeName = sanitizeFilename(exportTitle);

    if (fmt === 'docx') {
      buffer = await exportToDocx(content, exportTitle);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      filename = `${safeName}.docx`;
    } else {
      buffer = await exportToPdf(content, exportTitle);
      contentType = 'application/pdf';
      filename = `${safeName}.pdf`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ detail: 'Failed to export document' });
  }
});

export default router;
