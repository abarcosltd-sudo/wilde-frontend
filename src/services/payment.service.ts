import api from './api.service';
import { Order } from '@/types';

export const initiatePayment = (orderId: string, provider: 'paystack' | 'flutterwave' | 'stripe') =>
  api.post<{ paymentUrl: string }>('/payments/initiate', { orderId, provider });

export const verifyPayment = (reference: string) =>
  api.get<Order>(`/payments/verify/${reference}`);
