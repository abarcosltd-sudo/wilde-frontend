import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  queryDocuments, createDocument, updateDocument,
  Collections, where, orderBy, limit, increment,
} from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { Post } from '@/types';

/**
 * Community posts, backed by Firestore.
 *
 * This previously called `/community/posts` on the external API, which returns
 * 404 — that service only exposes `/api/health`. The rest of the app talks to
 * Firestore directly, so this does too.
 */
export const usePosts = (groupId?: string) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);
  const key = ['posts', groupId ?? 'all'] as const;

  const { data: posts = [], isPending: isLoading } = useQuery({
    queryKey: key,
    queryFn: () => queryDocuments<Post>(Collections.POSTS, groupId
      // Feed and group views are separate query shapes; the group view filters
      // on one field and sorts client-side to avoid a composite index.
      ? [where('groupId', '==', groupId), limit(50)]
      : [orderBy('createdAt', 'desc'), limit(50)]),
    select: rows => groupId
      ? [...rows].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      : rows,
  });

  const { mutate: createPost, isPending: isPosting } = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not signed in');
      await createDocument(Collections.POSTS, {
        authorId: user.uid, content, likeCount: 0, commentCount: 0,
        ...(groupId ? { groupId } : {}),
      });
    },
    onMutate: async (content: string) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Post[]>(key);
      if (user) {
        const pending = {
          id: `optimistic-${Date.now()}`,
          authorId: user.uid, content, likeCount: 0, commentCount: 0, groupId,
          // Left null so `formatTimeAgo` shows "just now" until the real
          // document's server timestamp replaces it.
          createdAt: null as unknown as string,
        } as Post;
        qc.setQueryData<Post[]>(key, old => [pending, ...(old ?? [])]);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prev);
      showToast("Couldn't post that. Please try again.", 'danger');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  const { mutate: likePost } = useMutation({
    mutationFn: (postId: string) =>
      updateDocument(Collections.POSTS, postId, { likeCount: increment(1) }),
    onMutate: async (postId: string) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Post[]>(key);
      qc.setQueryData<Post[]>(key, old =>
        old?.map(p => p.id === postId ? { ...p, likeCount: (p.likeCount ?? 0) + 1 } : p));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx) qc.setQueryData(key, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { posts, isLoading, createPost, isPosting, likePost };
};
