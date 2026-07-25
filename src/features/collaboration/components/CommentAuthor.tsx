import React from 'react';
import { useUser } from '@/hooks/useUser';

const CommentAuthor: React.FC<{ authorId: string }> = ({ authorId }) => {
  const { user: author } = useUser(authorId);
  return <>{author?.displayName ?? '…'}</>;
};

export default CommentAuthor;
