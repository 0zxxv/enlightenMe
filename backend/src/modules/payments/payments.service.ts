import { BookingStatus, PaymentStatus } from '@prisma/client';
import { z } from 'zod';
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
  if (booking.status === BookingStatus.Cancelled) {
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
    },
  };
}
