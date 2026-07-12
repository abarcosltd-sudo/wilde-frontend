import { useMutation } from '@tanstack/react-query';
import api from '@/services/api.service';
import { useAuthStore } from '@/store/slices/authStore';

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
