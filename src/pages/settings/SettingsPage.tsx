import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import {
  personOutline, starOutline, notificationsOutline, createOutline,
  cardOutline, lockClosedOutline, helpCircleOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { signOut } from '@/firebase/auth.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { ROUTES } from '@/constants';

const SETTINGS_ITEMS = [
  { label: 'Account', icon: personOutline, route: ROUTES.PROFILE },
  { label: 'Premium', icon: starOutline, route: null },
  { label: 'Notifications', icon: notificationsOutline, route: ROUTES.NOTIFICATIONS },
  { label: 'Writing Reminders', icon: createOutline, route: null },
  { label: 'Payment Methods', icon: cardOutline, route: null },
  { label: 'Privacy', icon: lockClosedOutline, route: null },
  { label: 'Help & Support', icon: helpCircleOutline, route: null },
];

const SettingsPage: React.FC = () => {
  const { clear } = useAuthStore();
  const history = useHistory();

  const handleSignOut = async () => {
    await signOut();
    clear();
    history.replace(ROUTES.SIGN_IN);
  };

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <h1 className="font-bold text-lg mb-4">Settings</h1>
          {SETTINGS_ITEMS.map(item => (
            <button key={item.label}
              onClick={item.route ? () => history.push(item.route as string) : undefined}
              disabled={!item.route}
              aria-disabled={!item.route}
              className={'flex items-center gap-3 py-4 border-b border-gray-100 w-full text-left ' +
                (item.route ? 'active:bg-gray-50' : 'opacity-40 cursor-not-allowed')}>
              <IonIcon icon={item.icon} aria-hidden="true" className="text-lg text-wilde-black" />
              <span className="text-sm font-medium">{item.label}</span>
              {!item.route && <span className="text-xs text-wilde-muted ml-auto mr-1">Coming soon</span>}
              <IonIcon icon={chevronForwardOutline} aria-hidden="true"
                className={item.route ? 'ml-auto text-gray-500' : 'text-gray-500'} />
            </button>
          ))}
          <button onClick={handleSignOut}
            className="mt-6 w-full text-center text-sm text-red-500 font-medium py-3">
            Sign Out
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
