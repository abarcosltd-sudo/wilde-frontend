import React from 'react';
import { IonPage, IonContent, IonRefresher, IonRefresherContent } from '@ionic/react';
import { searchOutline, notificationsOutline, peopleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import WorkCard from '@/components/ui/WorkCard';
import Avatar from '@/components/ui/Avatar';
import IconButton from '@/components/ui/IconButton';
import {
  SkeletonScreen, WorkGridSkeleton, CreatorRailSkeleton,
} from '@/components/ui/Skeleton';
import { ROUTES } from '@/constants';
import { formatCount } from '@/utils';

const HomePage: React.FC = () => {
  const { trending, feed, refresh, isLoading } = useHomeFeed();
  const { unreadCount } = useNotifications();
  const history = useHistory();

  return (
    <IonPage>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={async e => { await refresh(); e.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <img src="/wilde_logo2.png" alt="WILDE" className="w-8 h-8 object-contain" />
            <div className="flex gap-1">
              <IconButton icon={searchOutline} label="Search"
                onClick={() => history.push(ROUTES.EXPLORE)} />
              <IconButton icon={peopleOutline} label="Community"
                onClick={() => history.push(ROUTES.COMMUNITY)} />
              <IconButton icon={notificationsOutline} label="Notifications" badge={unreadCount}
                onClick={() => history.push(ROUTES.NOTIFICATIONS)} />
            </div>
          </div>

          <section>
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-sm">Trending Creatives</h2>
              <button onClick={() => history.push(ROUTES.EXPLORE)}
                className="text-xs text-wilde-muted underline">See all</button>
            </div>
            {isLoading ? (
              <SkeletonScreen label="trending creatives"><CreatorRailSkeleton /></SkeletonScreen>
            ) : trending.length === 0 ? (
              <p className="text-xs text-wilde-muted py-4">No creatives to show yet.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 animate-fade-in">
                {trending.map(creator => (
                  <button key={creator.id}
                    onClick={() => history.push(ROUTES.CREATOR_PROFILE.replace(':uid', creator.id))}
                    className="flex flex-col items-center gap-1 min-w-16 rounded-lg p-1 transition-colors
                      active:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wilde-black">
                    <Avatar src={creator.photoURL} name={creator.displayName} size="lg" />
                    <span className="text-xs font-medium text-center leading-tight">{creator.displayName}</span>
                    <span className="text-xs text-wilde-muted">{formatCount(creator.followersCount)}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="mt-4">
            <h2 className="font-bold text-sm mb-2">Recent Works</h2>
            {isLoading ? (
              <SkeletonScreen label="recent works"><WorkGridSkeleton count={4} /></SkeletonScreen>
            ) : feed.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-wilde-muted">Nothing published yet.</p>
                <p className="text-xs text-wilde-muted mt-1">
                  Works you and the creatives you follow publish will show up here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                {feed.map(work => (
                  <WorkCard key={work.id} work={work} />
                ))}
              </div>
            )}
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
