import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryDocuments, Collections, orderBy, limit } from '@/firebase/firestore.helpers';
import { usePrimeUserCache } from '@/hooks/useUser';
import { Work, User } from '@/types';

export const useHomeFeed = () => {
  const primeUsers = usePrimeUserCache();

  const feedQuery = useQuery({
    queryKey: ['home-feed'],
    queryFn: () => queryDocuments<Work>(Collections.WORKS, [orderBy('createdAt', 'desc'), limit(20)]),
  });

  const trendingQuery = useQuery({
    queryKey: ['trending-creators'],
    queryFn: () => queryDocuments<User>(Collections.USERS, [orderBy('followersCount', 'desc'), limit(10)]),
  });

  // The trending rail already carries full profiles — hand them to the shared
  // user cache so tapping through to a creator renders without a second read.
  useEffect(() => {
    if (trendingQuery.data) primeUsers(trendingQuery.data);
  }, [trendingQuery.data]);

  const refresh = async () => {
    await Promise.all([feedQuery.refetch(), trendingQuery.refetch()]);
  };

  return {
    feed: feedQuery.data ?? [],
    trending: trendingQuery.data ?? [],
    refresh,
    // Only true on the very first load. A background refetch of cached data
    // keeps the existing list on screen rather than flashing skeletons.
    isLoading: feedQuery.isPending || trendingQuery.isPending,
  };
};
