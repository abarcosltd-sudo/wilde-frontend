import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonContent, IonIcon } from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { chevronBackOutline, lockClosedOutline, heart, heartOutline, eyeOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { getDocument, queryDocuments, Collections, where } from '@/firebase/firestore.helpers';
import { useWorkBody } from '@/features/writing/hooks/useWorkBody';
import { useAuthStore } from '@/store/slices/authStore';
import { useBuyWork } from '@/features/marketplace/hooks/useBuyWork';
import { useUser } from '@/hooks/useUser';
import { useMyLikes, useToggleLike } from '@/hooks/useWorkLikes';
import { useTrackView } from '@/hooks/useTrackView';
import { formatCount } from '@/utils';
import { Work } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { Skeleton, SkeletonScreen, ProseSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency, sanitizeHtml, truncateHtml } from '@/utils';

const PREVIEW_RATIO = 0.5;

const ReadWorkPage: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const history = useHistory();
  const { user } = useAuthStore();
  const { buy, isBuying } = useBuyWork();

  // Shares the `['work', id]` key with the Writing Studio and Collaboration
  // screens, so moving between them doesn't refetch the document.
  const { data: work, isPending: isLoading } = useQuery({
    queryKey: ['work', workId],
    queryFn: () => getDocument<Work>(Collections.WORKS, workId),
    enabled: !!workId,
  });

  const { user: author } = useUser(work?.authorId);
  const likedWorkIds = useMyLikes();
  const { toggleLike } = useToggleLike();
  const isLiked = !!work && likedWorkIds.has(work.id);

  // Records the read. No-ops for the author and for repeat views this session.
  useTrackView(work);

  const purchaseKey = ['purchased', workId, user?.id] as const;
  const isPriced = (work?.price ?? 0) > 0;
  const isOwner = !!user && work?.authorId === user.id;

  const { data: hasPurchased = false } = useQuery({
    queryKey: purchaseKey,
    queryFn: async () => {
      const orders = await queryDocuments(Collections.ORDERS, [
        where('workId', '==', workId),
        where('buyerId', '==', user!.id),
        where('status', '==', 'completed'),
      ]);
      return orders.length > 0;
    },
    enabled: !!user && !!work && !isOwner && isPriced,
  });

  const isPaywalled = !!work && isPriced && !isOwner && !hasPurchased;

  // Stitches a long work's chapters back together; returns `content` verbatim
  // for every other type.
  const content = useWorkBody(work);
  const visibleHtml = isPaywalled
    ? truncateHtml(content, Math.floor(content.length * PREVIEW_RATIO))
    : sanitizeHtml(content);

  // Hands off to the provider's checkout; the unlock is applied when the buyer
  // returns to PaymentCallbackPage, which reloads the app and re-reads Orders.
  const handleBuy = () => { if (work) void buy(work); };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className="flex items-center gap-2 px-4 py-2">
            <IconButton icon={chevronBackOutline} label="Go back" onClick={() => history.goBack()} />
            <h2 className="flex-1 text-center font-bold text-base truncate">
              {work?.title ?? (isLoading ? '' : 'Not found')}
            </h2>
            <span className="min-w-11" />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="p-4">
          {isLoading ? (
            <SkeletonScreen label="story">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton circle className="h-8 w-8" />
                <Skeleton className="h-3 w-28" />
              </div>
              <ProseSkeleton lines={10} />
            </SkeletonScreen>
          ) : !work ? (
            <p className="text-sm text-wilde-muted text-center py-12">This work could not be found.</p>
          ) : (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Avatar src={author?.photoURL} name={author?.displayName} size="sm" />
                <span className="text-sm font-medium">{author?.displayName ?? '…'}</span>

                <div className="flex items-center gap-3 ml-auto text-xs text-wilde-muted">
                  <button onClick={() => toggleLike(work.id)}
                    aria-pressed={isLiked}
                    aria-label={`${isLiked ? 'Unlike' : 'Like'} this work`}
                    className={'flex items-center gap-1 transition-colors ' +
                      (isLiked ? 'text-red-500 dark:text-red-400' : 'active:text-wilde-black')}>
                    <IonIcon icon={isLiked ? heart : heartOutline} aria-hidden="true" className="text-base" />
                    {formatCount(work.likeCount ?? 0)}
                  </button>
                  <span className="flex items-center gap-1">
                    <IonIcon icon={eyeOutline} aria-hidden="true" className="text-base" />
                    {formatCount(work.viewCount ?? 0)}
                  </span>
                </div>
              </div>
              {work.coverImageUrl && (
                <img src={work.coverImageUrl} alt={work.title}
                  className="w-full rounded-lg mb-4 object-cover max-h-72" />
              )}
              <div className="text-sm leading-relaxed whitespace-pre-wrap rich-text-content"
                dangerouslySetInnerHTML={{ __html: visibleHtml }} />

              {isPaywalled && (
                <div className="relative -mt-20 pt-20 bg-gradient-to-t from-wilde-surface via-wilde-surface to-transparent">
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
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReadWorkPage;
