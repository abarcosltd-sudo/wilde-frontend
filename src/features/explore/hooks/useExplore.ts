import { useEffect, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryDocuments, Collections, orderBy, limit, where } from '@/firebase/firestore.helpers';
import { QueryConstraint } from 'firebase/firestore';
import { usePrimeUserCache } from '@/hooks/useUser';
import { Work, User, WorkType } from '@/types';

const TAB_TYPE: Partial<Record<string, WorkType>> = {
  Stories: 'short_story',
  Screenplays: 'screenplay',
  Poetry: 'poetry',
};

export const useExplore = (query: string, tab: string) => {
  const primeUsers = usePrimeUserCache();
  const isCreators = tab === 'Creators';

  // The search term filters client-side over an already-fetched page, so it is
  // deliberately *not* part of the query key: typing narrows the cached list
  // instantly instead of firing a Firestore read per keystroke.
  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['explore', tab],
    queryFn: async () => {
      if (isCreators) {
        return queryDocuments<User>(Collections.USERS, [orderBy('followersCount', 'desc'), limit(40)]);
      }
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(40)];
      const type = TAB_TYPE[tab];
      if (type) constraints.unshift(where('type', '==', type));
      return queryDocuments<Work>(Collections.WORKS, constraints);
    },
    // Switching tabs keeps the previous tab's results on screen until the new
    // ones land, so the list never collapses to an empty flash mid-switch.
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isCreators && data) primeUsers(data as User[]);
  }, [isCreators, data]);

  const term = query.trim().toLowerCase();

  const creators = useMemo(() => {
    if (!isCreators) return [];
    const rows = (data ?? []) as User[];
    if (!term) return rows;
    return rows.filter(u =>
      u.displayName?.toLowerCase().includes(term) ||
      u.username?.toLowerCase().includes(term));
  }, [isCreators, data, term]);

  const works = useMemo(() => {
    if (isCreators) return [];
    const rows = (data ?? []) as Work[];
    if (!term) return rows;
    return rows.filter(w => w.title?.toLowerCase().includes(term));
  }, [isCreators, data, term]);

  return {
    works, creators, isLoading: isPending, isFetching,
    error: isError ? error : null,
    retry: refetch,
  };
};
