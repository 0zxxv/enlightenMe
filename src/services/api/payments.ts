import type { ApiSuccess } from '@/types/api';
import type { Booking, Payment } from '@/types/models';
import { apiRequest } from './client';

export type PaymentIntentResponse = {
  payment: Payment;
  intent: {
    requiresProvider: boolean;
    message: string;
    status: string;
    stubConfirmAvailable?: boolean;
  };
};

export async function createPaymentIntent(bookingId: string) {
  const result = await apiRequest<ApiSuccess<PaymentIntentResponse>>('/payments/intent', {
    method: 'POST',
    body: { bookingId },
    auth: true,
  });
  return result.data;
}

export async function confirmStubPayment(bookingId: string) {
  const result = await apiRequest<
    ApiSuccess<{ booking: Booking; payment?: Payment; alreadyPaid?: boolean }>
  >(`/payments/${bookingId}/confirm-stub`, {
    method: 'POST',
    auth: true,
  });
  return result.data;
}
