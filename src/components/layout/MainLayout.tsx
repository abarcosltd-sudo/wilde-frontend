import React from 'react';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet,
} from '@ionic/react';
import {
  home, homeOutline, bag, bagOutline, add, notifications, notificationsOutline,
} from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants';
import CreateMenuModal from '@/features/writing/components/CreateMenuModal';
import { useUiStore } from '@/store/slices/uiStore';
import { useAuthStore } from '@/store/slices/authStore';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import Avatar from '@/components/ui/Avatar';

/**
 * Five slots, Create in the middle. Create is the one filled colour in the
 * chrome; the current tab is marked with a filled icon and a heavier label
 * rather than an accent, so the bar stays quiet.
 *
 * Explore has no tab of its own: it is reached from the search icon on Home.
 */
const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { openCreateMenu, isCreateMenuOpen, closeCreateMenu } = useUiStore();
  const { user } = useAuthStore();
  const { unreadCount } = useNotifications();
  const { pathname } = useLocation();

  const on = (route: string) => pathname === route || pathname.startsWith(`${route}/`);

  return (
    <>
      <IonTabs>
        <IonRouterOutlet>{children}</IonRouterOutlet>
        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href={ROUTES.HOME}>
            <IonIcon icon={on(ROUTES.HOME) ? home : homeOutline} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="market" href={ROUTES.MARKET}>
            <IonIcon icon={on(ROUTES.MARKET) ? bag : bagOutline} />
            <IonLabel>Market</IonLabel>
          </IonTabButton>
          <IonTabButton tab="create" className="tab-create" onClick={openCreateMenu}
            aria-label="Create">
            <span className="create-pill"><IonIcon icon={add} aria-hidden="true" /></span>
            <IonLabel>Create</IonLabel>
          </IonTabButton>
          <IonTabButton tab="activity" href={ROUTES.NOTIFICATIONS}>
            <span className="relative inline-flex">
              {/* Wrapped for the badge, so Ionic's own icon sizing (direct children
                  only) does not reach it. */}
              <IonIcon icon={on(ROUTES.NOTIFICATIONS) ? notifications : notificationsOutline}
                className="text-[24px]" />
              {unreadCount > 0 && (
                <span aria-label={`${unreadCount} unread`}
                  className="absolute -top-1 -right-2 min-w-4 h-4 px-1 flex items-center justify-center
                    rounded-full bg-fmt-artwork text-white text-[10px] font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            <IonLabel>Activity</IonLabel>
          </IonTabButton>
          <IonTabButton tab="profile" href={ROUTES.PROFILE}>
            <Avatar src={user?.photoURL} name={user?.displayName} size="sm"
              className={'!w-7 !h-7 ' + (on(ROUTES.PROFILE) ? 'ring-2 ring-wilde-black' : '')} />
            <IonLabel>Profile</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
      <CreateMenuModal isOpen={isCreateMenuOpen} onClose={closeCreateMenu} />
    </>
  );
};

export default MainLayout;
