import { ProviderType, Role } from '@prisma/client';
import { env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';
import {
  hashToken,
  parseExpiryToDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../lib/jwt.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { prisma } from '../../lib/prisma.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

function publicUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  language: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    language: user.language,
    createdAt: user.createdAt,
  };
}

async function issueTokens(user: { id: string; email: string; role: Role }) {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ sub: user.id });
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRES),
    },
  });
  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) {
    throw new AppError('EMAIL_TAKEN', 'Email is already registered', 409);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role,
      language: input.language ?? 'en',
      ...(input.role === Role.Student
        ? {
            studentProfile: {
              create: {
                ...(input.learnerType ? { learnerType: input.learnerType } : {}),
              },
            },
          }
        : {}),
      ...(input.role === Role.Parent ? { parentProfile: { create: {} } } : {}),
      ...(input.role === Role.Tutor
        ? {
            tutorProfile: {
              create: {
                bio: '',
                expertise: [],
                providerType: input.providerType ?? ProviderType.Teacher,
              },
            },
          }
        : {}),
    },
  });

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }
  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('INVALID_TOKEN', 'Invalid refresh token', 401);
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: {
      userId: payload.sub,
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!stored) {
    throw new AppError('INVALID_TOKEN', 'Refresh token revoked or expired', 401);
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return { success: true };
}

export async function forgotPassword(_email: string) {
  return {
    message: 'If an account exists for that email, password reset instructions will be sent.',
  };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: true,
      parentProfile: true,
      tutorProfile: true,
    },
  });
  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }
  return {
    ...publicUser(user),
    studentProfile: user.studentProfile,
    parentProfile: user.parentProfile,
    tutorProfile: user.tutorProfile,
  };
}
