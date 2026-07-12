import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import {
  createOutline, imagesOutline, filmOutline, ticketOutline,
  pencilOutline, bookOutline, sparklesOutline, closeOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { createDocument } from '@/firebase/firestore.helpers';
import { Collections } from '@/constants';
import { useAuthStore } from '@/store/slices/authStore';

const CREATE_OPTIONS = [
  { icon: createOutline, label: 'Write Story',       type: 'short_story' },
  { icon: imagesOutline, label: 'Upload Artwork',    type: 'artwork' },
  { icon: filmOutline,   label: 'Create Screenplay', type: 'screenplay' },
  { icon: ticketOutline, label: 'Create Play',       type: 'playlet' },
  { icon: pencilOutline, label: 'Write Poetry',      type: 'poetry' },
  { icon: bookOutline,   label: 'Long Work',         type: 'long_work' },
];

const CreateMenuPage: React.FC = () => {
  const history = useHistory();
  const { user } = useAuthStore();

  const handleCreate = async (type: string) => {
    if (!user) return;
    const id = await createDocument(Collections.WORKS, {
      authorId: user.uid, title: 'Untitled', type,
      status: 'draft', viewCount: 0, likeCount: 0, tags: [], isPremium: false,
    });
    history.push(ROUTES.WRITING_STUDIO.replace(':workId', id));
  };

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => history.goBack()}
              aria-label="Close"
              className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-gray-100">
              <IonIcon icon={closeOutline} aria-hidden="true" />
            </button>
            <h2 className="font-bold">Create Something</h2>
            <span className="min-w-11" />
          </div>
          {CREATE_OPTIONS.map(opt => (
            <button key={opt.type}
              onClick={() => handleCreate(opt.type)}
              className="flex items-center justify-between w-full py-4 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <IonIcon icon={opt.icon} aria-hidden="true" className="text-lg" />
                <span className="text-sm font-medium">{opt.label}</span>
              </div>
              <IonIcon icon={chevronForwardOutline} aria-hidden="true" className="text-gray-500" />
            </button>
          ))}
          <button onClick={() => history.push(ROUTES.AI_ASSISTANT)}
            className="flex items-center justify-between w-full py-4">
            <div className="flex items-center gap-3">
              <IonIcon icon={sparklesOutline} aria-hidden="true" className="text-lg" />
              <span className="text-sm font-medium">AI Prompt</span>
            </div>
            <IonIcon icon={chevronForwardOutline} aria-hidden="true" className="text-gray-500" />
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreateMenuPage;
