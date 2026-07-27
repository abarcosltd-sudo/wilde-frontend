import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Page } from './Page';
import { SkeletonScreen, WorkGridSkeleton } from '@/components/ui/Skeleton';

/**
 * Held up while a lazily-loaded route's chunk arrives.
 *
 * A skeleton rather than a spinner, for the same reason the rest of the app
 * uses skeletons: it holds roughly the shape of what is coming, so the page
 * doesn't jump when the real content lands. On a warm cache this is on screen
 * for a frame or two and is never really seen.
 */
const RouteFallback: React.FC = () => (
  <IonPage>
    <IonContent>
      <Page>
        <SkeletonScreen label="page">
          <WorkGridSkeleton count={4} />
        </SkeletonScreen>
      </Page>
    </IonContent>
  </IonPage>
);

export default RouteFallback;
