import React, { useState } from 'react';
import { PAGE_CLASS } from '@/components/layout/Page';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { imageOutline, briefcaseOutline, addOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useMarketplace } from '@/features/marketplace/hooks/useMarketplace';
import { useBuyWork } from '@/features/marketplace/hooks/useBuyWork';
import { useUser } from '@/hooks/useUser';
import IconButton from '@/components/ui/IconButton';
import HireButton from '@/features/marketplace/components/HireButton';
import OfferServiceModal from '@/features/marketplace/components/OfferServiceModal';
import { SkeletonScreen, ListRowSkeleton } from '@/components/ui/Skeleton';
import { ROUTES } from '@/constants';
import { formatCurrency } from '@/utils';

const TABS = ['Featured', 'Books', 'Art', 'Services'];

const AuthorName: React.FC<{ authorId: string }> = ({ authorId }) => {
  const { user: author } = useUser(authorId);
  return <>{author?.displayName ?? '…'}</>;
};

/** Row thumbnail: the work's cover if it has one, otherwise a placeholder. */
const WorkThumb: React.FC<{ src?: string; title: string }> = ({ src, title }) => {
  const [hasError, setError] = useState(false);
  return (
    <div className="w-12 h-10 bg-wilde-sunken rounded-md overflow-hidden flex items-center justify-center shrink-0">
      {src && !hasError ? (
        <img src={src} alt={title} loading="lazy" decoding="async"
          onError={() => setError(true)} className="w-full h-full object-cover" />
      ) : (
        <IonIcon icon={imageOutline} aria-hidden="true" className="text-wilde-muted" />
      )}
    </div>
  );
};

const MarketplacePage: React.FC = () => {
  const [tab, setTab] = useState('Featured');
  const { works, listings, isLoading } = useMarketplace(tab);
  const { buy, isBuying } = useBuyWork();
  const [isOfferOpen, setOfferOpen] = useState(false);
  const queryClient = useQueryClient();
  const history = useHistory();

  return (
    <IonPage>
      <IonContent>
        <div className={PAGE_CLASS}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-2xl font-black tracking-tight">WILDE MARKET</h1>
            {/* The cart icon that used to sit here was decorative — there is no
                cart flow, and purchases complete straight from the Buy button. */}
            <IconButton icon={briefcaseOutline} label="Creative Jobs"
              onClick={() => history.push(ROUTES.JOBS)} />
          </div>
          <div className="flex gap-2 border-b border-wilde-border pb-3 mb-4">
            {TABS.map(t => (
              <button key={t}
                onClick={() => setTab(t)}
                className={'text-xs px-3 py-1.5 rounded-full ' +
                  (tab === t ? 'bg-wilde-black text-wilde-on-ink' : 'border border-wilde-border')}>
                {t}
              </button>
            ))}
          </div>
          {isLoading && (
            <SkeletonScreen label={tab === 'Services' ? 'services' : 'works for sale'}>
              <ListRowSkeleton count={5} thumb={tab !== 'Services'} />
            </SkeletonScreen>
          )}

          {!isLoading && tab !== 'Services' && (
            <>
              <h3 className="text-sm font-bold mb-2">Featured Works</h3>
              {works.length === 0 && (
                <p className="text-sm text-wilde-muted text-center py-12">
                  Nothing for sale in {tab} yet.
                </p>
              )}
              {works.map(w => (
                <div key={w.id} className="flex items-center gap-3 py-3 border-b border-wilde-border">
                  <button onClick={() => history.push(ROUTES.READ_WORK.replace(':workId', w.id))}
                    className="flex items-center gap-3 flex-1 text-left">
                    <WorkThumb src={w.coverImageUrl} title={w.title} />
                    <div>
                      <p className="text-sm font-bold">{w.title}</p>
                      <p className="text-xs text-wilde-muted">by <AuthorName authorId={w.authorId} /></p>
                      <p className="text-sm font-bold">{formatCurrency(w.price ?? 0, w.currency)}</p>
                    </div>
                  </button>
                  <button disabled={isBuying} onClick={() => buy(w)}
                    className="text-xs bg-wilde-black text-wilde-on-ink px-3 py-1.5 rounded-md disabled:opacity-50">
                    Buy
                  </button>
                </div>
              ))}
            </>
          )}
          {!isLoading && tab === 'Services' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold">Services</h3>
                <button onClick={() => setOfferOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium border border-wilde-border
                    rounded-full px-3 py-1.5 active:bg-wilde-subtle">
                  <IonIcon icon={addOutline} aria-hidden="true" />
                  Offer a service
                </button>
              </div>
              {listings.length === 0 && (
                <p className="text-sm text-wilde-muted text-center py-12">
                  No services listed yet. Be the first.
                </p>
              )}
              {listings.map(l => (
                <div key={l.id} className="flex items-center gap-3 py-3 border-b border-wilde-border">
                  <div className="w-8 h-8 rounded-full bg-wilde-sunken" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{l.title}</p>
                    <p className="text-xs text-wilde-muted">{formatCurrency(l.pricePerProject, l.currency)} / project</p>
                  </div>
                  <HireButton toUserId={l.userId} subject={l.title} />
                </div>
              ))}
            </>
          )}
        </div>

        <OfferServiceModal
          isOpen={isOfferOpen}
          onClose={() => setOfferOpen(false)}
          onListed={() => queryClient.invalidateQueries({ queryKey: ['market-listings'] })} />
      </IonContent>
    </IonPage>
  );
};

export default MarketplacePage;
