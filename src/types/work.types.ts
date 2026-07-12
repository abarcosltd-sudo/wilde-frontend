export type WorkType = 'poetry' | 'screenplay' | 'playlet' | 'long_work' | 'short_story' | 'artwork';
export type WorkStatus = 'draft' | 'published' | 'archived';

export interface Work {
  id: string;
  authorId: string;
  title: string;
  type: WorkType;
  status: WorkStatus;
  coverImageUrl?: string;
  excerpt?: string;
  content?: string;   // For single-file works
  isPremium: boolean;
  price?: number;
  currency?: 'NGN' | 'USD';
  viewCount: number;
  likeCount: number;
  tags: string[];
  collaborators?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  workId: string;
  title: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
