import React, { useState } from 'react';
import { IonPage, IonContent, IonSearchbar, IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useExplore } from '@/features/explore/hooks/useExplore';
import WorkCard from '@/components/ui/WorkCard';
import Avatar from '@/components/ui/Avatar';
import { ROUTES } from '@/constants';
import { formatCount } from '@/utils';

const TABS = ['All', 'Stories', 'Screenplays', 'Poetry', 'Creators'];

const ExplorePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [query, setQuery] = useState('');
  const { works, creators, isLoading } = useExplore(query, activeTab);
  const history = useHistory();

  const isEmpty = activeTab === 'Creators' ? creators.length === 0 : works.length === 0;

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <h1 className="font-bold text-lg mb-3">Explore</h1>
          <IonSearchbar value={query} onIonChange={e => setQuery(e.detail.value ?? '')}
            placeholder="Search creators, works..." className="mb-3 p-0" />
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {TABS.map(tab => (
              <button key={tab}
                onClick={() => setActiveTab(tab)}
                className={'text-xs px-3 py-1.5 rounded-full border transition-colors ' +
                  (activeTab === tab ? 'bg-wilde-black text-white border-wilde-black' : 'border-wilde-border')}>
                {tab}
              </button>
            ))}
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <IonSpinner name="crescent" />
            </div>
          ) : isEmpty ? (
            <p className="text-sm text-wilde-muted text-center py-12">No results found.</p>
          ) : activeTab === 'Creators' ? (
            <div className="grid grid-cols-2 gap-3">
              {creators.map(creator => (
                <button key={creator.id}
                  onClick={() => history.push(ROUTES.CREATOR_PROFILE.replace(':uid', creator.id))}
                  className="flex flex-col items-center gap-1 p-3 border border-wilde-border rounded-lg">
                  <Avatar src={creator.photoURL} name={creator.displayName} size="lg" />
                  <span className="text-sm font-medium text-center">{creator.displayName}</span>
                  <span className="text-xs text-wilde-muted">{formatCount(creator.followersCount)} followers</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {works.map(item => (
                <WorkCard key={item.id} work={item} />
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ExplorePage;
