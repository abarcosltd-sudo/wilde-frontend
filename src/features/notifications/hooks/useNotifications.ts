import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryDocuments, updateDocument, Collections, where, orderBy, limit } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';

interface Notification {
  id: string; userId: string; icon: string; message: string; read: boolean; createdAt: string;
}

export const useNotifications = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.uid],
    queryFn: () => queryDocuments<Notification>(Collections.NOTIFICATIONS, [
      where('userId', '==', user!.uid), orderBy('createdAt', 'desc'), limit(50),
    ]),
    enabled: !!user,
  });

  const markAsRead = async (id: string) => {
    await updateDocument(Collections.NOTIFICATIONS, id, { read: true });
    queryClient.setQueryData<Notification[]>(['notifications', user?.uid], prev =>
      prev?.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return { notifications, markAsRead };
};
