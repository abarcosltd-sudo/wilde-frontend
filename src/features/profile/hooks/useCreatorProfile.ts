import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDocument, queryDocuments, createDocument, deleteDocument, updateDocument,
  Collections, where, increment,
} from '@/firebase/firestore.helpers';
import { User, Work, Follow } from '@/types';
import { useAuthStore } from '@/store/slices/authStore';
import { userQueryKey } from '@/hooks/useUser';
import { notify } from '@/features/notifications/notify';

export const useCreatorProfile = (uid: string) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const followKey = ['follow', user?.uid, uid] as const;

  // Shares `useUser`'s cache key, so a profile opened from a work card or the
  // trending rail renders from data the list already loaded.
  const { data: creator, isPending: isCreatorLoading } = useQuery({
    queryKey: userQueryKey(uid),
    queryFn: () => getDocument<User>(Collections.USERS, uid),
    enabled: !!uid,
    staleTime: 1000 * 60 * 15,
  });

  const { data: works = [], isPending: isWorksLoading } = useQuery({
    queryKey: ['creator-works', uid],
    queryFn: () => queryDocuments<Work>(Collections.WORKS, [where('authorId', '==', uid)]),
    enabled: !!uid,
  });

  const { data: followRow } = useQuery({
    queryKey: followKey,
    queryFn: async () => {
      const rows = await queryDocuments<Follow>(Collections.FOLLOWS, [
        where('followerId', '==', user!.uid),
        where('followingId', '==', uid),
      ]);
      return rows[0] ?? null;
    },
    enabled: !!user && user.uid !== uid,
  });

  const isFollowing = !!followRow;

  const { mutate: follow, isPending: isFollowPending } = useMutation({
    mutationFn: async () => {
      if (!user || user.uid === uid) return;
      if (followRow) {
        await deleteDocument(Collections.FOLLOWS, followRow.id);
        await updateDocument(Collections.USERS, user.uid, { followingCount: increment(-1) });
        await updateDocument(Collections.USERS, uid, { followersCount: increment(-1) });
      } else {
        await createDocument(Collections.FOLLOWS, { followerId: user.uid, followingId: uid });
        await updateDocument(Collections.USERS, user.uid, { followingCount: increment(1) });
        await updateDocument(Collections.USERS, uid, { followersCount: increment(1) });
        notify(uid, '👤', `${user.displayName} started following you`).catch(() => {});
      }
    },

    // Flip the button and the follower count the instant it's tapped; the write
    // is reconciled (or rolled back) underneath.
    onMutate: async () => {
      if (!user || user.uid === uid) return;
      await Promise.all([
        qc.cancelQueries({ queryKey: followKey }),
        qc.cancelQueries({ queryKey: userQueryKey(uid) }),
      ]);

      const prevFollow = qc.getQueryData<Follow | null>(followKey);
      const prevCreator = qc.getQueryData<User | null>(userQueryKey(uid));
      const wasFollowing = !!prevFollow;

      qc.setQueryData<Follow | null>(followKey, wasFollowing
        ? null
        // Stands in until the real document id arrives from `onSettled`.
        : ({ id: 'optimistic', followerId: user.uid, followingId: uid } as Follow));

      qc.setQueryData<User | null>(userQueryKey(uid), c => c && {
        ...c,
        followersCount: Math.max(0, (c.followersCount ?? 0) + (wasFollowing ? -1 : 1)),
      });

      return { prevFollow, prevCreator };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData(followKey, ctx.prevFollow);
      qc.setQueryData(userQueryKey(uid), ctx.prevCreator);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: followKey });
      qc.invalidateQueries({ queryKey: userQueryKey(uid) });
    },
  });

  return {
    creator: creator ?? null,
    works,
    isFollowing,
    follow,
    isFollowPending,
    isLoading: isCreatorLoading,
    isWorksLoading,
  };
};
