import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { toTemplate } from '../lib/mappers';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const fieldInput = z.object({
  label: z.string().min(1),
  key: z.string().min(1),
  default_value: z.string().optional(),
  order: z.number().int().optional(),
});

const sectionInput = z.object({
  title: z.string().min(1),
  order: z.number().int().optional(),
});

const groupInput = z.object({
  label: z.string().min(1),
  order: z.number().int().optional(),
  fields: z.array(fieldInput).default([]),
});

const templateInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  is_active: z.boolean().optional(),
  groups: z.array(groupInput).default([]),
  sections: z.array(sectionInput).default([]),
});

router.get('/', async (_req, res) => {
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      groups: {
        orderBy: { order: 'asc' },
        include: { fields: { orderBy: { order: 'asc' } } },
      },
      sections: { orderBy: { order: 'asc' } },
    },
  });
  return res.json(templates.map(toTemplate));
});

router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  const tpl = await prisma.template.findUnique({
    where: { id: String(req.params.id) },
    include: {
      groups: {
        orderBy: { order: 'asc' },
        include: { fields: { orderBy: { order: 'asc' } } },
      },
      sections: { orderBy: { order: 'asc' } },
    },
  });
  if (!tpl) {
    return res.status(404).json({ detail: 'Template not found' });
  }
  return res.json({ template: toTemplate(tpl) });
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  const parsed = templateInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }
  const { name, description, content, is_active, groups } = parsed.data;

  try {
    const template = await prisma.$transaction(async (tx) => {
      const created = await tx.template.create({
        data: {
          name,
          description,
          content,
          isActive: is_active ?? true,
          createdById: req.userId,
        },
      });

      if (groups.length) {
        for (const [idx, group] of groups.entries()) {
          const createdGroup = await tx.templateGroup.create({
            data: {
              templateId: created.id,
              label: group.label,
              order: group.order ?? idx,
            },
          });

          if (group.fields.length) {
            await tx.templateField.createMany({
              data: group.fields.map((f, fIdx) => ({
                templateId: created.id,
                groupId: createdGroup.id,
                label: f.label,
                key: f.key,
                defaultValue: f.default_value,
                order: f.order ?? fIdx,
              })),
            });
          }
        }
      }

      if (parsed.data.sections.length) {
        await tx.templateSection.createMany({
          data: parsed.data.sections.map((s, sIdx) => ({
            templateId: created.id,
            title: s.title,
            order: s.order ?? sIdx,
          })),
        });
      }

      return tx.template.findUnique({
        where: { id: created.id },
        include: {
          groups: {
            orderBy: { order: 'asc' },
            include: { fields: { orderBy: { order: 'asc' } } },
          },
          sections: { orderBy: { order: 'asc' } },
        },
      });
    });
    if (!template) {
      return res.status(500).json({ detail: 'Failed to load created template' });
    }
    return res.status(201).json({ template: toTemplate(template) });
  } catch (error) {
    console.error('Create template error', error);
    return res.status(500).json({ detail: 'Failed to create template' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  const parsed = templateInput.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }
  const templateId = String(req.params.id);
  const { name, description, content, is_active, groups, sections } = parsed.data;
  const shouldReplaceGroups = Array.isArray(groups);
  const shouldReplaceSections = Array.isArray(sections);

  const existing = await prisma.template.findUnique({ where: { id: templateId } });
  if (!existing) {
    return res.status(404).json({ detail: 'Template not found' });
  }

  try {
    const template = await prisma.$transaction(async (tx) => {
      await tx.template.update({
        where: { id: templateId },
        data: {
          name: name ?? existing.name,
          description: description ?? existing.description,
          content: content ?? existing.content,
          isActive: is_active ?? existing.isActive,
        },
      });

      if (shouldReplaceGroups) {
        await tx.templateField.deleteMany({ where: { templateId } });
        await tx.templateGroup.deleteMany({ where: { templateId } });
      }
      if (shouldReplaceSections) {
        await tx.templateSection.deleteMany({ where: { templateId } });
      }

      if (groups && groups.length) {
        for (const [idx, group] of groups.entries()) {
          const createdGroup = await tx.templateGroup.create({
            data: {
              templateId,
              label: group.label,
              order: group.order ?? idx,
            },
          });

          if (group.fields.length) {
            await tx.templateField.createMany({
              data: group.fields.map((f, fIdx) => ({
                templateId,
                groupId: createdGroup.id,
                label: f.label,
                key: f.key,
                defaultValue: f.default_value,
                order: f.order ?? fIdx,
              })),
            });
          }
        }
      }

      if (sections && sections.length) {
        await tx.templateSection.createMany({
          data: sections.map((s, sIdx) => ({
            templateId,
            title: s.title,
            order: s.order ?? sIdx,
          })),
        });
      }

      return tx.template.findUnique({
        where: { id: templateId },
        include: {
          groups: {
            orderBy: { order: 'asc' },
            include: { fields: { orderBy: { order: 'asc' } } },
          },
          sections: { orderBy: { order: 'asc' } },
        },
      });
    });

    if (!template) {
      return res.status(500).json({ detail: 'Failed to load template' });
    }
    return res.json({ template: toTemplate(template) });
  } catch (error) {
    console.error('Update template error', error);
    return res.status(500).json({ detail: 'Failed to update template' });
  }
});

export default router;
