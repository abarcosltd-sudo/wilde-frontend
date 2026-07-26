import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getDocument, queryDocuments, updateDocument, Collections, where } from '@/firebase/firestore.helpers';
import { useWritingStore } from '@/store/slices/writingStore';
import { useAuthStore } from '@/store/slices/authStore';
import { useStreaks } from '@/features/streaks/hooks/useStreaks';
import { notify } from '@/features/notifications/notify';
import { Work, Follow } from '@/types';

export interface PublishPricing {
  /** 0 means free. Anything above must clear `MIN_PRICE` for the currency. */
  price: number;
  currency: 'NGN' | 'USD';
}

export const useWorkEditor = (workId: string) => {
  const { setCurrentWork, currentWork, setSaving } = useWritingStore();
  const { user } = useAuthStore();
  const { logWrite } = useStreaks();
  const qc = useQueryClient();

  const load = useCallback(async () => {
    const work = await getDocument<Work>(Collections.WORKS, workId);
    setCurrentWork(work);
  }, [workId]);

  const save = useCallback(async (status: 'draft' | 'published', pricing?: PublishPricing) => {
    if (!currentWork) return;
    setSaving(true);
    const wasPublished = currentWork.status === 'published';
    const payload: Record<string, unknown> = {
      content: currentWork.content ?? '',
      title:   currentWork.title,
      status,
    };
    // Price is only ever set at publish time, so a draft save can't silently
    // change what a work costs. `price: 0` is what makes a work free — the
    // marketplace and the paywall both key off `price > 0`.
    if (pricing) {
      payload.price = pricing.price;
      payload.currency = pricing.currency;
    }
    // Always written, including as '' — writing it only when truthy meant a
    // removed cover image could never be cleared from the document.
    payload.coverImageUrl = currentWork.coverImageUrl ?? '';
    if (currentWork.collaborators) payload.collaborators = currentWork.collaborators;
    await updateDocument(Collections.WORKS, workId, payload);

    // Every surface that lists or renders this work holds it in a cache with a
    // 5-minute stale time, so without this a save is invisible until that
    // expires — a newly published work, a retitled one, or a freshly added
    // cover image would all keep showing the previous version.
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['home-feed'] }),
      qc.invalidateQueries({ queryKey: ['explore'] }),
      qc.invalidateQueries({ queryKey: ['work', workId] }),
      qc.invalidateQueries({ queryKey: ['creator-works', currentWork.authorId] }),
      qc.invalidateQueries({ queryKey: ['market-works'] }),
      qc.invalidateQueries({ queryKey: ['profile-analytics', currentWork.authorId] }),
    ]);

    logWrite();
    if (user && status === 'published' && !wasPublished) {
      queryDocuments<Follow>(Collections.FOLLOWS, [where('followingId', '==', user.uid)])
        .then(follows => Promise.all(follows.map(f =>
          notify(f.followerId, '📖', `${user.displayName} published "${currentWork.title}"`))))
        .catch(() => {});
    }
    setSaving(false);
  }, [currentWork, workId, user, logWrite, qc]);

  const publish = (pricing: PublishPricing) => save('published', pricing);

  return { load, save, publish };
};
