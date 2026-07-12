import { useState, useEffect } from 'react';
import { getDocument, queryDocuments, Collections, where } from '@/firebase/firestore.helpers';
import { User, Work } from '@/types';
import { useAuthStore } from '@/store/slices/authStore';

export const useCreatorProfile = (uid: string) => {
  const [creator, setCreator] = useState<User | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    getDocument<User>(Collections.USERS, uid).then(setCreator);
    queryDocuments<Work>(Collections.WORKS, [where('authorId', '==', uid)]).then(setWorks);
  }, [uid]);

  const follow = async () => setIsFollowing(f => !f); // TODO: real follow logic

  return { creator, works, isFollowing, follow };
};
