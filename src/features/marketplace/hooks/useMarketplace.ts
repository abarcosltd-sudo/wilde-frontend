import { useQuery } from '@tanstack/react-query';
import { queryDocuments, Collections, where, orderBy, limit } from '@/firebase/firestore.helpers';
import { Work, WorkType, GhostwriterListing } from '@/types';

const BOOK_TYPES: WorkType[] = ['short_story', 'long_work', 'poetry', 'screenplay', 'playlet'];

export const useMarketplace = (tab: string) => {
  const { data: works = [], isPending: isWorksLoading } = useQuery({
    // One fetch shared by every tab — the tab only narrows it client-side, so
    // switching tabs doesn't re-read Firestore.
    queryKey: ['market-works'],
    queryFn: () => queryDocuments<Work>(Collections.WORKS, [
      // Filtered and sorted server-side, against the existing
      // `Works {status ASC, price DESC}` composite index.
      //
      // This used to fetch 50 published works with no ordering and filter to
      // priced ones in memory, so once more than 50 published works existed,
      // works actually for sale could silently never appear. `price > 0` also
      // excludes documents with no price field at all, which is every work
      // published before pricing existed.
      where('status', '==', 'published'),
      where('price', '>', 0),
      orderBy('price', 'desc'),
      limit(50),
    ]),
  });

  // Type still splits client-side: filtering it server-side would need a third
  // composite index per tab, and the 50 priced works above are already narrow.
  const worksInTab = (tab === 'Books' ? works.filter(w => BOOK_TYPES.includes(w.type))
    : tab === 'Art' ? works.filter(w => w.type === 'artwork')
    : works
  ).slice(0, 20);

  const { data: listings = [], isPending: isListingsLoading } = useQuery({
    queryKey: ['market-listings'],
    queryFn: () => queryDocuments<GhostwriterListing>(Collections.GHOSTWRITER_LISTINGS, [
      where('isActive', '==', true), orderBy('rating', 'desc'), limit(20),
    ]),
  });

  return {
    works: worksInTab,
    listings,
    isLoading: tab === 'Services' ? isListingsLoading : isWorksLoading,
  };
};
