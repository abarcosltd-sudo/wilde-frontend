import { useMutation } from '@tanstack/react-query';
import api from '@/services/api.service';
import { useAuthStore } from '@/store/slices/authStore';

/**
 * NOT REACHABLE. Settings shows "Premium" as blocked ("Needs payments").
 *
 * `/payments/initiate` returns 404 — the external API only exposes
 * `/api/health`. Wiring a button to this would produce a dead end, so the entry
 * point stays disabled until a payment provider is actually connected. Same
 * blocker as `useBuyWork`, which records Orders without moving money.
 */
export const usePremium = () => {
  const { user } = useAuthStore();

  const { mutate: upgrade, isPending } = useMutation({
    mutationFn: (provider: 'paystack' | 'flutterwave') =>
      api.post('/payments/initiate', {
        email: user?.email,
        amount: 2999,
        currency: 'NGN',
        provider,
        metadata: { type: 'premium_upgrade', userId: user?.uid },
      }),
    onSuccess: ({ data }) => {
      window.location.href = data.data.paymentUrl;
    },
  });

  return { isPremium: user?.isPremium ?? false, upgrade, isPending };
};
