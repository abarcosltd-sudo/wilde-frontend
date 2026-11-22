import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Work } from '@/types';
import { formatTimeShort } from '@/utils';
import { toPlainText } from '@/utils/richText';
import { FORMATS } from '@/utils/formats';
import { ROUTES } from '@/constants';

interface Props {
  work: Work;
  onDelete: (work: Work) => void;
  /** True while this draft's delete is in flight, so it can't be tapped twice. */
  isDeleting?: boolean;
}

/**
 * A draft on the owner's profile: a "Draft" badge and when it was last touched,
 * a preview shaped to its format, and a delete button.
 *
 * The card and the delete button are siblings, not nested. A button inside a
 * button is invalid, and nesting would make a tap on the bin also open the draft.
 */
const DraftCard: React.FC<Props> = ({ work, onDelete, isDeleting }) => {
  const history = useHistory();
  const fmt = FORMATS[work.type];
  const [hasImageError, setImageError] = useState(false);
  useEffect(() => { setImageError(false); }, [work.coverImageUrl]);

  const preview = toPlainText(work.excerpt || work.content || '');
  const hasCover = !!work.coverImageUrl && !hasImageError;
  const isUntitled = !work.title || work.title === 'Untitled';

  return (
    <article className={`relative flex flex-col rounded-2xl border border-wilde-border p-3 min-h-[188px]
      ${hasCover ? fmt.tint : 'bg-wilde-panel'} ${isDeleting ? 'opacity-50' : ''}`}>
      <button type="button"
        onClick={() => history.push(ROUTES.WRITING_STUDIO.replace(':workId', work.id))}
        aria-label={`Continue editing ${isUntitled ? `untitled ${fmt.label.toLowerCase()}` : work.title}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-brand-strong" />

      <div className="relative flex items-center justify-between pointer-events-none">
        <span className="rounded-md border border-wilde-border bg-wilde-panel px-2 py-0.5 text-[13px] font-medium">
          Draft
        </span>
        <span className="text-[13px] text-wilde-muted">{formatTimeShort(work.updatedAt ?? work.createdAt)}</span>
      </div>

      <div className="relative flex-1 flex items-center justify-center my-3 pointer-events-none min-h-0">
        {hasCover ? (
          <img src={work.coverImageUrl} alt="" loading="lazy" decoding="async"
            onError={() => setImageError(true)} className="max-h-24 max-w-full rounded-md object-contain" />
        ) : (
          <div className="w-full">
            <p className={`font-display text-lg font-semibold leading-tight line-clamp-2
              ${isUntitled ? 'text-wilde-muted' : ''}`}>
              {isUntitled ? 'Untitled' : work.title}
            </p>
            {preview && (
              <p className="font-display text-[15px] leading-snug text-wilde-muted mt-1 line-clamp-3 whitespace-pre-line">
                {preview}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="relative flex items-end justify-between gap-2">
        <span className={`text-[13px] font-medium pointer-events-none ${fmt.text}`}>{fmt.label}</span>
        <button type="button" onClick={() => onDelete(work)} disabled={isDeleting}
          aria-label={`Delete draft ${isUntitled ? `untitled ${fmt.label.toLowerCase()}` : work.title}`}
          className="h-10 w-10 shrink-0 rounded-full border border-wilde-border bg-wilde-panel flex items-center
            justify-center text-lg transition-colors active:bg-wilde-subtle disabled:opacity-40
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong">
          <IonIcon icon={trashOutline} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};

export default DraftCard;
