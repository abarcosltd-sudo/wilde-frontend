import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  serverTimestamp,
  addDoc,
  increment,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

export const Collections = {
  USERS:                'Users',
  FOLLOWS:              'Follows',
  WORKS:                'Works',
  CHAPTERS:             'Chapters',
  GROUPS:               'Groups',
  GROUP_MEMBERS:        'GroupMembers',
  POSTS:                'Posts',
  COMMENTS:             'Comments',
  GHOSTWRITER_LISTINGS: 'GhostwriterListings',
  ORDERS:               'Orders',
  STREAKS:              'Streaks',
  REMINDERS:            'Reminders',
  PROMPTS:              'Prompts',
  PAYMENTS:             'Payments',
  JOBS:                 'Jobs',
  JOB_APPLICATIONS:     'JobApplications',
  NOTIFICATIONS:        'Notifications',
  REVIEWS:              'Reviews',
  LIKES:                'Likes',
  HIRE_REQUESTS:        'HireRequests',
} as const;

/**
 * Firestore returns `serverTimestamp()` fields as `Timestamp` objects, but every
 * type in `src/types` declares them as ISO `string` and the format helpers pass
 * them straight to `new Date(...)`. Normalising on read keeps the declared types
 * honest, so no caller has to know a field came from Firestore.
 *
 * Only plain objects/arrays are walked: `GeoPoint`, `DocumentReference` and
 * friends are class instances and are passed through untouched.
 */
export const normalize = (value: unknown): unknown => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, normalize(v)])
    );
  }
  return value;
};

const fromSnapshot = <T>(snap: { id: string; data(): DocumentData | undefined }): T =>
  ({ id: snap.id, ...(normalize(snap.data() ?? {}) as DocumentData) } as T);

export const getDocument = async <T>(col: string, id: string): Promise<T | null> => {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? fromSnapshot<T>(snap) : null;
};

export const createDocument = async (col: string, data: DocumentData, id?: string) => {
  const payload = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  if (id) {
    await setDoc(doc(db, col, id), payload);
    return id;
  }
  const ref = await addDoc(collection(db, col), payload);
  return ref.id;
};

export const updateDocument = async (col: string, id: string, data: Partial<DocumentData>) =>
  updateDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() });

export const deleteDocument = (col: string, id: string) =>
  deleteDoc(doc(db, col, id));

export const queryDocuments = async <T>(
  col: string,
  constraints: QueryConstraint[]
): Promise<T[]> => {
  const q = query(collection(db, col), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => fromSnapshot<T>(d));
};

export const subscribeToQuery = <T>(
  col: string,
  constraints: QueryConstraint[],
  onData: (docs: T[]) => void
) => {
  const q = query(collection(db, col), ...constraints);
  return onSnapshot(q, snap => onData(snap.docs.map(d => fromSnapshot<T>(d))));
};

export { where, orderBy, limit, increment };
