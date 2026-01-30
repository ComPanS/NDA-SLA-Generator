import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from '../index';
import { prisma } from '../config/prisma';

const app = createApp();
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
});

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

describe('auth flow', () => {
  it('registers and logs in user', async () => {
    const registerResp = await request(app)
      .post('/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(201);

    expect(registerResp.body).toHaveProperty('access_token');

    const loginResp = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(200);

    expect(loginResp.body).toHaveProperty('access_token');
    expect(loginResp.body).toHaveProperty('refresh_token');
  });
});
