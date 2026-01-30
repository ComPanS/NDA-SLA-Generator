import { Router } from 'express';
import { prisma } from '../config/prisma';
import { signToken, verifyToken } from '../lib/jwt';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function tokenPair(userId: string) {
  return {
    access_token: signToken(userId, 'access'),
    refresh_token: signToken(userId, 'refresh'),
    token_type: 'bearer' as const,
  };
}

router.post('/register', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(400).json({ detail: 'Email already taken' });
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, hashedPassword },
  });
  return res.status(201).json(tokenPair(user.id));
});

router.post('/login', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: 'Invalid payload' });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ detail: 'Invalid credentials' });
  }
  const ok = await bcrypt.compare(password, user.hashedPassword);
  if (!ok) {
    return res.status(400).json({ detail: 'Invalid credentials' });
  }
  return res.json(tokenPair(user.id));
});

router.post('/refresh', async (req, res) => {
  const schema = z.object({ refresh_token: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: 'Invalid payload' });
  }
  try {
    const userId = verifyToken(parsed.data.refresh_token, 'refresh');
    return res.json(tokenPair(userId));
  } catch {
    return res.status(401).json({ detail: 'Invalid refresh token' });
  }
});

export default router;
