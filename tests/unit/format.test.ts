import { Timestamp } from 'firebase/firestore';
import { formatTimeAgo, formatDate, toMillis, formatBytes } from '@/utils/format';

/**
 * Regression cover for the `createdAt` bug: Firestore writes these fields as
 * `Timestamp` objects (and leaves them null while a `serverTimestamp()` write is
 * pending), but every type in `src/types` declares them as ISO strings.
 * Previously all of these produced "Invalid Date".
 */
describe('date formatting', () => {
  const iso = '2026-07-20T12:00:00.000Z';

  describe('formatDate', () => {
    it('formats an ISO string', () => {
      expect(formatDate(iso)).toBe('Jul 20, 2026');
    });

    it('formats a Firestore Timestamp', () => {
      expect(formatDate(Timestamp.fromDate(new Date(iso)))).toBe('Jul 20, 2026');
    });

    it('formats a Date', () => {
      expect(formatDate(new Date(iso))).toBe('Jul 20, 2026');
    });

    it('renders a dash for a pending serverTimestamp rather than "Invalid Date"', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
    });

    it('renders a dash for unparseable input', () => {
      expect(formatDate('not a date')).toBe('—');
      expect(formatDate('')).toBe('—');
    });
  });

  describe('formatTimeAgo', () => {
    it('describes a Firestore Timestamp relative to now', () => {
      const twoHoursAgo = Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000));
      expect(formatTimeAgo(twoHoursAgo)).toBe('about 2 hours ago');
    });

    it('treats a pending serverTimestamp as "just now"', () => {
      expect(formatTimeAgo(null)).toBe('just now');
      expect(formatTimeAgo(undefined)).toBe('just now');
    });

    it('never emits "Invalid Date"', () => {
      expect(formatTimeAgo('nonsense')).toBe('just now');
    });
  });

  describe('toMillis', () => {
    it('is comparable across mixed representations', () => {
      const expected = new Date(iso).getTime();
      expect(toMillis(iso)).toBe(expected);
      expect(toMillis(Timestamp.fromDate(new Date(iso)))).toBe(expected);
      expect(toMillis(new Date(iso))).toBe(expected);
    });

    it('sorts unset values last rather than throwing', () => {
      expect(toMillis(null)).toBe(0);
      expect(toMillis('garbage')).toBe(0);
    });
  });
});

/**
 * These strings appear in the upload limit message the user is held to, so a
 * size that reads as "5.0MB" against a "5MB" cap, or rounds 5.4MB down to "5MB"
 * and makes the refusal look wrong, is the failure worth guarding.
 */
describe('formatBytes', () => {
  const MB = 1024 * 1024;

  it('drops a meaningless trailing zero', () => {
    expect(formatBytes(5 * MB)).toBe('5MB');
  });

  it('keeps one decimal where it changes the reading', () => {
    expect(formatBytes(5.4 * MB)).toBe('5.4MB');
  });

  it('never renders an over-limit file as being exactly at the limit', () => {
    expect(formatBytes(5.04 * MB)).toBe('5.1MB');
    expect(formatBytes(5.04 * MB)).not.toBe(formatBytes(5 * MB));
  });

  it('scales down to KB and bytes', () => {
    expect(formatBytes(2048)).toBe('2KB');
    expect(formatBytes(512)).toBe('512B');
  });

  it('stops showing decimals once they stop mattering', () => {
    expect(formatBytes(128.4 * MB)).toBe('129MB');
  });
});
