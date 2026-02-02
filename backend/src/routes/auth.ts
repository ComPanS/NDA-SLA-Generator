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
import { env } from '../config/env';
import { sendVerificationEmail } from '../lib/mailer';

const router = Router();

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 'Password must include upper, lower, and number');

const credentialsSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(6),
});

const resendSchema = z.object({
  email: z.string().email(),
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
          emailVerified: true,
        },
      })
    : await prisma.user.create({
        data: {
          email: profile.email,
          yandexId: profile.id,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          emailVerified: true,
        },
      });

  return user;
}

const VERIFICATION_ATTEMPTS_LIMIT = 5;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createVerificationCode(email: string, hashedPassword: string) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + env.verificationCodeTtlMinutes * 60 * 1000);

  await prisma.emailVerificationCode.deleteMany({ where: { email } });
  await prisma.emailVerificationCode.create({
    data: { email, hashedPassword, code, expiresAt },
  });

  await sendVerificationEmail(email, code);
}

async function ensureCanResend(email: string) {
  const lastHour = new Date(Date.now() - 60 * 60 * 1000);
  const countLastHour = await prisma.emailVerificationCode.count({
    where: { email, createdAt: { gte: lastHour } },
  });
  if (countLastHour >= env.verificationResendMaxPerHour) {
    return 'too_many_requests';
  }

  const last = await prisma.emailVerificationCode.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });
  if (
    last &&
    Date.now() - last.createdAt.getTime() < env.verificationResendIntervalSeconds * 1000
  ) {
    return 'cooldown';
  }

  return null;
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

  try {
    await createVerificationCode(email, hashedPassword);
  } catch (error) {
    console.error('Send verification email error', error);
  }

  return res
    .status(201)
    .json({ requires_verification: true, email_verified: false });
});

router.post('/login', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: 'Invalid payload' });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const pending = await prisma.emailVerificationCode.findFirst({ where: { email } });
    if (pending) {
      return res.status(403).json({
        detail: 'Email not verified',
        code: 'email_not_verified',
        requires_verification: true,
      });
    }
    return res.status(400).json({ detail: 'Invalid credentials' });
  }
  if (!user.hashedPassword) {
    return res.status(400).json({ detail: 'Password login unavailable for this account' });
  }
  const ok = await bcrypt.compare(password, user.hashedPassword);
  if (!ok) {
    return res.status(400).json({ detail: 'Invalid credentials' });
  }
  if (!user.emailVerified) {
    try {
      const reason = await ensureCanResend(user.email);
      if (!reason) {
        const lastPending = await prisma.emailVerificationCode.findFirst({
          where: { email: user.email },
          orderBy: { createdAt: 'desc' },
        });
        const hashedPassword = lastPending?.hashedPassword || user.hashedPassword || '';
        if (hashedPassword) {
          await createVerificationCode(user.email, hashedPassword);
        }
      }
    } catch (error) {
      console.error('Auto resend verification error', error);
    }
    return res.status(403).json({
      detail: 'Email not verified',
      code: 'email_not_verified',
      requires_verification: true,
    });
  }

  return res.json({ ...tokenPair(user.id), email_verified: true });
});

router.post('/verify', async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: 'Invalid payload' });
  }

  const { email, code } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.emailVerified) {
    return res.json({ ...tokenPair(user.id), email_verified: true });
  }

  const record = await prisma.emailVerificationCode.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return res.status(400).json({ detail: 'Code not found or expired' });
  }

  const now = Date.now();
  if (record.expiresAt.getTime() < now) {
    await prisma.emailVerificationCode.deleteMany({ where: { email } });
    return res.status(400).json({ detail: 'Code expired' });
  }

  if (record.attempts >= VERIFICATION_ATTEMPTS_LIMIT) {
    return res.status(429).json({ detail: 'Too many attempts' });
  }

  if (record.code !== code) {
    await prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return res.status(400).json({ detail: 'Invalid code' });
  }

  const createdUser =
    user ||
    (await prisma.user.create({
      data: {
        email,
        hashedPassword: record.hashedPassword,
        emailVerified: true,
      },
    }));

  await prisma.emailVerificationCode.deleteMany({ where: { email } });

  return res.json({ ...tokenPair(createdUser.id), email_verified: true });
});

router.post('/resend', async (req, res) => {
  const parsed = resendSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: 'Invalid payload' });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.emailVerified) {
    return res.status(400).json({ detail: 'Already verified' });
  }

  const pending = await prisma.emailVerificationCode.findFirst({ where: { email } });
  if (!pending && !user) {
    return res.status(400).json({ detail: 'Registration not found' });
  }
  if (!pending && user && !user.hashedPassword) {
    return res.status(400).json({ detail: 'Verification not required for this account' });
  }

  const blockedReason = await ensureCanResend(email);
  if (blockedReason === 'too_many_requests') {
    return res.status(429).json({ detail: 'Too many requests. Try later.' });
  }
  if (blockedReason === 'cooldown') {
    return res.status(429).json({ detail: 'Please wait before requesting another code.' });
  }

  try {
    const hashedPassword = pending?.hashedPassword || user?.hashedPassword;
    if (!hashedPassword) {
      return res.status(400).json({ detail: 'Registration not found' });
    }
    await createVerificationCode(email, hashedPassword);
    return res.json({ ok: true });
  } catch (error) {
    console.error('Resend verification error', error);
    return res.status(500).json({ detail: 'Failed to send code' });
  }
});

router.post('/refresh', async (req, res) => {
  const schema = z.object({ refresh_token: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ detail: 'Invalid payload' });
  }
  try {
    const userId = verifyToken(parsed.data.refresh_token, 'refresh');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid refresh token' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({ detail: 'Email not verified', code: 'email_not_verified' });
    }
    return res.json({ ...tokenPair(userId), email_verified: true });
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

    return res.json({ ...tokenPair(user.id), email_verified: true });
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
    return res.json({ ...tokenPair(user.id), email_verified: true });
  } catch (error) {
    return res.status(400).json({ detail: (error as Error).message });
  }
});

export default router;
