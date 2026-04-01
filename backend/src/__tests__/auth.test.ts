import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { createApp } from '../index';
import { prisma } from '../config/prisma';
import * as mailer from '../lib/mailer';

const app = createApp();
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123';
const TEST_TIMEOUT_MS = 30_000;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  vi.spyOn(mailer, 'sendVerificationEmail').mockResolvedValue(undefined);
});

beforeEach(async () => {
  await prisma.emailVerificationCode.deleteMany({ where: { code: { not: '' } } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
});

afterAll(async () => {
  await prisma.emailVerificationCode.deleteMany({ where: { code: { not: '' } } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

describe('auth flow', () => {
  it('registers, verifies and logs in user', async () => {
    const registerResp = await request(app)
      .post('/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(201);

    expect(registerResp.body).toHaveProperty('requires_verification', true);
    const userAfterRegister = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    expect(userAfterRegister).toBeNull();

    const codeRow = await prisma.emailVerificationCode.findFirst({
      where: { email: TEST_EMAIL },
      orderBy: { createdAt: 'desc' },
    });
    expect(codeRow?.code).toBeTruthy();

    const verifyResp = await request(app)
      .post('/auth/verify')
      .send({ email: TEST_EMAIL, code: codeRow?.code })
      .expect(200);

    expect(verifyResp.body).toHaveProperty('access_token');

    const loginResp = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(200);

    expect(loginResp.body).toHaveProperty('access_token');
    expect(loginResp.body).toHaveProperty('refresh_token');
  }, TEST_TIMEOUT_MS);

  it('blocks login until email verified', async () => {
    await request(app).post('/auth/register').send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(403);
  }, TEST_TIMEOUT_MS);
});

describe('password reset', () => {
  let lastResetLink: string | null = null;

  beforeEach(() => {
    lastResetLink = null;
    vi.spyOn(mailer, 'sendPasswordResetEmail').mockImplementation(async (_to, link) => {
      lastResetLink = link;
    });
  });

  afterEach(() => {
    vi.mocked(mailer.sendPasswordResetEmail).mockRestore();
  });

  it('sends reset link and allows login with new password', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(201);
    const codeRow = await prisma.emailVerificationCode.findFirst({
      where: { email: TEST_EMAIL },
      orderBy: { createdAt: 'desc' },
    });
    await request(app)
      .post('/auth/verify')
      .send({ email: TEST_EMAIL, code: codeRow?.code })
      .expect(200);

    await request(app).post('/auth/forgot-password').send({ email: TEST_EMAIL }).expect(200);
    expect(mailer.sendPasswordResetEmail).toHaveBeenCalled();
    expect(lastResetLink).toBeTruthy();
    const token = new URL(lastResetLink!).searchParams.get('token');
    expect(token).toBeTruthy();

    const NEW_PASSWORD = 'Newpassword1';
    await request(app)
      .post('/auth/reset-password')
      .send({ token, password: NEW_PASSWORD })
      .expect(200);

    await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: NEW_PASSWORD })
      .expect(200);
    await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(400);
  }, TEST_TIMEOUT_MS);

  it('returns ok for unknown email without sending mail', async () => {
    await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'nobody@example.com' })
      .expect(200);
    expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
  }, TEST_TIMEOUT_MS);

  it('rejects reused reset token', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(201);
    const codeRow = await prisma.emailVerificationCode.findFirst({
      where: { email: TEST_EMAIL },
      orderBy: { createdAt: 'desc' },
    });
    await request(app)
      .post('/auth/verify')
      .send({ email: TEST_EMAIL, code: codeRow?.code })
      .expect(200);

    await request(app).post('/auth/forgot-password').send({ email: TEST_EMAIL }).expect(200);
    const token = new URL(lastResetLink!).searchParams.get('token')!;
    await request(app)
      .post('/auth/reset-password')
      .send({ token, password: 'Newpassword1' })
      .expect(200);
    await request(app)
      .post('/auth/reset-password')
      .send({ token, password: 'Otherpass1' })
      .expect(400);
  }, TEST_TIMEOUT_MS);
});
