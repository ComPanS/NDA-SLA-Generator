import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { signAdminToken, verifyAdminToken } from '../lib/jwt';

const router = Router();

const loginSchema = z.object({
  login: z.string(),
  password: z.string(),
});

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  const token = auth.substring('Bearer '.length);
  try {
    verifyAdminToken(token);
    next();
  } catch {
    return res.status(401).json({ detail: 'Invalid token' });
  }
}

router.post('/login', (req: Request, res: Response) => {
  if (!env.adminLogin || !env.adminPassword) {
    return res.status(500).json({ detail: 'Admin credentials are not configured' });
  }

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: 'Invalid payload' });
  }

  const { login, password } = parsed.data;
  if (login !== env.adminLogin || password !== env.adminPassword) {
    return res.status(401).json({ detail: 'Invalid credentials' });
  }

  const token = signAdminToken();
  return res.json({
    token,
    token_type: 'bearer' as const,
    expires_in: env.adminTokenExpiresMinutes * 60,
  });
});

router.get('/overview', requireAdmin, async (_req: Request, res: Response) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    usersTotal,
    activeUsers,
    adminUsers,
    newUsersLast30d,
    guestsTotal,
    documentsTotal,
    subscriptionsTotal,
    documentsByStatus,
    subscriptionsByPlanStatus,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isAdmin: true } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.guestAccess.count(),
    prisma.document.count(),
    prisma.subscription.count(),
    prisma.document.groupBy({
      by: ['status'],
      _count: { _all: true },
      orderBy: { status: 'asc' },
    }),
    prisma.subscription.groupBy({
      by: ['plan', 'status'],
      _count: { _all: true },
      orderBy: [{ plan: 'asc' }, { status: 'asc' }],
    }),
  ]);

  const documentsByStatusMap = documentsByStatus.reduce<Record<string, number>>((acc, row) => {
    const count = typeof row._count === 'object' ? row._count._all ?? 0 : 0;
    acc[row.status] = count;
    return acc;
  }, {});

  const subscriptionsByPlanStatusList = subscriptionsByPlanStatus.map((row) => ({
    plan: row.plan,
    status: row.status,
    count: typeof row._count === 'object' ? row._count._all ?? 0 : 0,
  }));

  return res.json({
    users: {
      total: usersTotal,
      active: activeUsers,
      admin: adminUsers,
      new_last_30d: newUsersLast30d,
    },
    documents: {
      total: documentsTotal,
      by_status: documentsByStatusMap,
    },
    subscriptions: {
      total: subscriptionsTotal,
      by_plan_status: subscriptionsByPlanStatusList,
    },
    guests: {
      total: guestsTotal,
    },
  });
});

router.get('/users', requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      isActive: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          documents: true,
          subscriptions: true,
        },
      },
    },
  });

  return res.json({
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      documentsCount: user._count.documents,
      subscriptionsCount: user._count.subscriptions,
    })),
  });
});

export default router;
