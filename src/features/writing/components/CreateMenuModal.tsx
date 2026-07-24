import React from 'react';
import { IonModal, IonContent, IonIcon } from '@ionic/react';
import {
  createOutline, filmOutline, ticketOutline, pencilOutline,
  bookOutline, closeOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { createDocument } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { ROUTES } from '@/constants';
import { Collections } from '@/firebase/firestore.helpers';

const OPTIONS = [
  { icon: createOutline,   label: 'Write Story',       type: 'short_story' },
  { icon: filmOutline,     label: 'Create Screenplay', type: 'screenplay' },
  { icon: ticketOutline,   label: 'Create Play',       type: 'playlet' },
  { icon: pencilOutline,   label: 'Write Poetry',      type: 'poetry' },
  { icon: bookOutline,     label: 'Long Work',         type: 'long_work' },
];

interface Props { isOpen: boolean; onClose: () => void; }

const CreateMenuModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const history = useHistory();

  const handleSelect = async (type: string) => {
    onClose();
    if (!user) return;
    const id = await createDocument(Collections.WORKS, {
      authorId: user.uid, title: 'Untitled', type,
      status: 'draft', viewCount: 0, likeCount: 0, tags: [], isPremium: false,
    });
    history.push(ROUTES.WRITING_STUDIO.replace(':workId', id));
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.6} breakpoints={[0, 0.6]}>
      <IonContent className="ion-padding">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose}
            aria-label="Close"
            className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-gray-100">
            <IonIcon icon={closeOutline} aria-hidden="true" />
          </button>
          <h2 className="font-bold">Create Something</h2>
          <span className="min-w-11" />
        </div>
        {OPTIONS.map(opt => (
          <button key={opt.type} onClick={() => handleSelect(opt.type)}
            className="flex items-center justify-between w-full py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <IonIcon icon={opt.icon} aria-hidden="true" className="text-lg" />
              <span className="text-sm font-medium">{opt.label}</span>
            </div>
            <IonIcon icon={chevronForwardOutline} aria-hidden="true" className="text-gray-500" />
          </button>
        ))}
      </IonContent>
    </IonModal>
  );
};

export default CreateMenuModal;
