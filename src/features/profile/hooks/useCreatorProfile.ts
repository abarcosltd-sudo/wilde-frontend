import { useState, useEffect } from 'react';
import {
  getDocument, queryDocuments, createDocument, deleteDocument, updateDocument,
  Collections, where, increment,
} from '@/firebase/firestore.helpers';
import { User, Work, Follow } from '@/types';
import { useAuthStore } from '@/store/slices/authStore';
import { notify } from '@/features/notifications/notify';

export const useCreatorProfile = (uid: string) => {
  const [creator, setCreator] = useState<User | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    getDocument<User>(Collections.USERS, uid).then(setCreator);
    queryDocuments<Work>(Collections.WORKS, [where('authorId', '==', uid)]).then(setWorks);
  }, [uid]);

  useEffect(() => {
    if (!user || user.uid === uid) return;
    queryDocuments<Follow>(Collections.FOLLOWS, [
      where('followerId', '==', user.uid),
      where('followingId', '==', uid),
    ]).then(rows => {
      setIsFollowing(!!rows[0]);
      setFollowId(rows[0]?.id ?? null);
    });
  }, [uid, user?.uid]);

  const follow = async () => {
    if (!user || user.uid === uid) return;
    if (isFollowing) {
      if (followId) await deleteDocument(Collections.FOLLOWS, followId);
      await updateDocument(Collections.USERS, user.uid, { followingCount: increment(-1) });
      setIsFollowing(false);
      setFollowId(null);
      setCreator(c => c && { ...c, followersCount: Math.max(0, c.followersCount - 1) });
      updateDocument(Collections.USERS, uid, { followersCount: increment(-1) }).catch(() => {});
    } else {
      const id = await createDocument(Collections.FOLLOWS, { followerId: user.uid, followingId: uid });
      await updateDocument(Collections.USERS, user.uid, { followingCount: increment(1) });
      setIsFollowing(true);
      setFollowId(id);
      setCreator(c => c && { ...c, followersCount: c.followersCount + 1 });
      updateDocument(Collections.USERS, uid, { followersCount: increment(1) }).catch(() => {});
      notify(uid, '👤', `${user.displayName} started following you`).catch(() => {});
    }
  };

  return { creator, works, isFollowing, follow };
};
