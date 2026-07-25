import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryDocuments, createDocument, Collections, where } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { Review, Order } from '@/types';

export const useReviews = (creatorId: string) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);
  const reviewsKey = ['reviews', creatorId] as const;

  const { data: reviews = [], isPending: isLoading } = useQuery({
    queryKey: reviewsKey,
    queryFn: () => queryDocuments<Review>(Collections.REVIEWS, [where('creatorId', '==', creatorId)]),
    enabled: !!creatorId,
  });

  // Only buyers with a completed order may review, so eligibility is two reads
  // that are cached alongside the list.
  const { data: eligibleOrder = null } = useQuery({
    queryKey: ['review-eligibility', creatorId, user?.uid],
    queryFn: async () => {
      const orders = await queryDocuments<Order>(Collections.ORDERS, [
        where('buyerId', '==', user!.uid),
        where('sellerId', '==', creatorId),
        where('status', '==', 'completed'),
      ]);
      return orders[0] ?? null;
    },
    enabled: !!user && user.uid !== creatorId,
  });

  const hasReviewed = !!user && reviews.some(r => r.reviewerId === user.uid);

  const { mutate: submitReview, isPending: isSubmitting } = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      if (!user || !eligibleOrder) return;
      await createDocument(Collections.REVIEWS, {
        creatorId, reviewerId: user.uid, orderId: eligibleOrder.id, rating, comment,
      });
    },

    // Show the review — and its effect on the average — the moment it's
    // submitted, so the form doesn't sit there looking like nothing happened.
    onMutate: async ({ rating, comment }) => {
      await qc.cancelQueries({ queryKey: reviewsKey });
      const prev = qc.getQueryData<Review[]>(reviewsKey);
      if (user && eligibleOrder) {
        const pending = {
          id: `optimistic-${Date.now()}`,
          creatorId, reviewerId: user.uid, orderId: eligibleOrder.id, rating, comment,
        } as Review;
        qc.setQueryData<Review[]>(reviewsKey, old => [pending, ...(old ?? [])]);
      }
      return { prev };
    },

    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(reviewsKey, ctx.prev);
      showToast("Couldn't post your review. Please try again.", 'danger');
    },

    onSuccess: () => showToast('Review posted', 'success'),
    onSettled: () => qc.invalidateQueries({ queryKey: reviewsKey }),
  });

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    reviews,
    averageRating,
    canReview: !!eligibleOrder && !hasReviewed,
    submitReview: (rating: number, comment: string) => submitReview({ rating, comment }),
    isSubmitting,
    isLoading,
  };
};
