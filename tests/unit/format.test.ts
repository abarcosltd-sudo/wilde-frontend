import { Timestamp } from 'firebase/firestore';
import { formatTimeAgo, formatDate, toMillis } from '@/utils/format';

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
