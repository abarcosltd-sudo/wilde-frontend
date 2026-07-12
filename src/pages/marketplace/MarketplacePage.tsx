import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { cartOutline, imageOutline } from 'ionicons/icons';
import { useMarketplace } from '@/features/marketplace/hooks/useMarketplace';
import { formatCurrency } from '@/utils';

const TABS = ['Featured', 'Books', 'Art', 'Services'];

const MarketplacePage: React.FC = () => {
  const [tab, setTab] = useState('Featured');
  const { works, listings } = useMarketplace(tab);

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-black">WILDE MARKET</h1>
            <IonIcon icon={cartOutline} aria-hidden="true" className="text-xl" />
          </div>
          <div className="flex gap-2 border-b border-wilde-border pb-3 mb-4">
            {TABS.map(t => (
              <button key={t}
                onClick={() => setTab(t)}
                className={'text-xs px-3 py-1.5 rounded-full ' +
                  (tab === t ? 'bg-wilde-black text-white' : 'border border-wilde-border')}>
                {t}
              </button>
            ))}
          </div>
          {tab !== 'Services' && (
            <>
              <h3 className="text-sm font-bold mb-2">Featured Works</h3>
              {works.map(w => (
                <div key={w.id} className="flex items-center gap-3 py-3 border-b border-wilde-border">
                  <div className="w-12 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                    <IonIcon icon={imageOutline} aria-hidden="true" className="text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{w.title}</p>
                    <p className="text-xs text-wilde-muted">by {w.authorId}</p>
                    <p className="text-sm font-bold">{formatCurrency(w.price ?? 0, w.currency)}</p>
                  </div>
                  <button className="text-xs bg-wilde-black text-white px-3 py-1.5 rounded-md">Buy</button>
                </div>
              ))}
            </>
          )}
          {tab === 'Services' && (
            <>
              <h3 className="text-sm font-bold mb-2">Services</h3>
              {listings.map(l => (
                <div key={l.id} className="flex items-center gap-3 py-3 border-b border-wilde-border">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{l.title}</p>
                    <p className="text-xs text-wilde-muted">{formatCurrency(l.pricePerProject, l.currency)} / project</p>
                  </div>
                  <button className="text-xs border border-wilde-black rounded-md px-3 py-1.5">Hire</button>
                </div>
              ))}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MarketplacePage;
