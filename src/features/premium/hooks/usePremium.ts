import { useMutation } from '@tanstack/react-query';
import { initiatePayment, PaymentProvider } from '@/services/payment.service';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { apiErrorMessage } from '@/utils/apiError';

/**
 * Starts a premium upgrade.
 *
 * The price lives on the server (`PREMIUM_PRICE_NGN`) — this used to post an
 * `amount` of its own, which the backend then charged. `isPremium` is set by
 * the backend when the provider confirms payment, never by the client.
 */
export const usePremium = () => {
  const { user } = useAuthStore();
  const showToast = useUiStore(s => s.showToast);

  const { mutate: upgrade, isPending } = useMutation({
    mutationFn: async (provider: PaymentProvider = 'paystack') => {
      const { data } = await initiatePayment('premium', undefined, provider);
      return data.data;
    },
    onSuccess: (payment) => { window.location.href = payment.paymentUrl; },
    onError: (err) => showToast(apiErrorMessage(err), 'danger'),
  });

  return { isPremium: user?.isPremium ?? false, upgrade, isPending };
};
