import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/slices/authStore';
import { queryDocuments, Collections, where } from '@/firebase/firestore.helpers';
import { Work } from '@/types';

interface Analytics { views: number; engagement: number; revenue: number; }

export const useProfileDash = () => {
  const { user } = useAuthStore();

  const { data: analytics = { views: 0, engagement: 0, revenue: 0 } } = useQuery({
    queryKey: ['profile-analytics', user?.id],
    queryFn: async (): Promise<Analytics> => {
      const works = await queryDocuments<Work>(Collections.WORKS, [where('authorId', '==', user!.id)]);
      return {
        views: works.reduce((sum, w) => sum + (w.viewCount ?? 0), 0),
        engagement: works.reduce((sum, w) => sum + (w.likeCount ?? 0), 0),
        revenue: user!.totalSales ?? 0,
      };
    },
    enabled: !!user,
  });

  return { user, analytics };
};
