import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  SectionType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import puppeteer from 'puppeteer';
import { load, CheerioAPI, Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';

/**
 * Экспорт HTML в DOCX с сохранением форматирования (заголовки, списки, колонки, размеры текста).
 */
export async function exportToDocx(html: string, title: string): Promise<Buffer> {
  const $: CheerioAPI = load(`<body>${html}</body>`);

  type StyleCtx = {
    bold?: boolean;
    italics?: boolean;
    underline?: boolean;
    fontSize?: number; // half-points
  };

  const numbering = {
    config: [
      {
        reference: 'numbered',
        levels: [0, 1, 2].map((level) => ({
          level,
          format: 'decimal' as const,
          text: `%${level + 1}.`,
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: {
              indent: { left: 720 + level * 360, hanging: 360 },
            },
          },
        })),
      },
      {
        reference: 'bulleted',
        levels: [0, 1, 2].map((level) => ({
          level,
          format: 'bullet' as const,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: {
              indent: { left: 720 + level * 360, hanging: 360 },
            },
          },
        })),
      },
      {
        reference: 'dash',
        levels: [0, 1, 2].map((level) => ({
          level,
          format: 'bullet' as const,
          text: '-',
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: {
              indent: { left: 720 + level * 360, hanging: 360 },
            },
          },
        })),
      },
    ],
  };

  const logColumnsDebug = process.env.DOCX_COLUMNS_DEBUG === 'true';
  const logColumns = (label: string, payload: Record<string, unknown>) => {
    if (logColumnsDebug) {
      // eslint-disable-next-line no-console
      console.log(`[docx-columns] ${label}`, payload);
    }
  };

  type AlignmentValue = (typeof AlignmentType)[keyof typeof AlignmentType];

  const parseFontSize = (_style?: string) => {
    // Фиксируем шрифт 14px (28 half-points) для всего текста
    return 28;
  };

  const pageMarginsTwips = {
    top: Math.round(20 * 56.6929), // 20mm
    right: Math.round(10 * 56.6929), // 10mm
    bottom: Math.round(20 * 56.6929), // 20mm
    left: Math.round(30 * 56.6929), // 30mm
  };

  const parseAlignment = (style?: string): AlignmentValue | undefined => {
    if (!style) return undefined;
    const match = style.match(/text-align:\s*(left|right|center|justify)/i);
    if (!match) return undefined;
    const value = match[1].toLowerCase();
    switch (value) {
      case 'left':
        return AlignmentType.LEFT;
      case 'right':
        return AlignmentType.RIGHT;
      case 'center':
        return AlignmentType.CENTER;
      case 'justify':
        return AlignmentType.JUSTIFIED;
      default:
        return undefined;
    }
  };

  const collectTextRuns = (nodes: Cheerio<any>, base: StyleCtx): TextRun[] => {
    const runs: TextRun[] = [];

    nodes.each((_, node) => {
      const n: any = node as any;
      const tag = n?.tagName?.toLowerCase?.();
      if (n.type === 'text') {
        const text = (n.data || '').replace(/\s+/g, ' ');
        if (text.trim().length > 0) {
          runs.push(
            new TextRun({
              text,
              bold: base.bold,
              italics: base.italics,
              underline: base.underline ? {} : undefined,
              size: base.fontSize,
              font: 'Times New Roman',
              color: '000000',
            }),
          );
        }
        return;
      }

      if (tag === 'br') {
        runs.push(new TextRun({ break: 1 }));
        return;
      }

      if (n.type === 'tag') {
        const $node = $(node as AnyNode);
        const next: StyleCtx = { ...base };

        if (['strong', 'b'].includes(tag)) {
          next.bold = true;
        }
        if (['em', 'i'].includes(tag)) {
          next.italics = true;
        }
        if (tag === 'u') {
          next.underline = true;
        }
        // игнорируем font-size в span — размер фиксирован

        runs.push(...collectTextRuns($node.contents() as any, next));
      }
    });

    return runs;
  };

  type DomElement = AnyNode & { tagName?: string; attribs?: Record<string, string> };

  const makeParagraphFromElement = (el: DomElement, forceLeftAlign = false): Paragraph => {
    const $el = $(el);
    const tag = el.tagName?.toLowerCase?.();
    const isHeading = tag === 'h1' || tag === 'h2' || tag === 'h3';

    // Для колонок - всегда left, для заголовков - свои правила, для остального - justify по умолчанию
    let alignment: AlignmentValue | undefined;
    if (forceLeftAlign) {
      alignment = AlignmentType.LEFT;
    } else {
      const styleAlign = parseAlignment($el.attr('style'));
      if (styleAlign !== undefined) {
        alignment = styleAlign;
      } else if (isHeading) {
        // Заголовки без явного align получат свои defaults ниже
        alignment = undefined;
      } else {
        // Обычные параграфы по умолчанию justify
        alignment = AlignmentType.JUSTIFIED;
      }
    }

    const baseFontSize = 28;

    const runs = collectTextRuns($el.contents() as any, {
      bold: isHeading,
      italics: false,
      underline: false,
      fontSize: baseFontSize,
    });

    let paragraphOptions: ConstructorParameters<typeof Paragraph>[0] = {
      children: runs.length ? runs : [new TextRun({ text: '', font: 'Times New Roman', size: 28 })],
      alignment,
    };

    if (tag === 'h1') {
      paragraphOptions = {
        ...paragraphOptions,
        heading: HeadingLevel.HEADING_1,
        alignment: paragraphOptions.alignment ?? AlignmentType.CENTER,
      };
    } else if (tag === 'h2') {
      paragraphOptions = {
        ...paragraphOptions,
        heading: HeadingLevel.HEADING_2,
        alignment: paragraphOptions.alignment ?? AlignmentType.LEFT,
      };
    } else if (tag === 'h3') {
      paragraphOptions = {
        ...paragraphOptions,
        heading: HeadingLevel.HEADING_3,
        alignment: paragraphOptions.alignment ?? AlignmentType.LEFT,
      };
    } else if (tag === 'p' && $el.hasClass('list-level-3')) {
      // Списки 3 уровня (2.1.1.): отступ слева 1,25 см, висячий отступ первой строки 0,75 см
      paragraphOptions = {
        ...paragraphOptions,
        indent: {
          left: Math.round(1.25 * 28.35 * 20), // 1.25 cm в twips
          firstLine: -Math.round(0.75 * 28.35 * 20), // -0.75 cm (висячий)
        },
      };
    }

    return new Paragraph(paragraphOptions);
  };

  const processList = (
    listEl: DomElement,
    level: number,
    reference: 'numbered' | 'bulleted' | 'dash',
  ) => {
    const paragraphs: Paragraph[] = [];
    const $list = $(listEl);

    $list.children('li').each((_, liEl) => {
      const $li = $(liEl);

      const nestedLists = $li.children('ul,ol').toArray() as DomElement[];
      const inlineHtml = $li.clone().children('ul,ol').remove().end().html() || '';
      const $inline = load(`<wrapper>${inlineHtml}</wrapper>`)('wrapper');
      const runs = collectTextRuns($inline.contents() as any, {
        bold: false,
        italics: false,
        underline: false,
        fontSize: 28,
      });

      paragraphs.push(
        new Paragraph({
          children: runs.length ? runs : [new TextRun(' ')],
          numbering: {
            reference,
            level,
          },
          alignment: parseAlignment($li.attr('style')) ?? AlignmentType.JUSTIFIED,
        }),
      );

      nestedLists.forEach((nested) => {
        const nestedTag = (nested as DomElement).tagName?.toLowerCase?.();
        if (nestedTag === 'ol') {
          paragraphs.push(...processList(nested as DomElement, level + 1, 'numbered'));
        } else if (nestedTag === 'ul') {
          const styleAttr = $(nested).attr('data-list-style');
          const ref = styleAttr === 'dash' ? 'dash' : 'bulleted';
          paragraphs.push(...processList(nested as DomElement, level + 1, ref));
        }
      });
    });

    return paragraphs;
  };

  type SectionChild = Paragraph | Table;

  type SectionBlock = {
    children: SectionChild[];
  };

  const sections: SectionBlock[] = [{ children: [] }];

  const appendToCurrentSection = (items: SectionChild[]) => {
    if (!items.length) return;
    sections[sections.length - 1].children.push(...items);
  };

  const parseColumnsAttrs = (node: DomElement) => {
    const count = parseInt($(node).attr('data-columns') || '', 10);
    const gapPx = parseInt($(node).attr('data-gutter') || '', 10);
    const safeCount = Number.isFinite(count) && count > 0 ? count : 2;
    const safeGapPx = Number.isFinite(gapPx) && gapPx > 0 ? gapPx : 24;
    const gapTwips = Math.round(safeGapPx * 15); // px -> twips (1px ≈ 0.75pt => 15 twips)
    return { count: safeCount, gapTwips };
  };

  const emptyParagraph = () =>
    new Paragraph({ children: [new TextRun({ text: '', font: 'Times New Roman', size: 28 })] });

  const collectColumnParagraphs = (parent: any): Paragraph[] => {
    const result: Paragraph[] = [];

    $(parent)
      .contents()
      .each((_, child) => {
        const ct = (child as DomElement).tagName?.toLowerCase?.();
        const isSpan = $(child).attr('data-span-columns') !== undefined;
        const isBreak = $(child).attr('data-column-break') !== undefined;
        if (isSpan) {
          return;
        }
        if (isBreak) {
          // Для колонок пропускаем разрыв: отображается только как разделитель между колонками
          return;
        }
        if (ct === 'div') {
          result.push(...collectColumnParagraphs(child));
          return;
        }
        if (['p', 'h1', 'h2', 'h3'].includes(ct || '')) {
          result.push(makeParagraphFromElement(child as DomElement, true));
          return;
        }
        if (ct === 'ol') {
          result.push(...processList(child as DomElement, 0, 'numbered'));
          return;
        }
        if (ct === 'ul') {
          const sa = $(child).attr('data-list-style');
          result.push(...processList(child as DomElement, 0, sa === 'dash' ? 'dash' : 'bulleted'));
          return;
        }
        if ((child as any).type === 'text') {
          const text = ((child as any).data || '').trim();
          if (text) {
            result.push(
              new Paragraph({
                children: [new TextRun({ text, font: 'Times New Roman', size: 28 })],
                alignment: AlignmentType.LEFT,
              }),
            );
          }
          return;
        }
        if (ct) {
          result.push(makeParagraphFromElement(child as DomElement, true));
        }
      });

    return result;
  };

  // Рекурсивная функция обработки любого узла DOM → SectionChild[]
  const processNode = (node: any): void => {
    if (node.type === 'text') {
      const text = ((node as any).data || '').trim();
      if (text) {
        appendToCurrentSection([
          new Paragraph({
            children: [new TextRun({ text, font: 'Times New Roman', size: 28 })],
            alignment: AlignmentType.JUSTIFIED,
          }),
        ]);
      }
      return;
    }

    const tag = (node as DomElement).tagName?.toLowerCase?.();
    if (!tag) return;

    // Стандартные блочные элементы
    if (['p', 'h1', 'h2', 'h3'].includes(tag)) {
      appendToCurrentSection([makeParagraphFromElement(node as DomElement)]);
      return;
    }
    if (tag === 'ol') {
      appendToCurrentSection(processList(node as DomElement, 0, 'numbered'));
      return;
    }
    if (tag === 'ul') {
      const sa = $(node).attr('data-list-style');
      appendToCurrentSection(
        processList(node as DomElement, 0, sa === 'dash' ? 'dash' : 'bulleted'),
      );
      return;
    }

    // ===== Колонки: div[data-columns] → невидимая таблица =====
    if (tag === 'div' && $(node).attr('data-columns')) {
      const columnsProps = parseColumnsAttrs(node as DomElement);

      const explicitColumns = $(node)
        .children('div')
        .filter((_, el) => {
          const $el = $(el);
          return !$el.attr('data-span-columns') && !$el.attr('data-column-break');
        })
        .toArray() as DomElement[];

      const spanElements = $(node).children('[data-span-columns]').toArray();

      let cellContents: Paragraph[][];

      if (explicitColumns.length > 0) {
        // Есть явные вложенные div — считаем, что каждая представляет свою колонку без балансировки
        cellContents = explicitColumns
          .slice(0, columnsProps.count)
          .map((col) => collectColumnParagraphs(col));

        while (cellContents.length < columnsProps.count) {
          cellContents.push([]);
        }

        logColumns('explicit-columns', {
          declaredColumns: columnsProps.count,
          explicitColumns: explicitColumns.length,
          cells: cellContents.map((c) => c.length),
        });
      } else {
        // Шаг 1: собираем параграфы, разбивая по column-break
        const groups: Paragraph[][] = [[]];

        const walkColumnChildren = (parent: any) => {
          $(parent)
            .contents()
            .each((_, child) => {
              const ct = (child as DomElement).tagName?.toLowerCase?.();

              if (ct === 'div' && $(child).attr('data-column-break')) {
                groups.push([]);
                return;
              }
              // Пропускаем элементы с data-span-columns - они обрабатываются отдельно
              if (ct === 'div' && $(child).attr('data-span-columns')) {
                return;
              }
              if (ct === 'div') {
                walkColumnChildren(child); // рекурсия в div-обёртки
                return;
              }
              if (['p', 'h1', 'h2', 'h3'].includes(ct || '')) {
                groups[groups.length - 1].push(makeParagraphFromElement(child as DomElement, true));
                return;
              }
              if (ct === 'ol') {
                groups[groups.length - 1].push(...processList(child as DomElement, 0, 'numbered'));
                return;
              }
              if (ct === 'ul') {
                const sa = $(child).attr('data-list-style');
                groups[groups.length - 1].push(
                  ...processList(child as DomElement, 0, sa === 'dash' ? 'dash' : 'bulleted'),
                );
                return;
              }
              if (child.type === 'text') {
                const text = ((child as any).data || '').trim();
                if (text) {
                  groups[groups.length - 1].push(
                    new Paragraph({
                      children: [new TextRun({ text, font: 'Times New Roman', size: 28 })],
                      alignment: AlignmentType.LEFT,
                    }),
                  );
                }
                return;
              }
              if (ct) {
                groups[groups.length - 1].push(makeParagraphFromElement(child as DomElement, true));
              }
            });
        };

        walkColumnChildren(node);

        // Шаг 2: формируем содержимое ячеек
        if (groups.length > 1) {
          // Есть column-break — берём первые N групп, лишние сливаем в последнюю
          cellContents = groups.slice(0, columnsProps.count);
          for (let i = columnsProps.count; i < groups.length; i++) {
            cellContents[cellContents.length - 1].push(...groups[i]);
          }
        } else {
          // Нет column-break — делим контент поровну
          const all = groups[0];
          if (all.length > 0) {
            const perCol = Math.floor(all.length / columnsProps.count);
            cellContents = [];
            let offset = 0;
            for (let i = 0; i < columnsProps.count; i++) {
              const count = i === columnsProps.count - 1 ? all.length - offset : perCol;
              cellContents.push(all.slice(offset, offset + count));
              offset += count;
            }
          } else {
            cellContents = [[]];
          }
        }

        logColumns('balanced-columns', {
          declaredColumns: columnsProps.count,
          groups: groups.map((g) => g.length),
          cells: cellContents.map((c) => c.length),
        });
      }

      // Дополняем до нужного числа колонок
      while (cellContents.length < columnsProps.count) {
        cellContents.push([]);
      }

      // Шаг 3: строим невидимую таблицу
      const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
      const pageWidthTwips = 11906;
      const availableWidth = pageWidthTwips - pageMarginsTwips.left - pageMarginsTwips.right;
      const cellWidth = Math.floor(availableWidth / columnsProps.count);
      const gapHalf = Math.floor(columnsProps.gapTwips / 2);

      const cells = cellContents.map(
        (paras, colIdx) =>
          new TableCell({
            children: paras.length > 0 ? paras : [emptyParagraph()],
            width: { size: cellWidth, type: WidthType.DXA },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            verticalAlign: VerticalAlign.TOP,
            margins: {
              marginUnitType: WidthType.DXA,
              left: colIdx > 0 ? gapHalf : 0,
              right: colIdx < columnsProps.count - 1 ? gapHalf : 0,
              top: 0,
              bottom: 0,
            },
          }),
      );

      const table = new Table({
        rows: [new TableRow({ children: cells })],
        columnWidths: Array(columnsProps.count).fill(cellWidth),
        width: { size: availableWidth, type: WidthType.DXA },
        borders: {
          top: noBorder,
          bottom: noBorder,
          left: noBorder,
          right: noBorder,
          insideHorizontal: noBorder,
          insideVertical: noBorder,
        },
      });

      appendToCurrentSection([table]);

      // Обрабатываем элементы с data-span-columns отдельно (после колонок)
      $(node)
        .children('[data-span-columns]')
        .each((_, spanEl) => {
          $(spanEl)
            .contents()
            .each((_, spanChild) => {
              processNode(spanChild);
            });
        });

      return;
    }

    // column-break вне колонок — новая секция
    if (tag === 'div' && $(node).attr('data-column-break')) {
      sections.push({ children: [] });
      return;
    }

    // Любой другой div — рекурсивно обходим детей
    if (tag === 'div') {
      $(node)
        .contents()
        .each((_, child) => {
          processNode(child);
        });
      return;
    }

    // Фоллбек: любое другое содержимое как параграф
    appendToCurrentSection([makeParagraphFromElement(node as DomElement)]);
  };

  $('body')
    .contents()
    .each((_, node) => {
      processNode(node);
    });

  const normalizedSections = sections.filter((s) => s.children.length > 0);
  if (!normalizedSections.length) {
    normalizedSections.push({
      children: [
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, font: 'Times New Roman', size: 28 })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });
  }

  const doc = new Document({
    numbering: numbering as any, // docx types are restrictive; structure matches expected shape
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 28, // 14pt
            color: '000000',
          },
          paragraph: {
            spacing: { line: 360 },
          },
        },
      },
    },
    sections: normalizedSections.map((section, idx) => ({
      properties: {
        // Все секции кроме первой — непрерывные (без разрыва страницы)
        ...(idx > 0 ? { type: SectionType.CONTINUOUS } : {}),
        page: {
          margin: pageMarginsTwips,
        },
      },
      children: section.children,
    })),
  });

  return Packer.toBuffer(doc);
}

