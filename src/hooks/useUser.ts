import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { getDocument, Collections } from '@/firebase/firestore.helpers';
import { User } from '@/types';

/**
 * Shared, cached lookup of a user profile by id.
 *
 * Author names appear on every work card, marketplace row and comment, and each
 * of those used to run its own uncached `getDocument` in a `useEffect` — so a
 * 20-card feed by 3 authors fired 20 reads, again on every remount. Going
 * through one query key per user collapses that to one read per distinct user,
 * shared across every component that asks for them.
 */
export const userQueryKey = (uid?: string) => ['user', uid] as const;

const userQueryOptions = (uid?: string) => ({
  queryKey: userQueryKey(uid),
  queryFn: () => getDocument<User>(Collections.USERS, uid!),
  enabled: !!uid,
  // Display names and avatars change rarely; holding them longer than the
  // global default keeps lists from re-reading profiles as the user browses.
  staleTime: 1000 * 60 * 15,
});

export const useUser = (uid?: string) => {
  const { data, isLoading } = useQuery(userQueryOptions(uid));
  return { user: data ?? null, isLoading: !!uid && isLoading };
};

/** Batched variant for lists of ids — each id still shares the single-user cache. */
export const useUsers = (uids: string[]) => {
  const results = useQueries({ queries: uids.map(uid => userQueryOptions(uid)) });
  return {
    users: results.map(r => r.data).filter((u): u is User => !!u),
    isLoading: results.some(r => r.isLoading),
  };
};

/**
 * Seeds the per-user cache from a list that already contains full profiles
 * (e.g. the trending-creators rail), so opening one of those profiles renders
 * immediately instead of refetching a document we already hold.
 */
export const usePrimeUserCache = () => {
  const qc = useQueryClient();
  return (users: User[]) => {
    users.forEach(u => {
      if (u?.id) qc.setQueryData(userQueryKey(u.id), u);
    });
  };
};
