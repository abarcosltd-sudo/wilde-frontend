import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { heartOutline, heart, eyeOutline, chevronForwardOutline } from 'ionicons/icons';
import { Work } from '@/types';
import { formatCount, formatCurrency, formatTimeShort, truncate } from '@/utils';
import { FORMATS } from '@/utils/formats';
import { useUser } from '@/hooks/useUser';
import { useMyLikes, useToggleLike } from '@/hooks/useWorkLikes';
import { useBuyWork } from '@/features/marketplace/hooks/useBuyWork';
import { useAuthStore } from '@/store/slices/authStore';
import { ROUTES } from '@/constants';
import Avatar from './Avatar';
import FormatTag from './FormatTag';
import { Skeleton } from './Skeleton';

/**
 * One work as a post in the timeline: who made it, what kind of thing it is,
 * then the work itself shaped to its format — a painting is an image with a
 * price, a poem is its opening lines, a story or book is a cover and a way in.
 *
 * Only actions the app really has appear here (like, open, buy). Comments,
 * reposts, bookmarks and sharing are in the design but not built, and a button
 * that does nothing is worse than no button.
 */
const FeedPost: React.FC<{ work: Work }> = ({ work }) => {
  const { user: author, isLoading: isAuthorLoading } = useUser(work.authorId);
  const { user } = useAuthStore();
  const history = useHistory();
  const likedWorkIds = useMyLikes();
  const { toggleLike } = useToggleLike();
  const { buy, isBuying } = useBuyWork();
  const [hasImageError, setImageError] = useState(false);

  const fmt = FORMATS[work.type];
  const isLiked = likedWorkIds.has(work.id);
  const isOwn = user?.id === work.authorId;
  const isPriced = (work.price ?? 0) > 0;
  const showImage = !!work.coverImageUrl && !hasImageError;

  // A replaced cover keeps its storage path, so a stale error flag would pin
  // the fallback on after a good upload.
  useEffect(() => { setImageError(false); }, [work.coverImageUrl]);

  const open = () => {
    const route = isOwn ? ROUTES.WRITING_STUDIO : ROUTES.READ_WORK;
    history.push(route.replace(':workId', work.id));
  };

  const openAuthor = () => history.push(ROUTES.CREATOR_PROFILE.replace(':uid', work.authorId));

  const cover = (className: string) => (
    <div className={`${fmt.tint} overflow-hidden flex items-center justify-center ${className}`}>
      {showImage ? (
        <img src={work.coverImageUrl} alt={work.title} loading="lazy" decoding="async"
          onError={() => setImageError(true)} className="w-full h-full object-cover" />
      ) : (
        <IonIcon icon={fmt.icon} aria-hidden="true" className={`text-3xl ${fmt.text}`} />
      )}
    </div>
  );

  return (
    <article className="py-4 border-b border-wilde-border">
      <header className="flex items-center gap-3">
        <button onClick={openAuthor} aria-label={`Open ${author?.displayName ?? 'creator'}'s profile`}
          className="shrink-0 rounded-full">
          <Avatar src={author?.photoURL} name={author?.displayName} size="md" />
        </button>
        <div className="min-w-0 flex-1 text-[15px] leading-tight">
          {isAuthorLoading ? (
            <Skeleton className="h-3.5 w-40" />
          ) : (
            <p className="truncate">
              <span className="font-semibold">{author?.displayName ?? 'Unknown creator'}</span>
              <span className="text-wilde-muted">
                {author?.username ? ` @${author.username.replace(/^@/, '')}` : ''} · {formatTimeShort(work.createdAt)}
              </span>
            </p>
          )}
          <FormatTag type={work.type} note={isPriced && !isOwn ? 'for sale' : undefined}
            className="mt-1.5" />
        </div>
      </header>

      <div className="mt-3">
        {work.type === 'artwork' && (
          <>
            {work.excerpt && (
              <p className="text-[15px] leading-snug mb-3 text-pretty">{truncate(work.excerpt, 200)}</p>
            )}
            <div className="rounded-2xl border border-wilde-border overflow-hidden bg-wilde-panel">
              <button onClick={open} className="block w-full text-left" aria-label={`Open ${work.title}`}>
                {cover('w-full aspect-[4/3]')}
              </button>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[19px] font-semibold leading-tight truncate">{work.title}</p>
                  {isPriced && <p className="text-[13px] text-wilde-muted mt-0.5">Original</p>}
                </div>
                {isPriced && (
                  <span className="font-bold text-lg">{formatCurrency(work.price ?? 0, work.currency)}</span>
                )}
                {isPriced && !isOwn && (
                  <button onClick={() => buy(work)} disabled={isBuying}
                    className="bg-wilde-black text-wilde-on-ink rounded-full px-5 py-2.5 text-[15px]
                      font-semibold disabled:opacity-50">
                    Buy
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {work.type === 'poetry' && (
          <button onClick={open} className="block w-full text-left">
            <h3 className="font-display text-2xl font-semibold leading-tight text-pretty">{work.title}</h3>
            {work.excerpt && (
              <p className="font-display text-lg leading-snug text-wilde-muted mt-2 whitespace-pre-line line-clamp-4">
                {work.excerpt}
              </p>
            )}
            <span className="inline-flex items-center gap-0.5 mt-3 text-[15px] font-semibold text-brand">
              Read the full poem
              <IonIcon icon={chevronForwardOutline} aria-hidden="true" className="text-sm" />
            </span>
          </button>
        )}

        {work.type !== 'artwork' && work.type !== 'poetry' && (
          <>
            {work.excerpt && (
              <p className="text-[15px] leading-snug mb-3 text-pretty">{truncate(work.excerpt, 200)}</p>
            )}
            <div className="flex items-center gap-4 rounded-2xl border border-wilde-border bg-wilde-panel p-3">
              {cover('w-[72px] h-[100px] rounded-lg shrink-0')}
              <button onClick={open} className="min-w-0 flex-1 text-left">
                <p className="font-display text-xl font-semibold leading-tight text-pretty line-clamp-2">
                  {work.title}
                </p>
                <p className="text-[13px] text-wilde-muted mt-1">
                  {isPriced ? formatCurrency(work.price ?? 0, work.currency) : 'Free to read'}
                </p>
              </button>
              <button onClick={open}
                className="shrink-0 bg-brand-soft text-brand rounded-full px-5 py-2.5 text-[15px] font-semibold">
                Read
              </button>
            </div>
          </>
        )}
      </div>

      <footer className="flex items-center gap-5 mt-3 text-[15px] text-wilde-muted">
        <button
          onClick={() => toggleLike(work.id)}
          aria-pressed={isLiked}
          aria-label={`${isLiked ? 'Unlike' : 'Like'} ${work.title}. ${work.likeCount ?? 0} likes so far.`}
          className={'flex items-center gap-1.5 transition-colors ' +
            (isLiked ? 'text-fmt-artwork' : 'active:text-wilde-black')}>
          <IonIcon icon={isLiked ? heart : heartOutline} aria-hidden="true" className="text-xl" />
          {formatCount(work.likeCount ?? 0)}
        </button>
        <span className="flex items-center gap-1.5">
          <IonIcon icon={eyeOutline} aria-hidden="true" className="text-xl" />
          {formatCount(work.viewCount ?? 0)}
        </span>
      </footer>
    </article>
  );
};

export default FeedPost;
