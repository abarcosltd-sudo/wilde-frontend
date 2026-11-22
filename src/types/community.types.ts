export type GroupRole = 'member' | 'admin' | 'moderator';

export interface Group {
  id: string;
  name: string;
  description: string;
  coverImageUrl?: string;
  memberCount: number;
  createdBy: string;
  createdAt: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  groupId?: string;
  content: string;
  imageUrls?: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

/**
 * A public comment on a published work.
 *
 * Lives in the same `Comments` collection as community-post comments and the
 * collaborators' notes on a draft, which key off `postId`. The explicit
 * `parentType` keeps this apart from both: a reader's comment must never show
 * up in a draft's private working notes, or the reverse.
 */
export interface WorkComment {
  id: string;
  parentType: 'work';
  parentId: string;
  authorId: string;
  content: string;
  /** Set by moderators; absent on older rows. `hidden` is not shown to readers. */
  status?: 'visible' | 'flagged' | 'hidden';
  createdAt: string;
}
