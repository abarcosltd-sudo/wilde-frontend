import { useQuery } from '@tanstack/react-query';
import { queryDocuments, Collections, where, orderBy, limit } from '@/firebase/firestore.helpers';
import { Work, GhostwriterListing } from '@/types';

export const useMarketplace = (tab: string) => {
  const { data: works = [] } = useQuery({
    queryKey: ['market-works', tab],
    queryFn: () => queryDocuments<Work>(Collections.WORKS, [
      where('status', '==', 'published'),
      where('price', '>', 0),
      orderBy('price', 'desc'), limit(20),
    ]),
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['market-listings'],
    queryFn: () => queryDocuments<GhostwriterListing>(Collections.GHOSTWRITER_LISTINGS, [
      where('isActive', '==', true), orderBy('rating', 'desc'), limit(20),
    ]),
  });

  return { works, listings };
};
