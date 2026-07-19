import React, { lazy } from 'react';
import { IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { ROUTES } from '@/constants';
import AuthGuard from './AuthGuard';
import GuestGuard from './GuestGuard';
import MainLayout from '@/components/layout/MainLayout';
import { useAuthStore } from '@/store/slices/authStore';

const SplashPage         = lazy(() => import('@/pages/auth/SplashPage'));
const OnboardingPage     = lazy(() => import('@/pages/onboarding/OnboardingPage'));
const SignInPage         = lazy(() => import('@/pages/auth/SignInPage'));
const SignUpPage         = lazy(() => import('@/pages/auth/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const HomePage           = lazy(() => import('@/pages/main/HomePage'));
const ExplorePage        = lazy(() => import('@/pages/main/ExplorePage'));
const CreateMenuPage     = lazy(() => import('@/pages/writing/CreateMenuPage'));
const WritingStudioPage  = lazy(() => import('@/pages/writing/WritingStudioPage'));
const CollaborationPage  = lazy(() => import('@/pages/writing/CollaborationPage'));
const MarketplacePage    = lazy(() => import('@/pages/marketplace/MarketplacePage'));
const JobsPage           = lazy(() => import('@/pages/marketplace/JobsPage'));
const AiAssistantPage    = lazy(() => import('@/pages/main/AiAssistantPage'));
const NotificationsPage  = lazy(() => import('@/pages/main/NotificationsPage'));
const ProfileDashPage    = lazy(() => import('@/pages/profile/ProfileDashPage'));
const CreatorProfilePage = lazy(() => import('@/pages/profile/CreatorProfilePage'));
const SettingsPage       = lazy(() => import('@/pages/settings/SettingsPage'));


const DebugBadge: React.FC = () => {
  const { user, firebaseUser, isLoading } = useAuthStore();
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
      background: 'black', color: 'lime', fontSize: 10, padding: 4,
      fontFamily: 'monospace', wordBreak: 'break-all',
    }}>
      isLoading: {String(isLoading)} | firebaseUser: {firebaseUser ? firebaseUser.email : 'null'} | user(profile): {user ? user.username || user.uid : 'null'}
    </div>
  );
};

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
            <Route exact path={ROUTES.CREATE}         component={CreateMenuPage} />
            <Route exact path={ROUTES.MARKET}         component={MarketplacePage} />
            <Route exact path={ROUTES.PROFILE}        component={ProfileDashPage} />
            <Route exact path={ROUTES.CREATOR_PROFILE} component={CreatorProfilePage} />
            <Route exact path={ROUTES.WRITING_STUDIO} component={WritingStudioPage} />
            <Route exact path={ROUTES.COLLABORATION}  component={CollaborationPage} />
            <Route exact path={ROUTES.AI_ASSISTANT}   component={AiAssistantPage} />
            <Route exact path={ROUTES.JOBS}           component={JobsPage} />
            <Route exact path={ROUTES.NOTIFICATIONS}  component={NotificationsPage} />
            <Route exact path={ROUTES.SETTINGS}       component={SettingsPage} />
            <Redirect from="/app" to={ROUTES.HOME} exact />
            <DebugBadge />
          </IonRouterOutlet>
        </MainLayout>
      </AuthGuard>
      <Redirect to={ROUTES.SPLASH} />
    </IonRouterOutlet>
  </IonReactRouter>
);

export default AppRouter;
