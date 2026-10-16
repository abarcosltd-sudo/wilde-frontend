import React, { useMemo, useState } from 'react';
import { PAGE_CLASS } from '@/components/layout/Page';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { briefcaseOutline, addOutline, searchOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useMarketplace } from '@/features/marketplace/hooks/useMarketplace';
import { useUser } from '@/hooks/useUser';
import Avatar from '@/components/ui/Avatar';
import IconButton from '@/components/ui/IconButton';
import MarketTile from '@/components/ui/MarketTile';
import FilterChips, { Chip } from '@/components/ui/FilterChips';
import HireButton from '@/features/marketplace/components/HireButton';
import OfferServiceModal from '@/features/marketplace/components/OfferServiceModal';
import { SkeletonScreen, MarketGridSkeleton, ListRowSkeleton } from '@/components/ui/Skeleton';
import { ROUTES } from '@/constants';
import { formatCurrency } from '@/utils';
import { GhostwriterListing } from '@/types';

const CHIPS: Chip[] = [
  { id: 'All',      label: 'All' },
  { id: 'Books',    label: 'Books',    dot: 'bg-fmt-book' },
  { id: 'Art',      label: 'Art',      dot: 'bg-fmt-artwork' },
  { id: 'Poetry',   label: 'Poetry',   dot: 'bg-fmt-poem' },
  { id: 'Services', label: 'Services' },
];

const ServiceRow: React.FC<{ listing: GhostwriterListing }> = ({ listing }) => {
  const { user: seller } = useUser(listing.userId);
  return (
    <div className="flex items-center gap-3 py-4 border-b border-wilde-border">
      <Avatar src={seller?.photoURL} name={seller?.displayName} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-tight truncate">{listing.title}</p>
        <p className="text-[13px] text-wilde-muted mt-0.5 truncate">
          {seller?.displayName ?? '…'} · {formatCurrency(listing.pricePerProject, listing.currency)} / project
        </p>
      </div>
      <HireButton toUserId={listing.userId} subject={listing.title} />
    </div>
  );
};

const MarketplacePage: React.FC = () => {
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const { works, listings, isLoading } = useMarketplace(tab);
  const [isOfferOpen, setOfferOpen] = useState(false);
  const queryClient = useQueryClient();
  const history = useHistory();

  const isServices = tab === 'Services';
  const term = query.trim().toLowerCase();

  // Titles only: author names resolve one by one from the user cache, so they
  // aren't available to search across until each has loaded.
  const shownWorks = useMemo(
    () => (term ? works.filter(w => w.title.toLowerCase().includes(term)) : works),
    [works, term]);
  const shownListings = useMemo(
    () => (term ? listings.filter(l => l.title.toLowerCase().includes(term)) : listings),
    [listings, term]);

  return (
    <IonPage>
      <IonContent>
        <div className={PAGE_CLASS}>
          <header className="flex items-center justify-between mb-3">
            <h1 className="text-[34px] font-bold tracking-tight leading-none m-0">Marketplace</h1>
            {/* The cart that used to sit here was decorative — there is no cart
                flow, and purchases complete from the work itself. */}
            <IconButton icon={briefcaseOutline} label="Creative Jobs"
              onClick={() => history.push(ROUTES.JOBS)} />
          </header>

          <label className="flex items-center gap-3 rounded-2xl bg-wilde-subtle px-4 py-3 mb-3">
            <IonIcon icon={searchOutline} aria-hidden="true" className="text-xl text-wilde-muted" />
            <span className="sr-only">Search the marketplace</span>
            <input type="search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder={isServices ? 'Search services…' : 'Search by title…'}
              className="flex-1 min-w-0 text-[16px] outline-none bg-transparent" />
          </label>

          <FilterChips chips={CHIPS} value={tab} onChange={setTab} label="Filter the marketplace" />

          <div className="mt-5">
            {isLoading && (
              <SkeletonScreen label={isServices ? 'services' : 'works for sale'}>
                {isServices ? <ListRowSkeleton count={5} /> : <MarketGridSkeleton />}
              </SkeletonScreen>
            )}

            {!isLoading && !isServices && (
              shownWorks.length === 0 ? (
                <p className="text-[15px] text-wilde-muted text-center py-16">
                  {term ? `No results for "${query.trim()}".` : `Nothing for sale in ${tab} yet.`}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 animate-fade-in">
                  {shownWorks.map(w => <MarketTile key={w.id} work={w} />)}
                </div>
              )
            )}

            {!isLoading && isServices && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-[17px] font-semibold">Services</h2>
                  <button onClick={() => setOfferOpen(true)}
                    className="flex items-center gap-1 text-[15px] font-semibold border border-wilde-border
                      rounded-full px-4 py-2 active:bg-wilde-subtle">
                    <IonIcon icon={addOutline} aria-hidden="true" />
                    Offer a service
                  </button>
                </div>
                {shownListings.length === 0 ? (
                  <p className="text-[15px] text-wilde-muted text-center py-16">
                    {term ? `No results for "${query.trim()}".` : 'No services listed yet. Be the first.'}
                  </p>
                ) : shownListings.map(l => <ServiceRow key={l.id} listing={l} />)}
              </>
            )}
          </div>
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
