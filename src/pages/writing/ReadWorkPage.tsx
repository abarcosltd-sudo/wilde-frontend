import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonContent, IonIcon, IonSpinner } from '@ionic/react';
import { chevronBackOutline, lockClosedOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { getDocument, queryDocuments, Collections, where } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useBuyWork } from '@/features/marketplace/hooks/useBuyWork';
import { Work, User } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/utils';

const PREVIEW_RATIO = 0.5;

const ReadWorkPage: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const history = useHistory();
  const { user } = useAuthStore();
  const { buy, isBuying } = useBuyWork();

  const [work, setWork] = useState<Work | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const w = await getDocument<Work>(Collections.WORKS, workId);
      if (cancelled) return;
      setWork(w);

      if (w) {
        getDocument<User>(Collections.USERS, w.authorId).then(a => { if (!cancelled) setAuthor(a); });

        if (user && w.authorId !== user.id && (w.price ?? 0) > 0) {
          const orders = await queryDocuments(Collections.ORDERS, [
            where('workId', '==', workId),
            where('buyerId', '==', user.id),
            where('status', '==', 'completed'),
          ]);
          if (!cancelled) setHasPurchased(orders.length > 0);
        }
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [workId, user?.id]);

  const isOwner = !!user && work?.authorId === user.id;
  const isPaywalled = !!work && (work.price ?? 0) > 0 && !isOwner && !hasPurchased;
  const content = work?.content ?? '';
  const visibleContent = isPaywalled ? content.slice(0, Math.floor(content.length * PREVIEW_RATIO)) : content;

  const handleBuy = async () => {
    if (!work) return;
    const success = await buy(work);
    if (success) setHasPurchased(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className="flex items-center gap-2 px-4 py-2">
            <button onClick={() => history.goBack()}
              aria-label="Go back"
              className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-gray-100 shrink-0">
              <IonIcon icon={chevronBackOutline} aria-hidden="true" />
            </button>
            <h2 className="flex-1 text-center font-bold text-base truncate">{work?.title ?? 'Loading…'}</h2>
            <span className="min-w-11" />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <IonSpinner name="crescent" />
            </div>
          ) : !work ? (
            <p className="text-sm text-wilde-muted text-center py-12">This work could not be found.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Avatar src={author?.photoURL} name={author?.displayName} size="sm" />
                <span className="text-sm font-medium">{author?.displayName ?? '…'}</span>
              </div>
              {work.coverImageUrl && (
                <img src={work.coverImageUrl} alt={work.title}
                  className="w-full rounded-lg mb-4 object-cover max-h-72" />
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{visibleContent}</p>

              {isPaywalled && (
                <div className="relative -mt-20 pt-20 bg-gradient-to-t from-white via-white to-transparent">
                  <div className="border border-wilde-border rounded-xl p-4 text-center">
                    <IonIcon icon={lockClosedOutline} aria-hidden="true" className="text-2xl mb-2" />
                    <p className="font-bold text-sm mb-1">Continue reading "{work.title}"</p>
                    <p className="text-xs text-wilde-muted mb-3">
                      Unlock the full story for {formatCurrency(work.price ?? 0, work.currency)}
                    </p>
                    <Button expand="block" isLoading={isBuying} onClick={handleBuy}>
                      Unlock Full Story
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReadWorkPage;
