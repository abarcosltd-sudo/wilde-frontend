import { formatDistanceToNow, format } from 'date-fns';

/**
 * Anything the app might hold in a `createdAt`/`updatedAt` field. Reads are
 * normalised to ISO strings in `firestore.helpers`, but a document created with
 * `serverTimestamp()` reads back `null` until the server resolves the write, and
 * a raw `Timestamp` can still reach here from code that bypasses those helpers.
 */
export type DateLike = string | number | Date | { toDate(): Date } | null | undefined;

const toDate = (value: DateLike): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    const d = value.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  }
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Milliseconds since epoch, or 0 when the value isn't a usable date. Use for sorting. */
export const toMillis = (value: DateLike): number => toDate(value)?.getTime() ?? 0;

// A pending `serverTimestamp()` is genuinely a document created moments ago, so
// "just now" is accurate rather than a placeholder.
export const formatTimeAgo = (value: DateLike) => {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : 'just now';
};

export const formatDate = (value: DateLike) => {
  const d = toDate(value);
  return d ? format(d, 'MMM d, yyyy') : '—';
};

export const formatCurrency = (amount: number, currency: 'NGN' | 'USD' = 'NGN') =>
  currency === 'NGN'
    ? `₦${amount.toLocaleString()}`
    : `$${amount.toLocaleString()}`;

export const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export const truncate = (str: string, maxLen: number) =>
  str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
