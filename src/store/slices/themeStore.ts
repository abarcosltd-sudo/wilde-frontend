import { create } from 'zustand';
import { local } from '@/utils/storage';

/**
 * `auto` follows the clock — dark from 18:00 to 06:00. The other two pin the
 * theme and ignore the time entirely.
 */
export type ThemePreference = 'auto' | 'light' | 'dark';

/** Also read by the pre-paint script in `index.html`, which can't import this. */
export const THEME_STORAGE_KEY = 'theme';

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'auto' || value === 'light' || value === 'dark';

/** Anything unrecognised — a hand-edited value, or a key from an older build. */
const storedPreference = (): ThemePreference => {
  const saved = local.get<unknown>(THEME_STORAGE_KEY);
  return isPreference(saved) ? saved : 'auto';
};

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>(set => ({
  preference: storedPreference(),
  setPreference: preference => {
    // Written straight through rather than on an effect: the choice has to
    // survive a reload, and the pre-paint script reads it before React exists.
    local.set(THEME_STORAGE_KEY, preference);
    set({ preference });
  },
}));
