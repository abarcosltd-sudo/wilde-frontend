import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { chevronBackOutline, sendOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useCollaboration } from '@/features/collaboration/hooks/useCollaboration';
import { useAuthStore } from '@/store/slices/authStore';
import CollaboratorPickerModal from '@/features/writing/components/CollaboratorPickerModal';
import Avatar from '@/components/ui/Avatar';
import IconButton from '@/components/ui/IconButton';
import { Skeleton, SkeletonScreen, ProseSkeleton } from '@/components/ui/Skeleton';
import CommentAuthor from '@/features/collaboration/components/CommentAuthor';
import { sanitizeHtml, formatTimeAgo } from '@/utils';

const CollaborationPage: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const history = useHistory();
  const { user } = useAuthStore();
  const {
    work, collaborators, comments, addComment, invite, isLoading, isCommentsLoading,
  } = useCollaboration(workId);
  const [commentText, setCommentText] = useState('');
  const [isInviteOpen, setInviteOpen] = useState(false);

  const isAuthor = !!user && user.uid === work?.authorId;

  const handleSend = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    addComment(trimmed);
    setCommentText('');
  };

  return (
    <IonPage>
      <IonContent>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-wilde-border">
            <IconButton icon={chevronBackOutline} label="Go back" onClick={() => history.goBack()} />
            <h2 className="font-bold truncate">
              {work?.title ?? (isLoading ? <Skeleton className="h-4 w-32" /> : '')}
            </h2>
            <span className="min-w-11" />
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-b border-wilde-border">
            <div className="flex gap-3">
              {collaborators.map(c => (
                <div key={c.id} className="flex items-center gap-1 text-xs">
                  <Avatar name={c.displayName} src={c.photoURL} size="sm" />
                  <span className="font-semibold">{c.displayName}</span>
                </div>
              ))}
              {collaborators.length === 0 && (
                <span className="text-xs text-wilde-muted">No collaborators yet</span>
              )}
            </div>
            {isAuthor && (
              <button onClick={() => setInviteOpen(true)}
                className="text-xs bg-wilde-black text-white px-3 py-1 rounded">
                Invite
              </button>
            )}
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {isLoading ? (
              <SkeletonScreen label="document"><ProseSkeleton lines={6} /></SkeletonScreen>
            ) : work?.content ? (
              <div className="text-sm leading-relaxed text-wilde-muted mb-4 whitespace-pre-wrap rich-text-content"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(work.content) }} />
            ) : (
              <div className="text-sm leading-relaxed text-wilde-muted mb-4">No content yet.</div>
            )}

            {isCommentsLoading ? (
              <SkeletonScreen label="comments">
                {[0, 1].map(i => (
                  <div key={i} className="border border-wilde-border rounded-lg p-3 mb-2">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-2.5 w-full mt-2" />
                  </div>
                ))}
              </SkeletonScreen>
            ) : comments.map(c => (
              <div key={c.id} className="border border-wilde-border rounded-lg p-3 mb-2 text-xs animate-fade-in">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <p className="font-bold"><CommentAuthor authorId={c.authorId} /></p>
                  <span className="text-wilde-muted shrink-0">{formatTimeAgo(c.createdAt)}</span>
                </div>
                <p>{c.content}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-4 border-t border-wilde-border">
            <input value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              aria-label="Write a comment"
              className="flex-1 border border-wilde-border rounded-lg px-3 py-2 text-sm"
              placeholder="Write a comment…" />
            <IconButton icon={sendOutline} label="Send comment" side="top"
              onClick={handleSend} disabled={!commentText.trim()} />
          </div>
        </div>
      </IonContent>

      <CollaboratorPickerModal
        isOpen={isInviteOpen}
        onClose={() => setInviteOpen(false)}
        initialSelectedIds={work?.collaborators ?? []}
        onSave={invite} />
    </IonPage>
  );
};

export default CollaborationPage;
