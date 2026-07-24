import React, { useEffect, useState } from 'react';
import { IonModal, IonContent, IonIcon, IonSearchbar } from '@ionic/react';
import { closeOutline, checkmarkCircle } from 'ionicons/icons';
import { queryDocuments, Collections, orderBy, limit } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { User } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedIds: string[];
  onSave: (users: User[]) => void;
}

const CollaboratorPickerModal: React.FC<Props> = ({ isOpen, onClose, initialSelectedIds, onSave }) => {
  const { user } = useAuthStore();
  const [candidates, setCandidates] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(initialSelectedIds);
    queryDocuments<User>(Collections.USERS, [orderBy('followersCount', 'desc'), limit(50)])
      .then(list => setCandidates(list.filter(u => u.id !== user?.id)));
  }, [isOpen]);

  const filtered = candidates.filter(u =>
    u.displayName?.toLowerCase().includes(query.toLowerCase()) ||
    u.username?.toLowerCase().includes(query.toLowerCase()));

  const toggle = (id: string) => {
    setSelectedIds(ids => (ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]));
  };

  const handleSave = () => {
    onSave(candidates.filter(u => selectedIds.includes(u.id)));
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.75} breakpoints={[0, 0.75]}>
      <IonContent className="ion-padding">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose}
            aria-label="Close"
            className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-gray-100">
            <IonIcon icon={closeOutline} aria-hidden="true" />
          </button>
          <h2 className="font-bold">Invite Collaborators</h2>
          <span className="min-w-11" />
        </div>
        <IonSearchbar value={query} onIonChange={e => setQuery(e.detail.value ?? '')}
          placeholder="Search people…" className="mb-2 p-0" />
        <div className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
          {filtered.map(u => (
            <button key={u.id} type="button" onClick={() => toggle(u.id)}
              className="flex items-center justify-between w-full py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Avatar name={u.displayName} src={u.photoURL} size="sm" />
                <div className="text-left">
                  <p className="text-sm font-semibold">{u.displayName}</p>
                  <p className="text-xs text-wilde-muted">@{u.username}</p>
                </div>
              </div>
              {selectedIds.includes(u.id) && (
                <IonIcon icon={checkmarkCircle} aria-hidden="true" className="text-lg text-wilde-black" />
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-wilde-muted text-center py-8">No creators found.</p>
          )}
        </div>
        <Button expand="block" className="mt-4" onClick={handleSave}>
          {selectedIds.length > 0 ? `Invite ${selectedIds.length}` : 'Done'}
        </Button>
      </IonContent>
    </IonModal>
  );
};

export default CollaboratorPickerModal;
