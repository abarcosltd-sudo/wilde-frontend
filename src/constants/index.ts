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

export const ROUTES = {
  SPLASH:         '/',
  ONBOARDING:     '/onboarding',
  SIGN_IN:        '/auth/signin',
  SIGN_UP:        '/auth/signup',
  FORGOT_PASSWORD:'/auth/forgot-password',
  HOME:           '/app/home',
  EXPLORE:        '/app/explore',
  CREATE:         '/app/create',
  MARKET:         '/app/market',
  PROFILE:        '/app/profile',
  CREATOR_PROFILE:'/app/creator/:uid',
  WRITING_STUDIO: '/app/write/:workId',
  READ_WORK:      '/app/read/:workId',
  AI_ASSISTANT:   '/app/ai',
  JOBS:           '/app/jobs',
  NOTIFICATIONS:  '/app/notifications',
  SETTINGS:       '/app/settings',
  COLLABORATION:  '/app/collab/:workId',
} as const;

export const PAGINATION = { DEFAULT_LIMIT: 20 } as const;
