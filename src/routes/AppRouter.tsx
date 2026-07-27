import React, { lazy, Suspense } from 'react';
import { IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { ROUTES } from '@/constants';
import AuthGuard from './AuthGuard';
import GuestGuard from './GuestGuard';
import MainLayout from '@/components/layout/MainLayout';
import CommandPalette from '@/components/ui/CommandPalette';
import RouteFallback from '@/components/layout/RouteFallback';

/**
 * Routes are lazy so the first load ships the shell and the landing screen
 * rather than every page in the app. Previously all nineteen pages, the
 * rich-text editor and the export service sat in one chunk that had to be
 * downloaded and parsed before anything could render.
 *
 * Splash and sign-in stay eager: they are the first thing an unauthenticated
 * visitor sees, and putting a loading state in front of the loading screen
 * would trade one blank frame for two.
 */
import SplashPage from '@/pages/auth/SplashPage';
import SignInPage from '@/pages/auth/SignInPage';

const OnboardingPage      = lazy(() => import('@/pages/onboarding/OnboardingPage'));
const SignUpPage          = lazy(() => import('@/pages/auth/SignUpPage'));
const ForgotPasswordPage  = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const HomePage            = lazy(() => import('@/pages/main/HomePage'));
const ExplorePage         = lazy(() => import('@/pages/main/ExplorePage'));
const WritingStudioPage   = lazy(() => import('@/pages/writing/WritingStudioPage'));
const ReadWorkPage        = lazy(() => import('@/pages/writing/ReadWorkPage'));
const CollaborationPage   = lazy(() => import('@/pages/writing/CollaborationPage'));
const MarketplacePage     = lazy(() => import('@/pages/marketplace/MarketplacePage'));
const JobsPage            = lazy(() => import('@/pages/marketplace/JobsPage'));
const PaymentCallbackPage = lazy(() => import('@/pages/marketplace/PaymentCallbackPage'));
const NotificationsPage   = lazy(() => import('@/pages/main/NotificationsPage'));
const CommunityPage       = lazy(() => import('@/pages/community/CommunityPage'));
const ProfileDashPage     = lazy(() => import('@/pages/profile/ProfileDashPage'));
const CreatorProfilePage  = lazy(() => import('@/pages/profile/CreatorProfilePage'));
const SettingsPage        = lazy(() => import('@/pages/settings/SettingsPage'));
const HelpPage            = lazy(() => import('@/pages/settings/HelpPage'));
const PremiumPage         = lazy(() => import('@/pages/settings/PremiumPage'));
const PrivacyPage         = lazy(() => import('@/pages/settings/PrivacyPage'));

const AppRouter: React.FC = () => (
  <IonReactRouter>
    {/* Inside the router because it navigates; outside the outlet so the route
        change it triggers doesn't unmount it mid-navigation. */}
    <CommandPalette />
    <Suspense fallback={<RouteFallback />}>
      <IonRouterOutlet>
        <Route exact path={ROUTES.SPLASH}         component={SplashPage} />
        <Route path={ROUTES.ONBOARDING}           component={OnboardingPage} />
        <GuestGuard path={ROUTES.SIGN_IN}         component={SignInPage} />
        <GuestGuard path={ROUTES.SIGN_UP}         component={SignUpPage} />
        <GuestGuard path={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordPage} />
        <AuthGuard path="/app">
          <MainLayout>
            <IonRouterOutlet>
              <Route exact path={ROUTES.HOME}           component={HomePage} />
              <Route exact path={ROUTES.EXPLORE}        component={ExplorePage} />
              <Route exact path={ROUTES.MARKET}         component={MarketplacePage} />
              <Route exact path={ROUTES.PROFILE}        component={ProfileDashPage} />
              <Route exact path={ROUTES.CREATOR_PROFILE} component={CreatorProfilePage} />
              <Route exact path={ROUTES.WRITING_STUDIO} component={WritingStudioPage} />
              <Route exact path={ROUTES.READ_WORK}      component={ReadWorkPage} />
              <Route exact path={ROUTES.COLLABORATION}  component={CollaborationPage} />
              <Route exact path={ROUTES.JOBS}           component={JobsPage} />
              <Route exact path={ROUTES.PAYMENT_CALLBACK} component={PaymentCallbackPage} />
              <Route exact path={ROUTES.NOTIFICATIONS}  component={NotificationsPage} />
              <Route exact path={ROUTES.COMMUNITY}      component={CommunityPage} />
              <Route exact path={ROUTES.SETTINGS}       component={SettingsPage} />
              <Route exact path={ROUTES.HELP}           component={HelpPage} />
              <Route exact path={ROUTES.PREMIUM}        component={PremiumPage} />
              <Route exact path={ROUTES.PRIVACY}        component={PrivacyPage} />
              <Redirect from="/app" to={ROUTES.HOME} exact />
            </IonRouterOutlet>
          </MainLayout>
        </AuthGuard>
        <Redirect to={ROUTES.SPLASH} />
      </IonRouterOutlet>
    </Suspense>
  </IonReactRouter>
);

export default AppRouter;
