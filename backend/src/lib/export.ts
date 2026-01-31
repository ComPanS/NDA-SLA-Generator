import { Document, Packer, Paragraph, TextRun } from 'docx';
import puppeteer from 'puppeteer';
import { convert } from 'html-to-text';

/**
 * Экспорт HTML в DOCX
 */
export async function exportToDocx(html: string, title: string): Promise<Buffer> {
  // Конвертируем HTML в простой текст с сохранением абзацев
  const text = convert(html, {
    wordwrap: false,
    preserveNewlines: true,
  });

  // Разбиваем на абзацы по пустым строкам
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const paragraphs: Paragraph[] = [];

  let isFirst = true;
  blocks.forEach((block) => {
    // Определяем, похоже ли на заголовок (по шаблону)
    const isHeadingLike = /^[А-ЯA-Z0-9\s.()-]+$/.test(block) || /^\d+(\.\d+)*\s/.test(block);
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: isFirst ? title : block,
            bold: isFirst || isHeadingLike,
            font: 'Times New Roman',
            size: 28, // 14pt
            color: '000000',
          }),
        ],
        spacing: {
          before: isFirst ? 0 : isHeadingLike ? 300 : 200,
          after: isFirst ? 300 : 200,
        },
      }),
    );
    isFirst = false;
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 28,
            color: '000000',
          },
          paragraph: {
            spacing: { line: 360 },
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
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
      margin: 2cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 14px;
      line-height: 1.6;
      color: #000;
      max-width: 21cm;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      font-size: 14px;
      margin: 0 0 16px 0;
      font-weight: bold;
      color: #000;
    }
    h2 {
      font-size: 14px;
      margin: 18px 0 8px 0;
      font-weight: bold;
      color: #000;
    }
    h3 {
      font-size: 14px;
      margin: 14px 0 6px 0;
      font-weight: bold;
      color: #000;
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
