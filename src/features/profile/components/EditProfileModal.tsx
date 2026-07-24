import React, { useEffect, useRef, useState } from 'react';
import { IonModal, IonContent, IonIcon, IonSpinner } from '@ionic/react';
import { closeOutline, cameraOutline } from 'ionicons/icons';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { uploadFile, getStoragePath } from '@/firebase/storage.helpers';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Swal from '@/utils/swal';

interface Props { isOpen: boolean; onClose: () => void; }

const EditProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, updateProfile, isSaving } = useSettings();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    setDisplayName(user.displayName ?? '');
    setBio(user.bio ?? '');
    setPhotoURL(user.photoURL ?? '');
  }, [isOpen, user]);

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(getStoragePath.avatar(user.uid), file);
      setPhotoURL(url);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    await updateProfile({ displayName: displayName.trim(), bio: bio.trim(), photoURL });
    await Swal.fire({ icon: 'success', title: 'Profile updated', timer: 1200, showConfirmButton: false });
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
          <h2 className="font-bold">Edit Profile</h2>
          <span className="min-w-11" />
        </div>

        <div className="flex flex-col items-center gap-2 mb-6">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <button type="button" onClick={handlePickPhoto} disabled={isUploading}
            aria-label="Change profile photo" className="relative">
            <Avatar src={photoURL} name={displayName} size="lg" />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-wilde-black flex items-center justify-center">
              {isUploading
                ? <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} />
                : <IonIcon icon={cameraOutline} aria-hidden="true" className="text-white text-xs" />}
            </span>
          </button>
        </div>

        <label htmlFor="edit-display-name" className="text-xs text-wilde-muted mb-1 block">Display name</label>
        <input id="edit-display-name" value={displayName} onChange={e => setDisplayName(e.target.value)}
          className="w-full border border-wilde-border rounded-md px-3 py-2 text-sm mb-4" />

        <label htmlFor="edit-bio" className="text-xs text-wilde-muted mb-1 block">Bio</label>
        <textarea id="edit-bio" value={bio} onChange={e => setBio(e.target.value)} rows={3}
          className="w-full border border-wilde-border rounded-md px-3 py-2 text-sm resize-none mb-4" />

        <Button expand="block" isLoading={isSaving} disabled={!displayName.trim()} onClick={handleSave}>
          Save Changes
        </Button>
      </IonContent>
    </IonModal>
  );
};

export default EditProfileModal;
