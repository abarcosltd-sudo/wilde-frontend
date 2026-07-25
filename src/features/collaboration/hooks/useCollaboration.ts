import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDocument, createDocument, updateDocument, subscribeToQuery,
  Collections, where,
} from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUsers } from '@/hooks/useUser';
import { Work, Comment } from '@/types';
import { toMillis } from '@/utils';

export const useCollaboration = (workId: string) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const workKey = ['work', workId] as const;

  const { data: work, isPending: isWorkLoading } = useQuery({
    queryKey: workKey,
    queryFn: () => getDocument<Work>(Collections.WORKS, workId),
    enabled: !!workId,
  });

  const { users: collaborators } = useUsers(work?.collaborators ?? []);

  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommentsLoading, setCommentsLoading] = useState(true);

  // Live listener rather than a polled query: Firestore echoes a pending write
  // into the snapshot straight away, so a new comment appears the moment it is
  // posted without any manual optimistic bookkeeping. Its `createdAt` is null
  // until the server resolves, which `formatTimeAgo` renders as "just now".
  useEffect(() => {
    if (!workId) return;
    setCommentsLoading(true);
    return subscribeToQuery<Comment>(
      Collections.COMMENTS,
      [where('postId', '==', workId)],
      docs => {
        // Sorted client-side: ordering server-side would require a composite
        // index on (postId, createdAt) that this project doesn't define.
        setComments([...docs].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)));
        setCommentsLoading(false);
      },
    );
  }, [workId]);

  const addComment = async (content: string) => {
    if (!user) return;
    await createDocument(Collections.COMMENTS, { postId: workId, authorId: user.uid, content });
  };

  const invite = async (users: { id: string }[]) => {
    const ids = users.map(u => u.id);
    qc.setQueryData<Work | null>(workKey, w => w && { ...w, collaborators: ids });
    try {
      await updateDocument(Collections.WORKS, workId, { collaborators: ids });
    } finally {
      qc.invalidateQueries({ queryKey: workKey });
    }
  };

  return {
    work: work ?? null,
    collaborators,
    comments,
    addComment,
    invite,
    isLoading: isWorkLoading,
    isCommentsLoading,
  };
};
