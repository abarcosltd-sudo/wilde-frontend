import { eachDayOfInterval, format, startOfDay, subDays } from 'date-fns';

import { adminData } from './adminData.service';
import { shortId } from '../utils/format';
import type { AdminRecord } from '../types/admin.types';

export interface SeriesPoint {
  date: string; // yyyy-MM-dd
  label: string; // e.g. "12 Jul"
  value: number;
}

export interface Overview {
  users: number;
  works: number;
  chapters: number;
  posts: number;
  comments: number;
  listings: number;
  openJobs: number;
  flagged: number;
  pendingListings: number;
  disputedOrders: number;
}

export interface MarketSnapshot {
  gmv: number;
  orders: number;
  averageOrderValue: number;
  completionRate: number;
  refundRate: number;
  byStatus: { label: string; value: number }[];
  gmvSeries: SeriesPoint[];
}

export interface GrowthSnapshot {
  signups: SeriesPoint[];
  works: SeriesPoint[];
  posts: SeriesPoint[];
  newUsers: number;
  newWorks: number;
  activeWriters: number;
}

export interface TopCreator {
  authorId: string;
  /** Display name, falling back to @username, then a shortened id. */
  name: string;
  works: number;
  reads: number;
}

/** Firestore Timestamp | Date | ISO string -> Date */
export const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof (value as any)?.toDate === 'function') return (value as any).toDate();
  if (typeof (value as any)?.seconds === 'number') return new Date((value as any).seconds * 1000);
  return null;
};

/** Buckets records into one point per day so the charts always span the range. */
function bucketByDay(records: AdminRecord[], field: string, days: number): SeriesPoint[] {
  const start = startOfDay(subDays(new Date(), days - 1));
  const skeleton = new Map<string, SeriesPoint>();

  for (const day of eachDayOfInterval({ start, end: new Date() })) {
    const key = format(day, 'yyyy-MM-dd');
    skeleton.set(key, { date: key, label: format(day, 'd MMM'), value: 0 });
  }

  for (const record of records) {
    const date = toDate(record[field]);
    if (!date) continue;
    const key = format(date, 'yyyy-MM-dd');
    const point = skeleton.get(key);
    if (point) point.value += 1;
  }

  return [...skeleton.values()];
}

function sumByDay(records: AdminRecord[], field: string, valueKey: string, days: number): SeriesPoint[] {
  const points = bucketByDay([], field, days);
  const index = new Map(points.map((p) => [p.date, p]));

  for (const record of records) {
    const date = toDate(record[field]);
    if (!date) continue;
    const point = index.get(format(date, 'yyyy-MM-dd'));
    if (point) point.value += Number(record[valueKey] ?? 0);
  }

  return points;
}

export const analyticsService = {
  async overview(): Promise<Overview> {
    const [
      users, works, chapters, posts, comments, listings,
      openJobs, flaggedPosts, flaggedComments, pendingListings, disputedOrders,
    ] = await Promise.all([
      adminData.count('Users'),
      adminData.count('Works'),
      adminData.count('Chapters'),
      adminData.count('Posts'),
      adminData.count('Comments'),
      adminData.count('GhostwriterListings'),
      adminData.count('Jobs', { status: 'open' }),
      adminData.count('Posts', { status: 'flagged' }),
      adminData.count('Comments', { status: 'flagged' }),
      adminData.count('GhostwriterListings', { status: 'pending' }),
      adminData.count('Orders', { status: 'disputed' }),
    ]);

    return {
      users, works, chapters, posts, comments, listings, openJobs,
      flagged: flaggedPosts + flaggedComments,
      pendingListings,
      disputedOrders,
    };
  },

  async growth(days = 30): Promise<GrowthSnapshot> {
    const from = startOfDay(subDays(new Date(), days - 1));
    const [users, works, posts] = await Promise.all([
      adminData.since('Users', 'createdAt', from),
      adminData.since('Works', 'createdAt', from),
      adminData.since('Posts', 'createdAt', from),
    ]);

    const activeWriters = new Set(works.map((w) => w.authorId).filter(Boolean)).size;

    return {
      signups: bucketByDay(users, 'createdAt', days),
      works: bucketByDay(works, 'createdAt', days),
      posts: bucketByDay(posts, 'createdAt', days),
      newUsers: users.length,
      newWorks: works.length,
      activeWriters,
    };
  },

  async market(days = 30): Promise<MarketSnapshot> {
    const from = startOfDay(subDays(new Date(), days - 1));
    const orders = await adminData.since('Orders', 'createdAt', from);

    const paid = orders.filter((o) =>
      ['completed', 'delivered', 'in_progress'].includes(o.status));
    const refunded = orders.filter((o) => o.status === 'refunded');
    const completed = orders.filter((o) => o.status === 'completed');

    const gmv = paid.reduce((total, o) => total + Number(o.amount ?? 0), 0);

    const counts = orders.reduce<Record<string, number>>((acc, o) => {
      const key = o.status ?? 'unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return {
      gmv,
      orders: orders.length,
      averageOrderValue: paid.length ? gmv / paid.length : 0,
      completionRate: orders.length ? completed.length / orders.length : 0,
      refundRate: orders.length ? refunded.length / orders.length : 0,
      byStatus: Object.entries(counts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
      gmvSeries: sumByDay(paid, 'createdAt', 'amount', days),
    };
  },

  /** Writers ranked by works published in the window. */
  async topCreators(days = 30, take = 8): Promise<TopCreator[]> {
    const from = startOfDay(subDays(new Date(), days - 1));
    const works = await adminData.since('Works', 'createdAt', from);

    const tally = new Map<string, { authorId: string; works: number; reads: number }>();
    for (const work of works) {
      if (!work.authorId) continue;
      const entry = tally.get(work.authorId) ?? { authorId: work.authorId, works: 0, reads: 0 };
      entry.works += 1;
      entry.reads += Number(work.readCount ?? 0);
      tally.set(work.authorId, entry);
    }

    const ranked = [...tally.values()].sort((a, b) => b.works - a.works).slice(0, take);

    /**
     * Works carry only an `authorId`, so the names have to be looked up. One
     * read per creator, and `take` caps that at eight — cheap enough to do
     * inline, and the chart is close to useless without it.
     *
     * A creator whose Users document is missing or unreadable keeps the
     * shortened id and stays in the ranking: the bar is still true, and losing
     * the row entirely would quietly understate someone's output.
     */
    return Promise.all(
      ranked.map(async (entry) => {
        const user = await adminData.get('Users', entry.authorId).catch(() => null);
        const displayName = typeof user?.displayName === 'string' ? user.displayName.trim() : '';
        const username = typeof user?.username === 'string' ? user.username.trim() : '';
        return {
          ...entry,
          name: displayName || (username ? `@${username}` : '') || shortId(entry.authorId),
        };
      }),
    );
  },
};
