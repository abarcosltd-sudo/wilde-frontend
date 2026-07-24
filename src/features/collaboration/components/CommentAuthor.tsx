import React, { useState, useEffect } from 'react';
import { getDocument, Collections } from '@/firebase/firestore.helpers';
import { User } from '@/types';

const CommentAuthor: React.FC<{ authorId: string }> = ({ authorId }) => {
  const [author, setAuthor] = useState<User | null>(null);

  useEffect(() => {
    getDocument<User>(Collections.USERS, authorId).then(setAuthor);
  }, [authorId]);

  return <>{author?.displayName ?? '…'}</>;
};

export default CommentAuthor;
