import React from 'react';
import { IonModal, IonContent, IonIcon } from '@ionic/react';
import { chevronForwardOutline, closeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useCreateWork } from '@/features/writing/hooks/useCreateWork';
import { useMyWorks } from '@/features/profile/hooks/useMyWorks';
import IconButton from '@/components/ui/IconButton';
import { ROUTES } from '@/constants';
import { formatTimeShort } from '@/utils';
import { FORMATS } from '@/utils/formats';
import { Work, WorkType } from '@/types';

/** What each format is for, in a few words. */
const OPTIONS: { type: WorkType; blurb: string }[] = [
  { type: 'long_work',   blurb: 'Chapter by chapter' },
  { type: 'short_story', blurb: 'One sitting, start to finish' },
  { type: 'poetry',      blurb: 'Stanzas and line breaks that stay put' },
  { type: 'artwork',     blurb: 'Show the piece and its story' },
  { type: 'screenplay',  blurb: 'Scenes, dialogue and action' },
  { type: 'playlet',     blurb: 'Acts and scenes for the stage' },
];

const MAX_DRAFTS = 3;

/** "2h ago", "3d ago", "just now" — and a plain date once it is a week old. */
const editedAgo = (value: Work['updatedAt']) => {
  const short = formatTimeShort(value);
  if (short === 'now') return 'just now';
  return /^\d+[mhd]$/.test(short) ? `${short} ago` : short;
};

interface Props { isOpen: boolean; onClose: () => void; }

const CreateMenuModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createWork, isPending } = useCreateWork();
  // Only fetched once the sheet is opened, so it costs nothing on app load.
  const { drafts } = useMyWorks(isOpen);
  const history = useHistory();

  const handleSelect = (type: WorkType) => {
    onClose();
    createWork(type);
  };

  const openDraft = (id: string) => {
    onClose();
    history.push(ROUTES.WRITING_STUDIO.replace(':workId', id));
  };

  const allDrafts = () => {
    onClose();
    history.push(`${ROUTES.PROFILE}?tab=drafts`);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonContent>
        <div className="mx-auto w-full max-w-xl px-4 pt-3 pb-8">
          <div className="flex items-center justify-between">
            <IconButton icon={closeOutline} label="Close" onClick={onClose} />
          </div>

          <h2 className="text-[34px] font-bold tracking-tight leading-none mt-2">Create</h2>
          <p className="text-[17px] text-wilde-muted mt-2">What are you making today?</p>

          <div className="grid grid-cols-2 gap-3 mt-5">
            {OPTIONS.map(opt => {
              const fmt = FORMATS[opt.type];
              return (
                <button key={opt.type} onClick={() => handleSelect(opt.type)} disabled={isPending}
                  className={`text-left rounded-3xl p-4 min-h-[150px] flex flex-col items-start gap-5
                    transition-opacity active:opacity-80 disabled:opacity-50 ${fmt.tint}`}>
                  <span className={`h-11 w-11 rounded-xl flex items-center justify-center text-2xl text-white ${fmt.solid}`}>
                    <IonIcon icon={fmt.icon} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-xl font-bold leading-tight">{fmt.label}</span>
                    <span className="block text-[15px] text-wilde-muted leading-snug mt-0.5">{opt.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {drafts.length > 0 && (
            <section className="mt-8" aria-label="Continue a draft">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold">Continue a draft</h3>
                <button onClick={allDrafts} className="text-[15px] font-semibold text-brand">All drafts</button>
              </div>
              <ul className="mt-2">
                {drafts.slice(0, MAX_DRAFTS).map(w => {
                  const fmt = FORMATS[w.type];
                  return (
                    <li key={w.id} className="border-b border-wilde-border last:border-b-0">
                      <button onClick={() => openDraft(w.id)}
                        className="flex items-center gap-4 w-full py-3 text-left">
                        <span className={`h-14 w-11 rounded-md flex items-center justify-center text-xl shrink-0 ${fmt.tint} ${fmt.text}`}>
                          <IonIcon icon={fmt.icon} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[17px] font-semibold leading-tight truncate">{w.title}</span>
                          <span className="block text-[15px] text-wilde-muted mt-0.5">
                            {fmt.label} · edited {editedAgo(w.updatedAt ?? w.createdAt)}
                          </span>
                        </span>
                        <IonIcon icon={chevronForwardOutline} aria-hidden="true" className="text-wilde-muted" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default CreateMenuModal;
