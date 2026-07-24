import { useCallback } from 'react';
import { getDocument, updateDocument, Collections } from '@/firebase/firestore.helpers';
import { useWritingStore } from '@/store/slices/writingStore';
import { Work } from '@/types';

export const useWorkEditor = (workId: string) => {
  const { setCurrentWork, currentWork, setSaving } = useWritingStore();

  const load = useCallback(async () => {
    const work = await getDocument<Work>(Collections.WORKS, workId);
    setCurrentWork(work);
  }, [workId]);

  const save = useCallback(async (status: 'draft' | 'published') => {
    if (!currentWork) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      content: currentWork.content ?? '',
      title:   currentWork.title,
      status,
    };
    if (currentWork.coverImageUrl) payload.coverImageUrl = currentWork.coverImageUrl;
    if (currentWork.collaborators) payload.collaborators = currentWork.collaborators;
    await updateDocument(Collections.WORKS, workId, payload);
    setSaving(false);
  }, [currentWork, workId]);

  const publish = () => save('published');

  return { load, save, publish };
};
