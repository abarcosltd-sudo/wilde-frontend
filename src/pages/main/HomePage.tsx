import React from 'react';
import { IonPage, IonContent, IonRefresher, IonRefresherContent } from '@ionic/react';
import { searchOutline, notificationsOutline, peopleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useUiStore } from '@/store/slices/uiStore';
import WorkGrid from '@/components/ui/WorkGrid';
import Avatar from '@/components/ui/Avatar';
import IconButton from '@/components/ui/IconButton';
import ErrorState from '@/components/ui/ErrorState';
import { Page, PageHeader, Section } from '@/components/layout/Page';
import {
  SkeletonScreen, WorkGridSkeleton, CreatorRailSkeleton,
} from '@/components/ui/Skeleton';
import { ROUTES } from '@/constants';
import { formatCount } from '@/utils';

const HomePage: React.FC = () => {
  const {
    trending, feed, refresh, isLoading, feedError, trendingError, retryFeed, retryTrending,
  } = useHomeFeed();
  const { unreadCount } = useNotifications();
  const openCommandPalette = useUiStore(s => s.openCommandPalette);
  const history = useHistory();

  return (
    <IonPage>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={async e => { await refresh(); e.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>
        <Page>
          <PageHeader
            title="WILDE"
            actions={
              <>
                <IconButton icon={searchOutline} label="Search" onClick={openCommandPalette} />
                <IconButton icon={peopleOutline} label="Community"
                  onClick={() => history.push(ROUTES.COMMUNITY)} />
                <IconButton icon={notificationsOutline} label="Notifications" badge={unreadCount}
                  onClick={() => history.push(ROUTES.NOTIFICATIONS)} />
              </>
            } />

          <Section
            title="Trending Creatives"
            action={
              <button onClick={() => history.push(ROUTES.EXPLORE)}
                className="text-xs text-wilde-muted underline underline-offset-2">See all</button>
            }>
            {isLoading ? (
              <SkeletonScreen label="trending creatives"><CreatorRailSkeleton /></SkeletonScreen>
            ) : trendingError ? (
              // Inline: the rail failing shouldn't take a page-sized slot away
              // from the feed below, which may well have loaded fine.
              <ErrorState inline label="trending creatives" error={trendingError} onRetry={retryTrending} />
            ) : trending.length === 0 ? (
              <p className="text-xs text-wilde-muted py-4">No creatives to show yet.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 animate-fade-in">
                {trending.map(creator => (
                  <button key={creator.id}
                    onClick={() => history.push(ROUTES.CREATOR_PROFILE.replace(':uid', creator.id))}
                    className="flex flex-col items-center gap-1 min-w-16 rounded-lg p-1 transition-colors
                      active:bg-wilde-subtle focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-gold-strong">
                    <Avatar src={creator.photoURL} name={creator.displayName} size="lg" />
                    <span className="text-xs font-medium text-center leading-tight">{creator.displayName}</span>
                    <span className="text-xs text-wilde-muted">{formatCount(creator.followersCount)}</span>
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section title="Recent Works">
            {isLoading ? (
              <SkeletonScreen label="recent works"><WorkGridSkeleton count={4} /></SkeletonScreen>
            ) : feedError ? (
              <ErrorState label="your feed" error={feedError} onRetry={retryFeed} />
            ) : feed.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm font-medium">Nothing published yet</p>
                <p className="text-xs text-wilde-muted mt-1 text-pretty">
                  Works you and the creatives you follow publish will show up here.
                </p>
              </div>
            ) : (
              // The newest work leads at double width. This is the one list in
              // the app with a real lead item, so it's the only one that bentos.
              <WorkGrid works={feed} bento />
            )}
          </Section>
        </Page>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
