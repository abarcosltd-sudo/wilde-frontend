import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  queryDocuments, createDocument, updateDocument, deleteDocument,
  Collections, where,
} from '@/firebase/firestore.helpers';
import { useUiStore } from '@/store/slices/uiStore';
import { Chapter } from '@/types';

/**
 * Chapters for long-form works, stored in Firestore.
 *
 * `chapter.service.ts` used to back this with `/works/:id/chapters` on the
 * external API, which 404s — that service only exposes `/api/health`. Chapters
 * live in the `Chapters` collection alongside everything else.
 *
 * Only `long_work` uses chapters; every other type keeps its single flat
 * `content` string on the Work itself.
 */
export const useChapters = (workId: string, enabled: boolean, seedContent?: string) => {
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);
  const key = ['chapters', workId] as const;
  const hasSeeded = useRef(false);

  const { data: chapters = [], isPending: isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const rows = await queryDocuments<Chapter>(Collections.CHAPTERS, [
        where('workId', '==', workId),
      ]);
      // Sorted client-side: ordering server-side would need a composite index
      // on (workId, order) that this project doesn't define.
      return [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
    enabled: enabled && !!workId,
  });

  const { mutateAsync: addChapter, isPending: isAdding } = useMutation({
    mutationFn: async (title?: string) => {
      const order = chapters.length;
      // Stored empty unless the author names it. A default of "Chapter N" would
      // bake in a position that goes stale as soon as a chapter is deleted or
      // reordered — `chapterLabel` derives the number from the current order.
      return createDocument(Collections.CHAPTERS, {
        workId, title: title ?? '', content: '', order,
      });
    },
    onError: () => showToast("Couldn't add that chapter. Please try again.", 'danger'),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  /**
   * Long works created before chapters existed hold their text in `work.content`.
   * Rather than stranding it, the first chapter is seeded from it on open.
   */
  useEffect(() => {
    if (!enabled || isLoading || hasSeeded.current) return;
    if (chapters.length > 0) { hasSeeded.current = true; return; }
    hasSeeded.current = true;
    createDocument(Collections.CHAPTERS, {
      workId, title: '', content: seedContent ?? '', order: 0,
    })
      .then(() => qc.invalidateQueries({ queryKey: key }))
      .catch(() => {});
  }, [enabled, isLoading, chapters.length, workId, seedContent]);

  // Content edits are frequent, so they're written straight through and mirrored
  // into the cache rather than round-tripping a refetch on every save.
  const saveChapter = async (chapterId: string, patch: Partial<Chapter>) => {
    qc.setQueryData<Chapter[]>(key, old =>
      old?.map(c => (c.id === chapterId ? { ...c, ...patch } : c)));
    await updateDocument(Collections.CHAPTERS, chapterId, patch);
  };

  const { mutate: removeChapter } = useMutation({
    mutationFn: async (chapterId: string) => {
      await deleteDocument(Collections.CHAPTERS, chapterId);
      // Close the gap so `order` stays contiguous for the remaining chapters.
      const remaining = chapters.filter(c => c.id !== chapterId);
      await Promise.all(remaining.map((c, i) =>
        c.order === i ? null : updateDocument(Collections.CHAPTERS, c.id, { order: i })));
    },
    onMutate: async (chapterId: string) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Chapter[]>(key);
      qc.setQueryData<Chapter[]>(key, old => old?.filter(c => c.id !== chapterId));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prev);
      showToast("Couldn't delete that chapter. Please try again.", 'danger');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { chapters, isLoading, addChapter, isAdding, saveChapter, removeChapter };
};
