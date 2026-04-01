import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, '../src/shared/i18n/locales');

const sectionsDefault = {
  ru: [
    'Преамбула',
    'Предмет договора',
    'Права и обязанности сторон',
    'Стоимость и порядок расчетов',
    'Сроки выполнения и приемка',
    'Ответственность сторон',
    'Конфиденциальность',
    'Форс-мажор',
    'Порядок разрешения споров',
    'Срок действия, изменение и расторжение',
    'Заключительные положения',
    'Реквизиты и подписи сторон',
  ],
  en: [
    'Preamble',
    'Subject of the agreement',
    'Rights and obligations',
    'Pricing and payment terms',
    'Deadlines and acceptance',
    'Liability',
    'Confidentiality',
    'Force majeure',
    'Dispute resolution',
    'Term, amendment and termination',
    'Final provisions',
    'Details and signatures',
  ],
  es: [
    'Preámbulo',
    'Objeto del contrato',
    'Derechos y obligaciones',
    'Precio y forma de pago',
    'Plazos y aceptación',
    'Responsabilidad',
    'Confidencialidad',
    'Fuerza mayor',
    'Resolución de controversias',
    'Vigencia, modificación y rescisión',
    'Disposiciones finales',
    'Datos y firmas',
  ],
  th: [
    'คำนำ',
    'วัตถุประสงค์ของสัญญา',
    'สิทธิและหน้าที่ของคู่สัญญา',
    'ค่าตอบแทนและเงื่อนไขการชำระเงิน',
    'กำหนดเวลาและการรับมอบ',
    'ความรับผิด',
    'ความลับ',
    'ฟอร์ซมาฌอร์',
    'การระงับข้อพิพาท',
    'ระยะเวลา การแก้ไข และการบอกเลิกสัญญา',
    'ข้อกำหนดท้าย',
    'รายละเอียดและลายมือชื่อ',
  ],
};

