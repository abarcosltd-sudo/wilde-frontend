import React, { useMemo, useState } from 'react';
import { IonPage, IonContent, IonRefresher, IonRefresherContent } from '@ionic/react';
import { searchOutline, menuOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { useUiStore } from '@/store/slices/uiStore';
import FeedPost from '@/components/ui/FeedPost';
import FilterChips, { Chip } from '@/components/ui/FilterChips';
import Wordmark from '@/components/ui/Wordmark';
import Avatar from '@/components/ui/Avatar';
import IconButton from '@/components/ui/IconButton';
import ErrorState from '@/components/ui/ErrorState';
import { PAGE_CLASS } from '@/components/layout/Page';
import { SkeletonScreen, FeedSkeleton, CreatorRailSkeleton } from '@/components/ui/Skeleton';
import { ROUTES } from '@/constants';
import { formatCount } from '@/utils';
import { FORMAT_FILTERS } from '@/utils/formats';

const DOT: Record<string, string> = {
  books: 'bg-fmt-book', art: 'bg-fmt-artwork', poetry: 'bg-fmt-poem', stage: 'bg-fmt-stage',
};
const CHIPS: Chip[] = FORMAT_FILTERS.map(f => ({ id: f.id, label: f.label, dot: DOT[f.id] }));

const HomePage: React.FC = () => {
  const {
    trending, feed, refresh, isLoading, feedError, trendingError, retryFeed, retryTrending,
  } = useHomeFeed();
  const openSideMenu = useUiStore(s => s.openSideMenu);
  const history = useHistory();
  const [filter, setFilter] = useState('all');

  const visible = useMemo(() => {
    const types = FORMAT_FILTERS.find(f => f.id === filter)?.types;
    return types ? feed.filter(w => types.includes(w.type)) : feed;
  }, [feed, filter]);

  return (
    <IonPage>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={async e => { await refresh(); e.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>
        <div className={PAGE_CLASS}>
          <div className="mx-auto w-full max-w-xl">
            {/* Menu left, wordmark centred, search right, as in the design. The
                bell that used to sit here is the Activity tab now. */}
            <header className="grid grid-cols-[auto_1fr_auto] items-center mb-3 -mx-2">
              <IconButton icon={menuOutline} label="Menu" onClick={openSideMenu} />
              <h1 className="m-0 justify-self-center"><Wordmark /></h1>
              {/* Search lives on Explore, which has no tab of its own. */}
              <IconButton icon={searchOutline} label="Search"
                onClick={() => history.push(ROUTES.EXPLORE)} />
            </header>

            <FilterChips chips={CHIPS} value={filter} onChange={setFilter} label="Filter by format" />

            {isLoading ? (
              <div className="mt-4">
                <SkeletonScreen label="trending creatives"><CreatorRailSkeleton /></SkeletonScreen>
              </div>
            ) : trendingError ? (
              // Inline: the rail failing shouldn't take a page-sized slot away
              // from the feed below, which may well have loaded fine.
              <div className="mt-4">
                <ErrorState inline label="trending creatives" error={trendingError} onRetry={retryTrending} />
              </div>
            ) : trending.length > 0 && (
              <section aria-label="Trending creatives" className="mt-4 animate-fade-in">
                <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
                  {trending.map(creator => (
                    <button key={creator.id}
                      onClick={() => history.push(ROUTES.CREATOR_PROFILE.replace(':uid', creator.id))}
                      className="flex flex-col items-center gap-1 min-w-16 rounded-lg p-1 transition-colors
                        active:bg-wilde-subtle focus-visible:outline-none focus-visible:ring-2
                        focus-visible:ring-brand-strong">
                      <Avatar src={creator.photoURL} name={creator.displayName} size="lg" />
                      <span className="text-xs font-medium text-center leading-tight max-w-16 truncate">
                        {creator.displayName}
                      </span>
                      <span className="text-xs text-wilde-muted">{formatCount(creator.followersCount)}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-2" aria-label="Recent works">
              {isLoading ? (
                <SkeletonScreen label="recent works"><FeedSkeleton /></SkeletonScreen>
              ) : feedError ? (
                <ErrorState label="your feed" error={feedError} onRetry={retryFeed} />
              ) : visible.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-[15px] font-medium">
                    {feed.length === 0 ? 'Nothing published yet' : 'Nothing in this format yet'}
                  </p>
                  <p className="text-sm text-wilde-muted mt-1 text-pretty">
                    {feed.length === 0
                      ? 'Works you and the creatives you follow publish will show up here.'
                      : 'Try another format, or pull down to refresh.'}
                  </p>
                </div>
              ) : (
                <div className="animate-fade-in">
                  {visible.map(work => <FeedPost key={work.id} work={work} />)}
                </div>
              )}
            </section>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
