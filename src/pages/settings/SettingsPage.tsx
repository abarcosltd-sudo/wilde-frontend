import React from 'react';
import { PAGE_CLASS } from '@/components/layout/Page';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import {
  personOutline, starOutline, notificationsOutline, createOutline,
  cardOutline, lockClosedOutline, helpCircleOutline, chevronForwardOutline,
  peopleOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { format } from 'date-fns';
import { signOut } from '@/firebase/auth.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useThemeStore, ThemePreference } from '@/store/slices/themeStore';
// Read-only here. `useTheme` is mounted once in `App` and owns the class and
// the timer; calling it again would start a second set of both.
import { resolveIsDark, nextSwitchAt } from '@/hooks/useTheme';
import { ROUTES } from '@/constants';

interface SettingsItem {
  label: string;
  icon: string;
  route?: string;
  /**
   * Why this item can't be opened yet. Shown in place of the old blanket
   * "Coming soon", which told the user nothing about what they were waiting for.
   */
  blockedReason?: string;
}

const SETTINGS_ITEMS: SettingsItem[] = [
  { label: 'Account',      icon: personOutline,        route: ROUTES.PROFILE },
  { label: 'Community',    icon: peopleOutline,        route: ROUTES.COMMUNITY },
  { label: 'Notifications', icon: notificationsOutline, route: ROUTES.NOTIFICATIONS },
  { label: 'Privacy',      icon: lockClosedOutline,    route: ROUTES.PRIVACY },
  { label: 'Help & Support', icon: helpCircleOutline,  route: ROUTES.HELP },
  {
    label: 'Premium',
    icon: starOutline,
    route: ROUTES.PREMIUM,
  },
  {
    label: 'Payment Methods',
    icon: cardOutline,
    blockedReason: 'Needs payments',
  },
  {
    label: 'Writing Reminders',
    icon: createOutline,
    blockedReason: 'Needs notifications',
  },
];

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'auto',  label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark',  label: 'Dark' },
];

const THEME_PILL_CLASS =
  'flex-1 text-center text-xs py-1.5 rounded-full border cursor-pointer transition-colors ' +
  'border-wilde-border peer-checked:bg-wilde-black peer-checked:text-wilde-on-ink ' +
  'peer-checked:border-wilde-black ' +
  'peer-focus-visible:ring-2 peer-focus-visible:ring-gold-strong peer-focus-visible:ring-offset-1 ' +
  'peer-focus-visible:ring-offset-wilde-surface';

const SettingsPage: React.FC = () => {
  const { clear } = useAuthStore();
  const history = useHistory();
  const preference = useThemeStore(s => s.preference);
  const setPreference = useThemeStore(s => s.setPreference);

  const handleSignOut = async () => {
    await signOut();
    clear();
    history.replace(ROUTES.SIGN_IN);
  };

  // Naming the actual switch time beats "follows your device": this app's auto
  // mode follows the clock, not a system setting, and the hours aren't guessable.
  const themeHint = preference === 'auto'
    ? `${resolveIsDark(preference) ? 'Dark' : 'Light'} until ${format(nextSwitchAt(), 'h:mm a')}`
    : `Always ${preference}. Ignores the time of day.`;

  return (
    <IonPage>
      <IonContent>
        <div className={PAGE_CLASS}>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-5">Settings</h1>

          {/* Real radios behind the pills, so arrow-key navigation and group
              semantics come from the browser rather than being reimplemented. */}
          <fieldset className="mb-2 pb-4 border-b border-wilde-border">
            <legend className="text-sm font-medium mb-2">Appearance</legend>
            <div className="flex gap-2">
              {THEME_OPTIONS.map(option => (
                <label key={option.value} className="flex-1 flex">
                  <input
                    type="radio"
                    name="theme-preference"
                    value={option.value}
                    checked={preference === option.value}
                    onChange={() => setPreference(option.value)}
                    className="sr-only peer" />
                  <span className={THEME_PILL_CLASS}>{option.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-wilde-muted mt-2">{themeHint}</p>
          </fieldset>

          {SETTINGS_ITEMS.map(item => (
            <button key={item.label}
              onClick={item.route ? () => history.push(item.route as string) : undefined}
              disabled={!item.route}
              aria-disabled={!item.route}
              className={'flex items-center gap-3 py-4 border-b border-wilde-border w-full text-left ' +
                'transition-colors ' +
                (item.route ? 'active:bg-wilde-subtle' : 'opacity-40 cursor-not-allowed')}>
              <IonIcon icon={item.icon} aria-hidden="true" className="text-lg text-wilde-black" />
              <span className="text-sm font-medium">{item.label}</span>
              {item.blockedReason && (
                <span className="text-xs text-wilde-muted ml-auto mr-1">{item.blockedReason}</span>
              )}
              <IonIcon icon={chevronForwardOutline} aria-hidden="true"
                className={item.route ? 'ml-auto text-wilde-muted' : 'text-wilde-muted'} />
            </button>
          ))}
          <button onClick={handleSignOut}
            className="mt-6 w-full text-center text-sm text-red-500 dark:text-red-400 font-medium py-3">
            Sign Out
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
