import { useState, useEffect } from 'react';
import {
  getDocument, createDocument, updateDocument, subscribeToQuery,
  Collections, where,
} from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { Work, Comment, User } from '@/types';

// createdAt comes back from Firestore as a Timestamp, not the ISO string the
// app's types claim — see TODO.md.
const toMillis = (v: unknown): number =>
  v && typeof v === 'object' && 'toMillis' in v ? (v as { toMillis(): number }).toMillis() : new Date(v as string).getTime();

export const useCollaboration = (workId: string) => {
  const { user } = useAuthStore();
  const [work, setWork] = useState<Work | null>(null);
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    getDocument<Work>(Collections.WORKS, workId).then(setWork);
  }, [workId]);

  useEffect(() => {
    const ids = work?.collaborators ?? [];
    if (ids.length === 0) { setCollaborators([]); return; }
    Promise.all(ids.map(id => getDocument<User>(Collections.USERS, id)))
      .then(profiles => setCollaborators(profiles.filter((p): p is User => !!p)));
  }, [work?.collaborators]);

  useEffect(() => subscribeToQuery<Comment>(Collections.COMMENTS,
    [where('postId', '==', workId)],
    docs => setComments([...docs].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))),
  ), [workId]);

  const addComment = async (content: string) => {
    if (!user) return;
    await createDocument(Collections.COMMENTS, { postId: workId, authorId: user.uid, content });
  };

  const invite = async (users: User[]) => {
    const ids = users.map(u => u.id);
    await updateDocument(Collections.WORKS, workId, { collaborators: ids });
    setWork(w => w && { ...w, collaborators: ids });
  };

  return { work, collaborators, comments, addComment, invite };
};