const pack = (lang) => ({
  sectionsDefault: sectionsDefault[lang],
  new: {
    metaTitle:
      lang === 'ru'
        ? 'Создать договор с AI | ДоговорAI'
        : lang === 'en'
          ? 'Create a contract with AI | ДоговорAI'
          : lang === 'es'
            ? 'Crear contrato con IA | ДоговорAI'
            : 'สร้างสัญญาด้วย AI | ДоговорAI',
    metaDescription:
      lang === 'ru'
        ? 'Настройте разделы, заполните параметры и получите готовый договор с помощью AI.'
        : lang === 'en'
          ? 'Configure sections, fill in parameters and get a ready contract with AI.'
          : lang === 'es'
            ? 'Configure secciones, complete parámetros y obtenga un contrato listo con IA.'
            : 'ตั้งค่าหัวข้อ กรอกพารามิเตอร์ และรับสัญญาที่พร้อมใช้ด้วย AI',
    metaDescriptionLoading:
      lang === 'ru'
        ? 'Соберите договор (NDA, SLA и любые соглашения): выберите шаблон, заполните поля и сгенерируйте текст.'
        : lang === 'en'
          ? 'Build a contract (NDA, SLA and more): pick a template, fill fields and generate text.'
          : lang === 'es'
            ? 'Arme un contrato (NDA, SLA y más): elija plantilla, complete campos y genere texto.'
            : 'สร้างสัญญา (NDA SLA ฯลฯ): เลือกเทมเพลต กรอกฟิลด์ และสร้างข้อความ',
    loadingTemplates:
      lang === 'ru'
        ? 'Загрузка шаблонов...'
        : lang === 'en'
          ? 'Loading templates...'
          : lang === 'es'
            ? 'Cargando plantillas...'
            : 'กำลังโหลดเทมเพลต...',
    loadError:
      lang === 'ru'
        ? 'Не удалось загрузить шаблоны'
        : lang === 'en'
          ? 'Could not load templates'
          : lang === 'es'
            ? 'No se pudieron cargar las plantillas'
            : 'โหลดเทมเพลตไม่สำเร็จ',
    pageTitle:
      lang === 'ru'
        ? 'Создать новый договор'
        : lang === 'en'
          ? 'Create new contract'
          : lang === 'es'
            ? 'Crear contrato nuevo'
            : 'สร้างสัญญาใหม่',
    createError:
      lang === 'ru'
        ? 'Не удалось создать договор. Попробуйте еще раз.'
        : lang === 'en'
          ? 'Could not create the contract. Please try again.'
          : lang === 'es'
            ? 'No se pudo crear el contrato. Inténtelo de nuevo.'
            : 'สร้างสัญญาไม่สำเร็จ ลองอีกครั้ง',
    titleLabel:
      lang === 'ru' ? 'Название договора' : lang === 'en' ? 'Contract title' : lang === 'es' ? 'Título del contrato' : 'ชื่อสัญญา',
    titlePlaceholder:
      lang === 'ru'
        ? 'Например: NDA с ООО Компания'
        : lang === 'en'
          ? 'e.g. NDA with ACME LLC'
          : lang === 'es'
            ? 'p. ej., NDA con ACME S.L.'
            : 'เช่น NDA กับ บริษัท',
    titleError: lang === 'ru' ? 'Введите название' : lang === 'en' ? 'Enter a title' : lang === 'es' ? 'Introduzca el título' : 'กรุณากรอกชื่อ',
    titleHelper:
      lang === 'ru'
        ? 'Название — только для вашего удобства, на текст генерации не влияет. Описание для ИИ укажите ниже в поле “Описание / Параметры”.'
        : lang === 'en'
          ? 'The title is for your convenience only; it does not affect generated text. Put details for the AI in “Description / parameters” below.'
          : lang === 'es'
            ? 'El título es solo para su comodidad; no afecta el texto generado. Los detalles para la IA van en “Descripción / parámetros”.'
            : 'ชื่อใช้เพื่อความสะดวกของคุณเท่านั้น ไม่ส่งผลต่อข้อความที่สร้าง รายละเอียดสำหรับ AI อยู่ในช่อง “คำอธิบาย / พารามิเตอร์”',
    templateLabel: lang === 'ru' ? 'Шаблон' : lang === 'en' ? 'Template' : lang === 'es' ? 'Plantilla' : 'เทมเพลต',
    noTemplate:
      lang === 'ru' ? 'Без шаблона' : lang === 'en' ? 'No template' : lang === 'es' ? 'Sin plantilla' : 'ไม่มีเทมเพลต',
    promptLabel:
      lang === 'ru'
        ? 'Описание / Параметры'
        : lang === 'en'
          ? 'Description / parameters'
          : lang === 'es'
            ? 'Descripción / parámetros'
            : 'คำอธิบาย / พารามิเตอร์',
    promptPlaceholder:
      lang === 'ru'
        ? 'Опишите детали договора: стороны, предмет, сроки, условия...'
        : lang === 'en'
          ? 'Describe the contract: parties, subject, timelines, terms...'
          : lang === 'es'
            ? 'Describa el contrato: partes, objeto, plazos, condiciones...'
            : 'อธิบายสัญญา: คู่สัญญา วัตถุ ระยะเวลา เงื่อนไข...',
    promptError:
      lang === 'ru'
        ? 'Заполните описание / параметры для ИИ'
        : lang === 'en'
          ? 'Fill in description / parameters for the AI'
          : lang === 'es'
            ? 'Complete la descripción / parámetros para la IA'
            : 'กรอกคำอธิบาย / พารามิเตอร์สำหรับ AI',
    promptHelper:
      lang === 'ru'
        ? 'Чем подробнее описание, тем точнее будет сгенерирован документ'
        : lang === 'en'
          ? 'The more detail you provide, the more accurate the document'
          : lang === 'es'
            ? 'Cuanto más detalle, más preciso será el documento'
            : 'ยิ่งระบุรายละเอียดมาก เอกสารยิ่งแม่นยำ',
    riskCheck:
      lang === 'ru'
        ? 'Проверить на юридические риски'
        : lang === 'en'
          ? 'Run legal risk check'
          : lang === 'es'
            ? 'Analizar riesgos legales'
            : 'ตรวจสอบความเสี่ยงทางกฎหมาย',
    businessChip: lang === 'ru' ? 'Бизнес' : lang === 'en' ? 'Business' : lang === 'es' ? 'Negocio' : 'ธุรกิจ',
    riskTooltipNew:
      lang === 'ru'
        ? 'Включите, чтобы AI оценил текст договора и подсветил потенциальные юридические риски.'
        : lang === 'en'
          ? 'Enable so the AI reviews the text and highlights potential legal risks.'
          : lang === 'es'
            ? 'Active para que la IA evalúe el texto y marque riesgos legales potenciales.'
            : 'เปิดเพื่อให้ AI ประเมินข้อความและเน้นความเสี่ยงทางกฎหมาย',
    loadingFields:
      lang === 'ru'
        ? 'Загрузка полей шаблона...'
        : lang === 'en'
          ? 'Loading template fields...'
          : lang === 'es'
            ? 'Cargando campos de la plantilla...'
            : 'กำลังโหลดฟิลด์เทมเพลต...',
    enable: lang === 'ru' ? 'Включить' : lang === 'en' ? 'Enable' : lang === 'es' ? 'Activar' : 'เปิดใช้',
    sectionsTitle:
      lang === 'ru'
        ? 'Разделы договора'
        : lang === 'en'
          ? 'Contract sections'
          : lang === 'es'
            ? 'Secciones del contrato'
            : 'หัวข้อในสัญญา',
    proChip:
      lang === 'ru'
        ? 'Профессиональный'
        : lang === 'en'
          ? 'Professional'
          : lang === 'es'
            ? 'Profesional'
            : 'ระดับมืออาชีพ',
    sectionsTooltip:
      lang === 'ru'
        ? 'Настройте структуру договора: порядок и названия разделов влияют на генерацию и экспорт. При отключении, ИИ сам подберет нужные разделы.'
        : lang === 'en'
          ? 'Configure structure: section order and titles affect generation and export. If off, the AI picks sections.'
          : lang === 'es'
            ? 'Configure la estructura: el orden y títulos afectan la generación y exportación. Si está desactivado, la IA elige secciones.'
            : 'กำหนดโครงสร้าง: ลำดับและชื่อหัวข้อมีผลต่อการสร้างและส่งออก หากปิด AI จะเลือกหัวข้อเอง',
    sectionsUpsell:
      lang === 'ru'
        ? 'Настройка разделов доступна на платных тарифах.'
        : lang === 'en'
          ? 'Section customization is available on paid plans.'
          : lang === 'es'
            ? 'Personalizar secciones está disponible en planes de pago.'
            : 'การปรับหัวข้อใช้ได้ในแพ็กเกจแบบชำระเงิน',
    generate:
      lang === 'ru'
        ? 'Сгенерировать договор'
        : lang === 'en'
          ? 'Generate contract'
          : lang === 'es'
            ? 'Generar contrato'
            : 'สร้างสัญญา',
    generating:
      lang === 'ru'
        ? 'Генерация документа...'
        : lang === 'en'
          ? 'Generating document...'
          : lang === 'es'
            ? 'Generando documento...'
            : 'กำลังสร้างเอกสาร...',
    cancel: lang === 'ru' ? 'Отмена' : lang === 'en' ? 'Cancel' : lang === 'es' ? 'Cancelar' : 'ยกเลิก',
    disclaimer:
      lang === 'ru'
        ? 'Документ создается автоматически с помощью AI. Перед применением убедитесь, что он подходит под ваши требования. Перед использованием желательно проконсультироваться с юристом.'
        : lang === 'en'
          ? 'The document is generated with AI. Review it before use and consult a lawyer when needed.'
          : lang === 'es'
            ? 'El documento se genera con IA. Revíselo antes de usarlo y consulte a un abogado si es necesario.'
            : 'เอกสารสร้างด้วย AI ตรวจสอบก่อนใช้และปรึกษาทนายความหากจำเป็น',
    validationSnackbar:
      lang === 'ru'
        ? 'Заполните название и поле «Описание / Параметры»'
        : lang === 'en'
          ? 'Fill in the title and “Description / parameters”.'
          : lang === 'es'
            ? 'Complete el título y “Descripción / parámetros”.'
            : 'กรอกชื่อและ “คำอธิบาย / พารามิเตอร์”',
    paymentSuccess:
      lang === 'ru'
        ? 'Оплата прошла успешно! Теперь вы можете создать договор.'
        : lang === 'en'
          ? 'Payment successful! You can now create a contract.'
          : lang === 'es'
            ? '¡Pago exitoso! Ya puede crear un contrato.'
            : 'ชำระเงินสำเร็จ! คุณสร้างสัญญาได้แล้ว',
    paymentProcessing:
      lang === 'ru' ? 'Платёж обрабатывается...' : lang === 'en' ? 'Payment is processing...' : lang === 'es' ? 'El pago se está procesando...' : 'กำลังดำเนินการชำระเงิน...',
    paymentError:
      lang === 'ru'
        ? 'Оплата обрабатывается. Попробуйте обновить страницу.'
        : lang === 'en'
          ? 'Payment is processing. Try refreshing the page.'
          : lang === 'es'
            ? 'El pago se está procesando. Actualice la página.'
            : 'กำลังดำเนินการชำระเงิน ลองรีเฟรชหน้า',
  },
  view: {
    loading:
      lang === 'ru'
        ? 'Загрузка документа...'
        : lang === 'en'
          ? 'Loading document...'
          : lang === 'es'
            ? 'Cargando documento...'
            : 'กำลังโหลดเอกสาร...',
    notFoundTitle:
      lang === 'ru' ? 'Документ не найден' : lang === 'en' ? 'Document not found' : lang === 'es' ? 'Documento no encontrado' : 'ไม่พบเอกสาร',
    notFoundMessage:
      lang === 'ru'
        ? 'Не удалось загрузить документ. Возможно, он был удален или у вас нет доступа.'
        : lang === 'en'
          ? 'Could not load the document. It may have been deleted or you may lack access.'
          : lang === 'es'
            ? 'No se pudo cargar el documento. Pudo haberse eliminado o no tiene acceso.'
            : 'โหลดเอกสารไม่สำเร็จ อาจถูกลบหรือคุณไม่มีสิทธิ์',
    backToList:
      lang === 'ru'
        ? 'Вернуться к списку'
        : lang === 'en'
          ? 'Back to list'
          : lang === 'es'
            ? 'Volver a la lista'
            : 'กลับไปยังรายการ',
    back: lang === 'ru' ? 'Назад' : lang === 'en' ? 'Back' : lang === 'es' ? 'Atrás' : 'ย้อนกลับ',
    deleteContract:
      lang === 'ru'
        ? 'Удалить договор'
        : lang === 'en'
          ? 'Delete contract'
          : lang === 'es'
            ? 'Eliminar contrato'
            : 'ลบสัญญา',
    refineAi:
      lang === 'ru'
        ? 'Уточнить с AI'
        : lang === 'en'
          ? 'Refine with AI'
          : lang === 'es'
            ? 'Afinar con IA'
            : 'ปรับแต่งด้วย AI',
    docxTooltip:
      lang === 'ru'
        ? 'Доступно на тарифах Basic и выше'
        : lang === 'en'
          ? 'Available on Basic plans and above'
          : lang === 'es'
            ? 'Disponible en planes Basic y superiores'
            : 'ใช้ได้กับแพ็กเกจ Basic ขึ้นไป',
    downloadDocx:
      lang === 'ru'
        ? 'Скачать DOCX'
        : lang === 'en'
          ? 'Download DOCX'
          : lang === 'es'
            ? 'Descargar DOCX'
            : 'ดาวน์โหลด DOCX',
    downloadPdf:
      lang === 'ru'
        ? 'Скачать PDF'
        : lang === 'en'
          ? 'Download PDF'
          : lang === 'es'
            ? 'Descargar PDF'
            : 'ดาวน์โหลด PDF',
    statusLabel: lang === 'ru' ? 'Статус' : lang === 'en' ? 'Status' : lang === 'es' ? 'Estado' : 'สถานะ',
    titleLabel:
      lang === 'ru'
        ? 'Название договора'
        : lang === 'en'
          ? 'Contract title'
          : lang === 'es'
            ? 'Título del contrato'
            : 'ชื่อสัญญา',
    saving: lang === 'ru' ? 'Сохранение...' : lang === 'en' ? 'Saving...' : lang === 'es' ? 'Guardando...' : 'กำลังบันทึก...',
    saveTitle:
      lang === 'ru'
        ? 'Сохранить название'
        : lang === 'en'
          ? 'Save title'
          : lang === 'es'
            ? 'Guardar título'
            : 'บันทึกชื่อ',
    versionLabel: lang === 'ru' ? 'Версия' : lang === 'en' ? 'Version' : lang === 'es' ? 'Versión' : 'เวอร์ชัน',
    versionItem:
      lang === 'ru'
        ? 'Версия {{v}} — {{date}}'
        : lang === 'en'
          ? 'Version {{v}} — {{date}}'
          : lang === 'es'
            ? 'Versión {{v}} — {{date}}'
            : 'เวอร์ชัน {{v}} — {{date}}',
    historicVersion:
      lang === 'ru'
        ? 'Историческая версия (только просмотр)'
        : lang === 'en'
          ? 'Historical version (read-only)'
          : lang === 'es'
            ? 'Versión histórica (solo lectura)'
            : 'เวอร์ชันเก่า (อ่านอย่างเดียว)',
    metaLine:
      lang === 'ru'
        ? 'Создан: {{created}} | Просматриваемая версия: {{ver}} | Статус: {{status}} | Шаблон: {{tpl}}'
        : lang === 'en'
          ? 'Created: {{created}} | Viewing version: {{ver}} | Status: {{status}} | Template: {{tpl}}'
          : lang === 'es'
            ? 'Creado: {{created}} | Versión vista: {{ver}} | Estado: {{status}} | Plantilla: {{tpl}}'
            : 'สร้าง: {{created}} | กำลังดูเวอร์ชัน: {{ver}} | สถานะ: {{status}} | เทมเพลต: {{tpl}}',
    noTemplateName:
      lang === 'ru' ? 'Без названия' : lang === 'en' ? 'Untitled' : lang === 'es' ? 'Sin título' : 'ไม่มีชื่อ',
    noTemplate:
      lang === 'ru' ? 'Без шаблона' : lang === 'en' ? 'No template' : lang === 'es' ? 'Sin plantilla' : 'ไม่มีเทมเพลต',
    viewingVersionHint:
      lang === 'ru'
        ? 'Вы смотрите версию №{{v}} от {{date}}. Чтобы редактировать, вернитесь к последней версии.'
        : lang === 'en'
          ? 'You are viewing version {{v}} from {{date}}. Switch to the latest version to edit.'
          : lang === 'es'
            ? 'Está viendo la versión {{v}} del {{date}}. Cambie a la última versión para editar.'
            : 'คุณกำลังดูเวอร์ชัน {{v}} วันที่ {{date}} สลับไปเวอร์ชันล่าสุดเพื่อแก้ไข',
    risksTitle:
      lang === 'ru'
        ? 'Юридические риски'
        : lang === 'en'
          ? 'Legal risks'
          : lang === 'es'
            ? 'Riesgos legales'
            : 'ความเสี่ยงทางกฎหมาย',
    risksTooltip:
      lang === 'ru'
        ? 'Результат анализа договора на юридические риски. Включите опцию при генерации или уточнении, чтобы обновить этот блок.'
        : lang === 'en'
          ? 'Risk analysis results. Enable the option when generating or refining to refresh this block.'
          : lang === 'es'
            ? 'Resultado del análisis de riesgos. Active la opción al generar o afinar para actualizar.'
            : 'ผลการวิเคราะห์ความเสี่ยง เปิดตัวเลือกตอนสร้างหรือปรับแต่งเพื่ออัปเดต',
    risksUpdated:
      lang === 'ru'
        ? 'Обновлено: {{date}}'
        : lang === 'en'
          ? 'Updated: {{date}}'
          : lang === 'es'
            ? 'Actualizado: {{date}}'
            : 'อัปเดต: {{date}}',
    risksEmpty:
      lang === 'ru'
        ? 'Проверка рисков еще не выполнялась. Отметьте опцию при генерации или уточнении, чтобы получить оценку.'
        : lang === 'en'
          ? 'Risk check has not been run yet. Enable the option when generating or refining.'
          : lang === 'es'
            ? 'Aún no se analizaron riesgos. Active la opción al generar o afinar.'
            : 'ยังไม่ได้ตรวจความเสี่ยง เปิดตัวเลือกตอนสร้างหรือปรับแต่ง',
    refineTitle:
      lang === 'ru'
        ? 'Уточнить документ с помощью AI'
        : lang === 'en'
          ? 'Refine the document with AI'
          : lang === 'es'
            ? 'Afinar el documento con IA'
            : 'ปรับแต่งเอกสารด้วย AI',
    refineHint:
      lang === 'ru'
        ? 'Опишите, какие изменения нужно внести в договор, и AI обновит документ'
        : lang === 'en'
          ? 'Describe the changes you want; the AI will update the document.'
          : lang === 'es'
            ? 'Describa los cambios deseados; la IA actualizará el documento.'
            : 'อธิบายการเปลี่ยนแปลงที่ต้องการ AI จะอัปเดตเอกสาร',
    refinePlaceholder:
      lang === 'ru'
        ? 'Например: Добавить пункт о штрафных санкциях за разглашение информации в размере 100,000 рублей'
        : lang === 'en'
          ? 'e.g. Add a clause on penalties for disclosure of 100,000 RUB.'
          : lang === 'es'
            ? 'p. ej., Añadir cláusula de multas por divulgación de 100.000 RUB.'
            : 'เช่น เพิ่มข้อกำหนดค่าปรับการเปิดเผยข้อมูล 100,000 รูเบิล',
    riskTooltipRefine:
      lang === 'ru'
        ? 'Включите, чтобы AI проанализировал обновленный договор и подсветил возможные риски.'
        : lang === 'en'
          ? 'Enable so the AI analyzes the updated contract for risks.'
          : lang === 'es'
            ? 'Active para que la IA analice el contrato actualizado en busca de riesgos.'
            : 'เปิดเพื่อให้ AI วิเคราะห์สัญญาที่อัปเดตหาความเสี่ยง',
    applyChanges:
      lang === 'ru'
        ? 'Применить изменения'
        : lang === 'en'
          ? 'Apply changes'
          : lang === 'es'
            ? 'Aplicar cambios'
            : 'ใช้การเปลี่ยนแปลง',
    aiWorking:
      lang === 'ru' ? 'AI обрабатывает...' : lang === 'en' ? 'AI is working...' : lang === 'es' ? 'La IA está trabajando...' : 'AI กำลังประมวลผล...',
    aiDisclaimerBold:
      lang === 'ru'
        ? 'Это договор, сгенерированный через ИИ.'
        : lang === 'en'
          ? 'This contract was generated with AI.'
          : lang === 'es'
            ? 'Este contrato fue generado con IA.'
            : 'สัญญานี้สร้างด้วย AI',
    aiDisclaimerText:
      lang === 'ru'
        ? 'Вы можете редактировать его напрямую в редакторе ниже или использовать AI для автоматических изменений через кнопку «Уточнить с AI». Рекомендована консультация с юристом.'
        : lang === 'en'
          ? 'You can edit it below or use “Refine with AI” for automatic changes. Consult a lawyer when needed.'
          : lang === 'es'
            ? 'Puede editarlo abajo o usar “Afinar con IA”. Consulte a un abogado si es necesario.'
            : 'แก้ไขด้านล่างหรือใช้ “ปรับแต่งด้วย AI” ปรึกษาทนายความเมื่อจำเป็น',
    filledFieldsTitle:
      lang === 'ru'
        ? 'Заполненные поля'
        : lang === 'en'
          ? 'Filled fields'
          : lang === 'es'
            ? 'Campos completados'
            : 'ฟิลด์ที่กรอกแล้ว',
    saveFields:
      lang === 'ru'
        ? 'Сохранить поля'
        : lang === 'en'
          ? 'Save fields'
          : lang === 'es'
            ? 'Guardar campos'
            : 'บันทึกฟิลด์',
    sectionsTitle:
      lang === 'ru'
        ? 'Разделы договора'
        : lang === 'en'
          ? 'Contract sections'
          : lang === 'es'
            ? 'Secciones del contrato'
            : 'หัวข้อในสัญญา',
    saveSections:
      lang === 'ru'
        ? 'Сохранить разделы'
        : lang === 'en'
          ? 'Save sections'
          : lang === 'es'
            ? 'Guardar secciones'
            : 'บันทึกหัวข้อ',
    sectionsHidden:
      lang === 'ru'
        ? 'Разделы скрыты и не участвуют в документе.'
        : lang === 'en'
          ? 'Sections are hidden and not included in the document.'
          : lang === 'es'
            ? 'Las secciones están ocultas y no se incluyen en el documento.'
            : 'หัวข้อถูกซ่อนและไม่อยู่ในเอกสาร',
    sectionsUpsell:
      lang === 'ru'
        ? 'Настройка разделов доступна на платных тарифах.'
        : lang === 'en'
          ? 'Section customization is available on paid plans.'
          : lang === 'es'
            ? 'Personalizar secciones está disponible en planes de pago.'
            : 'การปรับหัวข้อใช้ได้ในแพ็กเกจแบบชำระเงิน',
    docIdLine:
      lang === 'ru'
        ? 'ID документа: {{id}} | Последнее обновление: {{date}}'
        : lang === 'en'
          ? 'Document ID: {{id}} | Last updated: {{date}}'
          : lang === 'es'
            ? 'ID del documento: {{id}} | Última actualización: {{date}}'
            : 'รหัสเอกสาร: {{id}} | อัปเดตล่าสุด: {{date}}',
    autoSaved:
      lang === 'ru'
        ? 'Изменения сохраняются автоматически'
        : lang === 'en'
          ? 'Changes save automatically'
          : lang === 'es'
            ? 'Los cambios se guardan automáticamente'
            : 'บันทึกการเปลี่ยนแปลงอัตโนมัติ',
    snackUpdatedAi:
      lang === 'ru'
        ? 'Документ успешно обновлен через AI'
        : lang === 'en'
          ? 'Document updated with AI'
          : lang === 'es'
            ? 'Documento actualizado con IA'
            : 'อัปเดตเอกสารด้วย AI แล้ว',
    snackUpdateError:
      lang === 'ru'
        ? 'Ошибка при обновлении документа'
        : lang === 'en'
          ? 'Error updating document'
          : lang === 'es'
            ? 'Error al actualizar el documento'
            : 'อัปเดตเอกสารไม่สำเร็จ',
    snackRenamed: lang === 'ru' ? 'Название договора обновлено' : lang === 'en' ? 'Title updated' : lang === 'es' ? 'Título actualizado' : 'อัปเดตชื่อแล้ว',
    snackRenameError:
      lang === 'ru'
        ? 'Не удалось обновить название'
        : lang === 'en'
          ? 'Could not update title'
          : lang === 'es'
            ? 'No se pudo actualizar el título'
            : 'อัปเดตชื่อไม่สำเร็จ',
    deleteConfirm:
      lang === 'ru'
        ? 'Удалить договор? Это действие нельзя отменить.'
        : lang === 'en'
          ? 'Delete this contract? This cannot be undone.'
          : lang === 'es'
            ? '¿Eliminar este contrato? No se puede deshacer.'
            : 'ลบสัญญานี้? ย้อนกลับไม่ได้',
    snackDeleted:
      lang === 'ru' ? 'Договор удален' : lang === 'en' ? 'Contract deleted' : lang === 'es' ? 'Contrato eliminado' : 'ลบสัญญาแล้ว',
    snackDeleteError:
      lang === 'ru'
        ? 'Не удалось удалить договор'
        : lang === 'en'
          ? 'Could not delete contract'
          : lang === 'es'
            ? 'No se pudo eliminar el contrato'
            : 'ลบสัญญาไม่สำเร็จ',
    snackStatusOk: lang === 'ru' ? 'Статус обновлен' : lang === 'en' ? 'Status updated' : lang === 'es' ? 'Estado actualizado' : 'อัปเดตสถานะแล้ว',
    snackStatusErr:
      lang === 'ru'
        ? 'Не удалось обновить статус'
        : lang === 'en'
          ? 'Could not update status'
          : lang === 'es'
            ? 'No se pudo actualizar el estado'
            : 'อัปเดตสถานะไม่สำเร็จ',
    snackSaveErr:
      lang === 'ru'
        ? 'Не удалось сохранить изменения'
        : lang === 'en'
          ? 'Could not save changes'
          : lang === 'es'
            ? 'No se pudieron guardar los cambios'
            : 'บันทึกการเปลี่ยนแปลงไม่สำเร็จ',
    snackExportOk:
      lang === 'ru'
        ? 'Файл {{fmt}} успешно загружен'
        : lang === 'en'
          ? '{{fmt}} file downloaded'
          : lang === 'es'
            ? 'Archivo {{fmt}} descargado'
            : 'ดาวน์โหลดไฟล์ {{fmt}} แล้ว',
    snackExportErr:
      lang === 'ru'
        ? 'Ошибка при экспорте в {{fmt}}'
        : lang === 'en'
          ? 'Export to {{fmt}} failed'
          : lang === 'es'
            ? 'Error al exportar a {{fmt}}'
            : 'ส่งออก {{fmt}} ไม่สำเร็จ',
    snackFieldsOk:
      lang === 'ru' ? 'Поля договора сохранены' : lang === 'en' ? 'Fields saved' : lang === 'es' ? 'Campos guardados' : 'บันทึกฟิลด์แล้ว',
    snackFieldsErr:
      lang === 'ru'
        ? 'Не удалось сохранить поля'
        : lang === 'en'
          ? 'Could not save fields'
          : lang === 'es'
            ? 'No se pudieron guardar los campos'
            : 'บันทึกฟิลด์ไม่สำเร็จ',
    snackSectionsOk:
      lang === 'ru'
        ? 'Разделы договора сохранены'
        : lang === 'en'
          ? 'Sections saved'
          : lang === 'es'
            ? 'Secciones guardadas'
            : 'บันทึกหัวข้อแล้ว',
    snackSectionsErr:
      lang === 'ru'
        ? 'Не удалось сохранить разделы'
        : lang === 'en'
          ? 'Could not save sections'
          : lang === 'es'
            ? 'No se pudieron guardar las secciones'
            : 'บันทึกหัวข้อไม่สำเร็จ',
    snackSaved:
      lang === 'ru'
        ? 'Изменения сохранены автоматически'
        : lang === 'en'
          ? 'Changes saved automatically'
          : lang === 'es'
            ? 'Cambios guardados automáticamente'
            : 'บันทึกการเปลี่ยนแปลงอัตโนมัติ',
  },
});

for (const lang of ['ru', 'en', 'es', 'th']) {
  const dir = path.join(base, lang);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'contracts.json'), JSON.stringify(pack(lang), null, 2), 'utf8');
}

console.log('contracts.json written for ru, en, es, th');
