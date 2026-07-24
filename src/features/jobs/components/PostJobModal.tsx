import React, { useState } from 'react';
import { IonModal, IonContent, IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { createDocument, Collections } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import Button from '@/components/ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPosted: () => void;
}

const PostJobModal: React.FC<Props> = ({ isOpen, onClose, onPosted }) => {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [neededRole, setNeededRole] = useState('');
  const [budget, setBudget] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const canSubmit = title.trim() && neededRole.trim() && Number(budget) > 0;

  const handlePost = async () => {
    if (!user || !canSubmit) return;
    setIsPosting(true);
    try {
      await createDocument(Collections.JOBS, {
        posterId: user.uid,
        title: title.trim(),
        description: '',
        neededRole: neededRole.trim(),
        budget: Number(budget),
        currency: 'NGN',
        applicantCount: 0,
      });
      setTitle(''); setNeededRole(''); setBudget('');
      onPosted();
      onClose();
    } finally {
      setIsPosting(false);
    }
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
          <h2 className="font-bold">Post a Job</h2>
          <span className="min-w-11" />
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-wilde-muted mb-1 block">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ghostwriter for a short story"
              className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-wilde-muted mb-1 block">Role needed</label>
            <input value={neededRole} onChange={e => setNeededRole(e.target.value)}
              placeholder="Writer"
              className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-wilde-muted mb-1 block">Budget (₦)</label>
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
              placeholder="20000"
              className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <Button expand="block" isLoading={isPosting} disabled={!canSubmit} onClick={handlePost}>
            Post Job
          </Button>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PostJobModal;
