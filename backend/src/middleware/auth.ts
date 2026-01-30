import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  const token = auth.substring('Bearer '.length);
  try {
    const userId = verifyToken(token, 'access');
    req.userId = userId;
    next();
  } catch {
    return res.status(401).json({ detail: 'Invalid token' });
  }
}
