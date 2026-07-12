import React, { useState } from 'react';
import { IonPage, IonContent, IonSearchbar } from '@ionic/react';
import { useExplore } from '@/features/explore/hooks/useExplore';
import WorkCard from '@/components/ui/WorkCard';
import Avatar from '@/components/ui/Avatar';

const TABS = ['All', 'Stories', 'Screenplays', 'Poetry', 'Creators'];

const ExplorePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [query, setQuery] = useState('');
  const { results, isLoading } = useExplore(query, activeTab);

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <h1 className="font-bold text-lg mb-3">Explore</h1>
          <IonSearchbar value={query} onIonChange={e => setQuery(e.detail.value ?? '')}
            placeholder="Search creators, works..." className="mb-3 p-0" />
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {TABS.map(tab => (
              <button key={tab}
                onClick={() => setActiveTab(tab)}
                className={'text-xs px-3 py-1.5 rounded-full border transition-colors ' +
                  (activeTab === tab ? 'bg-wilde-black text-white border-wilde-black' : 'border-wilde-border')}>
                {tab}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {results.map(item => (
              <WorkCard key={item.id} work={item} />
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ExplorePage;
