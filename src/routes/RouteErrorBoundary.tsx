import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { cloudOfflineOutline, refreshOutline } from 'ionicons/icons';

/**
 * Catches a route that fails to load or render.
 *
 * Without a boundary here, a rejected `React.lazy` import unmounts the whole
 * tree and leaves a blank white page with nothing to act on. `lazyPage` already
 * reloads once to recover from a stale document; this is what the user sees if
 * that reload didn't help — a genuinely missing chunk, or an error thrown
 * inside the page module itself.
 *
 * A class component because error boundaries have no hooks equivalent.
 */

interface State { hasError: boolean }

class RouteErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // The only record of what actually broke, since the UI deliberately
    // doesn't show a stack trace.
    console.error('Route failed to load:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <IonPage>
        <IonContent>
          <div role="alert" className="flex flex-col items-center justify-center h-full px-8 text-center">
            <IonIcon icon={cloudOfflineOutline} aria-hidden="true" className="text-4xl text-wilde-muted" />
            <p className="text-base font-semibold mt-3">This page didn&apos;t load</p>
            <p className="text-sm text-wilde-muted mt-1 text-pretty">
              It may have been updated while you were here. Reloading usually fixes it.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold
                border border-wilde-border rounded-full px-5 py-2.5 transition-colors
                active:bg-wilde-subtle focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-gold-strong focus-visible:ring-offset-1
                focus-visible:ring-offset-wilde-surface"
            >
              <IonIcon icon={refreshOutline} aria-hidden="true" />
              Reload
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }
}

export default RouteErrorBoundary;
