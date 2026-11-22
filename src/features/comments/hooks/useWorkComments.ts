import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  queryDocuments, createDocument, updateDocument, deleteDocument,
  Collections, where, increment,
} from '@/firebase/firestore.helpers';
import { notify } from '@/features/notifications/notify';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { Work, WorkComment } from '@/types';
import { visibleComments } from '@/features/comments/commentRules';

/**
 * Public comments on one published work.
 *
 * Read with two equality filters, which Firestore serves without a composite
 * index; ordering and hiding are done on the client (`visibleComments`). Only
 * fetched once the sheet is open, so a feed of twenty works does not read twenty
 * comment lists.
 */
export const useWorkComments = (workId: string, enabled: boolean) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);
  const key = ['work-comments', workId] as const;

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: key,
    queryFn: () => queryDocuments<WorkComment>(Collections.COMMENTS, [
      where('parentType', '==', 'work'), where('parentId', '==', workId),
    ]),
    enabled: enabled && !!workId,
  });

  /**
   * Keeps the count on every cached copy of the work in step with what the user
   * just did, so the number under the feed post and in the reader changes at
   * once. Any list whose cached rows are not works passes through untouched.
   */
  const bumpCount = (delta: number) => {
    const step = <T extends { id?: string; commentCount?: number }>(w: T): T =>
      w && w.id === workId ? { ...w, commentCount: Math.max(0, (w.commentCount ?? 0) + delta) } : w;
    qc.setQueryData<Work | null>(['work', workId], w => (w ? step(w) : w));
    for (const listKey of [['home-feed'], ['explore'], ['creator-works'], ['my-works'], ['market-works']]) {
      qc.setQueriesData<unknown>({ queryKey: listKey }, (old: unknown) => (Array.isArray(old) ? old.map(step) : old));
    }
  };

  /**
   * The stored counter is a convenience, not the record: the comment itself is
   * what matters. Stepping it needs a rule the database may not have yet, and a
   * failed step must not make a saved comment look like a failed post.
   */
  const stepStoredCount = async (delta: 1 | -1) => {
    try {
      await updateDocument(Collections.WORKS, workId, { commentCount: increment(delta) });
    } catch (err) {
      console.warn('Could not update the comment count:', err);
    }
  };

  const { mutate: addComment, isPending: isPosting } = useMutation({
    mutationFn: async ({ content, work }: { content: string; work: Work | null | undefined }) => {
      if (!user) throw new Error('Not signed in');
      await createDocument(Collections.COMMENTS, {
        parentType: 'work', parentId: workId, authorId: user.uid, content, status: 'visible',
      });
      await stepStoredCount(1);
      // Tell the author, unless they are talking to themselves. A failed
      // notification must not fail the comment.
      if (work && work.authorId !== user.uid) {
        notify(work.authorId, '💬', `${user.displayName} commented on "${work.title}"`).catch(() => {});
      }
    },
    onMutate: async ({ content }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<WorkComment[]>(key);
      if (user) {
        const pending = {
          id: `optimistic-${Date.now()}`, parentType: 'work', parentId: workId,
          authorId: user.uid, content, status: 'visible',
          // Null until the server resolves it; sorts to the top and reads "now".
          createdAt: null as unknown as string,
        } satisfies WorkComment;
        qc.setQueryData<WorkComment[]>(key, old => [...(old ?? []), pending]);
      }
      bumpCount(1);
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.previous);
      bumpCount(-1);
      showToast("Couldn't post that comment. Please try again.", 'danger');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  const { mutate: removeComment, variables: removingId } = useMutation({
    mutationFn: async (commentId: string) => {
      await deleteDocument(Collections.COMMENTS, commentId);
      await stepStoredCount(-1);
    },
    onMutate: async commentId => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<WorkComment[]>(key);
      qc.setQueryData<WorkComment[]>(key, old => old?.filter(c => c.id !== commentId));
      bumpCount(-1);
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.previous);
      bumpCount(1);
      showToast("Couldn't delete that comment. Please try again.", 'danger');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    comments: visibleComments(data ?? []),
    /** `null` until the list has loaded, so a count is not claimed before it is known. */
    loadedCount: data ? visibleComments(data).length : null,
    isLoading: isPending && enabled,
    isError,
    retry: refetch,
    addComment,
    isPosting,
    removeComment,
    removingId,
  };
};
