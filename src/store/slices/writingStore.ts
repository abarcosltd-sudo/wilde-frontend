import { create } from 'zustand';
import { Work, Chapter } from '@/types';

interface WritingState {
  currentWork:    Work | null;
  chapters:       Chapter[];
  isDirty:        boolean;
  isSaving:       boolean;
  setCurrentWork: (work: Work | null)    => void;
  setChapters:    (chapters: Chapter[]) => void;
  updateContent:  (content: string)     => void;
  setDirty:       (dirty: boolean)      => void;
  setSaving:      (saving: boolean)     => void;
}

export const useWritingStore = create<WritingState>(set => ({
  currentWork: null,
  chapters:    [],
  isDirty:     false,
  isSaving:    false,
  setCurrentWork: work     => set({ currentWork: work, isDirty: false }),
  setChapters:    chapters => set({ chapters }),
  updateContent:  content  => set(s => ({
    currentWork: s.currentWork ? { ...s.currentWork, content } : null,
    isDirty: true,
  })),
  setDirty:  isDirty  => set({ isDirty }),
  setSaving: isSaving => set({ isSaving }),
}));
