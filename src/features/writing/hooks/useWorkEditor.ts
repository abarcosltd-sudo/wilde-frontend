import { useCallback } from 'react';
import { getDocument, queryDocuments, updateDocument, Collections, where } from '@/firebase/firestore.helpers';
import { useWritingStore } from '@/store/slices/writingStore';
import { useAuthStore } from '@/store/slices/authStore';
import { useStreaks } from '@/features/streaks/hooks/useStreaks';
import { notify } from '@/features/notifications/notify';
import { Work, Follow } from '@/types';

export const useWorkEditor = (workId: string) => {
  const { setCurrentWork, currentWork, setSaving } = useWritingStore();
  const { user } = useAuthStore();
  const { logWrite } = useStreaks();

  const load = useCallback(async () => {
    const work = await getDocument<Work>(Collections.WORKS, workId);
    setCurrentWork(work);
  }, [workId]);

  const save = useCallback(async (status: 'draft' | 'published') => {
    if (!currentWork) return;
    setSaving(true);
    const wasPublished = currentWork.status === 'published';
    const payload: Record<string, unknown> = {
      content: currentWork.content ?? '',
      title:   currentWork.title,
      status,
    };
    if (currentWork.coverImageUrl) payload.coverImageUrl = currentWork.coverImageUrl;
    if (currentWork.collaborators) payload.collaborators = currentWork.collaborators;
    await updateDocument(Collections.WORKS, workId, payload);
    logWrite();
    if (user && status === 'published' && !wasPublished) {
      queryDocuments<Follow>(Collections.FOLLOWS, [where('followingId', '==', user.uid)])
        .then(follows => Promise.all(follows.map(f =>
          notify(f.followerId, '📖', `${user.displayName} published "${currentWork.title}"`))))
        .catch(() => {});
    }
    setSaving(false);
  }, [currentWork, workId, user, logWrite]);

  const publish = () => save('published');

  return { load, save, publish };
};
