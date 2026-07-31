import React from 'react';
import { IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { ROUTES } from '@/constants';
import AuthGuard from './AuthGuard';
import GuestGuard from './GuestGuard';
import adminRoutes from './AdminRoutes';
import MainLayout from '@/components/layout/MainLayout';
import CommandPalette from '@/components/ui/CommandPalette';
import RouteErrorBoundary from './RouteErrorBoundary';

/**
 * Every page is imported statically, on purpose.
 *
 * Route-level `React.lazy` was tried and reverted. It cut the entry chunk from
 * ~1.4MB to ~150kB, but it made the app depend on files a deploy renames: any
 * browser holding the previous `index.html` requested a hashed chunk that no
 * longer existed, the import rejected, and the page went blank until a
 * cache-bypassing reload. A one-shot recovery reload did not fully solve it.
 * With a single entry file, named directly by the document, there is nothing
 * left to arrive late or go missing mid-session.
 *
 * The bundle size is the deliberate cost. If it needs revisiting, split the
 * heavy leaf dependencies (the rich-text editor, the export service) behind a
 * user action instead — a failed import there degrades one feature rather than
 * blanking the whole screen.
 */
import SplashPage from '@/pages/auth/SplashPage';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';
import SignInPage from '@/pages/auth/SignInPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import HomePage from '@/pages/main/HomePage';
import ExplorePage from '@/pages/main/ExplorePage';
import WritingStudioPage from '@/pages/writing/WritingStudioPage';
import ReadWorkPage from '@/pages/writing/ReadWorkPage';
import CollaborationPage from '@/pages/writing/CollaborationPage';
import MarketplacePage from '@/pages/marketplace/MarketplacePage';
import JobsPage from '@/pages/marketplace/JobsPage';
import PaymentCallbackPage from '@/pages/marketplace/PaymentCallbackPage';
import NotificationsPage from '@/pages/main/NotificationsPage';
import CommunityPage from '@/pages/community/CommunityPage';
import ProfileDashPage from '@/pages/profile/ProfileDashPage';
import CreatorProfilePage from '@/pages/profile/CreatorProfilePage';
import SettingsPage from '@/pages/settings/SettingsPage';
import HelpPage from '@/pages/settings/HelpPage';
import PremiumPage from '@/pages/settings/PremiumPage';
import PrivacyPage from '@/pages/settings/PrivacyPage';

const AppRouter: React.FC = () => (
  <IonReactRouter>
    {/* Inside the router because it navigates; outside the outlet so the route
        change it triggers doesn't unmount it mid-navigation. */}
    <CommandPalette />
    {/* A page that throws while rendering now shows a message and a reload
        button rather than unmounting the tree and leaving a blank screen. */}
    <RouteErrorBoundary>
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
        {/* Staff-only. Outside `/app` because these screens bring their own
            chrome and their own gate; AdminGuard handles the signed-out and
            insufficient-role cases. Must stay above the catch-all below. */}
        {adminRoutes}
        <Redirect to={ROUTES.SPLASH} />
      </IonRouterOutlet>
    </RouteErrorBoundary>
  </IonReactRouter>
);

export default AppRouter;
