import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import sanitizeHtml, { Attributes, IFrame } from 'sanitize-html';
import { prisma } from '../config/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { toDocument } from '../lib/mappers';
import { generateText } from '../lib/yandex';
import { getClientIp } from '../lib/requestIp';
import {
  checkContractLimit,
  checkClarificationLimit,
  checkFeatureAccess,
  incrementContractUsage,
  incrementClarificationUsage,
} from '../lib/limits';
import { SINGLE_CONTRACT_PRICE } from '../config/subscriptions';

const router = Router();

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

function buildFieldsPrompt(fields: ContractFieldDraft[]) {
  const grouped = fields.reduce<Array<{ label: string; order: number; fields: typeof fields }>>(
    (acc, field) => {
      const existing = acc.find((g) => g.label === field.groupLabel);
      if (existing) {
        existing.fields.push(field);
      } else {
        acc.push({ label: field.groupLabel, order: field.groupOrder ?? 0, fields: [field] });
      }
      return acc;
    },
    [],
  );

  return grouped
    .sort((a, b) => a.order - b.order)
    .map((group) => {
      const renderedFields = group.fields
        .sort((a, b) => (a.order === b.order ? 0 : a.order - b.order))
        .map((f) => `  - ${f.label}: ${f.value || '(не указано)'}`)
        .join('\n');
      return `- ${group.label}:\n${renderedFields}`;
    })
    .join('\n');
}

function buildRiskPrompt(title: string, htmlContent: string) {
  return [
    'Ты — опытный юрист, специализирующийся на анализе договоров. Твоя задача — внимательно проанализировать предоставленный договор и выявить юридические риски.',
    '',
    'Правила оформления ответа:',
    '- Отвечай исключительно на русском языке.',
    '- Не используй никакого markdown-форматирования: никаких **, *, __, #, >, кодовых блоков, таблиц или других элементов разметки.',
    '- Используй только простой текст и обычные маркированные списки с дефисом "- ".',
    '- Каждый пункт списка должен иметь строго следующий формат:',
    '  - Риск [краткое название риска]: [пояснение риска].',
    '  Рекомендация: [конкретная рекомендация по устранению или снижению риска].',
    '- Между названием риска и пояснением ставь двоеточие, после пояснения — точку.',
    '- Строка с рекомендацией начинается строго со слова "Рекомендация:" (с большой буквы и двоеточия).',
    '- Если юридических рисков не выявлено, напиши ровно одну строку: "Юридические риски не выявлены." и ничего больше.',
    '- Не добавляй вступлений, заключений, приветствий, нумерации, лишних пояснений или пересказа договора.',
    '- Ответ должен состоять только из списка рисков (или сообщения об их отсутствии).',
    '',
    `Название договора: ${title}`,
    '',
    '--- Начало текста договора (HTML) ---',
    htmlContent,
    '--- Конец текста договора ---',
  ].join('\n');
}

