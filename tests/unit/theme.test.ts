import {
  isDarkHour, resolveIsDark, nextSwitchAt, DARK_FROM_HOUR, DARK_UNTIL_HOUR,
} from '@/hooks/useTheme';

/**
 * The theme is derived from the clock, so the boundaries are the whole
 * behaviour. Dates are built with the local-time `Date` constructor rather than
 * ISO strings, which would be parsed as UTC and make these pass or fail
 * depending on where the test runs.
 */
const at = (hour: number, minute = 0, day = 15) => new Date(2026, 6, day, hour, minute, 0, 0);

describe('isDarkHour', () => {
  it('is light through the day', () => {
    expect(isDarkHour(at(6))).toBe(false);
    expect(isDarkHour(at(12))).toBe(false);
    expect(isDarkHour(at(17, 59))).toBe(false);
  });

  it('is dark from 18:00', () => {
    expect(isDarkHour(at(18))).toBe(true);
    expect(isDarkHour(at(23, 59))).toBe(true);
  });

  it('stays dark through the small hours', () => {
    expect(isDarkHour(at(0))).toBe(true);
    expect(isDarkHour(at(5, 59))).toBe(true);
  });

  it('switches back to light exactly at 06:00, not after it', () => {
    expect(isDarkHour(at(5, 59))).toBe(true);
    expect(isDarkHour(at(6, 0))).toBe(false);
  });
});

describe('resolveIsDark', () => {
  it('follows the clock on auto', () => {
    expect(resolveIsDark('auto', at(21))).toBe(true);
    expect(resolveIsDark('auto', at(9))).toBe(false);
  });

  it('pins light through the night when the user has chosen it', () => {
    expect(resolveIsDark('light', at(23))).toBe(false);
    expect(resolveIsDark('light', at(3))).toBe(false);
  });

  it('pins dark through the day when the user has chosen it', () => {
    expect(resolveIsDark('dark', at(9))).toBe(true);
    expect(resolveIsDark('dark', at(12))).toBe(true);
  });

  it('is the only thing the pinned modes depend on — never the hour', () => {
    const hours = [0, 5, 6, 12, 17, 18, 23];
    expect(new Set(hours.map(h => resolveIsDark('light', at(h))))).toEqual(new Set([false]));
    expect(new Set(hours.map(h => resolveIsDark('dark', at(h))))).toEqual(new Set([true]));
  });
});

describe('nextSwitchAt', () => {
  it('aims at this morning 06:00 from the small hours', () => {
    const next = nextSwitchAt(at(2, 30));
    expect(next.getHours()).toBe(DARK_UNTIL_HOUR);
    expect(next.getDate()).toBe(15);
  });

  it('aims at this evening 18:00 from the daytime', () => {
    const next = nextSwitchAt(at(9));
    expect(next.getHours()).toBe(DARK_FROM_HOUR);
    expect(next.getDate()).toBe(15);
  });

  it('rolls to tomorrow 06:00 from the evening', () => {
    const next = nextSwitchAt(at(21));
    expect(next.getHours()).toBe(DARK_UNTIL_HOUR);
    expect(next.getDate()).toBe(16);
  });

  it('never returns a time in the past, on either side of both boundaries', () => {
    for (const hour of [0, 5, 6, 7, 17, 18, 19, 23]) {
      const now = at(hour, 30);
      expect(nextSwitchAt(now).getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it('lands on a boundary hour with the minutes zeroed', () => {
    const next = nextSwitchAt(at(11, 47));
    expect([DARK_FROM_HOUR, DARK_UNTIL_HOUR]).toContain(next.getHours());
    expect(next.getMinutes()).toBe(0);
    expect(next.getSeconds()).toBe(0);
    expect(next.getMilliseconds()).toBe(0);
  });

  it('the theme it schedules for is always the opposite of the current one', () => {
    for (const hour of [1, 6, 12, 17, 18, 22]) {
      const now = at(hour);
      expect(isDarkHour(nextSwitchAt(now))).toBe(!isDarkHour(now));
    }
  });
});
