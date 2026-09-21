import { createPaymentIntent } from '@/services/api/payments';

export type PaymentMethod = 'card' | 'apple_pay' | 'benefit_pay';

export type ClientPaymentResult = {
  status: 'pending' | 'succeeded' | 'failed';
  provider: string;
  providerRef: string;
  message?: string;
  stubConfirmAvailable?: boolean;
};

export interface PaymentProvider {
  pay(bookingId: string, method: PaymentMethod): Promise<ClientPaymentResult>;
}

class StubPaymentProvider implements PaymentProvider {
  async pay(bookingId: string, _method: PaymentMethod): Promise<ClientPaymentResult> {
    const result = await createPaymentIntent(bookingId);
    return {
      status: 'pending',
      provider: result.payment.provider ?? 'stub',
      providerRef: result.payment.providerRef ?? `stub_${bookingId}`,
      message: result.intent.message,
      stubConfirmAvailable: result.intent.stubConfirmAvailable,
    };
  }
}

export const paymentProvider: PaymentProvider = new StubPaymentProvider();
