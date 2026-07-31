import { useCallback, useMemo, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { adminData } from '../services/adminData.service';
import { analyticsService } from '../services/analytics.service';
import type { AdminRecord, ContentTypeDef } from '../types/admin.types';

export interface TableState {
  search: string;
  filters: Record<string, unknown>;
  orderByField?: string;
  direction: 'asc' | 'desc';
}

/**
 * Paginated list for one content type. Cursor pagination rather than page
 * numbers, because that is what both Firestore and the backend API return.
 */
export function useAdminCollection(type: ContentTypeDef, pageSize = 25) {
  const [state, setState] = useState<TableState>({
    search: '',
    filters: {},
    orderByField: type.createdField,
    direction: 'desc',
  });

  const query = useInfiniteQuery({
    queryKey: ['admin', type.collection, state],
    initialPageParam: null as unknown,
    queryFn: ({ pageParam }) =>
      adminData.list({
        collection: type.collection,
        pageSize,
        orderByField: state.orderByField,
        direction: state.direction,
        filters: state.filters,
        search: state.search || undefined,
        searchField: state.search ? type.searchFields?.[0] : undefined,
        cursor: pageParam,
      }),
    getNextPageParam: (last) => (last.hasMore ? last.cursor : undefined),
  });

  const rows: AdminRecord[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  const setSearch = useCallback((search: string) => setState((s) => ({ ...s, search })), []);
  const setFilter = useCallback(
    (key: string, value: unknown) =>
      setState((s) => ({ ...s, filters: { ...s.filters, [key]: value } })),
    [],
  );
  const toggleSort = useCallback(
    (field: string) =>
      setState((s) => ({
        ...s,
        orderByField: field,
        direction: s.orderByField === field && s.direction === 'desc' ? 'asc' : 'desc',
      })),
    [],
  );

  return { ...query, rows, state, setSearch, setFilter, toggleSort };
}

/** Writes for one collection, with the list invalidated on success. */
export function useAdminMutations(collection: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', collection] });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      adminData.update(collection, id, patch),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminData.remove(collection, id),
    onSuccess: invalidate,
  });

  const bulkUpdate = useMutation({
    mutationFn: ({ ids, patch }: { ids: string[]; patch: Record<string, unknown> }) =>
      adminData.bulkUpdate(collection, ids, patch),
    onSuccess: invalidate,
  });

  const bulkRemove = useMutation({
    mutationFn: (ids: string[]) => adminData.bulkRemove(collection, ids),
    onSuccess: invalidate,
  });

  return { update, remove, bulkUpdate, bulkRemove };
}

export function useOverview() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: () => analyticsService.overview(),
    staleTime: 60_000,
  });
}

export function useGrowth(days: number) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'growth', days],
    queryFn: () => analyticsService.growth(days),
    staleTime: 60_000,
  });
}

export function useMarket(days: number) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'market', days],
    queryFn: () => analyticsService.market(days),
    staleTime: 60_000,
  });
}

export function useTopCreators(days: number) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'creators', days],
    queryFn: () => analyticsService.topCreators(days),
    staleTime: 300_000,
  });
}
