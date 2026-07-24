export type CreativeRole =
  | 'writer'
  | 'screenwriter'
  | 'playwright'
  | 'painter'
  | 'designer'
  | 'musician'
  | 'other';

export interface User {
  id: string;
  uid: string;
  displayName: string;
  username: string;
  email: string;
  photoURL?: string;
  bio?: string;
  roles: CreativeRole[];
  isPremium: boolean;
  followersCount: number;
  followingCount: number;
  worksCount: number;
  totalSales: number;
  streakCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}
