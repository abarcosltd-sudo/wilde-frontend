import { useEffect } from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/firebase/config';
import { useAdminStore } from '../store/adminStore';
import { ROLE_PERMISSIONS, type AdminRole, type Permission } from '../types/admin.types';

const VALID_ROLES: AdminRole[] = ['superadmin', 'admin', 'moderator', 'analyst'];

/**
 * Resolves the signed-in user's admin role.
 *
 * The custom claim is the source of truth — it is signed by Firebase and is what
 * firestore.rules checks, so it can't be forged from the client. The Users
 * document is only a fallback for projects that haven't wired claims yet, and it
 * buys nothing at the rules layer: treat it as convenience, not security.
 */
async function resolveRole(user: User): Promise<AdminRole | null> {
  const token = await user.getIdTokenResult(true);
  const claimed = (token.claims.role ?? (token.claims.admin ? 'admin' : null)) as string | null;
  if (claimed && VALID_ROLES.includes(claimed as AdminRole)) return claimed as AdminRole;

  const snap = await getDoc(doc(db, 'Users', user.uid));
  const stored = snap.exists() ? (snap.data().role as string | undefined) : undefined;
  return stored && VALID_ROLES.includes(stored as AdminRole) ? (stored as AdminRole) : null;
}

export function useAdminAuth() {
  const { identity, status, setIdentity, setStatus } = useAdminStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      if (!user) {
        setIdentity(null);
        setStatus('signed-out');
        return;
      }

      setStatus('loading');
      try {
        const role = await resolveRole(user);
        setIdentity({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role,
          permissions: role ? ROLE_PERMISSIONS[role] : [],
        });
        setStatus(role ? 'authorised' : 'forbidden');
      } catch (error) {
        console.error('[admin] could not resolve role', error);
        setIdentity(null);
        setStatus('forbidden');
      }
    });

    return unsubscribe;
  }, [setIdentity, setStatus]);

  const can = (permission: Permission) => !!identity?.permissions.includes(permission);

  return { identity, status, can };
}

/** Permission check for components that don't need the whole auth lifecycle. */
export function useCan() {
  const identity = useAdminStore((s) => s.identity);
  return (permission: Permission) => !!identity?.permissions.includes(permission);
}
