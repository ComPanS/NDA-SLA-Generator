/**
 * Contract generation prompts: Russian Federation (RU) uses legacy RF-specific
 * instructions; other jurisdictions use language-specific international prompts.
 */

export const OUTPUT_LANGUAGES = ['ru', 'en', 'es', 'th'] as const;
export type OutputLanguage = (typeof OUTPUT_LANGUAGES)[number];

export type ContractPromptContext = {
  countryCode: string;
  /** BCP-47 language tag (e.g. ru, en, de, zh-CN). */
  outputLanguage: string;
  /** Human-readable country name in the output language */
  countryLabel: string;
};

export type ContractFieldDraftForPrompt = {
  groupLabel: string;
  groupOrder: number;
  label: string;
  key: string;
  value: string;
  order: number;
};

export type ContractSectionDraftForPrompt = {
  title: string;
  order: number;
};

const OUTPUT_LANG_TAG_RE = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]+)*$/;

export function isOutputLanguage(value: string): value is OutputLanguage {
  return (OUTPUT_LANGUAGES as readonly string[]).includes(value);
}

/** Normalizes and validates BCP-47–style tags; invalid values fall back to `ru`. */
export function normalizeOutputLanguage(value: string | undefined | null): string {
  const raw = String(value ?? 'ru')
    .trim()
    .replace(/_/g, '-');
  if (raw.length < 2 || raw.length > 32) return 'ru';
  if (!OUTPUT_LANG_TAG_RE.test(raw)) return 'ru';
  return raw;
}

/** Map an arbitrary tag to a bundled prompt pack (instruction templates). */
export function resolveBundledPromptLocale(tag: string): OutputLanguage {
  const t = tag.toLowerCase();
  if (t === 'ru' || t.startsWith('ru-')) return 'ru';
  if (t === 'es' || t.startsWith('es-')) return 'es';
  if (t === 'th' || t.startsWith('th-')) return 'th';
  return 'en';
}

export function isRussianPrimary(tag: string): boolean {
  const t = tag.toLowerCase();
  return t === 'ru' || t.startsWith('ru-');
}

export function outputLanguageHumanName(tag: string): string {
  const primary = tag.split('-')[0];
  if (!primary) return tag;
  try {
    const dn = new Intl.DisplayNames([tag], { type: 'language' });
    const name = dn.of(primary);
    if (name) return `${name} (${tag})`;
  } catch {
    /* ignore */
  }
  return tag;
}

export function normalizeCountryCode(value: string | undefined | null): string {
  const v = String(value || 'RU')
    .trim()
    .toUpperCase();
  return /^[A-Z]{2}$/.test(v) ? v : 'RU';
}

export function isRussianJurisdiction(countryCode: string): boolean {
  return countryCode.toUpperCase() === 'RU';
}

export function buildCountryDisplayName(countryCode: string, outputLanguage: string): string {
  const code = countryCode.toUpperCase();
  try {
    const dn = new Intl.DisplayNames([outputLanguage], { type: 'region' });
    const n = dn.of(code);
    if (n) return n;
  } catch {
    /* ignore */
  }
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' });
    return dn.of(code) || code;
  } catch {
    return code;
  }
}

export function makePromptContext(
  countryCode: string | undefined | null,
  outputLanguage: string | undefined | null,
): ContractPromptContext {
  const cc = normalizeCountryCode(countryCode);
  const ol = normalizeOutputLanguage(outputLanguage);
  return {
    countryCode: cc,
    outputLanguage: ol,
    countryLabel: buildCountryDisplayName(cc, ol),
  };
}

const notSpecified: Record<OutputLanguage, string> = {
  ru: '(не указано)',
  en: '(not specified)',
  es: '(no indicado)',
  th: '(ไม่ได้ระบุ)',
};

export const promptPartLabels = {
  structuredFields: {
    ru: 'Структурированные поля',
    en: 'Structured fields',
    es: 'Campos estructurados',
    th: 'ฟิลด์ที่จัดโครงสร้าง',
  },
  additionalRequirements: {
    ru: 'Дополнительные требования',
    en: 'Additional requirements',
    es: 'Requisitos adicionales',
    th: 'ข้อกำหนดเพิ่มเติม',
  },
} as const;

export function buildFieldsPrompt(
  fields: ContractFieldDraftForPrompt[],
  outputLangTag: string,
): string {
  const lang = resolveBundledPromptLocale(outputLangTag);
  const ns = notSpecified[lang];
  const grouped = fields.reduce<
    Array<{ label: string; order: number; fields: ContractFieldDraftForPrompt[] }>
  >((acc, field) => {
    const existing = acc.find((g) => g.label === field.groupLabel);
    if (existing) {
      existing.fields.push(field);
    } else {
      acc.push({ label: field.groupLabel, order: field.groupOrder ?? 0, fields: [field] });
    }
    return acc;
  }, []);

  return grouped
    .sort((a, b) => a.order - b.order)
    .map((group) => {
      const renderedFields = group.fields
        .sort((a, b) => (a.order === b.order ? 0 : a.order - b.order))
        .map((f) => `  - ${f.label}: ${f.value || ns}`)
        .join('\n');
      return `- ${group.label}:\n${renderedFields}`;
    })
    .join('\n');
}

