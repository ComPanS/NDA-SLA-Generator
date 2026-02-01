import { Router } from 'express';
import { prisma } from '../config/prisma';
import { signToken, verifyToken } from '../lib/jwt';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import {
  buildYandexAuthUrl,
  createYandexState,
  exchangeCodeForToken,
  fetchYandexProfile,
  verifyYandexState,
  YandexProfile,
} from '../lib/yandexOauth';

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

async function upsertYandexUser(profile: YandexProfile) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ yandexId: profile.id }, { email: profile.email }],
    },
  });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          yandexId: existing.yandexId ?? profile.id,
          displayName: profile.displayName ?? existing.displayName,
          avatarUrl: profile.avatarUrl ?? existing.avatarUrl,
        },
      })
    : await prisma.user.create({
        data: {
          email: profile.email,
          yandexId: profile.id,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        },
      });

  return user;
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
  if (!user.hashedPassword) {
    return res.status(400).json({ detail: 'Password login unavailable for this account' });
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

router.get('/yandex/url', (req, res) => {
  try {
    const state = createYandexState();
    const url = buildYandexAuthUrl(state);
    return res.json({ url, state });
  } catch (error) {
    return res.status(400).json({ detail: (error as Error).message });
  }
});

router.post('/yandex/callback', async (req, res) => {
  const schema = z.object({
    code: z.string(),
    state: z.string(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: 'Invalid payload' });
  }

  const { code, state } = parsed.data;
  if (!verifyYandexState(state)) {
    return res.status(400).json({ detail: 'Invalid state' });
  }

  try {
    const accessToken = await exchangeCodeForToken(code);
    const profile = await fetchYandexProfile(accessToken);
    const user = await upsertYandexUser(profile);

    return res.json(tokenPair(user.id));
  } catch (error) {
    return res.status(400).json({ detail: (error as Error).message });
  }
});

router.post('/yandex/suggest', async (req, res) => {
  const schema = z.object({
    access_token: z.string(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: 'Invalid payload' });
  }

  try {
    const profile = await fetchYandexProfile(parsed.data.access_token);
    const user = await upsertYandexUser(profile);
    return res.json(tokenPair(user.id));
  } catch (error) {
    return res.status(400).json({ detail: (error as Error).message });
  }
});

export default router;
