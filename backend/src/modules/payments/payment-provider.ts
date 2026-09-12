import { PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type CreatePaymentIntentInput = {
  bookingId: string;
  amount: Decimal;
  currency: string;
};

export type PaymentIntentResult = {
  status: PaymentStatus;
  provider: string;
  providerRef: string;
  requiresProvider: boolean;
  message: string;
};

export interface PaymentProvider {
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
}

/**
 * Stub provider — never fakes a successful paid state.
 * Real payment integration must replace this.
 */
export class StubPaymentProvider implements PaymentProvider {
  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      status: PaymentStatus.Pending,
      provider: 'stub',
      providerRef: `stub_${input.bookingId}_${Date.now()}`,
      requiresProvider: true,
      message: 'Payment requires a configured provider. No charge was made.',
    };
  }
}

export const paymentProvider: PaymentProvider = new StubPaymentProvider();
