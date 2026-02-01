import { Router } from 'express';
import { prisma } from '../config/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

async function getNotice() {
  const existing = await prisma.systemNotice.findUnique({ where: { id: 'system_notice' } });
  if (existing) return existing;
  return prisma.systemNotice.create({
    data: { id: 'system_notice', message: '', enabled: false },
  });
}

router.get('/', requireAuth, async (_req, res) => {
  const notice = await getNotice();
  res.json({
    id: notice.id,
    message: notice.message,
    enabled: notice.enabled,
    updatedAt: notice.updatedAt,
  });
});

export default router;
