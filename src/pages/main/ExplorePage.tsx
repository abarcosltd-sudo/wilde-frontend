import React, { useState } from 'react';
import { IonPage, IonContent, IonSearchbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useExplore } from '@/features/explore/hooks/useExplore';
import WorkCard from '@/components/ui/WorkCard';
import Avatar from '@/components/ui/Avatar';
import {
  SkeletonScreen, WorkGridSkeleton, CreatorGridSkeleton,
} from '@/components/ui/Skeleton';
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
          <IonSearchbar value={query} onIonInput={e => setQuery(e.detail.value ?? '')}
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
            <SkeletonScreen label={activeTab === 'Creators' ? 'creators' : 'works'}>
              {activeTab === 'Creators' ? <CreatorGridSkeleton /> : <WorkGridSkeleton count={6} />}
            </SkeletonScreen>
          ) : isEmpty ? (
            <div className="text-center py-12">
              <p className="text-sm text-wilde-muted">
                {query ? `No results for "${query}".` : 'Nothing here yet.'}
              </p>
              {query && (
                <p className="text-xs text-wilde-muted mt-1">Try a different search or another tab.</p>
              )}
            </div>
          ) : activeTab === 'Creators' ? (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              {creators.map(creator => (
                <button key={creator.id}
                  onClick={() => history.push(ROUTES.CREATOR_PROFILE.replace(':uid', creator.id))}
                  className="flex flex-col items-center gap-1 p-3 border border-wilde-border rounded-lg
                    transition-colors active:bg-gray-50 focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-wilde-black">
                  <Avatar src={creator.photoURL} name={creator.displayName} size="lg" />
                  <span className="text-sm font-medium text-center">{creator.displayName}</span>
                  <span className="text-xs text-wilde-muted">{formatCount(creator.followersCount)} followers</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
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