function buildInstructionRu(ctx: ContractPromptContext, _title: string): string {
  void _title;
  const human = outputLanguageHumanName(ctx.outputLanguage);
  const firstLine = isRussianPrimary(ctx.outputLanguage)
    ? 'Сгенерируй полноценный юридический договор на русском языке в формате валидного HTML.'
    : `Сгенерируй полноценный юридический договор в формате валидного HTML по законодательству Российской Федерации и обычаям российского договорного оборота. Весь текст договора внутри HTML (все заголовки, пункты, таблицы, подписи к полям реквизитов) должен быть на языке: ${human}.`;
  return [
    firstLine,
    'Верни СТРОГО только HTML-контент, без пояснений, комментариев, Markdown и вводных фраз.',
    'HTML должен быть самодостаточным и готовым к встраиванию на сайт или в документ (включая минимальный <!DOCTYPE html>, <html>, <head> с <meta charset="utf-8"> и <body>).',
    'Структура документа:',
    '- <h1> — полное название договора (определи его самостоятельно на основе сути запроса, например, «Договор оказания услуг», «Договор купли-продажи» и т.д.);',
    '- <h2> — заголовки разделов;',
    '- <p> — текст пунктов (разрешено style="text-align: left|right|center|justify");',
    '- <span style="font-size: 18px"> для изменения размера текста;',
    '- Выделение: <strong>/<b>, <em>/<i>, <u>;',
    '- Списки: для подпунктов с нумерацией 1.1, 2.2.1, 3.1.2 и т.д. используй <p>2.2.1. Текст пункта.</p> — НЕ используй <ol><li> для такой нумерации (иначе получится "1. 2.2.1."). Для простых списков 1, 2, 3 — <ol><li>; для маркированных — <ul><li>; для тире — <ul data-list-style="dash"><li>...</li></ul>;',
    '- Две колонки используй ТОЛЬКО в блоке реквизитов в конце и нигде более: оберни реквизиты в <div data-columns="2" style="column-count: 2; column-gap: 24px">, внутри два вложенных <div> — левая колонка (Сторона 1/роль по контексту) и правая колонка (Сторона 2/роль по контексту); при необходимости вставь <div data-column-break="true"></div> между колонками, чтобы избежать балансировки строк. Если одна колонка короче другой по количеству строк, добавь в неё столько пустых параграфоф вида <p>&nbsp;</p>, чтобы их количество строк было одинаково.',
    '- В блоке реквизитов обязательно выведи обе стороны: не пропускай правую колонку (Сторона 2/контекстная роль), укажи плейсхолдеры ровно из 30 символов «_» для названия, ИНН, ОГРН, адреса, представителя и основания, подписи и расшифровки. Если стороны разных типов (юрлицо/физлицо/ИП или другое), адаптируй реквизиты под тип: для физлица минимум — Ф.И.О., паспортные данные, адрес регистрации, подпись; для юрлица минимум — наименование, ИНН/ОГРН/КПП, адрес, представитель, основание, подпись и печать при необходимости; для всех остальных случаев - по ситуации.',
    '- Преамбула: только дата и краткое обозначение сторон без повторения реквизитов (к примеру ИНН/ОГРН/адрес/представители/подписи оставь в финальном блоке реквизитов).',
    '- Подразделы нумеруй внутри соответствующего раздела (1.1, 1.2, 2.1, 2.2.1 и т.д.) через тег <p>: <p>2.2.1. Текст подпункта.</p>. Не используй <ol><li> для нумерации 1.1, 2.2.1 — иначе браузер добавит "1." и получится "1. 2.2.1.". Не выводи номера подразделов раньше заголовка раздела и не сбивай нумерацию.',
    'Требования к содержанию:',
    '- Определи тип договора на основе запроса пользователя и самостоятельно подбери подходящую структуру и набор разделов, характерных для данного вида гражданско-правовых договоров в РФ.',
    '- Обязательно включи ключевые разделы, типичные для большинства договоров: Преамбула, Предмет договора, Права и обязанности сторон, Ответственность сторон, Срок действия и порядок расторжения, Урегулирование споров, Заключительные положения, Реквизиты и подписи сторон.',
    '- В разделе с реквизитами/подписями сторон (не преамбула) обязательно отобрази ДВЕ стороны в двух колонках: используй <div data-columns="2" style="column-count: 2; column-gap: 24px">, левая колонка — Сторона 1 (или «Заказчик/Продавец/Арендодатель» по контексту), правая колонка — Сторона 2 (или «Исполнитель/Покупатель/Арендатор»). В каждой колонке укажи плейсхолдеры с ровно 30 символами нижнего подчеркивания с полями, которые больше всего подходят под договор, к примеру: полное наименование, ИНН, ОГРН, адрес, «в лице ________________________________________», «на основании ________________________________________», место для подписи и расшифровки.',
    '- Добавляй дополнительные разделы, если они уместны для данного типа договора (например, «Порядок расчетов», «Гарантии», «Форс-мажор», «Интеллектуальная собственность», «Конфиденциальность» и т.д.).',
    '- Удаляй или не включай разделы, которые явно не нужны для данного вида договора.',
    '- Если тип договора предполагает специфические роли сторон, используй соответствующие плейсхолдеры: «Заказчик» и «Исполнитель» — для услуг, «Продавец» и «Покупатель» — для купли-продажи, «Арендодатель» и «Арендатор» — для аренды и т.д. При отсутствии конкретики используй нейтральные «Сторона 1» и «Сторона 2» или наиболее подходящие по контексту. Для разных типов сторон (юрлицо vs физлицо/ИП) реквизиты должны отличаться и соответствовать типу.',
    '- Если в дополнительных требованиях пользователя нет конкретных имён, наименований организаций, адресов, сумм, дат, сроков, площадей и иных фактов — не выдумывай их. Не заполняй договор вымышленными персональными или корпоративными данными, «примерными» адресами и числами. В преамбуле указывай стороны только по роли или нейтрально (Сторона 1/2); для каждого незаданного конкретного значения в тексте и в реквизитах используй плейсхолдер в виде ровно 30 символов «_» после подписи поля.',
    'Стиль изложения: строго официальный, юридически точный и нейтральный, без эмоциональной окраски, разговорных выражений и избыточной «воды».',
    'Используй формулировки, характерные для типовых договоров российского гражданского права (ссылки на ГК РФ при необходимости).',
    'Обеспечь отсутствие двусмысленностей и логическую последовательность положений.',
  ].join('\n');
}

