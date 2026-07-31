import { addDoc, collection as fsCollection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

import { db } from '@/firebase/config';
import { firestoreRepository } from './firestore.repository';
import { restRepository } from './rest.repository';
import type { AdminRepository } from '../types/admin.types';

/**
 * One switch decides where admin data comes from. Firestore is the default so
 * the panel works today; flip to `api` when wilde-backend ships /admin routes.
 */
const source = import.meta.env.VITE_ADMIN_DATA_SOURCE ?? 'firestore';

export const repo: AdminRepository = source === 'api' ? restRepository : firestoreRepository;

const AUDIT_COLLECTION = 'AdminAudit';

/** Fire-and-forget: a failed audit write must never block a moderation action. */
async function recordAudit(entry: {
  action: string;
  collection: string;
  documentId: string;
  before?: unknown;
  after?: unknown;
}) {
  try {
    const user = getAuth().currentUser;
    await addDoc(fsCollection(db, AUDIT_COLLECTION), {
      ...entry,
      actorUid: user?.uid ?? 'unknown',
      actorEmail: user?.email ?? null,
      at: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[admin] audit write failed', error);
  }
}

export const adminData = {
  list: repo.list,
  get: repo.get,
  getMany: repo.getMany,
  count: repo.count,
  since: repo.since,

  async update(collection: string, id: string, patch: Record<string, unknown>) {
    const before = await repo.get(collection, id);
    await repo.update(collection, id, patch);
    void recordAudit({ action: 'update', collection, documentId: id, before, after: patch });
  },

  async remove(collection: string, id: string) {
    const before = await repo.get(collection, id);
    await repo.remove(collection, id);
    void recordAudit({ action: 'delete', collection, documentId: id, before });
  },

  async bulkUpdate(collection: string, ids: string[], patch: Record<string, unknown>) {
    // Sequential on purpose: keeps the audit trail ordered and avoids a burst
    // of writes tripping Firestore's per-second limits on large selections.
    for (const id of ids) {
      await adminData.update(collection, id, patch);
    }
  },

  async bulkRemove(collection: string, ids: string[]) {
    for (const id of ids) {
      await adminData.remove(collection, id);
    }
  },
};
