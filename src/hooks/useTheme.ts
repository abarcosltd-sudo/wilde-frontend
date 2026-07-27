import { useEffect, useRef, useState } from 'react';
import { useThemeStore, ThemePreference } from '@/store/slices/themeStore';

/** Dark runs from 18:00 up to (but not including) 06:00, in the device's own timezone. */
export const DARK_FROM_HOUR = 18;
export const DARK_UNTIL_HOUR = 6;

export const isDarkHour = (at: Date = new Date()): boolean => {
  const hour = at.getHours();
  return hour >= DARK_FROM_HOUR || hour < DARK_UNTIL_HOUR;
};

/** What a preference actually resolves to right now. */
export const resolveIsDark = (preference: ThemePreference, at: Date = new Date()): boolean =>
  preference === 'auto' ? isDarkHour(at) : preference === 'dark';

/**
 * The next 06:00 or 18:00 after `from`, whichever comes first.
 *
 * Built by mutating a local `Date` rather than by adding milliseconds, so the
 * clocks-change nights land on the right wall-clock hour instead of drifting an
 * hour off for six months.
 */
export const nextSwitchAt = (from: Date = new Date()): Date => {
  const next = new Date(from);
  next.setMinutes(0, 0, 0);
  const hour = from.getHours();

  if (hour < DARK_UNTIL_HOUR) {
    next.setHours(DARK_UNTIL_HOUR);
  } else if (hour < DARK_FROM_HOUR) {
    next.setHours(DARK_FROM_HOUR);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(DARK_UNTIL_HOUR);
  }
  return next;
};

const CROSSFADE_MS = 450;

/**
 * Owns the `.dark` class on <html>.
 *
 * On `auto` the class is driven by the clock and flips mid-session, so the
 * change is eased rather than snapped — `.theme-crossfade` is added only for
 * the duration of the change, because leaving it on would slow every hover and
 * press in the app to 400ms. On a pinned preference there is no clock to watch
 * and no timer is scheduled at all.
 */
export const useTheme = (): boolean => {
  const preference = useThemeStore(s => s.preference);
  const [isDark, setIsDark] = useState(() => resolveIsDark(preference));

  /**
   * The inline script in index.html has already set the class for the first
   * paint, so the very first pass must not crossfade — there is nothing to fade
   * from. Every later pass is a real change the user asked for or the clock
   * made, and does.
   */
  const hasApplied = useRef(false);

  /**
   * Outlives the effect, because a crossfade started by one preference can
   * still be running when the next one begins. Without cancelling the pending
   * removal, an earlier timer fires part-way through the later fade and cuts it
   * off — visible if you tap through the settings toggle quickly.
   */
  const crossfadeTimer = useRef<number>();

  useEffect(() => {
    const root = document.documentElement;

    const apply = (dark: boolean, animate: boolean) => {
      if (root.classList.contains('dark') === dark) return;
      if (!animate) {
        root.classList.toggle('dark', dark);
        return;
      }
      window.clearTimeout(crossfadeTimer.current);
      root.classList.add('theme-crossfade');
      root.classList.toggle('dark', dark);
      crossfadeTimer.current = window.setTimeout(
        () => root.classList.remove('theme-crossfade'),
        CROSSFADE_MS,
      );
    };

    const sync = (animate: boolean) => {
      const dark = resolveIsDark(preference);
      setIsDark(dark);
      apply(dark, animate);
    };

    sync(hasApplied.current);
    hasApplied.current = true;

    // A pinned theme has no boundary to wait for.
    if (preference !== 'auto') return;

    let timer: number;

    const schedule = () => {
      window.clearTimeout(timer);
      const delay = Math.max(1000, nextSwitchAt().getTime() - Date.now());
      timer = window.setTimeout(() => {
        sync(true);
        schedule();
      }, delay);
    };

    /**
     * A backgrounded tab has its timers throttled and a sleeping phone stops
     * them altogether, so the scheduled flip can be minutes to hours late.
     * Re-checking whenever the app comes back into view covers that, and also
     * catches a timezone change mid-flight.
     */
    const resync = () => {
      if (document.visibilityState === 'hidden') return;
      sync(true);
      schedule();
    };

    schedule();
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('focus', resync);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('focus', resync);
    };
  }, [preference]);

  return isDark;
};
