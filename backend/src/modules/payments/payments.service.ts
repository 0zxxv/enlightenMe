import { BookingStatus, PaymentStatus } from '@prisma/client';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { paymentProvider } from './payment-provider.js';

export const createPaymentSchema = z.object({
  bookingId: z.string().uuid(),
});

export async function createPaymentIntent(userId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) {
    throw new AppError('NOT_FOUND', 'Booking not found', 404);
  }
  if (booking.userId !== userId) {
    throw new AppError('FORBIDDEN', 'You can only pay for your own bookings', 403);
  }
  if (booking.status === BookingStatus.Cancelled || booking.status === BookingStatus.Refunded) {
    throw new AppError('INVALID_STATUS', 'Cannot pay for a cancelled booking', 400);
  }
  if (booking.payment?.status === PaymentStatus.Paid) {
    throw new AppError('ALREADY_PAID', 'Booking is already paid', 409);
  }

  const intent = await paymentProvider.createPaymentIntent({
    bookingId: booking.id,
    amount: booking.priceSnapshot,
    currency: booking.currency,
  });

  const payment = booking.payment
    ? await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          amount: booking.priceSnapshot,
          currency: booking.currency,
          status: intent.status,
          provider: intent.provider,
          providerRef: intent.providerRef,
          paidAt: null,
        },
      })
    : await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.priceSnapshot,
          currency: booking.currency,
          status: intent.status,
          provider: intent.provider,
          providerRef: intent.providerRef,
        },
      });

  return {
    payment,
    intent: {
      requiresProvider: intent.requiresProvider,
      message: intent.message,
      status: intent.status,
      stubConfirmAvailable: Boolean(env.ALLOW_STUB_PAYMENT_CONFIRM),
    },
  };
}

/**
 * QA-only: marks payment Paid and booking Confirmed.
 * Gated by ALLOW_STUB_PAYMENT_CONFIRM — never trust the client alone.
 */
export async function confirmStubPayment(userId: string, bookingId: string) {
  if (!env.ALLOW_STUB_PAYMENT_CONFIRM) {
    throw new AppError(
      'FORBIDDEN',
      'Stub payment confirmation is disabled on this server',
      403,
    );
  }

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (!booking) {
      throw new AppError('NOT_FOUND', 'Booking not found', 404);
    }
    if (booking.userId !== userId) {
      throw new AppError('FORBIDDEN', 'You can only confirm your own payments', 403);
    }
    if (booking.status === BookingStatus.Cancelled || booking.status === BookingStatus.Refunded) {
      throw new AppError('INVALID_STATUS', 'Cannot confirm a cancelled booking', 400);
    }
    if (booking.payment?.status === PaymentStatus.Paid) {
      return {
        booking: await tx.booking.findUnique({
          where: { id: bookingId },
          include: { payment: true, course: true, session: true },
        }),
        alreadyPaid: true,
      };
    }

    const payment = booking.payment
      ? await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: PaymentStatus.Paid,
            paidAt: new Date(),
            provider: booking.payment.provider || 'stub',
          },
        })
      : await tx.payment.create({
          data: {
            bookingId: booking.id,
            amount: booking.priceSnapshot,
            currency: booking.currency,
            status: PaymentStatus.Paid,
            provider: 'stub',
            providerRef: `stub_confirm_${booking.id}`,
            paidAt: new Date(),
          },
        });

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.Confirmed },
      include: { payment: true, course: true, session: true },
    });

    return { booking: updatedBooking, payment, alreadyPaid: false };
  });
}
