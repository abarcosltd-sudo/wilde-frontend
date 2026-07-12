import { useEffect } from 'react';
import { subscribeToAuth } from '@/firebase/auth.helpers';
import { getDocument } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { Collections } from '@/constants';
import { User } from '@/types';

export const useAuth = () => {
  const store = useAuthStore();

  useEffect(() => {
    const unsub = subscribeToAuth(async (fbUser) => {
      store.setFirebaseUser(fbUser);
      if (fbUser) {
        const profile = await getDocument<User>(Collections.USERS, fbUser.uid);
        store.setUser(profile);
      } else {
        store.clear();
      }
      store.setLoading(false);
    });
    return unsub;
  }, []);

  return {
    user: store.user,
    isLoading: store.isLoading,
    isAuthenticated: !!store.user,
  };
};
