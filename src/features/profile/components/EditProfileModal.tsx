import React, { useEffect, useRef, useState } from 'react';
import { IonModal, IonContent, IonIcon } from '@ionic/react';
import { closeOutline, cameraOutline, refreshOutline, alertCircleOutline } from 'ionicons/icons';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { getStoragePath } from '@/firebase/storage.helpers';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useFileDrag } from '@/hooks/useFileDrag';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Swal from '@/utils/swal';

interface Props { isOpen: boolean; onClose: () => void; }

/** Storage rules cap `avatars/{uid}` at 5MB, so anything larger is refused before it leaves. */
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

const EditProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, updateProfile, isSaving } = useSettings();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useFileUpload({
    path: () => getStoragePath.avatar(user!.uid),
    maxBytes: AVATAR_MAX_BYTES,
    onUploaded: setPhotoURL,
  });

  const drag = useFileDrag({
    accept: upload.accept,
    disabled: !user || upload.isBusy,
    onDrop: files => upload.select(files),
  });

  useEffect(() => {
    if (!isOpen || !user) return;
    setDisplayName(user.displayName ?? '');
    setBio(user.bio ?? '');
    setPhotoURL(user.photoURL ?? '');
  }, [isOpen, user]);

  // Cleared on close rather than open, so a photo picked and abandoned isn't
  // still on screen next time — and its object URL is released straight away.
  // `upload` is a fresh object each render but `reset` is stable, so depending
  // on the whole thing would re-run this on every render and wipe live state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!isOpen) upload.reset(); }, [isOpen]);

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    upload.select(e.target.files);
    e.target.value = '';
  };

  const handleSave = async () => {
    await updateProfile({ displayName: displayName.trim(), bio: bio.trim(), photoURL });
    await Swal.fire({ icon: 'success', title: 'Profile updated', timer: 1200, showConfirmButton: false });
    onClose();
  };

  // The just-picked file wins over the stored photo: it renders with no round
  // trip, so the user sees their choice while it is still uploading.
  const shownPhoto = upload.previewUrl ?? photoURL;
  const percent = Math.round(upload.progress * 100);

  const dragHint =
    drag.state === 'over'   ? 'Drop to use this photo' :
    drag.state === 'reject' ? "That file isn't an image" :
    drag.state === 'armed'  ? 'Drop it on the photo' :
    null;

  const statusHint =
    upload.status === 'uploading'  ? `Uploading… ${percent}%` :
    upload.status === 'finalizing' ? 'Finishing up…' :
    null;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.75} breakpoints={[0, 0.75]}>
      <IonContent className="ion-padding">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose}
            aria-label="Close"
            className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-wilde-subtle">
            <IonIcon icon={closeOutline} aria-hidden="true" />
          </button>
          <h2 className="font-bold">Edit Profile</h2>
          <span className="min-w-11" />
        </div>

        <div className="flex flex-col items-center gap-2 mb-6">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={handlePhotoChange} disabled={upload.isBusy} />

          {/* The drop target is the photo itself. Its handlers live on the
              wrapper rather than the button so the ring and progress arc, which
              ignore pointer events, are still inside the counted subtree. */}
          <div {...drag.handlers} className="relative">
            <button type="button" onClick={handlePickPhoto} disabled={upload.isBusy || !user}
              aria-label={shownPhoto ? 'Change profile photo' : 'Add a profile photo'}
              className="relative block rounded-full focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-gold-strong focus-visible:ring-offset-2
                focus-visible:ring-offset-wilde-panel">
              <Avatar src={shownPhoto} name={displayName} size="lg"
                className={'transition-opacity duration-200 ' + (upload.isBusy ? 'opacity-50' : '')} />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-wilde-black
                flex items-center justify-center">
                <IonIcon icon={cameraOutline} aria-hidden="true" className="text-wilde-on-ink text-xs" />
              </span>
            </button>

            {/* Pulses on an overlay ring rather than on the avatar: growing the
                avatar itself would shift its edges under a still pointer and
                fire drag events that aren't real. */}
            <span aria-hidden="true"
              className={'pointer-events-none absolute -inset-1 rounded-full transition-opacity duration-150 ' +
                (drag.state === 'over'
                  ? 'ring-2 ring-gold-strong opacity-100 motion-safe:animate-drop-pulse '
                  : drag.state === 'reject' ? 'ring-2 ring-red-400 opacity-100 '
                  : drag.state === 'armed'  ? 'ring-2 ring-gold-strong/40 opacity-100 '
                  : 'ring-0 opacity-0 ')} />

            {/* Real bytes, drawn as an arc around the photo. */}
            {upload.isBusy && (
              <svg viewBox="0 0 100 100"
                role="progressbar"
                aria-label="Uploading profile photo"
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
                className="pointer-events-none absolute -inset-1 -rotate-90 animate-fade-in-delayed">
                {/* Themed through the tokens rather than hex, so the track and
                    the arc don't stay light-mode colours after dark. */}
                <circle cx="50" cy="50" r="46" fill="none"
                  className="stroke-wilde-border" strokeWidth="4" />
                <circle cx="50" cy="50" r="46" fill="none" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - upload.progress)}
                  className="stroke-gold-strong transition-[stroke-dashoffset] duration-200 ease-out
                    motion-reduce:transition-none" />
              </svg>
            )}
          </div>

          <p role="status" aria-live="polite" className="text-xs text-wilde-muted text-center min-h-4">
            {statusHint ?? dragHint ?? 'Drag a photo here, or tap to choose'}
          </p>

          {/* Kept in the layout instead of a toast — a message that fades leaves
              nothing to retry from. */}
          {upload.status === 'error' && (
            <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 max-w-64 animate-fade-in">
              <IonIcon icon={alertCircleOutline} aria-hidden="true" className="text-sm shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="leading-snug">{upload.error}</p>
                <div className="flex gap-3 mt-1">
                  {upload.canRetry && (
                    <button type="button" onClick={upload.retry}
                      className="flex items-center gap-1 font-semibold underline underline-offset-2">
                      <IonIcon icon={refreshOutline} aria-hidden="true" />
                      Try again
                    </button>
                  )}
                  <button type="button" onClick={handlePickPhoto}
                    className="font-semibold underline underline-offset-2">
                    Choose a different file
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <label htmlFor="edit-display-name" className="text-xs text-wilde-muted mb-1 block">Display name</label>
        <input id="edit-display-name" value={displayName} onChange={e => setDisplayName(e.target.value)}
          className="w-full border border-wilde-border rounded-md px-3 py-2 text-sm mb-4" />

        <label htmlFor="edit-bio" className="text-xs text-wilde-muted mb-1 block">Bio</label>
        <textarea id="edit-bio" value={bio} onChange={e => setBio(e.target.value)} rows={3}
          className="w-full border border-wilde-border rounded-md px-3 py-2 text-sm resize-none mb-4" />

        {/* Saving mid-upload would store the old photo URL while the new one is
            still in flight, so the button waits for it. */}
        <Button expand="block" isLoading={isSaving} onClick={handleSave}
          disabled={!displayName.trim() || upload.isBusy}>
          Save Changes
        </Button>
      </IonContent>
    </IonModal>
  );
};

export default EditProfileModal;
