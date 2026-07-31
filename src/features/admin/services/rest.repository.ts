import axios from 'axios';
import { getAuth } from 'firebase/auth';

import type {
  AdminRecord,
  AdminRepository,
  ListQuery,
  Page,
} from '../types/admin.types';

/**
 * Alternative data source: the WILDE backend (wilde-backend).
 *
 * Swap it in with VITE_ADMIN_DATA_SOURCE=api once the backend exposes
 * /admin/:collection. Same contract as the Firestore repository, so no screen
 * changes are needed — the cursor just becomes a string instead of a snapshot.
 */
const http = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? ''}/admin`,
  timeout: 20_000,
});

http.interceptors.request.use(async (config) => {
  const user = getAuth().currentUser;
  if (user) {
    config.headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  return config;
});

export const restRepository: AdminRepository = {
  async list(q: ListQuery): Promise<Page<AdminRecord>> {
    const { data } = await http.get(`/${q.collection}`, {
      params: {
        pageSize: q.pageSize ?? 25,
        orderBy: q.orderByField,
        direction: q.direction ?? 'desc',
        search: q.search,
        searchField: q.searchField,
        cursor: q.cursor ?? undefined,
        ...q.filters,
      },
    });
    return { items: data.items, cursor: data.cursor ?? null, hasMore: !!data.hasMore };
  },

  async get(collection, id) {
    const { data } = await http.get(`/${collection}/${id}`);
    return data ?? null;
  },

  async getMany(collection, ids) {
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return [];

    /**
     * Fans out over the documented `/:collection/:id` route rather than
     * inventing a batch endpoint the backend does not have yet. If one is added
     * later, this is the only place that has to change. A reference the caller
     * cannot read resolves to null and is dropped, so one unreadable row never
     * fails the whole lookup.
     */
    const records = await Promise.all(
      unique.map((id) => restRepository.get(collection, id).catch(() => null)),
    );
    return records.filter((record): record is AdminRecord => record !== null);
  },

  async update(collection, id, patch) {
    await http.patch(`/${collection}/${id}`, patch);
  },

  async remove(collection, id) {
    await http.delete(`/${collection}/${id}`);
  },

  async count(collection, filters) {
    const { data } = await http.get(`/${collection}/count`, { params: filters });
    return data.count ?? 0;
  },

  async since(collection, field, from) {
    const { data } = await http.get(`/${collection}`, {
      params: { field, from: from.toISOString(), pageSize: 5000 },
    });
    return data.items ?? [];
  },
};

/** Privileged operations that must never run client-side. */
export const adminApi = {
  /** Sets a custom claim, so the backend must own it. */
  setUserRole: (uid: string, role: string | null) =>
    http.post(`/users/${uid}/role`, { role }),
  suspendUser: (uid: string, reason: string, until?: string) =>
    http.post(`/users/${uid}/suspend`, { reason, until }),
  reinstateUser: (uid: string) => http.post(`/users/${uid}/reinstate`),
  refundPayment: (paymentId: string, reason: string) =>
    http.post(`/payments/${paymentId}/refund`, { reason }),
  payoutSeller: (orderId: string) => http.post(`/orders/${orderId}/payout`),
  broadcast: (payload: { title: string; body: string; segment: string }) =>
    http.post('/notifications/broadcast', payload),
  exportCollection: (collection: string, params: Record<string, unknown>) =>
    http.get(`/${collection}/export`, { params, responseType: 'blob' }),
};
