import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateDocument, Collections, increment } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { Work } from '@/types';

const seenKey = (workId: string) => `wilde:viewed:${workId}`;

/**
 * Counts a read of a work.
 *
 * Nothing incremented `viewCount` before this, which is why every work showed 0
 * views regardless of traffic.
 *
 * Counted once per work per browser session, and never for the author — a
 * writer opening their own draft repeatedly should not inflate their analytics.
 * `sessionStorage` is a deliberately cheap defence: it stops the obvious
 * refresh-to-inflate loop without pretending to be real deduplication, which
 * would need server-side counting.
 */
export const useTrackView = (work: Work | null | undefined) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  useEffect(() => {
    if (!work?.id) return;
    if (user && work.authorId === user.uid) return;
    if (sessionStorage.getItem(seenKey(work.id))) return;

    sessionStorage.setItem(seenKey(work.id), '1');

    // Reflected locally so the reader sees the number they just contributed to,
    // rather than waiting for the next refetch.
    qc.setQueryData<Work | null>(['work', work.id], old =>
      old ? { ...old, viewCount: (old.viewCount ?? 0) + 1 } : old);

    updateDocument(Collections.WORKS, work.id, { viewCount: increment(1) })
      .catch(err => console.error('Failed to record view:', err));
  }, [work?.id, work?.authorId, user?.uid]);
};
