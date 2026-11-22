import React, { useEffect, useRef } from 'react';
import { IonIcon } from '@ionic/react';
import {
  closeOutline, personOutline, documentTextOutline, statsChartOutline, peopleOutline,
  settingsOutline, helpCircleOutline, moonOutline, logOutOutline,
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { useUiStore } from '@/store/slices/uiStore';
import { useAuthStore } from '@/store/slices/authStore';
import { useThemeStore } from '@/store/slices/themeStore';
import { resolveIsDark, nextSwitchAt } from '@/hooks/useTheme';
import { useMyWorks } from '@/features/profile/hooks/useMyWorks';
import { signOut } from '@/firebase/auth.helpers';
import Avatar from '@/components/ui/Avatar';
import { formatCount } from '@/utils';
import { ROUTES } from '@/constants';

interface MenuItem {
  label: string;
  icon: string;
  to: string;
  /** Count shown in a small pill, hidden at zero. */
  badge?: number;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The slide-out menu opened from the hamburger on Home.
 *
 * Only places that exist are listed. The design also shows Saved, Orders &
 * purchases, Earnings & payouts and Wilde Agent; each is tracked in TODO.md and
 * joins `items` below when its screen does, rather than appearing now as a row
 * that goes nowhere.
 *
 * A custom drawer rather than `IonMenu`: the app routes through `IonTabs`, and
 * a menu bound to a content id inside that tree is easy to break, while a plain
 * overlay driven by the UI store (like the Create sheet) is not.
 */
const SideMenu: React.FC = () => {
  const isOpen = useUiStore(s => s.isSideMenuOpen);
  const close = useUiStore(s => s.closeSideMenu);
  const { user, clear } = useAuthStore();
  const preference = useThemeStore(s => s.preference);
  const setPreference = useThemeStore(s => s.setPreference);
  const { drafts } = useMyWorks(isOpen);
  const history = useHistory();
  const { pathname, search } = useLocation();

  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Any navigation, including the browser's back button, closes the menu.
  useEffect(() => { close(); }, [pathname, search, close]);

  // Focus moves in on open and back to the button that opened it on close.
  useEffect(() => {
    if (!isOpen) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => { openerRef.current?.focus?.(); };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      // Keep Tab inside the drawer: the page behind it is dimmed and inert.
      const els = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  if (!isOpen || !user) return null;

  const isDark = resolveIsDark(preference);
  // Same wording as Settings, so the two never describe the theme differently.
  const themeHint = preference === 'auto'
    ? `${isDark ? 'Dark' : 'Light'} until ${format(nextSwitchAt(), 'h:mm a')}`
    : null;

  const items: MenuItem[] = [
    { label: 'Profile',        icon: personOutline,       to: ROUTES.PROFILE },
    { label: 'Drafts',         icon: documentTextOutline, to: `${ROUTES.PROFILE}?tab=drafts`, badge: drafts.length },
    { label: 'Creator studio', icon: statsChartOutline,   to: `${ROUTES.PROFILE}?tab=studio` },
    { label: 'Community',      icon: peopleOutline,       to: ROUTES.COMMUNITY },
  ];
  const secondary: MenuItem[] = [
    { label: 'Settings & privacy', icon: settingsOutline,   to: ROUTES.SETTINGS },
    { label: 'Help & support',     icon: helpCircleOutline, to: ROUTES.HELP },
  ];

  // Closes explicitly as well as on route change: choosing the page you are
  // already on (Drafts, from the Drafts tab) changes no route to react to.
  const go = (to: string) => { close(); history.push(to); };

  const handleSignOut = async () => {
    close();
    await signOut();
    clear();
    history.replace(ROUTES.SIGN_IN);
  };

  const row = 'flex items-center gap-4 w-full py-3.5 text-left text-[17px] font-medium rounded-xl ' +
    'transition-colors active:bg-wilde-subtle focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-brand-strong';

  const renderItem = (item: MenuItem) => (
    <li key={item.label}>
      <button type="button" onClick={() => go(item.to)} className={row}>
        <IonIcon icon={item.icon} aria-hidden="true" className="text-2xl shrink-0" />
        <span className="flex-1">{item.label}</span>
        {!!item.badge && (
          <span className="min-w-7 rounded-full bg-wilde-subtle px-2 py-0.5 text-center text-[13px] font-semibold">
            {item.badge}
          </span>
        )}
      </button>
    </li>
  );

  return (
    <div className="fixed inset-0 z-[9000]">
      <div className="absolute inset-0 bg-black/45 animate-fade-in" onClick={close} aria-hidden="true" />

      <nav ref={panelRef} role="dialog" aria-modal="true" aria-label="Menu"
        className="absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col overflow-y-auto bg-wilde-panel
          px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]
          rounded-r-3xl shadow-sheet motion-safe:animate-slide-in-left">
        <div className="flex items-start justify-between">
          <Avatar src={user.photoURL} name={user.displayName} size="xl" ring />
          <button ref={closeRef} type="button" onClick={close} aria-label="Close menu"
            className="h-11 w-11 -mr-2 flex items-center justify-center rounded-full text-2xl
              active:bg-wilde-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong">
            <IonIcon icon={closeOutline} aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 text-2xl font-bold leading-tight">{user.displayName}</p>
        <p className="text-[15px] text-wilde-muted">@{user.username.replace(/^@/, '')}</p>
        <p className="mt-2 flex gap-4 text-[15px] text-wilde-muted">
          <span><b className="text-wilde-black">{formatCount(user.followingCount)}</b> Following</span>
          <span><b className="text-wilde-black">{formatCount(user.followersCount)}</b> Followers</span>
        </p>

        <ul className="mt-4 border-t border-wilde-border pt-2">{items.map(renderItem)}</ul>
        <ul className="mt-2 border-t border-wilde-border pt-2">{secondary.map(renderItem)}</ul>

        <div className="mt-auto pt-6">
          <div className="flex items-center gap-4 py-3">
            <IonIcon icon={moonOutline} aria-hidden="true" className="text-2xl shrink-0" />
            <div className="flex-1">
              <span id="dark-mode-label" className="block text-[17px] font-medium">Dark mode</span>
              {themeHint && <span className="block text-[13px] text-wilde-muted">{themeHint}</span>}
            </div>
            {/* Choosing here pins the theme; Settings keeps the third option, Auto. */}
            <button type="button" role="switch" aria-checked={isDark} aria-labelledby="dark-mode-label"
              onClick={() => setPreference(isDark ? 'light' : 'dark')}
              className={'relative h-8 w-14 shrink-0 rounded-full transition-colors focus-visible:outline-none ' +
                'focus-visible:ring-2 focus-visible:ring-brand-strong focus-visible:ring-offset-2 ' +
                'focus-visible:ring-offset-wilde-panel ' + (isDark ? 'bg-brand' : 'bg-wilde-sunken')}>
              <span className={'absolute left-0 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ' +
                (isDark ? 'translate-x-7' : 'translate-x-1')} />
            </button>
          </div>

          <button type="button" onClick={handleSignOut} className={`${row} text-fmt-artwork`}>
            <IonIcon icon={logOutOutline} aria-hidden="true" className="text-2xl shrink-0" />
            Log out
          </button>
        </div>
      </nav>
    </div>
  );
};

export default SideMenu;
