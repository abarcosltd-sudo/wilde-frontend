import { useQuery } from '@tanstack/react-query';
import { queryDocuments, Collections, where, orderBy, limit } from '@/firebase/firestore.helpers';
import { Work, WorkType, GhostwriterListing } from '@/types';

const BOOK_TYPES: WorkType[] = ['short_story', 'long_work', 'poetry', 'screenplay', 'playlet'];

export const useMarketplace = (tab: string) => {
  const { data: works = [] } = useQuery({
    queryKey: ['market-works', tab],
    queryFn: async () => {
      const published = await queryDocuments<Work>(Collections.WORKS, [
        where('status', '==', 'published'), limit(50),
      ]);
      const priced = published.filter(w => (w.price ?? 0) > 0);
      const inTab = tab === 'Books' ? priced.filter(w => BOOK_TYPES.includes(w.type))
        : tab === 'Art' ? priced.filter(w => w.type === 'artwork')
        : priced;
      return inTab
        .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
        .slice(0, 20);
    },
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['market-listings'],
    queryFn: () => queryDocuments<GhostwriterListing>(Collections.GHOSTWRITER_LISTINGS, [
      where('isActive', '==', true), orderBy('rating', 'desc'), limit(20),
    ]),
  });

  return { works, listings };
};
