import { PrismaClient } from '@prisma/client';
import { isEncrypted } from '../lib/crypto';

const prisma = new PrismaClient();

type IdRow = { id: string };
type DocumentRow = IdRow & { title: string | null };
type VersionRow = IdRow & { content: string | null };
type RiskRow = IdRow & { summary: string | null };
type ContractFieldRow = IdRow & { value: string | null; groupLabel: string | null; label: string | null };
type SectionRow = IdRow & { title: string | null };
type TemplateRow = IdRow & { content: string | null; description: string | null };
type TemplateGroupRow = IdRow & { label: string | null };
type TemplateFieldRow = IdRow & { label: string | null; defaultValue: string | null };

async function processDocuments() {
  let cursor: string | null = null;
  const batch = 100;
  while (true) {
    const docs: DocumentRow[] = await prisma.document.findMany({
      select: { id: true, title: true },
      orderBy: { id: 'asc' },
      take: batch,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!docs.length) break;
    for (const doc of docs) {
      if (!doc.title || isEncrypted(doc.title)) {
        cursor = doc.id;
        continue;
      }
      await prisma.document.update({
        where: { id: doc.id },
        data: { title: doc.title },
      });
      cursor = doc.id;
    }
  }
}

async function processDocumentVersions() {
  let cursor: string | null = null;
  const batch = 200;
  while (true) {
    const versions: VersionRow[] = await prisma.documentVersion.findMany({
      select: { id: true, content: true },
      orderBy: { id: 'asc' },
      take: batch,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!versions.length) break;
    for (const v of versions) {
      if (!v.content || isEncrypted(v.content)) {
        cursor = v.id;
        continue;
      }
      await prisma.documentVersion.update({
        where: { id: v.id },
        data: { content: v.content },
      });
      cursor = v.id;
    }
  }
}

async function processRiskAssessments() {
  let cursor: string | null = null;
  const batch = 200;
  while (true) {
    const risks: RiskRow[] = await prisma.riskAssessment.findMany({
      select: { id: true, summary: true },
      orderBy: { id: 'asc' },
      take: batch,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!risks.length) break;
    for (const r of risks) {
      if (!r.summary || isEncrypted(r.summary)) {
        cursor = r.id;
        continue;
      }
      await prisma.riskAssessment.update({
        where: { id: r.id },
        data: { summary: r.summary },
      });
      cursor = r.id;
    }
  }
}

async function processContractFields() {
  let cursor: string | null = null;
  const batch = 200;
  while (true) {
    const fields: ContractFieldRow[] = await prisma.contractField.findMany({
      select: { id: true, value: true, groupLabel: true, label: true },
      orderBy: { id: 'asc' },
      take: batch,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!fields.length) break;
    for (const f of fields) {
      const needsValue = f.value && !isEncrypted(f.value);
      const needsGroup = f.groupLabel && !isEncrypted(f.groupLabel);
      const needsLabel = f.label && !isEncrypted(f.label);
      if (!needsValue && !needsGroup && !needsLabel) {
        cursor = f.id;
        continue;
      }
      await prisma.contractField.update({
        where: { id: f.id },
        data: {
          value: needsValue && f.value ? f.value : undefined,
          groupLabel: needsGroup && f.groupLabel ? f.groupLabel : undefined,
          label: needsLabel && f.label ? f.label : undefined,
        },
      });
      cursor = f.id;
    }
  }
}

async function processContractSections() {
  let cursor: string | null = null;
  const batch = 200;
  while (true) {
    const sections: SectionRow[] = await prisma.contractSection.findMany({
      select: { id: true, title: true },
      orderBy: { id: 'asc' },
      take: batch,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!sections.length) break;
    for (const s of sections) {
      if (!s.title || isEncrypted(s.title)) {
        cursor = s.id;
        continue;
      }
      await prisma.contractSection.update({
        where: { id: s.id },
        data: { title: s.title },
      });
      cursor = s.id;
    }
  }
}

async function processTemplates() {
  let cursor: string | null = null;
  const batch = 100;
  while (true) {
    const templates: TemplateRow[] = await prisma.template.findMany({
      select: { id: true, content: true, description: true },
      orderBy: { id: 'asc' },
      take: batch,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!templates.length) break;
    for (const t of templates) {
      const needsContent = t.content && !isEncrypted(t.content);
      const needsDesc = t.description && !isEncrypted(t.description);
      if (!needsContent && !needsDesc) {
        cursor = t.id;
        continue;
      }
      await prisma.template.update({
        where: { id: t.id },
        data: {
          content: needsContent && t.content ? t.content : undefined,
          description: needsDesc && t.description ? t.description : undefined,
        },
      });
      cursor = t.id;
    }
  }
}

async function processTemplateGroups() {
  let cursor: string | null = null;
  const batch = 200;
  while (true) {
    const groups: TemplateGroupRow[] = await prisma.templateGroup.findMany({
      select: { id: true, label: true },
      orderBy: { id: 'asc' },
      take: batch,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!groups.length) break;
    for (const g of groups) {
      if (!g.label || isEncrypted(g.label)) {
        cursor = g.id;
        continue;
      }
      await prisma.templateGroup.update({
        where: { id: g.id },
        data: { label: g.label },
      });
      cursor = g.id;
    }
  }
}

async function processTemplateFields() {
  let cursor: string | null = null;
  const batch = 200;
  while (true) {
    const fields: TemplateFieldRow[] = await prisma.templateField.findMany({
      select: { id: true, label: true, defaultValue: true },
      orderBy: { id: 'asc' },
      take: batch,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!fields.length) break;
    for (const f of fields) {
      const needsLabel = f.label && !isEncrypted(f.label);
      const needsDefault = f.defaultValue && !isEncrypted(f.defaultValue);
      if (!needsLabel && !needsDefault) {
        cursor = f.id;
        continue;
      }
      await prisma.templateField.update({
        where: { id: f.id },
        data: {
          label: needsLabel && f.label ? f.label : undefined,
          defaultValue: needsDefault && f.defaultValue ? f.defaultValue : undefined,
        },
      });
      cursor = f.id;
    }
  }
}

async function processTemplateSections() {
  let cursor: string | null = null;
  const batch = 200;
  while (true) {
    const sections: SectionRow[] = await prisma.templateSection.findMany({
      select: { id: true, title: true },
      orderBy: { id: 'asc' },
      take: batch,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!sections.length) break;
    for (const s of sections) {
      if (!s.title || isEncrypted(s.title)) {
        cursor = s.id;
        continue;
      }
      await prisma.templateSection.update({
        where: { id: s.id },
        data: { title: s.title },
      });
      cursor = s.id;
    }
  }
}

async function main() {
  await processDocuments();
  await processDocumentVersions();
  await processRiskAssessments();
  await processContractFields();
  await processContractSections();
  await processTemplates();
  await processTemplateGroups();
  await processTemplateFields();
  await processTemplateSections();
}

main()
  .catch((err) => {
    console.error('Encryption backfill failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
