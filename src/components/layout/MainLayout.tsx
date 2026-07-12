import React from 'react';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet,
} from '@ionic/react';
import { home, search, add, bag, person } from 'ionicons/icons';
import { ROUTES } from '@/constants';
import CreateMenuModal from '@/features/writing/components/CreateMenuModal';
import { useUiStore } from '@/store/slices/uiStore';

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { openCreateMenu, isCreateMenuOpen, closeCreateMenu } = useUiStore();

  return (
    <>
      <IonTabs>
        <IonRouterOutlet>{children}</IonRouterOutlet>
        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href={ROUTES.HOME}>
            <IonIcon icon={home} /><IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="explore" href={ROUTES.EXPLORE}>
            <IonIcon icon={search} /><IonLabel>Explore</IonLabel>
          </IonTabButton>
          <IonTabButton tab="create" onClick={openCreateMenu}>
            <IonIcon icon={add} /><IonLabel>Create</IonLabel>
          </IonTabButton>
          <IonTabButton tab="market" href={ROUTES.MARKET}>
            <IonIcon icon={bag} /><IonLabel>Market</IonLabel>
          </IonTabButton>
          <IonTabButton tab="profile" href={ROUTES.PROFILE}>
            <IonIcon icon={person} /><IonLabel>Profile</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
      <CreateMenuModal isOpen={isCreateMenuOpen} onClose={closeCreateMenu} />
    </>
  );
};

export default MainLayout;
