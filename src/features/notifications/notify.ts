import { createDocument, Collections } from '@/firebase/firestore.helpers';

export const notify = (userId: string, icon: string, message: string) =>
  createDocument(Collections.NOTIFICATIONS, { userId, icon, message, read: false });
