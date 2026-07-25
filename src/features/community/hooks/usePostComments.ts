import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  queryDocuments, createDocument, updateDocument,
  Collections, where, increment,
} from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { Comment, Post } from '@/types';
import { toMillis } from '@/utils';

/**
 * Comments on a community post.
 *
 * Shares the `Comments` collection with the collaboration screen — both key off
 * `postId`, which there holds a work id. Only fetched once a thread is actually
 * opened, so a feed of twenty posts doesn't read twenty comment lists.
 */
export const usePostComments = (postId: string, enabled: boolean) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);
  const key = ['post-comments', postId] as const;

  const { data: comments = [], isPending: isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const rows = await queryDocuments<Comment>(Collections.COMMENTS, [
        where('postId', '==', postId),
      ]);
      // Sorted client-side; ordering server-side would need a composite index
      // on (postId, createdAt) that this project deliberately avoids.
      return [...rows].sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
    },
    enabled: enabled && !!postId,
  });

  const { mutate: addComment, isPending: isPosting } = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not signed in');
      await createDocument(Collections.COMMENTS, {
        postId, authorId: user.uid, content,
      });
      // Keeps the count under the post in step with the thread.
      await updateDocument(Collections.POSTS, postId, { commentCount: increment(1) });
    },

    onMutate: async (content: string) => {
      await qc.cancelQueries({ queryKey: key });
      const prevComments = qc.getQueryData<Comment[]>(key);
      if (user) {
        const pending = {
          id: `optimistic-${Date.now()}`,
          postId, authorId: user.uid, content,
          // Null until the server resolves it; renders as "just now".
          createdAt: null as unknown as string,
        } as Comment;
        qc.setQueryData<Comment[]>(key, old => [...(old ?? []), pending]);
      }
      // Step the count on whichever feed list is currently cached.
      qc.setQueriesData<Post[]>({ queryKey: ['posts'] }, old =>
        old?.map(p => (p.id === postId ? { ...p, commentCount: (p.commentCount ?? 0) + 1 } : p)));
      return { prevComments };
    },

    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prevComments);
      qc.invalidateQueries({ queryKey: ['posts'] });
      showToast("Couldn't post that comment. Please try again.", 'danger');
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return { comments, addComment, isPosting, isLoading };
};
