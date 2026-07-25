import React, { useEffect, useState } from 'react';
import { IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  heartOutline, eyeOutline, createOutline, imagesOutline,
  filmOutline, ticketOutline, pencilOutline, bookOutline,
} from 'ionicons/icons';
import { Work, WorkType } from '@/types';
import { formatCount, truncate } from '@/utils';
import { useUser } from '@/hooks/useUser';
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
}

const WorkCard: React.FC<WorkCardProps> = ({ work, onClick }) => {
  const { user: author, isLoading: isAuthorLoading } = useUser(work.authorId);
  const history = useHistory();
  const { user } = useAuthStore();
  const [hasImageError, setImageError] = useState(false);

  // A new upload replaces the cover at the same storage path, so reset the
  // error flag when the URL changes rather than staying stuck on the fallback.
  useEffect(() => { setImageError(false); }, [work.coverImageUrl]);

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    const route = user?.id === work.authorId ? ROUTES.WRITING_STUDIO : ROUTES.READ_WORK;
    history.push(route.replace(':workId', work.id));
  };

  return (
    <IonCard button onClick={handleClick} className="m-0 rounded-lg border border-wilde-border shadow-none">
      <div className="h-32 bg-gray-100 overflow-hidden flex items-center justify-center">
        {work.coverImageUrl && !hasImageError ? (
          <img
            src={work.coverImageUrl}
            alt={work.title}
            // Feeds are long and thumbnail-heavy; only load what's in view.
            loading="lazy"
            decoding="async"
            // A deleted or unreachable upload falls back to the type icon rather
            // than leaving a broken-image glyph in the timeline.
            onError={() => setImageError(true)}
            className="w-full h-full object-cover" />
        ) : (
          <IonIcon icon={TYPE_ICONS[work.type]} aria-hidden="true" className="text-4xl text-gray-400" />
        )}
      </div>
      <IonCardContent className="p-3">
        <p className="text-xs text-wilde-muted uppercase tracking-wide">{work.type}</p>
        <h3 className="font-bold text-sm mt-0.5">{work.title}</h3>
        {work.excerpt && (
          <p className="text-xs text-wilde-muted mt-1 leading-relaxed">
            {truncate(work.excerpt, 80)}
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
          <span className="flex items-center gap-1">
            <IonIcon icon={heartOutline} aria-hidden="true" />
            {formatCount(work.likeCount)}
          </span>
          <span className="flex items-center gap-1">
            <IonIcon icon={eyeOutline} aria-hidden="true" />
            {formatCount(work.viewCount)}
          </span>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default WorkCard;
