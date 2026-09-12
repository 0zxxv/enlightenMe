import { BookingStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const reviewsRouter = Router();

reviewsRouter.post(
  '/',
  requireAuth,
  validate(createReviewSchema),
  async (req: AuthedRequest, res, next) => {
    try {
      const { bookingId, rating, comment } = req.body as z.infer<typeof createReviewSchema>;
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { course: true, review: true },
      });
      if (!booking) {
        throw new AppError('NOT_FOUND', 'Booking not found', 404);
      }
      if (booking.userId !== req.user!.sub) {
        throw new AppError('FORBIDDEN', 'You can only review your own bookings', 403);
      }
      if (booking.status !== BookingStatus.Completed) {
        throw new AppError('INVALID_STATUS', 'Only completed bookings can be reviewed', 400);
      }
      if (booking.review) {
        throw new AppError('ALREADY_REVIEWED', 'Booking already has a review', 409);
      }

      let tutorProfileId: string | undefined;
      if (booking.course.tutorId) {
        const tutorProfile = await prisma.tutorProfile.findUnique({
          where: { userId: booking.course.tutorId },
        });
        tutorProfileId = tutorProfile?.id;
      }

      const review = await prisma.$transaction(async (tx) => {
        const created = await tx.review.create({
          data: {
            bookingId,
            userId: req.user!.sub,
            courseId: booking.courseId,
            tutorId: tutorProfileId,
            rating,
            comment,
          },
        });

        const courseAgg = await tx.review.aggregate({
          where: { courseId: booking.courseId },
          _avg: { rating: true },
          _count: { rating: true },
        });
        await tx.course.update({
          where: { id: booking.courseId },
          data: {
            ratingAvg: courseAgg._avg.rating ?? 0,
            ratingCount: courseAgg._count.rating,
          },
        });

        if (tutorProfileId) {
          const tutorAgg = await tx.review.aggregate({
            where: { tutorId: tutorProfileId },
            _avg: { rating: true },
            _count: { rating: true },
          });
          await tx.tutorProfile.update({
            where: { id: tutorProfileId },
            data: {
              ratingAvg: tutorAgg._avg.rating ?? 0,
              ratingCount: tutorAgg._count.rating,
            },
          });
        }

        return created;
      });

      res.status(201).json({ data: review });
    } catch (err) {
      next(err);
    }
  },
);
