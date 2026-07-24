import { useState } from 'react';
import { createDocument, Collections } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { Work } from '@/types';
import { formatCurrency } from '@/utils';
import { notify } from '@/features/notifications/notify';
import Swal from '@/utils/swal';

// TODO: replace with a real purchase via payment.service.ts (initiatePayment)
// once the backend's Paystack/Flutterwave integration is verified. This
// creates a completed Order directly so the unlock flow can be built and
// tested end-to-end without a live payment provider.
export const useBuyWork = () => {
  const { user } = useAuthStore();
  const [isBuying, setIsBuying] = useState(false);

  const buy = async (work: Work): Promise<boolean> => {
    if (!user) return false;
    const result = await Swal.fire({
      icon: 'question',
      title: `Unlock "${work.title}"?`,
      text: `Buy full access for ${formatCurrency(work.price ?? 0, work.currency)}.`,
      showCancelButton: true,
      confirmButtonText: 'Buy Now',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return false;

    setIsBuying(true);
    try {
      await createDocument(Collections.ORDERS, {
        buyerId: user.id,
        sellerId: work.authorId,
        workId: work.id,
        amount: work.price ?? 0,
        currency: work.currency ?? 'NGN',
        status: 'completed',
      });
      notify(work.authorId, '💰', `${user.displayName} purchased "${work.title}"`).catch(() => {});
      await Swal.fire({
        icon: 'success',
        title: 'Purchase complete!',
        text: 'You now have full access.',
        timer: 1500,
        showConfirmButton: false,
      });
      return true;
    } finally {
      setIsBuying(false);
    }
  };

  return { buy, isBuying };
};
