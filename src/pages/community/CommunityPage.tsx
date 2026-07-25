import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon, IonModal } from '@ionic/react';
import {
  heartOutline, heart, chatbubbleOutline, peopleOutline,
  addOutline, closeOutline, sendOutline,
} from 'ionicons/icons';
import { usePosts } from '@/features/community/hooks/usePosts';
import { usePostComments } from '@/features/community/hooks/usePostComments';
import { useGroups } from '@/features/community/hooks/useGroups';
import { useUser } from '@/hooks/useUser';
import Avatar from '@/components/ui/Avatar';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';
import { Skeleton, SkeletonScreen, ListRowSkeleton } from '@/components/ui/Skeleton';
import { formatCount, formatTimeAgo } from '@/utils';

const TABS = ['Feed', 'Groups'] as const;

const PostAuthor: React.FC<{ authorId: string }> = ({ authorId }) => {
  const { user, isLoading } = useUser(authorId);
  if (isLoading) {
    return (
      <>
        <Skeleton circle className="h-8 w-8 shrink-0" />
        <Skeleton className="h-2.5 w-24" />
      </>
    );
  }
  return (
    <>
      <Avatar src={user?.photoURL} name={user?.displayName} size="sm" />
      <span className="text-sm font-semibold truncate">{user?.displayName ?? 'Unknown'}</span>
    </>
  );
};

/**
 * Collapsed by default: the thread only fetches once opened, so a feed of posts
 * doesn't trigger a comment read per post.
 */
const CommentThread: React.FC<{ postId: string }> = ({ postId }) => {
  const { comments, addComment, isPosting, isLoading } = usePostComments(postId, true);
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    addComment(trimmed);
    setDraft('');
  };

  return (
    <div className="mt-3 pt-3 border-t border-wilde-border">
      {isLoading ? (
        <SkeletonScreen label="comments">
          <Skeleton className="h-2.5 w-1/3" />
          <Skeleton className="h-2.5 w-2/3 mt-2" />
        </SkeletonScreen>
      ) : comments.length === 0 ? (
        <p className="text-xs text-wilde-muted mb-2">No comments yet.</p>
      ) : (
        <div className="flex flex-col gap-2 mb-2">
          {comments.map(c => (
            <div key={c.id} className="text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold"><PostAuthorName authorId={c.authorId} /></span>
                <span className="text-wilde-muted shrink-0">{formatTimeAgo(c.createdAt)}</span>
              </div>
              <p className="text-wilde-muted mt-0.5">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          aria-label="Write a comment"
          placeholder="Add a comment…"
          className="flex-1 border border-wilde-border rounded-lg px-3 py-1.5 text-xs" />
        <IconButton icon={sendOutline} label="Post comment" side="top"
          className="!min-w-9 !min-h-9 !text-base"
          disabled={!draft.trim() || isPosting} onClick={handleSend} />
      </div>
    </div>
  );
};

/** Name only — the comment rows are too dense for an avatar. */
const PostAuthorName: React.FC<{ authorId: string }> = ({ authorId }) => {
  const { user } = useUser(authorId);
  return <>{user?.displayName ?? '…'}</>;
};

const NewGroupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: { name: string; description: string }) => void;
  isCreating: boolean;
}> = ({ isOpen, onClose, onCreate, isCreating }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim() });
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.6} breakpoints={[0, 0.6]}>
      <IonContent className="ion-padding">
        <div className="flex items-center justify-between mb-4">
          <IconButton icon={closeOutline} label="Close" onClick={onClose} />
          <h2 className="font-bold">New Group</h2>
          <span className="min-w-11" />
        </div>
        <label className="text-xs font-semibold" htmlFor="group-name">Name</label>
        <input id="group-name" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Lagos Screenwriters"
          className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm mt-1 mb-3" />
        <label className="text-xs font-semibold" htmlFor="group-desc">Description</label>
        <textarea id="group-desc" value={description} onChange={e => setDescription(e.target.value)}
          rows={3} placeholder="What is this group for?"
          className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm mt-1 mb-4 resize-none" />
        <Button expand="block" isLoading={isCreating} disabled={!name.trim()} onClick={handleSubmit}>
          Create Group
        </Button>
      </IonContent>
    </IonModal>
  );
};

