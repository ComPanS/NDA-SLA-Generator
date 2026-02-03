import { Router } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        plan: true,
        status: true,
        expiresAt: true,
        updatedAt: true,
      },
    });

    return res.json({
      ...user,
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            expiresAt: subscription.expiresAt,
            updatedAt: subscription.updatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ detail: 'Failed to load profile' });
  }
});

router.delete('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    await prisma.$transaction(async (tx) => {
      const templates = await tx.template.findMany({
        where: { createdById: req.userId },
        select: { id: true },
      });
      const templateIds = templates.map((t) => t.id);

      if (templateIds.length > 0) {
        await tx.document.updateMany({
          where: { templateId: { in: templateIds } },
          data: { templateId: null },
        });

        await tx.template.deleteMany({ where: { id: { in: templateIds } } });
      }

      await tx.documentVersion.deleteMany({ where: { document: { ownerId: req.userId } } });
      await tx.document.deleteMany({ where: { ownerId: req.userId } });
      await tx.subscription.deleteMany({ where: { userId: req.userId } });
      await tx.payment.deleteMany({ where: { userId: req.userId } });
      await tx.usageRecord.deleteMany({ where: { userId: req.userId } });
      await tx.emailVerificationCode.deleteMany({ where: { email: user.email } });
      await tx.user.delete({ where: { id: req.userId } });
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ detail: 'Failed to delete account' });
  }
});

export default router;