function buildInstructionIntl(ctx: ContractPromptContext): string {
  const c = ctx.countryLabel;
  const L = resolveBundledPromptLocale(ctx.outputLanguage);
  const human = outputLanguageHumanName(ctx.outputLanguage);
  const blocks: Record<OutputLanguage, string[]> = {
    ru: [
      `Сгенерируй полноценный юридический договор в формате валидного HTML. Договор должен соответствовать применимому законодательству и обычаям делового оборота страны: ${c} (${ctx.countryCode}).`,
      'Верни СТРОГО только HTML-контент, без пояснений, комментариев, Markdown и вводных фраз.',
      'HTML должен быть самодостаточным (включая минимальный <!DOCTYPE html>, <html>, <head> с <meta charset="utf-8"> и <body>).',
      'Структура разметки:',
      '- <h1> — полное название договора по смыслу запроса;',
      '- <h2> — разделы;',
      '- <p> — пункты (разрешён style="text-align: left|right|center|justify");',
      '- <span style="font-size: 18px"> для размера текста; выделение: <strong>/<b>, <em>/<i>, <u>;',
      '- Для нумерации подпунктов вида 1.1, 2.2.1 используй <p>2.2.1. Текст.</p>, не <ol><li> для таких номеров. Простые списки — <ol><li> или <ul><li>; тире — <ul data-list-style="dash"><li>.',
      '- Две колонки только в финальном блоке реквизитов/подписей: <div data-columns="2" style="column-count: 2; column-gap: 24px">, два внутренних <div>; при необходимости <div data-column-break="true"></div>; выровняй высоту колонок пустыми <p>&nbsp;</p>.',
      `- В реквизитах укажи обе стороны; используй типичные для ${c} реквизиты и идентификаторы (налоговый номер, регистрация компании, адрес, представитель, основание полномочий и т.д. по практике этой страны). Плейсхолдеры для линий подписи и ключевых полей — ровно 30 символов «_». Адаптируй под тип стороны (юрлицо / физлицо / ИП и т.д.).`,
      '- Преамбула: дата и краткое указание сторон только по роли (без имён и реквизитов, если пользователь их не дал); без полного повтора финального блока реквизитов.',
      'По содержанию: подбери структуру и формулировки как для качественного коммерческого договора в выбранной стране; учти типичные разделы, обязательства, ответственность, сроки, расторжение, споры, конфиденциальность при необходимости, применимое право и юрисдикцию в соответствии с практикой этой страны.',
      'Стиль: официальный юридический, без разговорных оборотов и двусмысленностей.',
      'Факты и плейсхолдеры (обязательно): если пользователь в «Дополнительных требованиях» не привёл конкретные имена, компании, идентификаторы, адреса, суммы, даты, сроки, площади и т.п. — не выдумывай и не подставляй «типовые» или иллюстративные данные. В преамбуле — только роли сторон или «Сторона 1/2». Для каждого отсутствующего значения после подписи поля — строка ровно из 30 символов «_», как в реквизитах.',
    ],
    en: [
      `Generate a complete legal agreement as valid HTML. The agreement must reflect the laws, typical commercial practice, and identification/registration norms of ${c} (${ctx.countryCode}).`,
      'Return STRICTLY HTML only — no explanations, comments, Markdown, or preamble text.',
      'The HTML must be self-contained (minimal <!DOCTYPE html>, <html>, <head> with <meta charset="utf-8"> and <body>).',
      'Markup rules:',
      '- <h1> — full contract title (derive from the user request);',
      '- <h2> — sections;',
      '- <p> — clauses (style="text-align: ..." allowed);',
      '- <span style="font-size: 18px"> for size; emphasis: <strong>/<b>, <em>/<i>, <u>;',
      '- For numbered sub-clauses like 1.1, 2.2.1 use <p>2.2.1. Text.</p>, not <ol><li> (browser adds extra numbers). Simple lists: <ol>/<ul>; dashed lists: <ul data-list-style="dash"><li>.',
      '- Two columns ONLY in the final signature/details block: <div data-columns="2" style="column-count: 2; column-gap: 24px"> with two inner <div>s; use <div data-column-break="true"></div> if needed; pad shorter column with <p>&nbsp;</p>.',
      `- In the details block include BOTH parties; use field names and identifiers typical for ${c} (tax ID, company number, address, representative, authority to sign, etc.). Use exactly 30 underscore characters «_» as line placeholders for signatures and key blanks. Adapt to party type (company / individual / other).`,
      '- Preamble: date and party roles only (e.g. Landlord/Tenant or Party A/B) — no personal/company names or identifiers unless provided by the user; not a full repeat of the details block.',
      'Substance: choose sections and wording suitable for a professional contract under the chosen country’s law; include typical core sections (parties, subject, obligations, liability, term/termination, disputes, final provisions, signatures) and add industry-specific sections when appropriate.',
      'Tone: formal legal, precise, unambiguous.',
      'Facts and placeholders (mandatory): Unless the user’s additional requirements explicitly state them, do NOT invent or fabricate party names, company names, registry/tax IDs, addresses, phones, emails, amounts, percentages, dates, durations, areas, or any deal-specific details. Do not use realistic-looking sample data (no fake street addresses, “ACME Ltd”, “John Doe” as if real). In the preamble, name parties only by role (e.g. Landlord/Tenant, Party A/B). For every missing concrete value after a field label, use exactly one line of 30 underscore characters «_», consistent with the signature block style.',
    ],
    es: [
      `Genera un contrato jurídico completo como HTML válido. El contrato debe ajustarse a la legislación aplicable y a la práctica comercial habitual en ${c} (${ctx.countryCode}).`,
      'Devuelve ÚNICAMENTE HTML, sin explicaciones, comentarios, Markdown ni texto introductorio.',
      'El HTML debe ser autónomo (<!DOCTYPE html>, <html>, <head> con <meta charset="utf-8"> y <body> mínimos).',
      'Estructura:',
      '- <h1> — título completo del contrato según la petición;',
      '- <h2> — secciones;',
      '- <p> — cláusulas (permitido style="text-align: ...");',
      '- <span style="font-size: 18px">; énfasis: <strong>/<b>, <em>/<i>, <u>;',
      '- Para subapartados 1.1, 2.2.1 usa <p>2.2.1. Texto.</p>, no <ol><li>. Listas simples: <ol>/<ul>; listas con guiones: <ul data-list-style="dash"><li>.',
      '- Dos columnas SOLO en el bloque final de datos/firmas: <div data-columns="2" style="column-count: 2; column-gap: 24px"> con dos <div> internos; si hace falta <div data-column-break="true"></div>; equilibra altura con <p>&nbsp;</p>.',
      `- Incluye ambas partes en datos/firmas; usa campos e identificadores típicos de ${c} (NIF/CIF u otros según el país, registro mercantil, domicilio, representante, poderes, etc.). Usa exactamente 30 guiones bajos «_» como líneas de firma/espacios clave. Adapta al tipo de parte (sociedad / persona física / autónomo, etc.).`,
      '- Preámbulo: fecha y roles de las partes (p. ej. arrendador/arrendatario) — sin nombres ni identificadores salvo que el usuario los haya indicado; sin repetir el bloque final de datos.',
      'Contenido: estructura y redacción propias de un contrato mercantil serio en el país elegido; incluye secciones habituales (partes, objeto, obligaciones, responsabilidad, plazo/resolución, litigios, cláusulas finales, firmas) y otras pertinentes al tipo de contrato.',
      'Estilo: jurídico formal, claro, sin ambigüedades.',
      'Datos y marcadores (obligatorio): si el usuario no aporta en los requisitos adicionales nombres propios, razones sociales, identificadores, direcciones, importes, fechas, plazos, superficies u otros datos concretos, no los inventes ni uses datos de ejemplo creíbles. En el preámbulo identifica a las partes solo por su rol (p. ej. arrendador/arrendatario, Parte A/B). Para cada dato faltante tras la etiqueta del campo, usa una línea de exactamente 30 guiones bajos «_», igual que en firmas.',
    ],
    th: [
      `สร้างสัญญาทางกฎหมายฉบับสมบูรณ์ในรูปแบบ HTML ที่ถูกต้อง สัญญาต้องสอดคล้องกับกฎหมายที่ใช้บังคับและแนวทางปฏิบัติทางธุรกิจทั่วไปของ ${c} (${ctx.countryCode})`,
      'ตอบกลับเฉพาะ HTML เท่าน้ัน — ห้ามคำอธิบาย คอมเมนต์ Markdown หรือข้อความนำ',
      'HTML ต้องครบชุดด้วยตนเอง (มีอย่างน้อย <!DOCTYPE html>, <html>, <head> ที่มี <meta charset="utf-8"> และ <body>)',
      'กฎการจัดรูปแบบ:',
      '- <h1> — ชื่อสัญญาเต็ม (อ้างอิงคำขอของผู้ใช้)',
      '- <h2> — หัวข้อหลัก',
      '- <p> — ข้อความข้อ (อนุญาต style="text-align: ...")',
      '- <span style="font-size: 18px">; การเน้น: <strong>/<b>, <em>/<i>, <u>',
      '- หมายเลขย่อยแบบ 1.2, 2.2.1 ใช้ <p>2.2.1. ข้อความ</p> ไม่ใช้ <ol><li> รูปแบบนั้น; รายการทั่วไปใช้ <ol>/<ul>; รายการขีดกลางใช้ <ul data-list-style="dash"><li>',
      '- สองคอลัมน์เฉพาะใน блокรายละเอียด/ลายเซ็นท้ายเอกสาร: <div data-columns="2" style="column-count: 2; column-gap: 24px"> ภายในมี <div> สองชั้น; ใช้ <div data-column-break="true"></div> เมื่อจำเป็น; เติม <p>&nbsp;</p> ให้ความสูงเท่ากัน',
      `- ในรายละเอียดต้องมีทั้งสองฝ่าย; ใช้แบบฟอร์มและตัวระบุที่นิยมใน ${c} (เลขประจำตัวผู้เสียภาษี / เลขทะเบียนนิติบุคคล / ที่อยู่ / ผู้แทน / อำนาจลงนาม ฯลฯ ตามประเพณีของประเทศนั้น) ใช้ขีดล่าง «_» จำนวน 30 ตัวเป็นตัวยึดสำหรับลายเซ็นหรือช่องสำคัญ ปรับตามประเภทคู่สัญญา`,
      '- คำนำ: วันที่และบทบาทคู่สัญญาเท่านั้น — ไม่ใส่ชื่อจริงหรือเลขทะเบียนหากผู้ใช้ไม่ได้ระบุ; ไม่ซ้ำบล็อกรายละเอียดท้ายเอกสาร',
      'เนื้อหา: เลือกโครงสร้างและถ้อยคำที่สมเหตุสมผลตามกฎหมายของประเทศที่เลือก รวมหัวข้อหลักที่พบบ่อย (คู่สัญญา วัตถุแห่งสัญญา หน้าที่ ความรับผิด ระยะเวลา/บอกเลิก ระงับข้อพิพาท ข้อสรุป ลายเซ็น) และหัวข้อเฉพาะเมื่อเหมาะสม',
      'โทน: เป็นทางการ ชัดเจน ไม่คลุมเครือ',
      'ข้อเท็จจริงและช่องเว้นว่าง (บังคับ): หากผู้ใช้ไม่ได้ระบุในข้อกำหนดเพิ่มเติม — ชื่อ ชื่อบริษัท เลขทะเบียน/ภาษี ที่อยู่ จำนวนเงิน วันที่ ระยะเวลา พื้นที่ หรือรายละเอียดเฉพาะอื่น — ห้ามแต่งเรื่องหรือใส่ข้อมูลตัวอย่างให้ดูเหมือนจริง ในคำนำให้อ้างคู่สัญญาเฉพาะตามบทบาท (เช่น ผู้ให้เช่า/ผู้เช่า ฝ่าย A/B) เท่านั้น สำหรับค่าที่ยังไม่มี ให้ใช้บรรทัดขีดล่าง «_» จำนวน 30 ตัวหลังป้ายช่อง สอดคล้องกับบล็อกลายเซ็น',
    ],
  };
  const tail: Record<OutputLanguage, string> = {
    ru: `Обязательно: весь юридический текст в HTML (заголовки, пункты, реквизиты) пиши на языке: ${human}.`,
    en: `Mandatory: the full contract text in HTML (headings, clauses, party details) must be written in ${human}.`,
    es: `Obligatorio: todo el texto jurídico en HTML (títulos, cláusulas, datos de las partes) debe estar redactado en ${human}.`,
    th: `ข้อบังคับ: ข้อความทางกฎหมายทั้งหมดใน HTML (หัวข้อ ข้อความ รายละเอียดคู่สัญญา) ต้องเขียนเป็นภาษา ${human}`,
  };
  return [...blocks[L], tail[L]].join('\n');
}

