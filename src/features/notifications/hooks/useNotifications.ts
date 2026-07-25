import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryDocuments, updateDocument, Collections, where, orderBy, limit } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';

export interface Notification {
  id: string; userId: string; icon: string; message: string; read: boolean; createdAt: string;
}

export const useNotifications = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);
  const key = ['notifications', user?.uid] as const;

  const { data: notifications = [], isPending: isLoading } = useQuery({
    queryKey: key,
    queryFn: () => queryDocuments<Notification>(Collections.NOTIFICATIONS, [
      where('userId', '==', user!.uid), orderBy('createdAt', 'desc'), limit(50),
    ]),
    enabled: !!user,
    // Short window so the unread badge stays roughly live as the user moves
    // around the app, without a listener open on every screen.
    staleTime: 1000 * 60,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (ids: string[]) =>
    qc.setQueryData<Notification[]>(key, prev =>
      prev?.map(n => (ids.includes(n.id) ? { ...n, read: true } : n)));

  const { mutate: markAsRead } = useMutation({
    mutationFn: (id: string) => updateDocument(Collections.NOTIFICATIONS, id, { read: true }),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Notification[]>(key);
      markRead([id]);
      return { prev };
    },
    onError: (_e, _id, ctx) => { if (ctx) qc.setQueryData(key, ctx.prev); },
  });

  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(
        unread.map(n => updateDocument(Collections.NOTIFICATIONS, n.id, { read: true })));
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Notification[]>(key);
      markRead(notifications.map(n => n.id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prev);
      showToast("Couldn't mark all as read. Please try again.", 'danger');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { notifications, unreadCount, markAsRead, markAllAsRead, isMarkingAll, isLoading };
};
