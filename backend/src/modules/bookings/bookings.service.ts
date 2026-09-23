import { BookingStatus, CourseStatus, PaymentStatus, SessionStatus, type Prisma } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

export const createBookingSchema = z.object({
  courseId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

const bookingInclude = {
  course: {
    include: {
      category: true,
      tutor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          tutorProfile: { select: { verificationStatus: true } },
        },
      },
    },
  },
  session: true,
  payment: true,
  review: true,
} as const;

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
    if (session.status !== SessionStatus.Scheduled) {
      throw new AppError('SESSION_UNAVAILABLE', 'This session is not available', 400);
    }
    if (session.startsAt <= new Date()) {
      throw new AppError('SESSION_UNAVAILABLE', 'Cannot book a past session', 400);
    }
    if (session.seatsAvailable <= 0) {
      throw new AppError('CAPACITY_FULL', 'No seats available for this session', 409);
    }

    const existing = await tx.booking.findUnique({
      where: { userId_sessionId: { userId, sessionId: input.sessionId } },
    });
    if (existing && existing.status !== BookingStatus.Cancelled && existing.status !== BookingStatus.Refunded) {
      throw new AppError('ALREADY_BOOKED', 'You already have a booking for this session', 409);
    }

    const updated = await tx.courseSession.updateMany({
      where: { id: session.id, seatsAvailable: { gt: 0 }, status: SessionStatus.Scheduled },
      data: { seatsAvailable: { decrement: 1 } },
    });
    if (updated.count === 0) {
      throw new AppError('CAPACITY_FULL', 'No seats available for this session', 409);
    }

    if (existing) {
      const revived = await tx.booking.update({
        where: { id: existing.id },
        data: {
          status: BookingStatus.Pending,
          priceSnapshot: session.course.priceDecimal,
          currency: session.course.currency,
        },
        include: bookingInclude,
      });
      await ensureCourseGroupMembership(tx, input.courseId, userId);
      return revived;
    }

    const created = await tx.booking.create({
      data: {
        userId,
        courseId: input.courseId,
        sessionId: input.sessionId,
        status: BookingStatus.Pending,
        priceSnapshot: session.course.priceDecimal,
        currency: session.course.currency,
      },
      include: bookingInclude,
    });
    await ensureCourseGroupMembership(tx, input.courseId, userId);
    return created;
  });
}

async function ensureCourseGroupMembership(
  tx: Prisma.TransactionClient,
  courseId: string,
  userId: string,
) {
  const course = await tx.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, tutorId: true },
  });
  if (!course?.tutorId) return;

  let group = await tx.conversation.findUnique({ where: { courseId } });
  if (!group) {
    group = await tx.conversation.create({
      data: {
        courseId: course.id,
        title: course.title,
        participants: {
          create: [{ userId: course.tutorId }],
        },
      },
    });
  }

  const memberIds = new Set([course.tutorId, userId]);
  for (const memberId of memberIds) {
    await tx.conversationParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId: group.id,
          userId: memberId,
        },
      },
      create: {
        conversationId: group.id,
        userId: memberId,
      },
      update: {},
    });
  }
}

export async function listMyBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBookingById(bookingId: string, userId: string, isAdmin: boolean) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      ...bookingInclude,
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
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
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

    // Paid bookings: mark refunded (real refunds require a payment provider)
    const wasPaid = booking.payment?.status === PaymentStatus.Paid;
    const nextStatus = wasPaid ? BookingStatus.Refunded : BookingStatus.Cancelled;

    if (wasPaid && booking.payment) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: PaymentStatus.Refunded },
      });
    } else if (booking.payment && booking.payment.status === PaymentStatus.Pending) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: PaymentStatus.Cancelled },
      });
    }

    await tx.courseSession.update({
      where: { id: booking.sessionId },
      data: { seatsAvailable: { increment: 1 } },
    });

    return tx.booking.update({
      where: { id: bookingId },
      data: { status: nextStatus },
      include: bookingInclude,
    });
  });
}
