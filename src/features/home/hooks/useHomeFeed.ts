import { useState, useEffect } from 'react';
import { queryDocuments, Collections, orderBy, limit } from '@/firebase/firestore.helpers';
import { Work, User } from '@/types';

export const useHomeFeed = () => {
  const [feed, setFeed] = useState<Work[]>([]);
  const [trending, setTrending] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const [works, creators] = await Promise.all([
      queryDocuments<Work>(Collections.WORKS, [orderBy('createdAt', 'desc'), limit(20)]),
      queryDocuments<User>(Collections.USERS, [orderBy('followersCount', 'desc'), limit(10)]),
    ]);
    setFeed(works);
    setTrending(creators);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  return { feed, trending, refresh: load, isLoading };
};
