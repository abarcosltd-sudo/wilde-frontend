import React, { useEffect, useState } from 'react';
import { IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  heartOutline, eyeOutline, createOutline, imagesOutline,
  filmOutline, ticketOutline, pencilOutline, bookOutline,
} from 'ionicons/icons';
import { Work, WorkType, User } from '@/types';
import { formatCount, truncate } from '@/utils';
import { getDocument, Collections } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { ROUTES } from '@/constants';
import Avatar from './Avatar';

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
  const [author, setAuthor] = useState<User | null>(null);
  const history = useHistory();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!work.authorId) return;
    getDocument<User>(Collections.USERS, work.authorId).then(setAuthor);
  }, [work.authorId]);

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    const route = user?.id === work.authorId ? ROUTES.WRITING_STUDIO : ROUTES.READ_WORK;
    history.push(route.replace(':workId', work.id));
  };

  return (
    <IonCard button onClick={handleClick} className="m-0 rounded-lg border border-wilde-border shadow-none">
      <div className="h-32 bg-gray-100 overflow-hidden flex items-center justify-center">
        {work.coverImageUrl ? (
          <img src={work.coverImageUrl} alt={work.title} className="w-full h-full object-cover" />
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
          <Avatar src={author?.photoURL} name={author?.displayName} size="sm" />
          <span className="text-xs font-medium truncate">{author?.displayName ?? '…'}</span>
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
