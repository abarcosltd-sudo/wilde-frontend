import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useCreatorProfile } from '@/features/profile/hooks/useCreatorProfile';
import Avatar from '@/components/ui/Avatar';
import WorkCard from '@/components/ui/WorkCard';
import { formatCount } from '@/utils';

const TABS = ['Portfolio', 'About', 'Reviews'];

const CreatorProfilePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const history = useHistory();
  const [tab, setTab] = useState('Portfolio');
  const { creator, works, follow, isFollowing } = useCreatorProfile(uid);

  if (!creator) return null;

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <button onClick={() => history.goBack()}
            aria-label="Go back"
            className="mb-4 min-w-11 min-h-11 flex items-center justify-center -ml-2 rounded-full active:bg-gray-100">
            <IonIcon icon={chevronBackOutline} aria-hidden="true" className="text-xl" />
          </button>
          <div className="flex flex-col items-center gap-2 mb-4">
            <Avatar src={creator.photoURL} name={creator.displayName} size="lg" />
            <h2 className="font-bold text-base">{creator.displayName}</h2>
            <p className="text-xs text-wilde-muted">{creator.roles.join(' · ')}</p>
            <div className="flex gap-4 text-xs">
              <span>Followers <strong>{formatCount(creator.followersCount)}</strong></span>
              <span>Following <strong>{formatCount(creator.followingCount)}</strong></span>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => follow()}
              className={'flex-1 rounded-lg py-2 text-sm font-medium ' +
                (isFollowing ? 'border border-wilde-border' : 'bg-wilde-black text-white')}>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button className="flex-1 border border-wilde-border rounded-lg py-2 text-sm font-medium">
              Hire
            </button>
          </div>
          <div className="flex border-b border-wilde-border mb-4">
            {TABS.map(t => (
              <button key={t}
                onClick={() => setTab(t)}
                className={'flex-1 text-center py-2 text-xs ' +
                  (tab === t ? 'font-bold border-b-2 border-wilde-black' : 'text-wilde-muted')}>
                {t}
              </button>
            ))}
          </div>
          {tab === 'Portfolio' && (
            <div className="grid grid-cols-2 gap-3">
              {works.map(w => <WorkCard key={w.id} work={w} />)}
            </div>
          )}
          {tab === 'About' && (
            <p className="text-sm leading-relaxed text-gray-600">{creator.bio}</p>
          )}
          {tab === 'Reviews' && (
            <p className="text-sm text-wilde-muted text-center mt-8">No reviews yet</p>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreatorProfilePage;
