import { formatDistanceToNow, format } from 'date-fns';

export const formatTimeAgo = (dateStr: string) =>
  formatDistanceToNow(new Date(dateStr), { addSuffix: true });

export const formatDate = (dateStr: string) =>
  format(new Date(dateStr), 'MMM d, yyyy');

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
