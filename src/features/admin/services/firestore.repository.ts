import {
  collection as fsCollection,
  deleteDoc,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy as fsOrderBy,
  query as fsQuery,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '@/firebase/config';
import type {
  AdminRecord,
  AdminRepository,
  ListQuery,
  Page,
} from '../types/admin.types';

const toRecord = (snap: QueryDocumentSnapshot): AdminRecord => ({
  id: snap.id,
  ...snap.data(),
});

const buildConstraints = (q: ListQuery): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [];

  for (const [field, value] of Object.entries(q.filters ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    constraints.push(where(field, '==', value));
  }

  // Prefix search. Firestore has no contains operator, so we bracket the term
  // with the highest possible code point. The search field has to lead the sort
  // for this to be a legal query.
  if (q.search && q.searchField) {
    constraints.push(where(q.searchField, '>=', q.search));
    constraints.push(where(q.searchField, '<=', `${q.search}\uf8ff`));
    constraints.push(fsOrderBy(q.searchField));
  } else if (q.orderByField) {
    constraints.push(fsOrderBy(q.orderByField, q.direction ?? 'desc'));
  }

  // The cursor is a DocumentSnapshot in this implementation, but the shared
  // ListQuery type keeps it opaque so the REST repository can use a string.
  if (q.cursor) constraints.push(startAfter(q.cursor as QueryDocumentSnapshot));
  constraints.push(fsLimit((q.pageSize ?? 25) + 1)); // +1 tells us if more exist

  return constraints;
};

export const firestoreRepository: AdminRepository = {
  async list(q: ListQuery): Promise<Page<AdminRecord>> {
    const pageSize = q.pageSize ?? 25;
    const snap = await getDocs(
      fsQuery(fsCollection(db, q.collection), ...buildConstraints(q)),
    );

    const docs = snap.docs;
    const hasMore = docs.length > pageSize;
    const visible = hasMore ? docs.slice(0, pageSize) : docs;

    return {
      items: visible.map(toRecord),
      cursor: visible.length ? visible[visible.length - 1] : null,
      hasMore,
    };
  },

  async get(collection, id) {
    const snap = await getDoc(doc(db, collection, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async getMany(collection, ids) {
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return [];

    /**
     * Firestore caps an `in` filter at 30 values, so the lookup is chunked.
     * Chunking saves round trips, not money — reads are billed per document
     * either way — which is why the chunks are fetched in parallel.
     */
    const CHUNK = 30;
    const chunks: string[][] = [];
    for (let i = 0; i < unique.length; i += CHUNK) chunks.push(unique.slice(i, i + CHUNK));

    const snaps = await Promise.all(
      chunks.map((chunk) =>
        getDocs(fsQuery(fsCollection(db, collection), where(documentId(), 'in', chunk))),
      ),
    );
    return snaps.flatMap((snap) => snap.docs.map(toRecord));
  },

  async update(collection, id, patch) {
    await updateDoc(doc(db, collection, id), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  },

  async remove(collection, id) {
    await deleteDoc(doc(db, collection, id));
  },

  async count(collection, filters) {
    const constraints: QueryConstraint[] = Object.entries(filters ?? {})
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([field, value]) => where(field, '==', value));

    const snap = await getCountFromServer(
      fsQuery(fsCollection(db, collection), ...constraints),
    );
    return snap.data().count;
  },

  async since(collection, field, from) {
    const snap = await getDocs(
      fsQuery(
        fsCollection(db, collection),
        where(field, '>=', from),
        fsOrderBy(field, 'asc'),
        fsLimit(5000), // ceiling; past this, move the aggregation to the backend
      ),
    );
    return snap.docs.map(toRecord);
  },
};
