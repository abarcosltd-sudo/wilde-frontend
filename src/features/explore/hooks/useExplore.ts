import { useState, useEffect, useCallback } from 'react';
import { queryDocuments, Collections, orderBy, limit, where } from '@/firebase/firestore.helpers';
import { QueryConstraint } from 'firebase/firestore';
import { Work, User, WorkType } from '@/types';

const TAB_TYPE: Partial<Record<string, WorkType>> = {
  Stories: 'short_story',
  Screenplays: 'screenplay',
  Poetry: 'poetry',
};

export const useExplore = (query: string, tab: string) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [creators, setCreators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async () => {
    setIsLoading(true);
    try {
      if (tab === 'Creators') {
        const users = await queryDocuments<User>(Collections.USERS, [orderBy('followersCount', 'desc'), limit(40)]);
        setCreators(query
          ? users.filter(u =>
              u.displayName?.toLowerCase().includes(query.toLowerCase()) ||
              u.username?.toLowerCase().includes(query.toLowerCase()))
          : users);
      } else {
        const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(40)];
        const type = TAB_TYPE[tab];
        if (type) constraints.unshift(where('type', '==', type));
        const results = await queryDocuments<Work>(Collections.WORKS, constraints);
        setWorks(query ? results.filter(w => w.title.toLowerCase().includes(query.toLowerCase())) : results);
      }
    } finally {
      setIsLoading(false);
    }
  }, [query, tab]);

  useEffect(() => { search(); }, [search]);

  return { works, creators, isLoading };
};
