import type { ApiSuccess } from '@/types/api';
import type { Payment } from '@/types/models';
import { apiRequest } from './client';

export type PaymentIntentResponse = {
  payment: Payment;
  intent: {
    id: string;
    status: string;
    provider: string;
    providerRef: string;
    clientSecret?: string | null;
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
