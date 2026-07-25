import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDocument, queryDocuments, createDocument, deleteDocument, updateDocument,
  Collections, where, limit, increment,
} from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { Like, Work } from '@/types';

/**
 * A Like's id is deterministic — `{workId}_{userId}` — so liking is idempotent
 * and "have I liked this?" never needs a query, just a document read.
 */
const likeId = (workId: string, userId: string) => `${workId}_${userId}`;

/** Every cached shape that holds a list of works, for optimistic count updates. */
const WORK_LIST_KEYS = [['home-feed'], ['explore'], ['creator-works'], ['market-works']];

/**
 * The set of works the signed-in user has liked.
 *
 * Fetched once for the whole session rather than per card: checking like state
 * on each work card individually would reintroduce the N+1 read pattern that
 * `useUser` exists to avoid.
 */
export const useMyLikes = () => {
  const { user } = useAuthStore();

  const { data: likedWorkIds = new Set<string>() } = useQuery({
    queryKey: ['my-likes', user?.uid],
    queryFn: async () => {
      const rows = await queryDocuments<Like>(Collections.LIKES, [
        where('userId', '==', user!.uid), limit(500),
      ]);
      return new Set(rows.map(r => r.workId));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  return likedWorkIds;
};

export const useToggleLike = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);
  const likesKey = ['my-likes', user?.uid] as const;

  /** Steps a work's likeCount everywhere it is currently cached. */
  const patchCounts = (workId: string, delta: number) => {
    const bump = (w: Work) =>
      w.id === workId ? { ...w, likeCount: Math.max(0, (w.likeCount ?? 0) + delta) } : w;

    WORK_LIST_KEYS.forEach(key =>
      qc.setQueriesData<Work[]>({ queryKey: key }, old => old?.map(bump)));
    qc.setQueryData<Work | null>(['work', workId], old => (old ? bump(old) : old));
  };

  const { mutate: toggleLike, isPending } = useMutation({
    mutationFn: async (workId: string) => {
      if (!user) throw new Error('Not signed in');
      const id = likeId(workId, user.uid);
      const existing = await getDocument<Like>(Collections.LIKES, id);

      if (existing) {
        await deleteDocument(Collections.LIKES, id);
        await updateDocument(Collections.WORKS, workId, { likeCount: increment(-1) });
      } else {
        await createDocument(Collections.LIKES, { workId, userId: user.uid }, id);
        await updateDocument(Collections.WORKS, workId, { likeCount: increment(1) });
      }
    },

    onMutate: async (workId: string) => {
      await qc.cancelQueries({ queryKey: likesKey });
      const prevLikes = qc.getQueryData<Set<string>>(likesKey);
      const wasLiked = !!prevLikes?.has(workId);

      qc.setQueryData<Set<string>>(likesKey, old => {
        const next = new Set(old ?? []);
        if (wasLiked) next.delete(workId); else next.add(workId);
        return next;
      });
      patchCounts(workId, wasLiked ? -1 : 1);

      return { prevLikes, wasLiked };
    },

    onError: (_e, workId, ctx) => {
      if (!ctx) return;
      qc.setQueryData(likesKey, ctx.prevLikes);
      patchCounts(workId, ctx.wasLiked ? 1 : -1);
      showToast("Couldn't register that. Please try again.", 'danger');
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: likesKey });
      WORK_LIST_KEYS.forEach(key => qc.invalidateQueries({ queryKey: key }));
    },
  });

  return { toggleLike, isPending };
};
