import React, { useEffect, useState } from 'react';
import { IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  heartOutline, heart, eyeOutline, createOutline, imagesOutline,
  filmOutline, ticketOutline, pencilOutline, bookOutline,
} from 'ionicons/icons';
import { Work, WorkType } from '@/types';
import { formatCount, truncate } from '@/utils';
import { useUser } from '@/hooks/useUser';
import { useMyLikes, useToggleLike } from '@/hooks/useWorkLikes';
import { useAuthStore } from '@/store/slices/authStore';
import { ROUTES } from '@/constants';
import Avatar from './Avatar';
import { Skeleton } from './Skeleton';

const TYPE_ICONS: Record<WorkType, string> = {
  short_story: createOutline,
  artwork:     imagesOutline,
  screenplay:  filmOutline,
  playlet:     ticketOutline,
  poetry:      pencilOutline,
  long_work:   bookOutline,
};

interface WorkCardProps {
  work: Work;
  onClick?: () => void;
  /**
   * `feature` is the wide tile in a bento grid: a taller cover and a larger
   * title, since it occupies twice the width and would otherwise look like a
   * normal card that got stretched.
   */
  size?: 'default' | 'feature';
}

const WorkCard: React.FC<WorkCardProps> = ({ work, onClick, size = 'default' }) => {
  const { user: author, isLoading: isAuthorLoading } = useUser(work.authorId);
  const history = useHistory();
  const { user } = useAuthStore();
  const [hasImageError, setImageError] = useState(false);
  // One cached lookup shared by every card, not a read per card.
  const likedWorkIds = useMyLikes();
  const { toggleLike } = useToggleLike();
  const isLiked = likedWorkIds.has(work.id);

  const isFeature = size === 'feature';

  // A new upload replaces the cover at the same storage path, so reset the
  // error flag when the URL changes rather than staying stuck on the fallback.
  useEffect(() => { setImageError(false); }, [work.coverImageUrl]);

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    const route = user?.id === work.authorId ? ROUTES.WRITING_STUDIO : ROUTES.READ_WORK;
    history.push(route.replace(':workId', work.id));
  };

  return (
    <IonCard button onClick={handleClick}
      // Depth in light, a rim in dark, and a gold hairline in both. The press
      // scale is `motion-safe` and tiny — a card is a big target, and anything
      // more than a percent or two reads as the layout breaking.
      className="m-0 rounded-lg border border-wilde-border ring-1 ring-gold/20 dark:ring-gold/25
        shadow-card dark:shadow-none transition-[box-shadow,transform]
        active:shadow-press motion-safe:active:scale-[0.99]
        motion-reduce:transition-none">
      <div className={'bg-wilde-sunken overflow-hidden flex items-center justify-center ' +
        (isFeature ? 'h-44 sm:h-52' : 'h-32')}>
        {work.coverImageUrl && !hasImageError ? (
          <img
            src={work.coverImageUrl}
            alt={work.title}
            // Feeds are long and thumbnail-heavy; only load what's in view. The
            // feature tile is the one thing above the fold worth fetching eagerly.
            loading={isFeature ? 'eager' : 'lazy'}
            decoding="async"
            // A deleted or unreachable upload falls back to the type icon rather
            // than leaving a broken-image glyph in the timeline.
            onError={() => setImageError(true)}
            className="w-full h-full object-cover" />
        ) : (
          <IonIcon icon={TYPE_ICONS[work.type]} aria-hidden="true" className="text-4xl text-wilde-muted" />
        )}
      </div>
      <IonCardContent className="p-3">
        <p className="text-xs text-wilde-muted uppercase tracking-wide">{work.type}</p>
        {/* The display face on titles is what makes a feed of writing read as
            writing rather than as a list of records. */}
        <h3 className={'font-display font-bold mt-0.5 tracking-tight text-pretty ' +
          (isFeature ? 'text-lg' : 'text-sm')}>
          {work.title}
        </h3>
        {work.excerpt && (
          <p className="text-xs text-wilde-muted mt-1 leading-relaxed">
            {truncate(work.excerpt, isFeature ? 160 : 80)}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-2">
          {isAuthorLoading ? (
            <>
              <Skeleton circle className="h-8 w-8 shrink-0" />
              <Skeleton className="h-2.5 w-20" />
            </>
          ) : (
            <>
              <Avatar src={author?.photoURL} name={author?.displayName} size="sm" />
              <span className="text-xs font-medium truncate">
                {author?.displayName ?? 'Unknown creator'}
              </span>
            </>
          )}
        </div>
        <div className="flex gap-3 mt-1.5 text-xs text-wilde-muted">
          <button
            onClick={e => {
              // The whole card is a link to the work; liking must not open it.
              e.stopPropagation();
              toggleLike(work.id);
            }}
            aria-pressed={isLiked}
            aria-label={`${isLiked ? 'Unlike' : 'Like'} ${work.title}`}
            className={'flex items-center gap-1 transition-colors ' +
              (isLiked ? 'text-red-500 dark:text-red-400' : 'active:text-wilde-black')}>
            <IonIcon icon={isLiked ? heart : heartOutline} aria-hidden="true" />
            {formatCount(work.likeCount ?? 0)}
          </button>
          <span className="flex items-center gap-1">
            <IonIcon icon={eyeOutline} aria-hidden="true" />
            {formatCount(work.viewCount ?? 0)}
          </span>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default WorkCard;