/**
 * Экспорт HTML в PDF
 */
export async function exportToPdf(html: string, title: string): Promise<Buffer> {
  // Создаем HTML страницу для PDF
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 10mm 20mm 30mm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 22px;
      line-height: 1.6;
      color: #000;
      width: 210mm;
      margin: 0 auto;
      padding: 0;
      box-sizing: border-box;
    }
    h1 {
      text-align: center;
      font-size: 22px;
      margin: 20px 0;
      font-weight: bold;
      color: #000;
    }
    h2 {
      font-size: 22px;
      margin: 16px 0 8px 0;
      font-weight: bold;
      color: #000;
      text-align: left;
    }
    h3 {
      font-size: 22px;
      margin: 12px 0 6px 0;
      font-weight: bold;
      color: #000;
      text-align: left;
    }
    p {
      margin: 0 0 10px 0;
      text-align: justify;
      color: #000;
    }
    ul, ol {
      margin: 0 0 10px 18px;
    }
    li {
      margin-bottom: 6px;
      text-align: justify;
    }
    ul[data-list-style="dash"] {
      list-style-type: none;
      padding-left: 18px;
    }
    ul[data-list-style="dash"] li {
      position: relative;
      padding-left: 18px;
    }
    ul[data-list-style="dash"] li::before {
      content: "-";
      position: absolute;
      left: 0;
    }
    p.list-level-3 {
      margin-left: 1.25cm;
      text-indent: -0.75cm;
      padding-left: 0.75cm;
    }
    [data-columns] {
      display: table;
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
    }
    [data-columns] > .pdf-column-cell {
      display: table-cell;
      vertical-align: top;
      padding: 0 12px;
      width: 50%;
    }
    [data-columns] > .pdf-column-cell:first-child {
      padding-left: 0;
    }
    [data-columns] > .pdf-column-cell:last-child {
      padding-right: 0;
    }
    [data-columns] p,
    [data-columns] li {
      text-align: left;
    }
    [data-span-columns="all"] {
      display: block;
      width: 100%;
    }
    [data-column-break="true"] {
      display: none;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
  `;

  // Трансформируем колонки: разбиваем по column-break на независимые table-cell
  const $pdf = load(fullHtml);
  $pdf('[data-columns]').each((_, columnsEl) => {
    const $cols = $pdf(columnsEl);
    const colCount = parseInt($cols.attr('data-columns') || '2', 10) || 2;
    const children = $cols.children().toArray();

    // Разбиваем детей по data-column-break, исключая элементы с data-span-columns
    const groups: (typeof children)[] = [[]];
    const spanElements: typeof children = [];

    for (const child of children) {
      if ($pdf(child).attr('data-span-columns') !== undefined) {
        // Элементы с data-span-columns выносим отдельно
        spanElements.push(child);
      } else if ($pdf(child).attr('data-column-break') !== undefined) {
        groups.push([]);
      } else {
        groups[groups.length - 1].push(child);
      }
    }

    // Если разрывов не было, делим контент поровну
    if (groups.length === 1 && colCount > 1) {
      const all = groups[0];
      const perCol = Math.floor(all.length / colCount);
      groups.length = 0;
      let offset = 0;
      for (let i = 0; i < colCount; i++) {
        const count = i === colCount - 1 ? all.length - offset : perCol;
        groups.push(all.slice(offset, offset + count));
        offset += count;
      }
    }

    // Дополняем пустыми группами
    while (groups.length < colCount) {
      groups.push([]);
    }

    // Очищаем содержимое и вставляем ячейки
    $cols.empty();
    for (let i = 0; i < colCount; i++) {
      const cell = $pdf('<div class="pdf-column-cell"></div>');
      for (const child of groups[i] || []) {
        cell.append($pdf(child));
      }
      $cols.append(cell);
    }

    // Добавляем span-элементы после колонок
    for (const spanEl of spanElements) {
      $cols.after($pdf(spanEl));
    }
  });

  const transformedHtml = $pdf.html();

  // Запускаем Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(transformedHtml, { waitUntil: 'networkidle0' });

    // Генерируем PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
