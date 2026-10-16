import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Work } from '@/types';
import { formatCurrency } from '@/utils';
import { FORMATS } from '@/utils/formats';
import { useUser } from '@/hooks/useUser';
import { ROUTES } from '@/constants';

/**
 * A marketplace tile: square media, then price, title and byline. The whole
 * tile opens the work, where the unlock button lives — a second buy button on
 * the tile would put a payment one mis-tap away in a dense grid.
 */
const MarketTile: React.FC<{ work: Work }> = ({ work }) => {
  const { user: author } = useUser(work.authorId);
  const history = useHistory();
  const [hasImageError, setImageError] = useState(false);
  const fmt = FORMATS[work.type];

  useEffect(() => { setImageError(false); }, [work.coverImageUrl]);

  return (
    <button onClick={() => history.push(ROUTES.READ_WORK.replace(':workId', work.id))}
      className="text-left block w-full self-start rounded-2xl focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-brand-strong focus-visible:ring-offset-2 focus-visible:ring-offset-wilde-surface">
      <div className={`aspect-square w-full rounded-2xl overflow-hidden flex items-center justify-center ${fmt.tint}`}>
        {work.coverImageUrl && !hasImageError ? (
          <img src={work.coverImageUrl} alt="" loading="lazy" decoding="async"
            onError={() => setImageError(true)} className="w-full h-full object-cover" />
        ) : (
          <IonIcon icon={fmt.icon} aria-hidden="true" className={`text-5xl ${fmt.text}`} />
        )}
      </div>
      <p className="mt-3 text-xl font-bold leading-none">{formatCurrency(work.price ?? 0, work.currency)}</p>
      <p className="mt-1.5 text-[15px] font-medium leading-snug line-clamp-2">{work.title}</p>
      <p className="mt-0.5 text-[13px] text-wilde-muted truncate">
        {author?.displayName ?? '…'} · {fmt.label}
      </p>
    </button>
  );
};

export default MarketTile;
