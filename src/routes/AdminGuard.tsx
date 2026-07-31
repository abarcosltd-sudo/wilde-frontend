import React from 'react';
import { Redirect } from 'react-router-dom';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';

import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import type { Permission } from '@/features/admin/types/admin.types';
import { ROUTES } from '@/constants';

/**
 * Gate for every /admin route.
 *
 * This is a convenience layer, not the security boundary — it decides what to
 * paint, nothing more. The real check lives in firestore.rules (and, once the
 * backend admin routes exist, in the token verification there). Anyone can edit
 * client-side JavaScript; nobody can edit a signed custom claim.
 */
export const AdminGuard: React.FC<{
  children: React.ReactNode;
  requires?: Permission;
}> = ({ children, requires }) => {
  const { status, can } = useAdminAuth();

  if (status === 'loading') {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="flex h-full items-center justify-center">
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (status === 'signed-out') {
    return <Redirect to={ROUTES.SIGN_IN} />;
  }

  if (status === 'forbidden' || (requires && !can(requires))) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="mx-auto max-w-md py-20 text-center">
            <h1 className="text-lg font-semibold text-slate-900">You don't have admin access</h1>
            <p className="mt-2 text-sm text-slate-600">
              This area is limited to accounts with an admin role. If you should have one, ask a
              superadmin to grant it from Users.
            </p>
            <a href="/" className="mt-4 inline-block text-sm text-indigo-600 underline">
              Back to WILDE
            </a>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return <>{children}</>;
};
