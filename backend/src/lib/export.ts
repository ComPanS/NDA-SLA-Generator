import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import puppeteer from 'puppeteer';
import { convert } from 'html-to-text';

/**
 * Экспорт HTML в DOCX
 */
export async function exportToDocx(html: string, title: string): Promise<Buffer> {
  // Конвертируем HTML в простой текст с сохранением структуры
  const text = convert(html, {
    wordwrap: 80,
    preserveNewlines: true,
  });

  // Разбиваем на параграфы
  const lines = text.split('\n').filter((line) => line.trim());

  // Создаем параграфы для документа
  const paragraphs: Paragraph[] = [];

  // Добавляем заголовок
  paragraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
    })
  );

  // Добавляем дату
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Дата создания: ${new Date().toLocaleDateString('ru-RU')}`,
          italics: true,
        }),
      ],
      spacing: {
        after: 200,
      },
    })
  );

  // Добавляем контент
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Определяем является ли строка заголовком (обычно заглавными буквами или с номером)
    const isHeading = /^[А-ЯA-Z\s]+$/.test(trimmed) || /^\d+\./.test(trimmed);

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: trimmed,
            bold: isHeading,
          }),
        ],
        heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
        spacing: {
          before: isHeading ? 400 : 200,
          after: 200,
        },
      })
    );
  });

  // Добавляем футер с дисклеймером
  paragraphs.push(
    new Paragraph({
      text: '',
      spacing: { before: 600 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Документ создан автоматически с помощью NDA/SLA Generator. Рекомендуется проверка квалифицированным юристом перед использованием.',
          italics: true,
          size: 18,
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );

  // Создаем документ
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  // Генерируем буфер
  const buffer = await Packer.toBuffer(doc);
  return buffer;
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
      margin: 2cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 21cm;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      font-size: 18pt;
      margin-bottom: 1cm;
      font-weight: bold;
    }
    h2 {
      font-size: 14pt;
      margin-top: 0.8cm;
      margin-bottom: 0.4cm;
      font-weight: bold;
    }
    h3 {
      font-size: 12pt;
      margin-top: 0.6cm;
      margin-bottom: 0.3cm;
      font-weight: bold;
    }
    p {
      margin-bottom: 0.5cm;
      text-align: justify;
    }
    .date {
      font-style: italic;
      margin-bottom: 1cm;
    }
    .disclaimer {
      margin-top: 2cm;
      font-size: 10pt;
      font-style: italic;
      text-align: center;
      color: #666;
    }
    ul, ol {
      margin-bottom: 0.5cm;
    }
    li {
      margin-bottom: 0.3cm;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="date">Дата создания: ${new Date().toLocaleDateString('ru-RU')}</p>
  ${html}
  <div class="disclaimer">
    Документ создан автоматически с помощью NDA/SLA Generator.<br>
    Рекомендуется проверка квалифицированным юристом перед использованием.
  </div>
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