export function sanitizeGeneratedHtml(raw: string, title: string): string {
  let content = raw.trim();

  // Убираем обёртку ```html ... ```
  if (content.startsWith('```')) {
    content = content
      .replace(/^```[a-zA-Z]*\s*/, '')
      .replace(/```$/, '')
      .trim();
  }

  // Если модель вернула лишние бэктики в конце
  content = content.replace(/```$/, '').trim();

  // Если модель продублировала <h1> с тем же заголовком, оставим первый
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  const matches = [...content.matchAll(h1Regex)];
  if (matches.length > 1) {
    const first = matches[0][0];
    // Удаляем все последующие h1
    content = first + content.replace(first, '').replace(h1Regex, '');
  }

  // Убираем дублирование заголовка без тэгов в начале (часто модель повторяет)
  const escapedTitle = escapeRegExp(title.trim());
  const textOnly = content.replace(/<[^>]+>/g, '').trim();
  const repeatedPlain = new RegExp(`^(${escapedTitle}\\s*){2,}`, 'i');
  if (repeatedPlain.test(textOnly)) {
    content = content.replace(new RegExp(`^(\\s*${escapedTitle}\\s*)+`, 'i'), `${title.trim()}\n`);
  }

  // Если сразу после h1 идёт тот же заголовок текстом — уберём дубль
  content = content.replace(new RegExp(`</h1>\\s*${escapedTitle}`, 'i'), '</h1>');

  // Убираем параграф сразу после заголовка, если он повторяет название
  content = content.replace(new RegExp(`</h1>\\s*<p>\\s*${escapedTitle}\\s*</p>`, 'i'), '</h1>');

  // Удаляем явный дубликат названия на первой строке без тегов
  content = content.replace(new RegExp(`^\\s*${escapedTitle}\\s*\\n`, 'i'), '');

  // Нормализуем первый <h1>: если он есть — переписываем текст на точное название договора
  content = content.replace(/<title[^>]*>[\s\S]*?<\/title>/i, '');

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
      '*': ['class'],
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
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

// function buildInstruction(title: string) {
//   return [
//     'Сгенерируй полноценный юридический договор на русском языке в формате валидного HTML.',
//     'Верни СТРОГО только HTML-контент, без пояснений, комментариев, Markdown и вводных фраз.',
//     'HTML должен быть самодостаточным и готовым к встраиванию на сайт или в документ.',
//     'Структура документа:',
//     '- <h1> — название договора;',
//     '- <h2> — разделы;',
//     '- <p> — текст пунктов;',
//     '- <ul>/<li> — перечисления (если уместно).',
//     'Обязательные разделы договора:',
//     '1. Преамбула;',
//     '2. Предмет договора;',
//     '3. Права и обязанности сторон;',
//     '4. Ответственность сторон;',
//     '5. Срок действия и порядок расторжения;',
//     '6. Конфиденциальность;',
//     '7. Урегулирование споров;',
//     '8. Заключительные положения;',
//     '9. Подписи сторон.',
//     'Стиль изложения: официальный, юридически нейтральный, без эмоциональных оценок.',
//     'Используй формулировки, характерные для типовых гражданско-правовых договоров РФ.',
//     'Избегай двусмысленностей, разговорных выражений и воды.',
//     'При необходимости используй нумерацию пунктов внутри разделов.',
//     'Если данные сторон не указаны — используй нейтральные плейсхолдеры (например, «Заказчик», «Исполнитель»).',
//     // `Название договора: ${title}`,
//   ].join('\n');
// }

function buildInstruction(title: string) {
  void title;
  return [
    'Сгенерируй полноценный юридический договор на русском языке в формате валидного HTML.',
    'Верни СТРОГО только HTML-контент, без пояснений, комментариев, Markdown и вводных фраз.',
    'HTML должен быть самодостаточным и готовым к встраиванию на сайт или в документ (включая минимальный <!DOCTYPE html>, <html>, <head> с <meta charset="utf-8"> и <body>).',
    'Структура документа:',
    '- <h1> — полное название договора (определи его самостоятельно на основе сути запроса, например, «Договор оказания услуг», «Договор купли-продажи» и т.д.);',
    '- <h2> — заголовки разделов;',
    '- <p> — текст пунктов;',
    '- <ol> или <ul> с <li> — нумерованные или маркированные перечисления (используй по смыслу);',
    '- при необходимости — вложенная нумерация пунктов внутри разделов (например, 1.1, 1.2).',
    'Требования к содержанию:',
    '- Определи тип договора на основе запроса пользователя и самостоятельно подбери подходящую структуру и набор разделов, характерных для данного вида гражданско-правовых договоров в РФ.',
    '- Обязательно включи ключевые разделы, типичные для большинства договоров: Преамбула, Предмет договора, Права и обязанности сторон, Ответственность сторон, Срок действия и порядок расторжения, Урегулирование споров, Заключительные положения, Реквизиты и подписи сторон.',
    '- Добавляй дополнительные разделы, если они уместны для данного типа договора (например, «Порядок расчетов», «Гарантии», «Форс-мажор», «Интеллектуальная собственность», «Конфиденциальность» и т.д.).',
    '- Удаляй или не включай разделы, которые явно не нужны для данного вида договора.',
    '- Если тип договора предполагает специфические роли сторон, используй соответствующие плейсхолдеры: «Заказчик» и «Исполнитель» — для услуг, «Продавец» и «Покупатель» — для купли-продажи, «Арендодатель» и «Арендатор» — для аренды и т.д. При отсутствии конкретики используй нейтральные «Сторона 1» и «Сторона 2» или наиболее подходящие по контексту.',
    'Стиль изложения: строго официальный, юридически точный и нейтральный, без эмоциональной окраски, разговорных выражений и избыточной «воды».',
    'Используй формулировки, характерные для типовых договоров российского гражданского права (ссылки на ГК РФ при необходимости).',
    'Обеспечь отсутствие двусмысленностей и логическую последовательность положений.',
  ].join('\n');
}

function buildSectionsPrompt(title: string, sectionsSource: ContractSectionDraft[]) {
  return sectionsSource.length > 0
    ? `Структура разделов (сохрани указанный порядок и названия разделов, при необходимости дополни 1–3 логичными разделами, которые обычно присутствуют в договорах данного типа):\n${sectionsSource
        .sort((a, b) => a.order - b.order)
        .map((s, idx) => `${idx + 1}. ${s.title}`)
        .join('\n')}`
    : `Самостоятельно сформируй оптимальную, максимально полную и соответствующую современной российской договорной практике (2024–2026 гг.) структуру разделов для договора.

Требования к структуре и содержанию:
• Определи состав, последовательность и глубину разделов, исходя из:
  - сути регулируемых гражданско-правовых отношений,
  - положений Гражданского кодекса РФ (особенной части),
  - специального законодательства (если применимо к данному виду договора),
  - сложившейся договорной и судебной практики 2024–2026 годов,
  - типичных рисков, интересов и потребностей сторон именно для данного вида договора.
• Не используй упрощённые, шаблонные или усечённые перечни разделов.
• Каждый раздел должен быть детализированным, содержать все логически необходимые подразделы (нумерация 1.1., 1.2., 1.2.1. и т.д.) и исключать двусмысленности.
• Не оставляй разделы пустыми или состоящими из 1–2 общих фраз — каждый пункт должен нести конкретную юридическую нагрузку и минимизировать риски сторон.
• Обязательно включи:
  - Преамбулу (с датой заключения в формате ««___» _________ 20__ г.», полные реквизиты сторон с плейсхолдерами: наименование, ИНН, ОГРН, адрес, в лице ___________, действующего на основании ___________),
  - Финальный раздел «Реквизиты и подписи сторон» (или аналогичное название).
• В разделе с подписями сторон обязательно предусмотри чётко оформленные поля:
  - дата (««___» _________ 20__ г.»),
  - строки для ФИО, должности (при наличии), собственноручной подписи каждой стороны,
  - расшифровки подписей под линиями,
  - место для оттиска печати (при необходимости).
• Используй тег <h2> для названий основных разделов, нумеруй их арабскими цифрами (1., 2., …).
• Подразделы внутри разделов нумеруй последовательно (1.1., 1.2., 1.2.1. и т.д.).
• Порядок разделов должен быть логичным, последовательным и удобным для восприятия сторонами и в случае судебного разбирательства.

Генерируй структуру, максимально соответствующую качественным гражданско-правовым договорам, используемым в российском деловом обороте на текущий момент.`;
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
  template_id: z.string().uuid().optional(),
  prompt: z.string().min(1),
  format_mode: z.string().optional(),
  risk_check: z.boolean().optional(),
  fields: z.array(createFieldSchema).optional(),
  sections: z.array(createSectionSchema).optional(),
});

const refineSchema = z.object({
  prompt: z.string().min(1),
  format_mode: z.string().optional(),
  risk_check: z.boolean().optional(),
});

const guestGenerateSchema = z.object({
  title: z.string().min(1),
  prompt: z.string().min(1),
  risk_check: z.boolean().optional(),
  fields: z.array(createFieldSchema).optional(),
  sections: z.array(createSectionSchema).optional(),
});

const guestExportSchema = z.object({
  title: z.string().min(1),
  html: z.string().min(1),
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
  const doc = (await prisma.document.findUnique({
    where: { id: docId },
    include: {
      template: { select: { id: true, name: true } },
      versions: { orderBy: { version: 'asc' }, include: { riskAssessment: true } },
      fields: { orderBy: [{ groupOrder: 'asc' }, { order: 'asc' }] },
      sections: { orderBy: { order: 'asc' } },
    },
  })) as DocWithRelations | null;

  if (!doc || doc.ownerId !== req.userId) {
    return res.status(404).json({ detail: 'Document not found' });
  }

  return res.json({ document: toDocument(doc) });
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }

  const docs = await prisma.document.findMany({
    where: { ownerId: req.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      template: { select: { id: true, name: true } },
      versions: { orderBy: { version: 'asc' }, include: { riskAssessment: true } },
      fields: { orderBy: [{ groupOrder: 'asc' }, { order: 'asc' }] },
      sections: { orderBy: { order: 'asc' } },
    },
  });

  return res.json({ documents: docs.map(toDocument) });
});

router.post('/guest/generate', async (req, res) => {
  const ip = getClientIp(req);
  if (!ip) {
    return res.status(400).json({ detail: 'Не удалось определить IP адрес' });
  }

  const existing = await prisma.guestAccess.findUnique({ where: { ip } });
  if (existing) {
    return res.status(429).json({
      detail: 'Лимит бесплатного договора использован. Зарегистрируйтесь для продолжения.',
    });
  }

  const parsed = guestGenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }

  const { title, prompt, fields: incomingFields, sections: incomingSections } = parsed.data;

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

  const instruction = buildInstruction(title);
  const fieldsPrompt = fieldCopies.length ? buildFieldsPrompt(fieldCopies) : '';
  const sectionsPrompt = buildSectionsPrompt(title, sectionCopies);

  const finalPrompt = [
    instruction,
    fieldsPrompt ? `Структурированные поля:\n${fieldsPrompt}` : null,
    sectionsPrompt,
    `Дополнительные требования:\n${prompt}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const rawContent = await generateText(finalPrompt);
  const content = sanitizeGeneratedHtml(rawContent, title);
  const exportTitle = extractTitleFromHtml(content, title);
  let riskAssessmentText: string | null = null;

  if (parsed.data.risk_check) {
    try {
      const riskPrompt = buildRiskPrompt(title, content);
      riskAssessmentText = (await generateText(riskPrompt)).trim();
    } catch (error) {
      console.error('Guest risk assessment generation failed:', error);
    }
  }

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
    console.error('Guest access create error:', error);
    return res.status(500).json({ detail: 'Не удалось зафиксировать попытку' });
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

router.post('/generate', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }

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

  const template = template_id
    ? await prisma.template.findFirst({
        where: { id: template_id, createdById: req.userId, isActive: true },
        include: {
          groups: { include: { fields: true }, orderBy: { order: 'asc' } },
          sections: { orderBy: { order: 'asc' } },
        },
      })
    : null;

  if (template_id && !template) {
    return res.status(404).json({ detail: 'Template not found' });
  }

  const userPrompt = template ? `${template.content}\n\n${prompt}` : prompt;
  const instruction = buildInstruction(title);

  const fieldCopies: ContractFieldDraft[] = template ? contractFieldsFromTemplate(template) : [];
  // Only allow sections if user has access
  const sectionCopies: ContractSectionDraft[] =
    hasSectionsAccess && template ? contractSectionsFromTemplate(template) : [];

  if (incomingFields && incomingFields.length) {
    for (const [idx, field] of incomingFields.entries()) {
      const existingIdx = fieldCopies.findIndex(
        (f) =>
          (field.template_field_id && f.templateFieldId === field.template_field_id) ||
          f.key === field.key,
      );

      const normalized = {
        templateFieldId: field.template_field_id,
        groupLabel: field.group_label,
        groupOrder: field.group_order ?? idx,
        label: field.label,
        key: field.key,
        value: field.value ?? '',
        order: field.order ?? idx,
      };

      if (existingIdx >= 0) {
        fieldCopies[existingIdx] = { ...fieldCopies[existingIdx], ...normalized };
      } else {
        fieldCopies.push(normalized);
      }
    }
  }

  // Only process incoming sections if user has access
  if (hasSectionsAccess && incomingSections && incomingSections.length) {
    for (const [idx, section] of incomingSections.entries()) {
      const existingIdx = sectionCopies.findIndex(
        (s) =>
          (section.template_section_id && s.templateSectionId === section.template_section_id) ||
          s.title === section.title,
      );
      const normalized = {
        templateSectionId: section.template_section_id,
        title: section.title,
        order: section.order ?? idx,
      };
      if (existingIdx >= 0) {
        sectionCopies[existingIdx] = { ...sectionCopies[existingIdx], ...normalized };
      } else {
        sectionCopies.push(normalized);
      }
    }
  }

  const fieldsPrompt = fieldCopies.length ? buildFieldsPrompt(fieldCopies) : '';
  const sectionsSource = sectionCopies;
  const sectionsPrompt = buildSectionsPrompt(title, sectionsSource);

  const finalPrompt = [
    instruction,
    fieldsPrompt ? `Структурированные поля:\n${fieldsPrompt}` : null,
    sectionsPrompt,
    `Дополнительные требования:\n${userPrompt}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const rawContent = await generateText(finalPrompt);
  const content = sanitizeGeneratedHtml(rawContent, title);
  let riskAssessmentText: string | null = null;

  if (hasRiskCheckAccess && parsed.data.risk_check) {
    try {
      const riskPrompt = buildRiskPrompt(title, content);
      riskAssessmentText = (await generateText(riskPrompt)).trim();
    } catch (error) {
      console.error('Risk assessment generation failed:', error);
    }
  }

  const document = await prisma.document.create({
    data: {
      title,
      ownerId: req.userId,
      templateId: template?.id,
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
            create: fieldCopies,
          }
        : undefined,
      sections: sectionsSource.length
        ? {
            create: sectionsSource,
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

  // Increment contract usage counter
  await incrementContractUsage(req.userId);

  return res.json({ document: toDocument(document) });
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
  const refinePrompt = [
    'Ты редактор юридических договоров.',
    'На входе HTML договора; верни только обновлённый HTML без пояснений.',
    'Сохрани структуру и стили: заголовки h1/h2, параграфы p, списки ul/li, выделения strong/em.',
    'Вноси только запрошенные изменения, остальное оставь без изменений.',
    'Если изменения противоречат закону, переформулируй корректно, но без комментариев.',
    '--- Исходный договор ---',
    baseContent,
    '--- Правки ---',
    parsed.data.prompt,
  ].join('\n');

  const rawContent = await generateText(refinePrompt);
  const content = sanitizeGeneratedHtml(rawContent, doc.title);
  let riskAssessmentText: string | null = null;

  if (hasRiskCheckAccess && parsed.data.risk_check) {
    try {
      const riskPrompt = buildRiskPrompt(doc.title, content);
      riskAssessmentText = (await generateText(riskPrompt)).trim();
    } catch (error) {
      console.error('Risk assessment generation failed (refine):', error);
    }
  }
  const updated = (await prisma.document.update({
    where: { id: doc.id },
    data: {
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
