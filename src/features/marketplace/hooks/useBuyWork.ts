import { useState } from 'react';
import { initiatePayment } from '@/services/payment.service';
import { Work } from '@/types';
import { formatCurrency } from '@/utils';
import { apiErrorMessage } from '@/utils/apiError';
import Swal from '@/utils/swal';

/**
 * Starts a real purchase.
 *
 * This used to write a `completed` Order straight to Firestore, which unlocked
 * the work without any money moving. The order is now created by the backend
 * off a server-resolved price, and only reaches `completed` when the payment
 * provider confirms it.
 *
 * `buy` does not resolve to a result: it hands the browser to the provider's
 * hosted checkout. The purchase completes on `PaymentCallbackPage` when the
 * provider sends the buyer back.
 */
export const useBuyWork = () => {
  const [isBuying, setIsBuying] = useState(false);

  const buy = async (work: Work): Promise<void> => {
    const confirmed = await Swal.fire({
      icon: 'question',
      title: `Unlock "${work.title}"?`,
      text: `Buy full access for ${formatCurrency(work.price ?? 0, work.currency)}.`,
      showCancelButton: true,
      confirmButtonText: 'Continue to payment',
      cancelButtonText: 'Cancel',
    });
    if (!confirmed.isConfirmed) return;

    setIsBuying(true);
    try {
      const { data } = await initiatePayment('work', work.id);
      // Full-page navigation, not a router push — checkout is the provider's
      // own domain. `isBuying` stays true; this page is going away.
      window.location.href = data.data.paymentUrl;
    } catch (err) {
      setIsBuying(false);
      await Swal.fire({
        icon: 'error',
        title: "Couldn't start checkout",
        text: apiErrorMessage(err),
      });
    }
  };

  return { buy, isBuying };
};
