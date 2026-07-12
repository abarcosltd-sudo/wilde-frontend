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
