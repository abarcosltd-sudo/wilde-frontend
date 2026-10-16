import { useQuery } from '@tanstack/react-query';
import { queryDocuments, Collections, where } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { toMillis } from '@/utils/format';
import { Work } from '@/types';

/**
 * The signed-in user's own works, split into what is live and what is still a
 * draft. Newest first, sorted here: ordering server-side as well as by author
 * would need a composite index for a list this short.
 */
export const useMyWorks = (enabled = true) => {
  const { user } = useAuthStore();

  const { data = [], isPending } = useQuery({
    queryKey: ['my-works', user?.uid],
    queryFn: () => queryDocuments<Work>(Collections.WORKS, [where('authorId', '==', user!.uid)]),
    enabled: !!user && enabled,
  });

  const newestFirst = (a: Work, b: Work) =>
    toMillis(b.updatedAt ?? b.createdAt) - toMillis(a.updatedAt ?? a.createdAt);

  return {
    published: data.filter(w => w.status === 'published').sort(newestFirst),
    drafts:    data.filter(w => w.status === 'draft').sort(newestFirst),
    isLoading: isPending,
  };
};
