import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { adminData } from '../services/adminData.service';
import { contentTypeByCollection } from '../config/contentTypes';
import type { AdminRecord } from '../types/admin.types';

/**
 * Turns the raw ids in `reference` columns into names.
 *
 * Documents store ids, so a list view rendered straight from Firestore shows
 * `9S8qxK…1O2` where a moderator needs "Frederick Ottache". Every reference
 * column already declares its `refCollection` in the content-type registry, so
 * this resolves them generically rather than per screen — a new collection
 * added to the registry gets resolved names with no extra work.
 *
 * The caller still falls back to `shortId` when a label cannot be found, so an
 * unreadable or deleted reference degrades to what was shown before rather than
 * blanking the cell.
 */

export interface ReferenceRequest {
  collection: string;
  /** Usually a uid; typed loosely because it comes straight off a document. */
  id: unknown;
}

/**
 * Resolved labels, shared by every screen for the life of the tab.
 *
 * Module-level rather than React Query state because the same handful of
 * authors recur across pages, collections and screens: paging through Works and
 * then opening Comments should not re-read the same Users documents. An empty
 * string is a deliberate tombstone meaning "looked this up, there is no label" —
 * without it, a reference to a deleted document stays permanently missing and
 * the effect below would re-request it on every render.
 */
const labelCache = new Map<string, string>();

const cacheKey = (collection: string, id: string) => `${collection}/${id}`;

/** Long titles are for the record editor, not a table cell. */
const truncate = (value: string) => (value.length > 40 ? `${value.slice(0, 40)}…` : value);

/**
 * What to show for a referenced document.
 *
 * Users are the common case and have no entry in the content-type registry —
 * they get a bespoke screen — so their fallback chain is spelled out here, and
 * matches the one AdminUsersPage uses. Everything else takes the `titleField`
 * the registry already declares, which is why Works resolve to their title and
 * Groups to their name without either being named here.
 */
function labelOf(collection: string, record: AdminRecord): string | undefined {
  if (collection === 'Users') {
    const displayName = typeof record.displayName === 'string' ? record.displayName.trim() : '';
    if (displayName) return truncate(displayName);
    const username = typeof record.username === 'string' ? record.username.trim() : '';
    return username ? truncate(`@${username}`) : undefined;
  }

  const titleField = contentTypeByCollection(collection)?.titleField;
  // `id` as a title field means the collection has no human-readable name of
  // its own (Orders, Streaks); the shortened id is already the best label.
  if (!titleField || titleField === 'id') return undefined;

  const value = record[titleField];
  return typeof value === 'string' && value.trim() ? truncate(value.trim()) : undefined;
}

export function useReferenceLabels(refs: ReferenceRequest[]) {
  // Everything asked for this render, deduped and stably ordered so that React
  // Query sees the same key for the same page of rows.
  const wanted = useMemo(() => {
    const keys = new Set<string>();
    for (const ref of refs) {
      if (typeof ref.id !== 'string' || !ref.id) continue;
      keys.add(cacheKey(ref.collection, ref.id));
    }
    return [...keys].sort();
  }, [refs]);

  const missing = wanted.filter((key) => !labelCache.has(key));

  const query = useQuery({
    // `missing` shrinks to empty once a batch lands, which is what stops this
    // re-running: the key changes, the next key has nothing left to fetch.
    queryKey: ['admin', 'referenceLabels', missing],
    enabled: missing.length > 0,
    staleTime: Infinity,
    queryFn: async () => {
      const byCollection = new Map<string, string[]>();
      for (const key of missing) {
        const split = key.indexOf('/');
        const collection = key.slice(0, split);
        const id = key.slice(split + 1);
        byCollection.set(collection, [...(byCollection.get(collection) ?? []), id]);
      }

      await Promise.all(
        [...byCollection].map(async ([collection, ids]) => {
          // Tombstone first, so ids that come back empty — deleted documents,
          // or a collection this role cannot read — are not asked for again.
          for (const id of ids) labelCache.set(cacheKey(collection, id), '');

          try {
            const records = await adminData.getMany(collection, ids);
            for (const record of records) {
              const label = labelOf(collection, record);
              if (label) labelCache.set(cacheKey(collection, record.id), label);
            }
          } catch (error) {
            // One unreadable collection must not empty the whole table: those
            // cells keep the shortened id they had before.
            console.warn(`[admin] could not resolve ${collection} references`, error);
          }
        }),
      );

      return missing.length;
    },
  });

  /**
   * Deliberately a fresh closure each render rather than a memoised one: it
   * reads a mutable cache, and the render that follows a resolved batch is
   * exactly when consumers need to see the new values.
   */
  void query.data;
  return (collection: string, id: unknown): string | undefined => {
    if (typeof id !== 'string' || !id) return undefined;
    return labelCache.get(cacheKey(collection, id)) || undefined;
  };
}