export function buildInstruction(ctx: ContractPromptContext, title: string): string {
  if (isRussianJurisdiction(ctx.countryCode)) {
    return buildInstructionRu(ctx, title);
  }
  return buildInstructionIntl(ctx);
}

export function composeContractGeneratePrompt(
  ctx: ContractPromptContext,
  title: string,
  fields: ContractFieldDraftForPrompt[],
  sections: ContractSectionDraftForPrompt[],
  userPrompt: string,
): string {
  const lang = resolveBundledPromptLocale(ctx.outputLanguage);
  const instruction = buildInstruction(ctx, title);
  const fieldsBody = fields.length ? buildFieldsPrompt(fields, ctx.outputLanguage) : '';
  const sectionsPrompt = buildSectionsPrompt(ctx, title, sections);
  const sf = promptPartLabels.structuredFields[lang];
  const ar = promptPartLabels.additionalRequirements[lang];
  return [instruction, fieldsBody ? `${sf}:\n${fieldsBody}` : null, sectionsPrompt, `${ar}:\n${userPrompt}`]
    .filter(Boolean)
    .join('\n\n');
}

function buildSectionsPromptRuDefault(): string {
  return `Самостоятельно сформируй оптимальную, максимально полную и соответствующую современной российской договорной практике (2024–2026 гг.) структуру разделов для договора.

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
  - Преамбулу (с датой заключения в формате ««___» _________ 20__ г.», полные реквизиты сторон с плейсхолдерами и линиями ровно из 30 символов «_»: наименование, ИНН, ОГРН, адрес, «в лице ________________________________________», «действующего на основании ________________________________________»),
  - Финальный раздел «Реквизиты и подписи сторон» (или аналогичное название).
• В разделе с подписями сторон обязательно предусмотри чётко оформленные поля:
  - дата (««___» _________ 20__ г.»),
  - строки для ФИО, должности (при наличии), собственноручной подписи каждой стороны с линиями ровно из 30 символов «_»,
  - расшифровки подписей под линиями ровно из 30 символов «_»,
  - место для оттиска печати (при необходимости).
• Используй тег <h2> для названий основных разделов, нумеруй их арабскими цифрами (1., 2., …).
• Подразделы внутри разделов нумеруй последовательно (1.1., 1.2., 1.2.1. и т.д.) через тег <p>: <p>2.2.1. Текст.</p>, не через <ol><li>.
• Порядок разделов должен быть логичным, последовательным и удобным для восприятия сторонами и в случае судебного разбирательства.

Генерируй структуру, максимально соответствующую качественным гражданско-правовым договорам, используемым в российском деловом обороте на текущий момент.`;
}

