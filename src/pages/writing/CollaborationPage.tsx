import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { chevronBackOutline, sendOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useCollaboration } from '@/features/collaboration/hooks/useCollaboration';
import { useAuthStore } from '@/store/slices/authStore';
import CollaboratorPickerModal from '@/features/writing/components/CollaboratorPickerModal';
import Avatar from '@/components/ui/Avatar';
import CommentAuthor from '@/features/collaboration/components/CommentAuthor';

const CollaborationPage: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const history = useHistory();
  const { user } = useAuthStore();
  const { work, collaborators, comments, addComment, invite } = useCollaboration(workId);
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
            <button onClick={() => history.goBack()}
              aria-label="Go back"
              className="min-w-11 min-h-11 flex items-center justify-center rounded-full active:bg-gray-100">
              <IonIcon icon={chevronBackOutline} aria-hidden="true" />
            </button>
            <h2 className="font-bold">{work?.title}</h2>
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
            <div className="text-sm leading-relaxed text-wilde-muted mb-4 whitespace-pre-wrap">
              {work?.content || 'No content yet.'}
            </div>
            {comments.map(c => (
              <div key={c.id} className="border border-wilde-border rounded-lg p-3 mb-2 text-xs">
                <p className="font-bold mb-1"><CommentAuthor authorId={c.authorId} /></p>
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
            <button onClick={handleSend}
              disabled={!commentText.trim()}
              aria-label="Send comment"
              className="min-w-11 min-h-11 flex items-center justify-center text-lg rounded-full text-wilde-black disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-100">
              <IonIcon icon={sendOutline} aria-hidden="true" />
            </button>
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
