import { useEffect } from 'react';
import { subscribeToAuth, signOut } from '@/firebase/auth.helpers';
import { getDocument, createDocument } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { Collections } from '@/firebase/firestore.helpers';
import { generateUsername } from '@/utils/username';
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
            try {
              await createDocument(Collections.USERS, {
                displayName: fbUser.displayName || 'New Creative',
                // Never derived from the email address: the Users document is
                // world-readable, so email stays in Firebase Auth only.
                username:    generateUsername(fbUser.displayName, fbUser.uid),
                photoURL:    fbUser.photoURL || undefined,
                roles: [], isPremium: false,
                followersCount: 0, followingCount: 0, worksCount: 0, totalSales: 0, streakCount: 0,
              }, fbUser.uid);
            } catch (err) {
              // Signed in with Google but no profile to show for it. Left alone
              // that is a dead end: Firebase says signed in, the app says
              // nobody is, and the sign-in screen stays up with no explanation.
              // Say so and sign out, so the next attempt starts clean.
              console.error('Failed to create profile for new Google user:', err);
              useUiStore.getState().showToast(
                "We couldn't finish setting up your account. Please try signing in again.", 'danger');
              await signOut();
              store.setUser(null);
              return;
            }
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
