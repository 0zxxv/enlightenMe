import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
} from './auth.schemas.js';
import * as authService from './auth.service.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const data = await authService.refresh(req.body.refreshToken);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', validate(refreshSchema), async (req, res, next) => {
  try {
    const data = await authService.logout(req.body.refreshToken);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const data = await authService.forgotPassword(req.body.email);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const data = await authService.me(req.user!.sub);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
