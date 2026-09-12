import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import { verifyAccessToken, type AccessTokenPayload } from '../lib/jwt.js';

export type AuthedRequest = Request & { user?: AccessTokenPayload };

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
  }
  try {
    const token = header.slice(7);
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN', 'Insufficient permissions', 403));
    }
    return next();
  };
}
