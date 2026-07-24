import { useState, useEffect, useCallback } from 'react';
import { queryDocuments, createDocument, Collections, where } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { Review, Order } from '@/types';

export const useReviews = (creatorId: string) => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligibleOrder, setEligibleOrder] = useState<Order | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  const loadReviews = useCallback(() => {
    queryDocuments<Review>(Collections.REVIEWS, [where('creatorId', '==', creatorId)]).then(setReviews);
  }, [creatorId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  useEffect(() => {
    if (!user || user.uid === creatorId) return;
    queryDocuments<Order>(Collections.ORDERS, [
      where('buyerId', '==', user.uid),
      where('sellerId', '==', creatorId),
      where('status', '==', 'completed'),
    ]).then(orders => setEligibleOrder(orders[0] ?? null));
    queryDocuments<Review>(Collections.REVIEWS, [
      where('creatorId', '==', creatorId),
      where('reviewerId', '==', user.uid),
    ]).then(rows => setHasReviewed(rows.length > 0));
  }, [creatorId, user?.uid]);

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const submitReview = async (rating: number, comment: string) => {
    if (!user || !eligibleOrder) return;
    await createDocument(Collections.REVIEWS, {
      creatorId, reviewerId: user.uid, orderId: eligibleOrder.id, rating, comment,
    });
    setHasReviewed(true);
    loadReviews();
  };

  const canReview = !!eligibleOrder && !hasReviewed;

  return { reviews, averageRating, canReview, submitReview };
};
