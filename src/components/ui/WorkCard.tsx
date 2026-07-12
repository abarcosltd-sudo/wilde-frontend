import React from 'react';
import { IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { heartOutline, eyeOutline } from 'ionicons/icons';
import { Work } from '@/types';
import { formatCount, truncate } from '@/utils';

interface WorkCardProps {
  work: Work;
  onClick?: () => void;
}

const WorkCard: React.FC<WorkCardProps> = ({ work, onClick }) => (
  <IonCard button onClick={onClick} className="m-0 rounded-lg border border-wilde-border shadow-none">
    {work.coverImageUrl && (
      <div className="h-32 bg-gray-100 overflow-hidden">
        <img src={work.coverImageUrl} alt={work.title} className="w-full h-full object-cover" />
      </div>
    )}
    <IonCardContent className="p-3">
      <p className="text-xs text-wilde-muted uppercase tracking-wide">{work.type}</p>
      <h3 className="font-bold text-sm mt-0.5">{work.title}</h3>
      {work.excerpt && (
        <p className="text-xs text-wilde-muted mt-1 leading-relaxed">
          {truncate(work.excerpt, 80)}
        </p>
      )}
      <div className="flex gap-3 mt-2 text-xs text-wilde-muted">
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

export default WorkCard;