const CommunityPage: React.FC = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Feed');
  const [draft, setDraft] = useState('');
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  // One thread open at a time, so the feed stays readable on a phone.
  const [openComments, setOpenComments] = useState<string | null>(null);

  const { posts, isLoading: isPostsLoading, createPost, isPosting, likePost } = usePosts();
  const {
    groups, isLoading: isGroupsLoading, createGroup, isCreating,
    joinedGroupIds, toggleMembership,
  } = useGroups();

  const handlePost = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    createPost(trimmed);
    setDraft('');
  };

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-bold text-lg">Community</h1>
            {tab === 'Groups' && (
              <IconButton icon={addOutline} label="New group"
                onClick={() => setGroupModalOpen(true)} />
            )}
          </div>

          <div className="flex gap-2 border-b border-wilde-border pb-3 mb-4">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={'text-xs px-3 py-1.5 rounded-full transition-colors ' +
                  (tab === t ? 'bg-wilde-black text-white' : 'border border-wilde-border')}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'Feed' && (
            <>
              <div className="flex flex-col gap-2 mb-4">
                <textarea value={draft} onChange={e => setDraft(e.target.value)}
                  rows={2} placeholder="Share something with the community…"
                  aria-label="Write a post"
                  className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm resize-none" />
                <div className="flex justify-end">
                  <Button size="sm" disabled={!draft.trim() || isPosting} onClick={handlePost}>
                    Post
                  </Button>
                </div>
              </div>

              {isPostsLoading ? (
                <SkeletonScreen label="posts"><ListRowSkeleton count={4} thumb={false} /></SkeletonScreen>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-wilde-muted">No posts yet.</p>
                  <p className="text-xs text-wilde-muted mt-1">Be the first to say something.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 animate-fade-in">
                  {posts.map(p => (
                    <article key={p.id} className="border border-wilde-border rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <PostAuthor authorId={p.authorId} />
                        <span className="text-xs text-wilde-muted ml-auto shrink-0">
                          {formatTimeAgo(p.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.content}</p>
                      <div className="flex gap-4 mt-3 text-xs text-wilde-muted">
                        <button onClick={() => likePost(p.id)}
                          aria-label={`Like this post. ${p.likeCount ?? 0} likes so far.`}
                          className="flex items-center gap-1 transition-colors active:text-wilde-black">
                          <IonIcon icon={heartOutline} aria-hidden="true" />
                          {formatCount(p.likeCount ?? 0)}
                        </button>
                        <button
                          onClick={() => setOpenComments(id => (id === p.id ? null : p.id))}
                          aria-expanded={openComments === p.id}
                          aria-label={`${openComments === p.id ? 'Hide' : 'Show'} comments. ${p.commentCount ?? 0} so far.`}
                          className="flex items-center gap-1 transition-colors active:text-wilde-black">
                          <IonIcon icon={chatbubbleOutline} aria-hidden="true" />
                          {formatCount(p.commentCount ?? 0)}
                        </button>
                      </div>

                      {openComments === p.id && <CommentThread postId={p.id} />}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'Groups' && (
            isGroupsLoading ? (
              <SkeletonScreen label="groups"><ListRowSkeleton count={4} thumb={false} /></SkeletonScreen>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-wilde-muted">No groups yet.</p>
                <p className="text-xs text-wilde-muted mt-1">Use the + button to start one.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 animate-fade-in">
                {groups.map(g => {
                  const isJoined = joinedGroupIds.has(g.id);
                  return (
                    <div key={g.id} className="border border-wilde-border rounded-xl p-3 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <IonIcon icon={peopleOutline} aria-hidden="true" className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{g.name}</p>
                        {g.description && (
                          <p className="text-xs text-wilde-muted mt-0.5 line-clamp-2">{g.description}</p>
                        )}
                        <p className="text-xs text-wilde-muted mt-1">
                          {formatCount(g.memberCount ?? 0)} member{g.memberCount === 1 ? '' : 's'}
                        </p>
                      </div>
                      <button onClick={() => toggleMembership(g.id)}
                        aria-pressed={isJoined}
                        className={'text-xs rounded-md px-3 py-1.5 shrink-0 transition-colors ' +
                          (isJoined ? 'border border-wilde-border' : 'bg-wilde-black text-white')}>
                        {isJoined ? 'Joined' : 'Join'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </IonContent>

      <NewGroupModal isOpen={isGroupModalOpen} onClose={() => setGroupModalOpen(false)}
        onCreate={createGroup} isCreating={isCreating} />
    </IonPage>
  );
};

export default CommunityPage;
