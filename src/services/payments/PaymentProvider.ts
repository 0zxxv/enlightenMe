import { createPaymentIntent } from '@/services/api/payments';

export type PaymentMethod = 'card' | 'apple_pay' | 'benefit_pay';

export type ClientPaymentResult = {
  status: 'pending' | 'succeeded' | 'failed';
  provider: string;
  providerRef: string;
  message?: string;
};

export interface PaymentProvider {
  pay(bookingId: string, method: PaymentMethod): Promise<ClientPaymentResult>;
}

class StubPaymentProvider implements PaymentProvider {
  async pay(bookingId: string, method: PaymentMethod): Promise<ClientPaymentResult> {
    const result = await createPaymentIntent(bookingId);
    return {
      status: 'pending',
      provider: result.intent.provider ?? 'stub',
      providerRef: result.intent.providerRef,
      message: `Payment initiated via ${method}. Awaiting provider confirmation.`,
    };
  }
}

export const paymentProvider: PaymentProvider = new StubPaymentProvider();
