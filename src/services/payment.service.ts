import api from './api.service';
import { ApiResponse } from '@/types';

export type PurchaseKind = 'work' | 'listing' | 'premium';
export type PaymentProvider = 'paystack' | 'flutterwave';

export interface InitiatedPayment {
  paymentUrl: string;
  reference: string;
  orderId: string;
  amount: number;
  currency: 'NGN' | 'USD';
}

export interface VerifiedPayment {
  /**
   * `pending` means the provider hasn't settled yet (a bank transfer awaiting
   * confirmation) — the order is untouched and a later webhook will finish it.
   * `disputed` means the amount received didn't match the order.
   */
  status: 'completed' | 'cancelled' | 'disputed' | 'pending';
  orderId: string;
  kind?: PurchaseKind;
  workId?: string | null;
}

/**
 * Sends only *what* is being bought. The price is resolved server-side from the
 * Work / listing document — a client-supplied amount would be a client-supplied
 * discount.
 */
export const initiatePayment = (
  kind: PurchaseKind,
  targetId?: string,
  provider: PaymentProvider = 'paystack',
) => api.post<ApiResponse<InitiatedPayment>>('/payments/initiate', { kind, targetId, provider });

export const verifyPayment = (reference: string) =>
  api.get<ApiResponse<VerifiedPayment>>(`/payments/verify/${reference}`);

export interface PremiumPricing {
  amount: number;
  currency: 'NGN' | 'USD';
  description: string;
}

/** Quoted by the server so the displayed price can't drift from the charged one. */
export const getPremiumPricing = () =>
  api.get<ApiResponse<PremiumPricing>>('/payments/pricing/premium');
