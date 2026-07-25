import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryDocuments, Collections, where } from '@/firebase/firestore.helpers';
import { escapeHtml } from '@/utils';
import { Work, Chapter } from '@/types';

/**
 * The readable body of a work, as HTML.
 *
 * A `long_work` stores its text as Chapter documents rather than a flat
 * `content` string, so anything *displaying* a work has to stitch those back
 * together. Shared by the reader and the collaboration view so the two can't
 * disagree about what a long work contains.
 */
export const useWorkBody = (work: Work | null | undefined) => {
  const isLongWork = work?.type === 'long_work';

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters', work?.id],
    queryFn: async () => {
      const rows = await queryDocuments<Chapter>(Collections.CHAPTERS, [
        where('workId', '==', work!.id),
      ]);
      return [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
    enabled: !!work?.id && isLongWork,
  });

  return useMemo(() => {
    if (!isLongWork || chapters.length === 0) return work?.content ?? '';
    // Titles are user-supplied, so they're escaped before interpolation.
    return chapters
      .map((c, i) => `<h3>${escapeHtml(c.title || `Chapter ${i + 1}`)}</h3>${c.content ?? ''}`)
      .join('');
  }, [isLongWork, chapters, work?.content]);
};
