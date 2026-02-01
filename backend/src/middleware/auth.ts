import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { prisma } from '../config/prisma';

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  const token = auth.substring('Bearer '.length);
  try {
    const userId = verifyToken(token, 'access');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({ detail: 'Email not verified', code: 'email_not_verified' });
    }
    req.userId = userId;
    next();
  } catch {
    return res.status(401).json({ detail: 'Invalid token' });
  }
}
