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
  /**
   * Deliberately absent. The Users document is world-readable (profiles have to
   * be), and Firestore rules cannot hide individual fields — so anything stored
   * here is public. Email lives in Firebase Auth, which is the source of truth
   * for identity; read the signed-in user's own address from
   * `auth.currentUser.email` if it is ever needed.
   */
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
