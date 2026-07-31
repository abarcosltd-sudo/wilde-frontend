import React, { useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { Link, useLocation } from 'react-router-dom';
import * as ionIcons from 'ionicons/icons';
import {
  analyticsOutline,
  closeOutline,
  gridOutline,
  logOutOutline,
  menuOutline,
  peopleOutline,
  shieldHalfOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { getAuth, signOut } from 'firebase/auth';

import { CONTENT_TYPES, GROUP_LABELS } from '../config/contentTypes';
import { useAdminStore } from '../store/adminStore';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const PRIMARY: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: gridOutline },
  { label: 'Analytics', href: '/admin/analytics', icon: analyticsOutline },
  { label: 'Users', href: '/admin/users', icon: peopleOutline },
  { label: 'Market', href: '/admin/market', icon: storefrontOutline },
  { label: 'Moderation', href: '/admin/moderation', icon: shieldHalfOutline },
];

const icon = (name: string) => (ionIcons as Record<string, string>)[name] ?? gridOutline;

const NavLink: React.FC<{ item: NavItem; active: boolean; onNavigate: () => void }> = ({
  item, active, onNavigate,
}) => (
  <Link
    to={item.href}
    onClick={onNavigate}
    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
      active
        ? 'bg-indigo-50 font-semibold text-indigo-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <IonIcon icon={item.icon} className="text-lg" aria-hidden="true" />
    <span className="truncate">{item.label}</span>
  </Link>
);

const Sidebar: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
  const { pathname } = useLocation();
  const identity = useAdminStore((s) => s.identity);

  const grouped = CONTENT_TYPES.filter((t) => !t.hidden).reduce<Record<string, NavItem[]>>(
    (acc, type) => {
      const item = { label: type.plural, href: `/admin/c/${type.id}`, icon: icon(type.icon) };
      (acc[type.group] ??= []).push(item);
      return acc;
    },
    {},
  );

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-4" aria-label="Admin sections">
      <div>
        <p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">WILDE</p>
        <p className="px-3 text-xs text-slate-500">Admin</p>
      </div>

      <div className="space-y-1">
        {PRIMARY.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {Object.entries(grouped).map(([group, items]) => (
        <div key={group} className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            {GROUP_LABELS[group] ?? group}
          </p>
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}

      <div className="mt-auto border-t border-slate-200 pt-3">
        <p className="truncate px-3 text-xs text-slate-500">{identity?.email}</p>
        <p className="px-3 text-xs capitalize text-slate-400">{identity?.role}</p>
        <button
          onClick={() => signOut(getAuth())}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <IonIcon icon={logOutOutline} className="text-lg" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </nav>
  );
};

export const AdminShell: React.FC<{
  title: string;
  subtitle?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, toolbar, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start" className="lg:hidden">
            <IonButton onClick={() => setOpen(true)} aria-label="Open admin navigation">
              <IonIcon icon={menuOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="end">{toolbar}</IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="admin-content" color="light">
        <div className="flex min-h-full">
          <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
            <Sidebar onNavigate={() => undefined} />
          </aside>

          {open && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div
                className="absolute inset-0 bg-slate-900/40"
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />
              <div className="relative z-10 h-full w-64 bg-white shadow-xl">
                <button
                  onClick={() => setOpen(false)}
                  className="absolute right-2 top-2 rounded p-1 text-slate-500"
                  aria-label="Close admin navigation"
                >
                  <IonIcon icon={closeOutline} className="text-xl" />
                </button>
                <Sidebar onNavigate={() => setOpen(false)} />
              </div>
            </div>
          )}

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6">
            {subtitle && <p className="mb-4 text-sm text-slate-500">{subtitle}</p>}
            {children}
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};