function buildSectionsPromptIntlDefault(ctx: ContractPromptContext): string {
  const c = ctx.countryLabel;
  const L = resolveBundledPromptLocale(ctx.outputLanguage);
  const text: Record<OutputLanguage, string> = {
    ru: `Самостоятельно сформируй полную структуру разделов договора, соответствующую современной практике страны ${c} (${ctx.countryCode}).

Требования:
• Определи состав и порядок разделов исходя из сути сделки, применимого права этой страны, отраслевых норм (если есть) и типичных рисков сторон.
• Разделы должны быть детальными; подпункты нумеруй через <p>1.2.1. Текст.</p>, не через <ol><li> для многоуровневой нумерации.
• Включи преамбулу (дата, стороны только по роли без выдуманных имён и реквизитов, если их нет в запросе) и финальный блок реквизитов/подписей двух сторон в двух колонках с плейсхолдерами из 30 символов «_»; реквизиты — типичные для ${c}.
• Используй <h2> для основных разделов; порядок — логичный для судебного и делового использования.
• Не заполняй договор вымышленными данными сторон, суммами и датами: при отсутствии фактов в запросе — нейтральные роли и строки из 30 символов «_».`,
    en: `Independently design a comprehensive section structure for the agreement appropriate for ${c} (${ctx.countryCode}).

Requirements:
• Choose sections and depth from the transaction type, applicable local law, sector rules where relevant, and typical party risks.
• Use detailed clauses; number sub-clauses with <p>1.2.1. Text.</p>, not <ol><li> for hierarchical numbering.
• Include a preamble (date, party roles only — no fabricated names/IDs) and a final two-column details/signatures block for both parties with 30× «_» placeholders; use identification fields typical for ${c}.
• Use <h2> for main sections; order sections logically for business and dispute resolution.
• Do not invent party-specific or numeric facts; if the user did not supply them, use neutral roles and 30× «_» lines for missing values.`,
    es: `Diseña de forma autónoma una estructura de secciones completa del contrato adecuada para ${c} (${ctx.countryCode}).

Requisitos:
• Elige secciones y profundidad según el tipo de acuerdo, la ley local aplicable, normas sectoriales si procede y riesgos típicos.
• Cláusulas detalladas; subapartados con <p>1.2.1. Texto.</p>, no <ol><li> para jerarquía numérica.
• Incluye preámbulo (fecha, roles de las partes sin datos inventados) y bloque final de datos/firmas en dos columnas para ambas partes con 30 guiones bajos «_»; campos típicos de ${c}.
• Usa <h2> para secciones principales; orden lógico para negocio y litigios.
• No inventes datos identificativos ni importes numéricos; si el usuario no los aportó, usa roles neutros y líneas de 30 «_».`,
    th: `ออกแบบโครงสร้างหัวข้อของสัญญาให้ครบถ้วนและสมเหตุสมผลกับ ${c} (${ctx.countryCode}) ด้วยตนเอง

ข้อกำหนด:
• เลือกหัวข้อและความลึกตามชนิดสัญญา กฎหมายท้องถิ่น ข้อกำหนดเฉพาะอุตสาหกรรม (ถ้ามี) และความเสี่ยงทั่วไปของคู่สัญญา
• ข้อความละเอียด; หมายเลขย่อยใช้ <p>1.2.1. ข้อความ</p> ไม่ใช้ <ol><li> สำหรับเลขหลายระดับ
• มีคำนำ (วันที่ และบทบาทคู่สัญญาเท่านั้น ไม่แต่งชื่อหรือข้อมูล) และบล็อกรายละเอียด/ลายเซ็นท้ายแบบสองคอลัมน์สำหรับทั้งสองฝ่าย พร้อมขีดล่าง 30 ตัว; ใช้รูปแบบข้อมูลที่พบบ่อยใน ${c}
• ใช้ <h2> สำหรับหัวข้อหลัก; เรียงลำดับอย่างมีเหตุผล
• ห้ามเติมข้อมูลสมมติของคู่สัญญาหรือตัวเลข หากผู้ใช้ไม่ได้ให้มา — ใช้บทบาทเป็นกลางและบรรทัด «_» 30 ตัว`,
  };
  return text[L];
}

