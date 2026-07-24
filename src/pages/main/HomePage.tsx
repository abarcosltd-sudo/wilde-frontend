import React from 'react';
import { IonPage, IonContent, IonRefresher, IonRefresherContent, IonIcon } from '@ionic/react';
import { searchOutline, notificationsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authStore';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import WorkCard from '@/components/ui/WorkCard';
import Avatar from '@/components/ui/Avatar';
import { ROUTES } from '@/constants';
import { formatCount } from '@/utils';

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const { trending, feed, refresh, isLoading } = useHomeFeed();
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
              <button onClick={() => history.push(ROUTES.EXPLORE)}
                aria-label="Search"
                className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-gray-100">
                <IonIcon icon={searchOutline} aria-hidden="true" />
              </button>
              <button onClick={() => history.push(ROUTES.NOTIFICATIONS)}
                aria-label="Notifications"
                className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-gray-100">
                <IonIcon icon={notificationsOutline} aria-hidden="true" />
              </button>
            </div>
          </div>

          <section>
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-sm">Trending Creatives</h2>
              <button onClick={() => history.push(ROUTES.EXPLORE)}
                className="text-xs text-wilde-muted underline">See all</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {trending.map(creator => (
                <button key={creator.id}
                  onClick={() => history.push(ROUTES.CREATOR_PROFILE.replace(':uid', creator.id))}
                  className="flex flex-col items-center gap-1 min-w-16">
                  <Avatar src={creator.photoURL} name={creator.displayName} size="lg" />
                  <span className="text-xs font-medium text-center leading-tight">{creator.displayName}</span>
                  <span className="text-xs text-wilde-muted">{formatCount(creator.followersCount)}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-4">
            <h2 className="font-bold text-sm mb-2">Recent Works</h2>
            <div className="grid grid-cols-2 gap-3">
              {feed.map(work => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
