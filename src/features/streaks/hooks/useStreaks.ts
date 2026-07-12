import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocument, updateDocument, Collections } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';

interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastWrittenDate: string;
}

export const useStreaks = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: streak } = useQuery({
    queryKey: ['streak', user?.uid],
    queryFn: () => getDocument<Streak>(Collections.STREAKS, user!.uid),
    enabled: !!user,
  });

  const { mutate: logWrite } = useMutation({
    mutationFn: () =>
      updateDocument(Collections.STREAKS, user!.uid, {
        lastWrittenDate: new Date().toISOString(),
        currentStreak: (streak?.currentStreak ?? 0) + 1,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streak', user?.uid] }),
  });

  return { streak, logWrite };
};
