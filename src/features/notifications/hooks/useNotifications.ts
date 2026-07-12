import { useQuery } from '@tanstack/react-query';
import { queryDocuments, Collections, orderBy, limit } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';

interface Notification {
  id: string; icon: string; message: string; read: boolean; createdAt: string;
}

export const useNotifications = () => {
  const { user } = useAuthStore();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.uid],
    queryFn: () => queryDocuments<Notification>(Collections.NOTIFICATIONS, [
      orderBy('createdAt', 'desc'), limit(50),
    ]),
    enabled: !!user,
  });

  return { notifications };
};
