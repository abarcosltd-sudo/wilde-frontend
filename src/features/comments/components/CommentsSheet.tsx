import React, { useEffect, useRef, useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonContent, IonFooter, IonIcon } from '@ionic/react';
import { closeOutline, sendOutline, trashOutline } from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { getDocument, Collections } from '@/firebase/firestore.helpers';
import { useWorkComments } from '@/features/comments/hooks/useWorkComments';
import {
  MAX_COMMENT_LENGTH, normalizeComment, canDeleteComment, displayCount,
} from '@/features/comments/commentRules';
import { useUiStore } from '@/store/slices/uiStore';
import { useAuthStore } from '@/store/slices/authStore';
import { useUser } from '@/hooks/useUser';
import Avatar from '@/components/ui/Avatar';
import ErrorState from '@/components/ui/ErrorState';
import { Skeleton, SkeletonScreen } from '@/components/ui/Skeleton';
import { formatTimeShort } from '@/utils';
import Swal from '@/utils/swal';
import { Work, WorkComment } from '@/types';

const Row: React.FC<{
  comment: WorkComment; canDelete: boolean; isRemoving: boolean; onDelete: () => void;
}> = ({ comment, canDelete, isRemoving, onDelete }) => {
  const { user: author } = useUser(comment.authorId);
  return (
    <li className={`flex gap-3 py-3 ${isRemoving ? 'opacity-50' : ''}`}>
      <Avatar src={author?.photoURL} name={author?.displayName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-tight">
          <span className="font-semibold text-[15px]">{author?.displayName ?? '…'}</span>
          <span className="text-wilde-muted"> · {formatTimeShort(comment.createdAt)}</span>
        </p>
        {/* Plain text, so a comment can never carry markup into the page. */}
        <p className="mt-0.5 text-[15px] leading-snug whitespace-pre-wrap break-words">{comment.content}</p>
      </div>
      {canDelete && (
        <button type="button" onClick={onDelete} disabled={isRemoving} aria-label="Delete comment"
          className="h-9 w-9 shrink-0 rounded-full text-lg text-wilde-muted flex items-center justify-center
            active:bg-wilde-subtle disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-brand-strong">
          <IonIcon icon={trashOutline} aria-hidden="true" />
        </button>
      )}
    </li>
  );
};

/**
 * The comments panel for any published work: books, stories, poems, artwork,
 * screenplays and plays alike. One instance is mounted for the whole app and
 * opened with `openComments(workId)` from the feed or the reader, so the
 * behaviour is identical wherever it is reached from.
 *
 * A fixed-height panel (see `.comments-sheet` in index.css), not one of Ionic's
 * draggable breakpoint sheets: those keep the modal full height and slide it
 * down, so a footer pinned to its bottom — the comment box — ends up below the
 * edge of the screen until the sheet is dragged fully open.
 */
const CommentsSheet: React.FC = () => {
  const workId = useUiStore(s => s.commentsWorkId);
  const close = useUiStore(s => s.closeComments);
  const { user } = useAuthStore();
  const { pathname } = useLocation();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpen = !!workId;

  // Shares the reader's cache key, so the work is usually already loaded.
  const { data: work } = useQuery({
    queryKey: ['work', workId],
    queryFn: () => getDocument<Work>(Collections.WORKS, workId!),
    enabled: isOpen,
  });

  const {
    comments, loadedCount, isLoading, isError, retry, addComment, isPosting, removeComment, removingId,
  } = useWorkComments(workId ?? '', isOpen);

  // A sheet left open across a navigation would sit over an unrelated page.
  useEffect(() => { close(); }, [pathname, close]);
  // A different work starts with an empty box, not the last one's half-typed reply.
  useEffect(() => { setText(''); }, [workId]);

  const canComment = !!work && work.status === 'published';
  const total = displayCount(work?.commentCount, loadedCount);
  const normalized = normalizeComment(text);

  const post = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalized || isPosting || !canComment) return;
    addComment({ content: normalized, work });
    setText('');
    inputRef.current?.focus();
  };

  const confirmDelete = async (comment: WorkComment) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete this comment?',
      text: "This can't be undone.",
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Keep it',
      focusCancel: true,
    });
    if (result.isConfirmed) removeComment(comment.id);
  };

  return (
    <IonModal className="comments-sheet" isOpen={isOpen} onDidDismiss={close}>
      <IonHeader>
        <IonToolbar>
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="text-[17px] font-semibold">
              Comments{total > 0 ? ` · ${total}` : ''}
            </h2>
            <button type="button" onClick={close} aria-label="Close comments"
              className="h-10 w-10 -mr-2 rounded-full text-2xl flex items-center justify-center
                active:bg-wilde-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong">
              <IonIcon icon={closeOutline} aria-hidden="true" />
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="px-4">
          {isLoading ? (
            <SkeletonScreen label="comments">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex gap-3 py-3">
                  <Skeleton circle className="h-8 w-8 shrink-0" />
                  <div className="flex-1"><Skeleton className="h-3 w-32" /><Skeleton className="h-3 w-full mt-2" /></div>
                </div>
              ))}
            </SkeletonScreen>
          ) : isError ? (
            <ErrorState label="the comments" error={new Error('load')} onRetry={retry} />
          ) : comments.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-[15px] font-medium">No comments yet</p>
              <p className="text-sm text-wilde-muted mt-1">
                {canComment ? 'Be the first to say something.' : 'Comments open once a work is published.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-wilde-border">
              {comments.map(c => (
                <Row key={c.id} comment={c}
                  canDelete={!c.id.startsWith('optimistic-') && canDeleteComment(c, user?.uid, work?.authorId)}
                  isRemoving={removingId === c.id}
                  onDelete={() => confirmDelete(c)} />
              ))}
            </ul>
          )}
        </div>
      </IonContent>

      {canComment && (
        <IonFooter>
          <IonToolbar>
            <form onSubmit={post} className="flex items-center gap-2 px-4 py-2">
              <Avatar src={user?.photoURL} name={user?.displayName} size="sm" />
              <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                maxLength={MAX_COMMENT_LENGTH} aria-label="Write a comment" placeholder="Add a comment…"
                autoComplete="off" enterKeyHint="send"
                className="flex-1 min-w-0 rounded-full bg-wilde-subtle px-4 py-2.5 text-[16px]" />
              {text.length >= MAX_COMMENT_LENGTH - 80 && (
                <span aria-live="polite"
                  className={`text-[12px] tabular-nums ${text.length >= MAX_COMMENT_LENGTH ? 'text-fmt-artwork' : 'text-wilde-muted'}`}>
                  {text.length}/{MAX_COMMENT_LENGTH}
                </span>
              )}
              <button type="submit" disabled={!normalized || isPosting} aria-label="Post comment"
                className="h-10 w-10 shrink-0 rounded-full bg-brand text-brand-on text-xl flex items-center
                  justify-center transition-opacity disabled:opacity-40 focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-brand-strong focus-visible:ring-offset-2
                  focus-visible:ring-offset-wilde-surface">
                <IonIcon icon={sendOutline} aria-hidden="true" />
              </button>
            </form>
          </IonToolbar>
        </IonFooter>
      )}
    </IonModal>
  );
};

export default CommentsSheet;
