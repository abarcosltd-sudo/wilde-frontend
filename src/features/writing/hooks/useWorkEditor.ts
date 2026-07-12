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
    await updateDocument(Collections.WORKS, workId, {
      content: currentWork.content,
      title:   currentWork.title,
      status,
    });
    setSaving(false);
  }, [currentWork, workId]);

  const publish = () => save('published');

  return { load, save, publish };
};
