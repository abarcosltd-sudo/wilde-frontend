import {
  createOutline, filmOutline, ticketOutline, brushOutline,
  pencilOutline, musicalNotesOutline, ellipsisHorizontalOutline,
} from 'ionicons/icons';

export const APP_NAME = 'WILDE';
export const APP_TAGLINE = 'Where Creatives find their voice.';

export const WORK_TYPES = ['poetry', 'screenplay', 'playlet', 'long_work', 'short_story', 'artwork'] as const;

export const CREATIVE_ROLES = [
  { value: 'writer',       label: 'Writer',       icon: createOutline },
  { value: 'screenwriter', label: 'Screenwriter',  icon: filmOutline },
  { value: 'playwright',   label: 'Playwright',    icon: ticketOutline },
  { value: 'painter',      label: 'Painter',       icon: brushOutline },
  { value: 'designer',     label: 'Designer',      icon: pencilOutline },
  { value: 'musician',     label: 'Musician',      icon: musicalNotesOutline },
  { value: 'other',        label: 'Other',         icon: ellipsisHorizontalOutline },
] as const;

export const CURRENCIES = { NGN: '₦', USD: '$' } as const;

/**
 * Smallest amount the payment providers will actually charge. Priced below
 * this, a work looks buyable but every checkout fails at the provider — so the
 * limit is enforced when setting the price, and again server-side at sale.
 */
export const MIN_PRICE: Record<keyof typeof CURRENCIES, number> = { NGN: 100, USD: 1 };

export const ROUTES = {
  SPLASH:         '/',
  ONBOARDING:     '/onboarding',
  SIGN_IN:        '/auth/signin',
  SIGN_UP:        '/auth/signup',
  FORGOT_PASSWORD:'/auth/forgot-password',
  HOME:           '/app/home',
  EXPLORE:        '/app/explore',
  MARKET:         '/app/market',
  COMMUNITY:      '/app/community',
  PROFILE:        '/app/profile',
  CREATOR_PROFILE:'/app/creator/:uid',
  WRITING_STUDIO: '/app/write/:workId',
  READ_WORK:      '/app/read/:workId',
  JOBS:           '/app/jobs',
  // Where payment providers redirect after checkout. Must match the backend's
  // PAYMENT_CALLBACK_URL.
  PAYMENT_CALLBACK: '/app/payment/callback',
  NOTIFICATIONS:  '/app/notifications',
  SETTINGS:       '/app/settings',
  HELP:           '/app/settings/help',
  PREMIUM:        '/app/settings/premium',
  PRIVACY:        '/app/settings/privacy',
  COLLABORATION:  '/app/collab/:workId',
  /**
   * Staff-only, and deliberately outside `/app`: the admin screens carry their
   * own chrome (AdminShell) and their own gate (AdminGuard), so mounting them
   * under MainLayout would wrap them in the reader's tab bar.
   */
  ADMIN:            '/admin',
  ADMIN_ANALYTICS:  '/admin/analytics',
  ADMIN_USERS:      '/admin/users',
  ADMIN_MARKET:     '/admin/market',
  ADMIN_MODERATION: '/admin/moderation',
  ADMIN_COLLECTION: '/admin/c/:typeId',
} as const;

export const PAGINATION = { DEFAULT_LIMIT: 20 } as const;
