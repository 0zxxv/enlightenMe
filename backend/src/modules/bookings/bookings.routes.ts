import { Role } from '@prisma/client';
import { Router } from 'express';
import { paramId } from '../../lib/params.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createBookingSchema } from './bookings.service.js';
import * as bookingsService from './bookings.service.js';

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

bookingsRouter.post('/', validate(createBookingSchema), async (req: AuthedRequest, res, next) => {
  try {
    const data = await bookingsService.createBooking(req.user!.sub, req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get('/mine', async (req: AuthedRequest, res, next) => {
  try {
    const data = await bookingsService.listMyBookings(req.user!.sub);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const data = await bookingsService.getBookingById(
      paramId(req.params.id),
      req.user!.sub,
      req.user!.role === Role.Admin,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.post('/:id/cancel', async (req: AuthedRequest, res, next) => {
  try {
    const data = await bookingsService.cancelBooking(
      paramId(req.params.id),
      req.user!.sub,
      req.user!.role === Role.Admin,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
