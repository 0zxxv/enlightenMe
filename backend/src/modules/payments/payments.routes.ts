import { Router } from 'express';
import { paramId } from '../../lib/params.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createPaymentSchema } from './payments.service.js';
import * as paymentsService from './payments.service.js';

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

paymentsRouter.post(
  '/intent',
  validate(createPaymentSchema),
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await paymentsService.createPaymentIntent(req.user!.sub, req.body.bookingId);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

paymentsRouter.post('/:bookingId/confirm-stub', async (req: AuthedRequest, res, next) => {
  try {
    const data = await paymentsService.confirmStubPayment(
      req.user!.sub,
      paramId(req.params.bookingId),
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
