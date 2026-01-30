import { Router } from 'express';
import { prisma } from '../config/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { toBilling } from '../lib/mappers';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const sub = await prisma.subscription.findFirst({
    where: { userId: req.userId },
    orderBy: { updatedAt: 'desc' },
  });
  return res.json(toBilling(sub));
});

export default router;
