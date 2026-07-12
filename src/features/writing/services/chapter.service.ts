import api from '@/services/api.service';
import { Chapter } from '@/types';

export const listChapters = (workId: string) =>
  api.get<{ data: Chapter[] }>(`/works/${workId}/chapters`).then(r => r.data.data);

export const createChapter = (workId: string, title: string, order: number) =>
  api.post(`/works/${workId}/chapters`, { title, order });

export const updateChapter = (workId: string, chapterId: string, content: string) =>
  api.put(`/works/${workId}/chapters/${chapterId}`, { content });
