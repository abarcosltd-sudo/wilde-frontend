import { useState, useEffect, useCallback } from 'react';
import { queryDocuments, Collections, orderBy, limit, where } from '@/firebase/firestore.helpers';
import { Work } from '@/types';

export const useExplore = (query: string, tab: string) => {
  const [results, setResults] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async () => {
    setIsLoading(true);
    const constraints = [orderBy('createdAt', 'desc'), limit(40)];
    if (tab !== 'All' && tab !== 'Creators') {
      constraints.unshift(where('type', '==', tab.toLowerCase().replace('s', '')));
    }
    const works = await queryDocuments<Work>(Collections.WORKS, constraints);
    setResults(query ? works.filter(w => w.title.toLowerCase().includes(query.toLowerCase())) : works);
    setIsLoading(false);
  }, [query, tab]);

  useEffect(() => { search(); }, [search]);

  return { results, isLoading };
};