function sectionsUserPrefix(ctx: ContractPromptContext): string {
  const L = resolveBundledPromptLocale(ctx.outputLanguage);
  const c = ctx.countryLabel;
  const lines: Record<OutputLanguage, string> = {
    ru: `Структура разделов (сохрани указанный порядок и названия разделов; при необходимости дополни 1–3 логичными разделами, характерными для договоров этого типа в стране ${c}):`,
    en: `Section structure (keep the order and titles below; you may add 1–3 logical sections typical for this agreement type in ${c}):`,
    es: `Estructura de secciones (conserva el orden y los títulos; puedes añadir 1–3 secciones lógicas típicas de este tipo de contrato en ${c}):`,
    th: `โครงสร้างหัวข้อ (รักษาลำดับและชื่อหัวข้อตามน้ัน; เพิ่มได้ 1–3 หัวข้อที่สมเหตุสมผลสำหรับสัญญาประเภทนี้ใน ${c}):`,
  };
  return lines[L];
}

export function buildSectionsPrompt(
  ctx: ContractPromptContext,
  _title: string,
  sectionsSource: ContractSectionDraftForPrompt[],
): string {
  void _title;
  if (sectionsSource.length > 0) {
    const body = sectionsSource
      .sort((a, b) => a.order - b.order)
      .map((s, idx) => `${idx + 1}. ${s.title}`)
      .join('\n');
    return `${sectionsUserPrefix(ctx)}\n${body}`;
  }
  if (isRussianJurisdiction(ctx.countryCode)) {
    let body = buildSectionsPromptRuDefault();
    if (!isRussianPrimary(ctx.outputLanguage)) {
      body += `\n\nВажно: формулировки разделов и пунктов в HTML должны быть на языке: ${outputLanguageHumanName(ctx.outputLanguage)}.`;
    }
    return body;
  }
  return buildSectionsPromptIntlDefault(ctx);
}

