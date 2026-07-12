import { useAuthStore } from '@/store/slices/authStore';

interface Analytics { views: number; engagement: number; revenue: number; }

export const useProfileDash = () => {
  const { user } = useAuthStore();
  // TODO: fetch real analytics from backend
  const analytics: Analytics = { views: 12500, engagement: 3200, revenue: 78000 };
  return { user, analytics };
};
