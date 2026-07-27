import React, { useState } from 'react';
import { IonPage, IonContent, IonSearchbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useExplore } from '@/features/explore/hooks/useExplore';
import WorkGrid from '@/components/ui/WorkGrid';
import Avatar from '@/components/ui/Avatar';
import ErrorState from '@/components/ui/ErrorState';
import { Page, PageHeader } from '@/components/layout/Page';
import {
  SkeletonScreen, WorkGridSkeleton, CreatorGridSkeleton,
} from '@/components/ui/Skeleton';
import { ROUTES } from '@/constants';
import { formatCount } from '@/utils';

const TABS = ['All', 'Stories', 'Screenplays', 'Poetry', 'Creators'];

const ExplorePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [query, setQuery] = useState('');
  const { works, creators, isLoading, error, retry } = useExplore(query, activeTab);
  const history = useHistory();

  const isEmpty = activeTab === 'Creators' ? creators.length === 0 : works.length === 0;

  return (
    <IonPage>
      <IonContent>
        <Page>
          <PageHeader title="Explore" />
          <IonSearchbar value={query} onIonInput={e => setQuery(e.detail.value ?? '')}
            placeholder="Search creators, works..." className="mb-3 p-0" />
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4" role="tablist" aria-label="Browse by type">
            {TABS.map(tab => (
              <button key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={'text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0 ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-strong ' +
                  (activeTab === tab
                    ? 'bg-wilde-black text-wilde-on-ink border-wilde-black'
                    : 'border-wilde-border')}>
                {tab}
              </button>
            ))}
          </div>
          {isLoading ? (
            <SkeletonScreen label={activeTab === 'Creators' ? 'creators' : 'works'}>
              {activeTab === 'Creators' ? <CreatorGridSkeleton /> : <WorkGridSkeleton count={6} />}
            </SkeletonScreen>
          ) : error ? (
            // Distinct from the empty state below: "nothing here" is a claim
            // about the data, and it isn't true when the read never returned.
            <ErrorState label={activeTab === 'Creators' ? 'creators' : 'works'}
              error={error} onRetry={retry} />
          ) : isEmpty ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium">
                {query ? `No results for "${query}"` : 'Nothing here yet'}
              </p>
              {query && (
                <p className="text-xs text-wilde-muted mt-1">Try a different search or another tab.</p>
              )}
            </div>
          ) : activeTab === 'Creators' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-in">
              {creators.map(creator => (
                <button key={creator.id}
                  onClick={() => history.push(ROUTES.CREATOR_PROFILE.replace(':uid', creator.id))}
                  className="flex flex-col items-center gap-1 p-3 border border-wilde-border rounded-lg
                    transition-colors active:bg-wilde-subtle focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-gold-strong">
                  <Avatar src={creator.photoURL} name={creator.displayName} size="lg" />
                  <span className="text-sm font-medium text-center">{creator.displayName}</span>
                  <span className="text-xs text-wilde-muted">{formatCount(creator.followersCount)} followers</span>
                </button>
              ))}
            </div>
          ) : (
            // No bento here: a filtered result list has no lead item, so
            // doubling the first tile would just promote whatever sorted first.
            <WorkGrid works={works} />
          )}
        </Page>
      </IonContent>
    </IonPage>
  );
};

export default ExplorePage;
