import { format, formatDistanceToNowStrict } from 'date-fns';

import { toDate } from '../services/analytics.service';
import type { FieldDef } from '../types/admin.types';

export const formatMoney = (value: unknown, currency = 'NGN') => {
  const amount = Number(value ?? 0);
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

export const formatNumber = (value: unknown) => Number(value ?? 0).toLocaleString();

export const formatPercent = (ratio: number) => `${(ratio * 100).toFixed(1)}%`;

export const formatWhen = (value: unknown) => {
  const date = toDate(value);
  if (!date) return '—';
  return `${format(date, 'd MMM yyyy')} · ${formatDistanceToNowStrict(date)} ago`;
};

export const shortId = (value: unknown) => {
  const id = String(value ?? '');
  return id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-3)}` : id || '—';
};

/** Renders a field value as a single line of table text. */
export function formatCell(field: FieldDef, record: Record<string, any>): string {
  const value = record[field.key];
  if (value === undefined || value === null || value === '') return '—';

  switch (field.kind) {
    case 'timestamp': {
      const date = toDate(value);
      return date ? format(date, 'd MMM yyyy, HH:mm') : '—';
    }
    case 'money':
      return formatMoney(value, record.currency ?? 'NGN');
    case 'number':
      return formatNumber(value);
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'reference':
      return shortId(value);
    case 'array':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'json':
      return JSON.stringify(value).slice(0, 80);
    case 'text':
    case 'richtext': {
      const plain = String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      return plain.length > 120 ? `${plain.slice(0, 120)}…` : plain;
    }
    default:
      return String(value);
  }
}

const STATUS_TONES: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-800',
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
  success: 'bg-emerald-100 text-emerald-800',
  open: 'bg-emerald-100 text-emerald-800',
  visible: 'bg-slate-100 text-slate-700',
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-800',
  in_review: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-sky-100 text-sky-800',
  delivered: 'bg-sky-100 text-sky-800',
  initiated: 'bg-sky-100 text-sky-800',
  flagged: 'bg-orange-100 text-orange-800',
  disputed: 'bg-orange-100 text-orange-800',
  paused: 'bg-orange-100 text-orange-800',
  hidden: 'bg-rose-100 text-rose-800',
  removed: 'bg-rose-100 text-rose-800',
  rejected: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-rose-100 text-rose-800',
  refunded: 'bg-rose-100 text-rose-800',
  failed: 'bg-rose-100 text-rose-800',
  suspended: 'bg-rose-100 text-rose-800',
};

export const statusTone = (status: unknown) =>
  STATUS_TONES[String(status)] ?? 'bg-slate-100 text-slate-700';

export const humanise = (value: unknown) =>
  String(value ?? '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
