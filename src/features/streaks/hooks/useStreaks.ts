import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocument, createDocument, updateDocument, Collections } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';

interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastWrittenDate: string;
}

const dayOf = (iso: string) => iso.slice(0, 10);

const daysBetween = (fromIso: string, toIso: string) => {
  const from = new Date(dayOf(fromIso));
  const to = new Date(dayOf(toIso));
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
};

export const useStreaks = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: streak } = useQuery({
    queryKey: ['streak', user?.uid],
    queryFn: () => getDocument<Streak>(Collections.STREAKS, user!.uid),
    enabled: !!user,
  });

  const { mutate: logWrite } = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const today = new Date().toISOString();
      if (!streak) {
        return createDocument(Collections.STREAKS, {
          userId: user.uid, currentStreak: 1, longestStreak: 1, lastWrittenDate: today,
        }, user.uid);
      }
      const gap = daysBetween(streak.lastWrittenDate, today);
      if (gap === 0) return;
      const nextStreak = gap === 1 ? streak.currentStreak + 1 : 1;
      return updateDocument(Collections.STREAKS, user.uid, {
        currentStreak: nextStreak,
        longestStreak: Math.max(streak.longestStreak, nextStreak),
        lastWrittenDate: today,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streak', user?.uid] }),
  });

  return { streak, logWrite };
};