function buildRiskPromptRu(title: string, htmlContent: string): string {
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

function buildRiskPromptRuNonPrimary(
  ctx: ContractPromptContext,
  title: string,
  htmlContent: string,
): string {
  const h = outputLanguageHumanName(ctx.outputLanguage);
  return [
    'Ты — опытный юрист, специализирующийся на анализе договоров по законодательству Российской Федерации. Твоя задача — внимательно проанализировать предоставленный договор и выявить юридические риски.',
    '',
    'Правила оформления ответа:',
    `- Отвечай полностью на языке: ${h}. Не смешивай другие языки.`,
    '- Не используй никакого markdown-форматирования: никаких **, *, __, #, >, кодовых блоков, таблиц или других элементов разметки.',
    '- Используй только простой текст и маркированные списки с дефисом "- ". Метки структуры (аналоги «Риск», «Рекомендация») формулируй на языке ответа.',
    '- Каждый пункт списка: (1) одна строка с кратким названием и пояснением риска, двоеточие после названия; (2) отдельная строка с конкретной рекомендацией, начинающаяся с соответствующей метки на языке ответа и двоеточия.',
    '- Если юридических рисков не выявлено, напиши ровно одну короткую фразу на языке ответа об отсутствии рисков и ничего больше.',
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

function riskRespondLanguageLine(ctx: ContractPromptContext): string {
  const h = outputLanguageHumanName(ctx.outputLanguage);
  const L = resolveBundledPromptLocale(ctx.outputLanguage);
  const lines: Record<OutputLanguage, string> = {
    ru: `- Отвечай полностью на языке: ${h}. Не смешивай другие языки.`,
    en: `- Respond entirely in ${h}. Do not mix other languages.`,
    es: `- Responde íntegramente en ${h}. No mezcles otros idiomas.`,
    th: `- ตอบทั้งหมดในภาษา ${h} เท่านั้น ห้ามปนภาษาอื่น`,
  };
  return lines[L];
}

function buildRiskPromptIntl(ctx: ContractPromptContext, title: string, htmlContent: string): string {
  const L = resolveBundledPromptLocale(ctx.outputLanguage);
  const c = ctx.countryLabel;
  const intro: Record<OutputLanguage, string[]> = {
    ru: [
      'Ты — опытный юрист. Проанализируй договор с учётом применимого права и практики страны ' +
        c +
        '. Выяви юридические риски.',
      '',
      'Правила ответа:',
      riskRespondLanguageLine(ctx),
      '- Без Markdown; только простой текст и маркированные списки с "- ".',
      '- Формат каждого пункта:',
      '  - Риск [краткое название]: [пояснение].',
      '  Рекомендация: [конкретные действия].',
      '- Если рисков нет — одна короткая фраза на языке ответа об отсутствии юридических рисков.',
      '- Без вступлений и пересказа всего договора.',
      '',
      `Название: ${title}`,
    ],
    en: [
      `You are an experienced lawyer. Review the agreement with ${c}'s applicable law and commercial practice in mind. Identify legal risks.`,
      '',
      'Answer rules:',
      riskRespondLanguageLine(ctx),
      '- No Markdown; plain text and bullet lists with "- ".',
      '- Each item format:',
      '  - Risk [short title]: [explanation].',
      '  Recommendation: [concrete mitigation].',
      '- If there are no risks, output exactly one short sentence in the response language stating that no legal risks were identified.',
      '- No introductions or full contract paraphrase.',
      '',
      `Title: ${title}`,
    ],
    es: [
      `Eres un abogado experimentado. Analiza el contrato considerando la ley aplicable y la práctica en ${c}. Identifica riesgos jurídicos.`,
      '',
      'Normas de respuesta:',
      riskRespondLanguageLine(ctx),
      '- Sin Markdown; texto plano y listas con "- ".',
      '- Formato de cada punto:',
      '  - Riesgo [título breve]: [explicación].',
      '  Recomendación: [acción concreta].',
      '- Si no hay riesgos, una sola frase corta en el idioma de respuesta indicando que no hay riesgos jurídicos.',
      '- Sin introducciones ni resumen completo del contrato.',
      '',
      `Título: ${title}`,
    ],
    th: [
      `คุณเป็นทนายความที่มีประสบการณ์ วิเคราะห์สัญญาโดยคำนึงถึงกฎหมายและแนวปฏิบัติใน ${c} ระบุความเสี่ยงทางกฎหมาย`,
      '',
      'กฎการตอบ:',
      riskRespondLanguageLine(ctx),
      '- ห้าม Markdown; ใช้ข้อความธรรมดาและรายการด้วย "- "',
      '- รูปแบบแต่ละข้อ:',
      '  - ความเสี่ยง [ชื่อสั้น]: [คำอธิบาย]',
      '  คำแนะนำ: [การแก้ไขที่ชัดเจน]',
      '- หากไม่มีความเสี่ยง ให้ตอบหนึ่งประโยคสั้นๆ ในภาษาที่ใช้ตอบ ระบุว่าไม่พบความเสี่ยงทางกฎหมาย',
      '- ห้ามคำนำหรือถอความสัญญาทั้งฉบับ',
      '',
      `ชื่อสัญญา: ${title}`,
    ],
  };
  return [
    ...intro[L],
    '',
    '--- Contract HTML start ---',
    htmlContent,
    '--- Contract HTML end ---',
  ].join('\n');
}

export function buildRiskPrompt(
  ctx: ContractPromptContext,
  title: string,
  htmlContent: string,
): string {
  if (isRussianJurisdiction(ctx.countryCode) && isRussianPrimary(ctx.outputLanguage)) {
    return buildRiskPromptRu(title, htmlContent);
  }
  if (isRussianJurisdiction(ctx.countryCode)) {
    return buildRiskPromptRuNonPrimary(ctx, title, htmlContent);
  }
  return buildRiskPromptIntl(ctx, title, htmlContent);
}

function refineLanguageRetentionRu(ctx: ContractPromptContext): string {
  return `Язык текста: сохраняй тот же язык, что в исходном HTML (ожидаемая локаль вывода: ${ctx.outputLanguage}); меняй язык только если пользователь в блоке «Правки» явно просит об этом.`;
}

function buildRefinePromptRu(
  ctx: ContractPromptContext,
  baseContent: string,
  userPrompt: string,
): string {
  return [
    'Ты редактор юридических договоров.',
    'На входе HTML договора; верни только обновлённый HTML без пояснений.',
    'Сохрани структуру и стили: заголовки h1/h2, параграфы p (разрешено style="text-align: left|right|center|justify"), выделения strong/em/u, изменение размера через <span style="font-size: Npx">, списки ol/ul/li и ul с data-list-style="dash". Подпункты 1.1, 2.2.1 — только через <p>2.2.1. Текст.</p>, не через <ol><li>. Разрывы колонок <div data-column-break="true"></div> и полноширинные блоки <div data-span-columns="all">...</div>.',
    'Колонки <div data-columns="2"> используй ТОЛЬКО для блока реквизитов в конце: внутри две вложенные <div> (левая — Сторона 1/роль по контексту, правая — Сторона 2/роль по контексту); при необходимости поставь <div data-column-break="true"></div> между ними, чтобы избежать балансировки строк; если одна колонка короче, добавь в неё 1–3 пустых <p>&nbsp;</p> для выравнивания высоты. Не добавляй колонки в других разделах.',
    'Обязательно сохрани или восстанови блок с реквизитами/подписями двух сторон в двух колонках, с плейсхолдерами длиной ровно 30 символов «_» для реквизитов, даты, подписи и расшифровки; правую колонку не пропускай. Реквизиты адаптируй под тип стороны (юрлицо/физлицо/ИП), колонки не должны быть идентичными, если типы сторон различаются.',
    'Преамбула должна содержать только дату и краткое обозначение сторон, без повторения реквизитов (ИНН/ОГРН/адрес/представитель/подпись оставь в финальном блоке реквизитов).',
    'Подразделы нумеруй через <p>2.2.1. Текст.</p>, не через <ol><li> (иначе получится "1. 2.2.1."). Не выводи номера подразделов раньше заголовка раздела и не сбивай нумерацию.',
    'Вноси только запрошенные изменения, остальное оставь без изменений.',
    'Если изменения противоречат закону, переформулируй корректно, но без комментариев.',
    refineLanguageRetentionRu(ctx),
    '--- Исходный договор ---',
    baseContent,
    '--- Правки ---',
    userPrompt,
  ].join('\n');
}

function refineLanguageRetentionIntl(ctx: ContractPromptContext): string {
  const L = resolveBundledPromptLocale(ctx.outputLanguage);
  const lines: Record<OutputLanguage, string> = {
    ru: `Сохраняй язык формулировок как в исходном HTML (локаль: ${ctx.outputLanguage}), пока правки явно не требуют сменить язык.`,
    en: `Preserve the contract language as in the source HTML (locale: ${ctx.outputLanguage}) unless edits explicitly request a change.`,
    es: `Conserva el idioma del contrato como en el HTML de origen (local: ${ctx.outputLanguage}) salvo que las ediciones pidan otro idioma.`,
    th: `รักษาภาษาของสัญญาตาม HTML ต้นฉบับ (locale: ${ctx.outputLanguage}) เว้นแต่การแก้ไขระบุเป็นอย่างอื่น`,
  };
  return lines[L];
}

function buildRefinePromptIntl(ctx: ContractPromptContext, baseContent: string, userPrompt: string) {
  const c = ctx.countryLabel;
  const L = resolveBundledPromptLocale(ctx.outputLanguage);
  const hdr = {
    ru: [
      'Ты редактор юридических договоров.',
      `Учитывай применимое право и обычай страны ${c}.`,
      'На входе — HTML; верни только обновлённый HTML.',
    ],
    en: [
      'You are a legal contract editor.',
      `Take into account the law and commercial practice of ${c}.`,
      'Input is HTML; return only the updated HTML.',
    ],
    es: [
      'Eres un editor jurídico de contratos.',
      `Ten en cuenta la ley y la práctica comercial de ${c}.`,
      'La entrada es HTML; devuelve solo el HTML actualizado.',
    ],
    th: [
      'คุณเป็นบรรณาธิการร่างสัญญา',
      `คำนึงถึงกฎหมายและแนวปฏิบัติของ ${c}`,
      'ข้อมูลเข้าเป็น HTML ตอบเฉพาะ HTML ที่แก้แล้ว',
    ],
  }[L];
  const rules = {
    ru: [
      'Сохрани структуру и стили: h1/h2, p, strong/em/u, span font-size, списки; подпункты 1.1 и 2.2.1 — только <p>2.2.1. Текст.</p>, не <ol><li>.',
      'Две колонки только в блоке реквизитов в конце; две вложенные колонки для сторон; при необходимости data-column-break; выравняй высоту <p>&nbsp;</p>.',
      'Сохрани или восстанови реквизиты/подписи двух сторон с плейсхолдерами «_» длиной 30; типичные поля для этой страны.',
      'Вноси только запрошенные правки. Если правка конфликтует с правом, исправь формулировку без комментариев.',
    ],
    en: [
      'Keep structure and styles: h1/h2, p, strong/em/u, span font-size, lists; hierarchical numbering only as <p>2.2.1. Text.</p>, not <ol><li>.',
      'Two columns only in the final details/signatures block; two inner columns for parties; use data-column-break if needed; pad with <p>&nbsp;</p>.',
      'Preserve or restore both parties’ details/signatures with 30× «_» placeholders and fields typical for the jurisdiction.',
      'Apply only requested edits. If an edit conflicts with applicable law, rephrase without commentary.',
    ],
    es: [
      'Mantén estructura y estilos: h1/h2, p, strong/em/u, span font-size, listas; subapartados solo como <p>2.2.1. Texto.</p>, no <ol><li>.',
      'Dos columnas solo al final; dos columnas internas para las partes; data-column-break si hace falta; rellena con <p>&nbsp;</p>.',
      'Conserva o restablece datos/firmas de ambas partes con 30 «_» y campos típicos del país.',
      'Aplica solo los cambios pedidos. Si chocan con la ley, reformula sin comentarios.',
    ],
    th: [
      'รักษาโครงสร้างและสไตล์: h1/h2, p, strong/em/u, span font-size, รายการ; หมายเลขย่อยเฉพาะแบบ <p>2.2.1. ข้อความ</p>',
      'สองคอลัมน์เฉพาะท้ายเอกสาร; แยกคอลััมน์คู่สัญญา; ใช้ data-column-break และ <p>&nbsp;</p>',
      'รักษาหรือคืนรายละเอียด/ลายเซ็นทั้งสองฝ่าย พร้อม «_» 30 ตัว ตามท้องถิ่น',
      'แก้เฉพาะที่ร้องขอ หากขัดกฎหมาย ให้ถอความใหม่โดยไม่อธิบาย',
    ],
  }[L];
  return [
    ...hdr,
    ...rules,
    refineLanguageRetentionIntl(ctx),
    '--- Source ---',
    baseContent,
    '--- Edits ---',
    userPrompt,
  ].join('\n');
}

export function buildRefinePrompt(
  ctx: ContractPromptContext,
  baseContent: string,
  userPrompt: string,
): string {
  if (isRussianJurisdiction(ctx.countryCode)) {
    return buildRefinePromptRu(ctx, baseContent, userPrompt);
  }
  return buildRefinePromptIntl(ctx, baseContent, userPrompt);
}
