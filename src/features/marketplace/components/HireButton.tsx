import React, { useState } from 'react';
import { IonModal, IonContent } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useHireRequest } from '@/features/marketplace/hooks/useHireRequest';
import { useAuthStore } from '@/store/slices/authStore';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';

interface Props {
  toUserId: string;
  /** What the approach is about — a service listing, or the creative's name. */
  subject: string;
  className?: string;
}

/**
 * Opens a short message composer rather than the visitor's mail app. The old
 * `mailto:` version required the recipient's email address to be publicly
 * readable, which is exactly what we stopped storing.
 */
const HireButton: React.FC<Props> = ({ toUserId, subject, className }) => {
  const { user } = useAuthStore();
  const { sendHireRequest, isPending } = useHireRequest();
  const [isOpen, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Approaching yourself is never meaningful.
  if (user?.uid === toUserId) return null;

  const handleSend = () => {
    sendHireRequest({ toUserId, subject, message: message.trim() });
    setMessage('');
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={className ?? 'text-xs border border-wilde-black rounded-md px-3 py-1.5 transition-colors active:bg-gray-50'}>
        Hire
      </button>

      <IonModal isOpen={isOpen} onDidDismiss={() => setOpen(false)}
        initialBreakpoint={0.55} breakpoints={[0, 0.55]}>
        <IonContent className="ion-padding">
          <div className="flex items-center justify-between mb-4">
            <IconButton icon={closeOutline} label="Close" onClick={() => setOpen(false)} />
            <h2 className="font-bold">Get in touch</h2>
            <span className="min-w-11" />
          </div>

          <p className="text-xs text-wilde-muted mb-3">
            About <span className="font-semibold text-wilde-black">{subject}</span>. They'll see
            this in their notifications.
          </p>

          <label htmlFor="hire-message" className="text-xs font-semibold mb-1 block">
            Message <span className="font-normal text-wilde-muted">(optional)</span>
          </label>
          <textarea id="hire-message" value={message} onChange={e => setMessage(e.target.value)}
            rows={4} placeholder="What do you have in mind?"
            className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm resize-none mb-4" />

          <Button expand="block" isLoading={isPending} onClick={handleSend}>
            Send Request
          </Button>
        </IonContent>
      </IonModal>
    </>
  );
};

export default HireButton;
