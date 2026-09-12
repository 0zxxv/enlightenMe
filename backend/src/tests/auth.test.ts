import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

describe('auth', () => {
  it('login rejects invalid credentials when DB is available', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      console.warn('Skipping auth DB test — database unavailable');
      return;
    }

    const app = createApp();
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@dars.app',
      password: 'wrong-password',
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('register validates body without needing DB success path', async () => {
    const app = createApp();
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
