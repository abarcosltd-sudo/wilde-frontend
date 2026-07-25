import React from 'react';
import { IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { ROUTES } from '@/constants';
import AuthGuard from './AuthGuard';
import GuestGuard from './GuestGuard';
import MainLayout from '@/components/layout/MainLayout';

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
import NotificationsPage from '@/pages/main/NotificationsPage';
import CommunityPage from '@/pages/community/CommunityPage';
import ProfileDashPage from '@/pages/profile/ProfileDashPage';
import CreatorProfilePage from '@/pages/profile/CreatorProfilePage';
import SettingsPage from '@/pages/settings/SettingsPage';
import HelpPage from '@/pages/settings/HelpPage';
import PrivacyPage from '@/pages/settings/PrivacyPage';

const AppRouter: React.FC = () => (
  <IonReactRouter>
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
            <Route exact path={ROUTES.NOTIFICATIONS}  component={NotificationsPage} />
            <Route exact path={ROUTES.COMMUNITY}      component={CommunityPage} />
            <Route exact path={ROUTES.SETTINGS}       component={SettingsPage} />
            <Route exact path={ROUTES.HELP}           component={HelpPage} />
            <Route exact path={ROUTES.PRIVACY}        component={PrivacyPage} />
            <Redirect from="/app" to={ROUTES.HOME} exact />
          </IonRouterOutlet>
        </MainLayout>
      </AuthGuard>
      <Redirect to={ROUTES.SPLASH} />
    </IonRouterOutlet>
  </IonReactRouter>
);

export default AppRouter;
