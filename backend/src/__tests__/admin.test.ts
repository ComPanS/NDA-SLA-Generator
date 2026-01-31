import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { prisma } from '../config/prisma';

let app: Express;
const TEST_LOGIN = 'admin';
const TEST_PASSWORD = 'secret';
const ADMIN_PATH = '/internal-admin';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.ADMIN_LOGIN = TEST_LOGIN;
  process.env.ADMIN_PASSWORD = TEST_PASSWORD;
  process.env.ADMIN_ROUTE = ADMIN_PATH;
  process.env.ADMIN_TOKEN_EXPIRES_MINUTES = '5';

  const mod = await import('../index');
  app = mod.createApp();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('admin auth', () => {
  it('rejects invalid credentials', async () => {
    await request(app)
      .post(`${ADMIN_PATH}/login`)
      .send({ login: 'wrong', password: 'nope' })
      .expect(401);
  });

  it('logs in and fetches overview', async () => {
    const loginResp = await request(app)
      .post(`${ADMIN_PATH}/login`)
      .send({ login: TEST_LOGIN, password: TEST_PASSWORD })
      .expect(200);

    expect(loginResp.body).toHaveProperty('token');
    const token = loginResp.body.token as string;

    await request(app)
      .get(`${ADMIN_PATH}/overview`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
