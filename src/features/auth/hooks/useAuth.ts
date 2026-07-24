import { useEffect } from 'react';
import { subscribeToAuth } from '@/firebase/auth.helpers';
import { getDocument, createDocument } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { Collections } from '@/firebase/firestore.helpers';
import { User } from '@/types';

export const useAuth = () => {
  const store = useAuthStore();

  useEffect(() => {
    const unsub = subscribeToAuth(async (fbUser) => {
      store.setFirebaseUser(fbUser);
      try {
        if (fbUser) {
          let profile = await getDocument<User>(Collections.USERS, fbUser.uid);
          const isOAuth = fbUser.providerData.some(p => p.providerId !== 'password');
          if (!profile && isOAuth) {
            await createDocument(Collections.USERS, {
              displayName: fbUser.displayName || 'New Creative',
              username:    fbUser.email?.split('@')[0] || fbUser.uid.slice(0, 8),
              email:       fbUser.email || '',
              photoURL:    fbUser.photoURL || undefined,
              roles: [], isPremium: false,
              followersCount: 0, followingCount: 0, worksCount: 0, totalSales: 0, streakCount: 0,
            }, fbUser.uid);
            profile = await getDocument<User>(Collections.USERS, fbUser.uid);
          }
          store.setUser(profile ? { ...profile, uid: fbUser.uid } : null);
        } else {
          store.clear();
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        store.setUser(null);
      } finally {
        store.setLoading(false);
      }
    });
    return unsub;
  }, []);

  return {
    user: store.user,
    isLoading: store.isLoading,
    isAuthenticated: !!store.user,
  };
};
