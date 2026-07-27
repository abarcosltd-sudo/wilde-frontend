import React from 'react';
import { IonModal, IonContent, IonIcon } from '@ionic/react';
import {
  createOutline, filmOutline, ticketOutline, pencilOutline,
  bookOutline, imagesOutline, closeOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { useCreateWork } from '@/features/writing/hooks/useCreateWork';
import IconButton from '@/components/ui/IconButton';
import { WorkType } from '@/types';

const OPTIONS: { icon: string; label: string; type: WorkType }[] = [
  { icon: createOutline, label: 'Write Story',       type: 'short_story' },
  { icon: filmOutline,   label: 'Create Screenplay', type: 'screenplay' },
  { icon: ticketOutline, label: 'Create Play',       type: 'playlet' },
  { icon: pencilOutline, label: 'Write Poetry',      type: 'poetry' },
  { icon: bookOutline,   label: 'Long Work',         type: 'long_work' },
  // Was only offered by the now-removed `CreateMenuPage`, leaving no reachable
  // way to start an artwork.
  { icon: imagesOutline, label: 'Upload Artwork',    type: 'artwork' },
];

interface Props { isOpen: boolean; onClose: () => void; }

const CreateMenuModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createWork, isPending } = useCreateWork();

  const handleSelect = (type: WorkType) => {
    onClose();
    createWork(type);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.7} breakpoints={[0, 0.7]}>
      <IonContent className="ion-padding">
        <div className="flex items-center justify-between mb-4">
          <IconButton icon={closeOutline} label="Close" onClick={onClose} />
          <h2 className="font-bold">Create Something</h2>
          <span className="min-w-11" />
        </div>
        {OPTIONS.map(opt => (
          <button key={opt.type} onClick={() => handleSelect(opt.type)} disabled={isPending}
            className="flex items-center justify-between w-full py-4 border-b border-wilde-border
              transition-colors active:bg-wilde-subtle disabled:opacity-50">
            <div className="flex items-center gap-3">
              <IonIcon icon={opt.icon} aria-hidden="true" className="text-lg" />
              <span className="text-sm font-medium">{opt.label}</span>
            </div>
            <IonIcon icon={chevronForwardOutline} aria-hidden="true" className="text-wilde-muted" />
          </button>
        ))}
      </IonContent>
    </IonModal>
  );
};

export default CreateMenuModal;
