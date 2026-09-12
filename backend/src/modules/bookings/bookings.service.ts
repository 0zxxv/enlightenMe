import { BookingStatus, CourseStatus } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

export const createBookingSchema = z.object({
  courseId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

export async function createBooking(userId: string, input: z.infer<typeof createBookingSchema>) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.courseSession.findUnique({
      where: { id: input.sessionId },
      include: { course: true },
    });

    if (!session || session.courseId !== input.courseId) {
      throw new AppError('NOT_FOUND', 'Session not found for course', 404);
    }
    if (session.course.status !== CourseStatus.Published) {
      throw new AppError('COURSE_UNAVAILABLE', 'Course is not available for booking', 400);
    }
    if (session.seatsAvailable <= 0) {
      throw new AppError('CAPACITY_FULL', 'No seats available for this session', 409);
    }

    const existing = await tx.booking.findUnique({
      where: { userId_sessionId: { userId, sessionId: input.sessionId } },
    });
    if (existing && existing.status !== BookingStatus.Cancelled) {
      throw new AppError('ALREADY_BOOKED', 'You already have a booking for this session', 409);
    }

    const updated = await tx.courseSession.updateMany({
      where: { id: session.id, seatsAvailable: { gt: 0 } },
      data: { seatsAvailable: { decrement: 1 } },
    });
    if (updated.count === 0) {
      throw new AppError('CAPACITY_FULL', 'No seats available for this session', 409);
    }

    if (existing?.status === BookingStatus.Cancelled) {
      return tx.booking.update({
        where: { id: existing.id },
        data: {
          status: BookingStatus.Pending,
          priceSnapshot: session.course.priceDecimal,
          currency: session.course.currency,
        },
        include: { course: true, session: true, payment: true },
      });
    }

    return tx.booking.create({
      data: {
        userId,
        courseId: input.courseId,
        sessionId: input.sessionId,
        status: BookingStatus.Pending,
        priceSnapshot: session.course.priceDecimal,
        currency: session.course.currency,
      },
      include: { course: true, session: true, payment: true },
    });
  });
}

export async function listMyBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: {
      course: { include: { category: true, tutor: { select: { id: true, firstName: true, lastName: true } } } },
      session: true,
      payment: true,
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBookingById(bookingId: string, userId: string, isAdmin: boolean) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      course: true,
      session: true,
      payment: true,
      review: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!booking) {
    throw new AppError('NOT_FOUND', 'Booking not found', 404);
  }
  if (!isAdmin && booking.userId !== userId) {
    throw new AppError('FORBIDDEN', 'You can only view your own bookings', 403);
  }
  return booking;
}

export async function cancelBooking(bookingId: string, userId: string, isAdmin: boolean) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new AppError('NOT_FOUND', 'Booking not found', 404);
    }
    if (!isAdmin && booking.userId !== userId) {
      throw new AppError('FORBIDDEN', 'You can only cancel your own bookings', 403);
    }
    if (
      booking.status === BookingStatus.Cancelled ||
      booking.status === BookingStatus.Refunded
    ) {
      throw new AppError('INVALID_STATUS', 'Booking is already cancelled', 400);
    }
    if (booking.status === BookingStatus.Completed) {
      throw new AppError('INVALID_STATUS', 'Completed bookings cannot be cancelled', 400);
    }

    await tx.courseSession.update({
      where: { id: booking.sessionId },
      data: { seatsAvailable: { increment: 1 } },
    });

    return tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.Cancelled },
      include: { course: true, session: true, payment: true },
    });
  });
}
