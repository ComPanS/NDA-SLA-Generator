import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
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

  const parseFontSize = (_style?: string) => {
    // Фиксируем шрифт 14px (28 half-points) для всего текста
    return 28;
  };

  const parseAlignment = (style?: string) => {
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

  const makeParagraphFromElement = (el: DomElement): Paragraph => {
    const $el = $(el);
    const tag = el.tagName?.toLowerCase?.();
    const alignment = parseAlignment($el.attr('style'));
    const baseFontSize = 28;

    const runs = collectTextRuns($el.contents() as any, {
      bold: false,
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
      };
    } else if (tag === 'h3') {
      paragraphOptions = {
        ...paragraphOptions,
        heading: HeadingLevel.HEADING_3,
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
          alignment: parseAlignment($li.attr('style')),
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

  type SectionBlock = {
    columns?: {
      count: number;
      gapTwips: number;
    };
    children: Paragraph[];
  };

  const sections: SectionBlock[] = [{ children: [] }];

  const appendToCurrentSection = (paras: Paragraph[]) => {
    if (!paras.length) return;
    sections[sections.length - 1].children.push(...paras);
  };

  const flushSection = (payload: Paragraph[], columns?: { count: number; gapTwips: number }) => {
    if (!payload.length) return;
    sections.push({
      columns,
      children: payload,
    });
  };

  const parseColumnsAttrs = (node: DomElement) => {
    const count = parseInt($(node).attr('data-columns') || '', 10);
    const gapPx = parseInt($(node).attr('data-gutter') || '', 10);
    const safeCount = Number.isFinite(count) && count > 0 ? count : 2;
    const safeGapPx = Number.isFinite(gapPx) && gapPx > 0 ? gapPx : 24;
    const gapTwips = Math.round(safeGapPx * 15); // px -> twips (1px ≈ 0.75pt => 15 twips)
    return { count: safeCount, gapTwips };
  };

  const collectInlineChildren = (node: DomElement) => {
    const innerParagraphs: Paragraph[] = [];
    $(node)
      .contents()
      .each((_, inner) => {
        const innerAny = inner as any;
        const innerTag = innerAny?.tagName?.toLowerCase?.();
        if (innerAny.type === 'text') {
          const text = (innerAny.data || '').trim();
          if (text) {
            innerParagraphs.push(
              new Paragraph({
                children: [new TextRun({ text, font: 'Times New Roman', size: 28 })],
              }),
            );
          }
          return;
        }
        if (innerTag === 'p' || innerTag === 'h1' || innerTag === 'h2' || innerTag === 'h3') {
          innerParagraphs.push(makeParagraphFromElement(inner as DomElement));
          return;
        }
        if (innerTag === 'ol') {
          innerParagraphs.push(...processList(inner as DomElement, 0, 'numbered'));
          return;
        }
        if (innerTag === 'ul') {
          const styleAttr = $(inner).attr('data-list-style');
          const reference = styleAttr === 'dash' ? 'dash' : 'bulleted';
          innerParagraphs.push(...processList(inner as DomElement, 0, reference));
          return;
        }
      });
    return innerParagraphs;
  };

  $('body')
    .contents()
    .each((_, node) => {
      if (node.type === 'text') {
        const text = (node.data || '').trim();
        if (text) {
          appendToCurrentSection([
            new Paragraph({
              children: [new TextRun({ text, font: 'Times New Roman', size: 28 })],
            }),
          ]);
        }
        return;
      }

      const tag = (node as DomElement).tagName?.toLowerCase?.();
      if (!tag) return;

      if (['p', 'h1', 'h2', 'h3'].includes(tag)) {
        appendToCurrentSection([makeParagraphFromElement(node as DomElement)]);
        return;
      }

      if (tag === 'ol') {
        appendToCurrentSection(processList(node as DomElement, 0, 'numbered'));
        return;
      }

      if (tag === 'ul') {
        const styleAttr = $(node).attr('data-list-style');
        const reference = styleAttr === 'dash' ? 'dash' : 'bulleted';
        appendToCurrentSection(processList(node as DomElement, 0, reference));
        return;
      }

      if (tag === 'div' && $(node).attr('data-columns')) {
        const columnsProps = parseColumnsAttrs(node as DomElement);
        let buffer: Paragraph[] = [];

        $(node)
          .contents()
          .each((_, inner) => {
            const innerTag = (inner as DomElement).tagName?.toLowerCase?.();
            if (innerTag === 'div' && $(inner).attr('data-column-break')) {
              flushSection(buffer, columnsProps);
              buffer = [];
              return;
            }
            if (innerTag === 'div' && $(inner).attr('data-span-columns')) {
              const spanParas = collectInlineChildren(inner as DomElement);
              flushSection(buffer, columnsProps);
              buffer = [];
              appendToCurrentSection([]);
              sections.push({ children: spanParas });
              sections.push({ children: [] });
              return;
            }
            const paragraphs = collectInlineChildren(inner as DomElement);
            buffer.push(...paragraphs);
          });

        flushSection(buffer, columnsProps);
        sections.push({ children: [] }); // новый секционный блок для последующего текста
        return;
      }

      if (tag === 'div' && $(node).attr('data-column-break')) {
        sections.push({ children: [] });
        return;
      }

      // Фоллбек: любое другое содержимое как параграф
      appendToCurrentSection([makeParagraphFromElement(node as DomElement)]);
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
    sections: normalizedSections.map((section) => ({
      properties: section.columns
        ? {
            column: {
              count: section.columns.count,
              space: section.columns.gapTwips,
            },
          }
        : {},
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
      font-size: 14px;
      line-height: 1.6;
      color: #000;
      width: 210mm;
      margin: 0 auto;
      padding: 0;
      box-sizing: border-box;
    }
    h1 {
      text-align: center;
      font-size: 24px;
      margin: 20px 0;
      font-weight: bold;
      color: #000;
    }
    h2 {
      font-size: 18px;
      margin: 16px 0 8px 0;
      font-weight: bold;
      color: #000;
      text-align: left;
    }
    h3 {
      font-size: 16px;
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
    [data-columns] {
      column-count: 2;
      column-gap: 24px;
      column-fill: balance;
    }
    [data-columns] > * {
      break-inside: avoid;
    }
    [data-span-columns="all"] {
      column-span: all;
      break-before: column;
    }
    [data-column-break="true"] {
      break-before: column;
      height: 0;
      padding: 0;
      margin: 0;
      border: none;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
  `;

  // Запускаем Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

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
