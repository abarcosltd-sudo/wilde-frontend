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
} as const;

export const getDocument = async <T>(col: string, id: string): Promise<T | null> => {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
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
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
};

export const subscribeToQuery = <T>(
  col: string,
  constraints: QueryConstraint[],
  onData: (docs: T[]) => void
) => {
  const q = query(collection(db, col), ...constraints);
  return onSnapshot(q, snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as T))));
};

export { where, orderBy, limit, increment };
