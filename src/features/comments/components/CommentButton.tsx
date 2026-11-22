import React from 'react';
import { IonIcon } from '@ionic/react';
import { chatbubbleOutline } from 'ionicons/icons';
import { useUiStore } from '@/store/slices/uiStore';
import { formatCount } from '@/utils';
import { Work } from '@/types';

/**
 * The comment button with its count. Opens the shared comments sheet. Renders
 * nothing for a work that is not published: comments on a draft are the
 * collaborators' private notes, handled on their own screen.
 */
const CommentButton: React.FC<{
  work: Pick<Work, 'id' | 'title' | 'status' | 'commentCount'>;
  iconClass?: string;
}> = ({ work, iconClass = 'text-xl' }) => {
  const openComments = useUiStore(s => s.openComments);
  if (work.status !== 'published') return null;
  const count = work.commentCount ?? 0;
  return (
    <button type="button" onClick={() => openComments(work.id)}
      aria-label={`Comments on ${work.title}. ${count} so far.`}
      className="flex items-center gap-1.5 transition-colors active:text-wilde-black rounded-md
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong">
      <IonIcon icon={chatbubbleOutline} aria-hidden="true" className={iconClass} />
      {formatCount(count)}
    </button>
  );
};

export default CommentButton;
