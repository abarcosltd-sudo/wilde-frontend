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
  /**
   * Set at publish time. Above zero is the single switch for both "listed in
   * the marketplace" and "paywalled"; absent or zero means free. There is no
   * separate premium flag — one existed, was written as `false` at creation and
   * never read again.
   */
  price?: number;
  currency?: 'NGN' | 'USD';
  viewCount: number;
  likeCount: number;
  tags: string[];
  collaborators?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * One row per (work, user). Its existence is what makes a like toggleable and
 * idempotent — `Work.likeCount` on its own can only be stepped, never told
 * whether this particular user has already liked.
 */
export interface Like {
  id: string;
  workId: string;
  userId: string;
  createdAt: string;
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
