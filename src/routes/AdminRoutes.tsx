import React, { Suspense, lazy } from 'react';
import { Route } from 'react-router-dom';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';

import { ROUTES } from '@/constants';
import { AdminGuard } from './AdminGuard';

/**
 * The one place the app still loads a route lazily.
 *
 * `AppRouter` imports every reader-facing page statically, on purpose — see the
 * note there: a deploy renames hashed chunks, and a browser holding the old
 * document then requests a file that no longer exists. These routes keep
 * `lazy` anyway, on the exception that note itself carves out. The admin
 * screens are a leaf nobody navigates through: a failed import degrades
 * `/admin` for the handful of staff who use it, instead of blanking the app for
 * every reader. `RouteErrorBoundary` wraps the outlet and catches the rejected
 * import — Suspense alone would not — so the failure surfaces as the standard
 * "this page didn't load" screen with a reload button.
 *
 * What it buys: the tables, editor and charts behind these six pages stay out
 * of the entry bundle that ships to every reader on mobile.
 */
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminMarketPage = lazy(() => import('@/pages/admin/AdminMarketPage'));
const AdminModerationPage = lazy(() => import('@/pages/admin/AdminModerationPage'));
const AdminCollectionPage = lazy(() => import('@/pages/admin/AdminCollectionPage'));

const Loading = () => (
  <IonPage>
    <IonContent>
      <div className="flex h-full items-center justify-center">
        <IonSpinner />
      </div>
    </IonContent>
  </IonPage>
);

const guarded = (Component: React.ComponentType, requires?: Parameters<typeof AdminGuard>[0]['requires']) => () => (
  <AdminGuard requires={requires}>
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  </AdminGuard>
);

export const adminRoutes = [
  <Route key="admin"            exact path={ROUTES.ADMIN}            render={guarded(AdminDashboardPage, 'analytics.read')} />,
  <Route key="admin-analytics"  exact path={ROUTES.ADMIN_ANALYTICS}  render={guarded(AdminAnalyticsPage, 'analytics.read')} />,
  <Route key="admin-users"      exact path={ROUTES.ADMIN_USERS}      render={guarded(AdminUsersPage, 'users.read')} />,
  <Route key="admin-market"     exact path={ROUTES.ADMIN_MARKET}     render={guarded(AdminMarketPage, 'market.read')} />,
  <Route key="admin-moderation" exact path={ROUTES.ADMIN_MODERATION} render={guarded(AdminModerationPage, 'content.read')} />,
  <Route key="admin-collection" exact path={ROUTES.ADMIN_COLLECTION} render={guarded(AdminCollectionPage, 'content.read')} />,
];

export default adminRoutes;
