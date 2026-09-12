import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env.js';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: Role;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: { sub: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function parseExpiryToDate(expires: string): Date {
  const match = /^(\d+)([smhd])$/.exec(expires);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + amount * (multipliers[unit] ?? multipliers.d));
}
