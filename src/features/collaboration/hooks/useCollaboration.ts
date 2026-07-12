import { useState, useEffect } from 'react';
import { getDocument, queryDocuments, Collections, where, orderBy } from '@/firebase/firestore.helpers';
import { Work, Comment, User } from '@/types';

export const useCollaboration = (workId: string) => {
  const [work, setWork] = useState<Work | null>(null);
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    getDocument<Work>(Collections.WORKS, workId).then(setWork);
    queryDocuments<Comment>(Collections.COMMENTS, [
      where('postId', '==', workId), orderBy('createdAt', 'desc'),
    ]).then(setComments);
  }, [workId]);

  const addComment = async (content: string) => { /* TODO */ };

  return { work, collaborators, comments, addComment };
};
