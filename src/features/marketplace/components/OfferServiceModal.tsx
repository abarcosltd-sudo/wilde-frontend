import React, { useState } from 'react';
import { IonModal, IonContent, IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { createDocument, Collections } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { CURRENCIES, MIN_PRICE } from '@/constants';
import { formatCurrency } from '@/utils';
import Button from '@/components/ui/Button';

type Currency = keyof typeof CURRENCIES;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onListed: () => void;
}

/**
 * Creates a `GhostwriterListing` — the Services side of the marketplace.
 *
 * Written straight to Firestore like the rest of the app rather than through
 * the backend's `POST /api/market/listings`: the rules already scope create to
 * the owner, and there is no secret involved. (That endpoint exists and works,
 * but nothing has ever called it.)
 */
const OfferServiceModal: React.FC<Props> = ({ isOpen, onClose, onListed }) => {
  const { user } = useAuthStore();
  const showToast = useUiStore(s => s.showToast);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [isSaving, setSaving] = useState(false);

  const amount = Number(price);
  const minimum = MIN_PRICE[currency];
  const isBelowMinimum = price !== '' && amount < minimum;
  const canSubmit = !!title.trim() && amount >= minimum;

  const reset = () => {
    setTitle(''); setDescription(''); setSpecialties(''); setPrice(''); setCurrency('NGN');
  };

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSaving(true);
    try {
      await createDocument(Collections.GHOSTWRITER_LISTINGS, {
        userId: user.uid,
        title: title.trim(),
        description: description.trim(),
        // Free-text, comma-separated — blanks dropped so "a, , b" is two tags.
        specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
        pricePerProject: amount,
        currency,
        // The marketplace query filters on isActive and sorts by rating, so both
        // must exist from the start or the listing never appears.
        rating: 0,
        reviewCount: 0,
        isActive: true,
      });
      reset();
      onListed();
      onClose();
      showToast('Your service is live', 'success');
    } catch {
      showToast("Couldn't list that service. Please try again.", 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.85} breakpoints={[0, 0.85]}>
      <IonContent className="ion-padding">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose}
            aria-label="Close"
            className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-wilde-subtle">
            <IonIcon icon={closeOutline} aria-hidden="true" />
          </button>
          <h2 className="font-bold">Offer a Service</h2>
          <span className="min-w-11" />
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="svc-title" className="text-xs text-wilde-muted mb-1 block">Title</label>
            <input id="svc-title" value={title} onChange={e => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Ghostwriting for short fiction"
              className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label htmlFor="svc-desc" className="text-xs text-wilde-muted mb-1 block">
              What you offer
            </label>
            <textarea id="svc-desc" value={description} onChange={e => setDescription(e.target.value)}
              rows={3} maxLength={500}
              placeholder="What you'll deliver, how you work, typical turnaround…"
              className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm resize-none" />
          </div>

          <div>
            <label htmlFor="svc-tags" className="text-xs text-wilde-muted mb-1 block">
              Specialties
            </label>
            <input id="svc-tags" value={specialties} onChange={e => setSpecialties(e.target.value)}
              placeholder="Fiction, Screenwriting, Editing"
              aria-describedby="svc-tags-help"
              className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm" />
            <p id="svc-tags-help" className="text-xs text-wilde-muted mt-1">Separate with commas.</p>
          </div>

          <div>
            <label htmlFor="svc-price" className="text-xs text-wilde-muted mb-1 block">
              Price per project
            </label>
            <div className="flex gap-2">
              <select aria-label="Currency" value={currency}
                onChange={e => setCurrency(e.target.value as Currency)}
                className="border border-wilde-border rounded-lg px-3 py-2 text-sm">
                {(Object.keys(CURRENCIES) as Currency[]).map(c => (
                  <option key={c} value={c}>{CURRENCIES[c]} {c}</option>
                ))}
              </select>
              <input id="svc-price" type="number" inputMode="decimal" min={minimum}
                value={price} onChange={e => setPrice(e.target.value)}
                placeholder="20000"
                aria-describedby="svc-price-help"
                className="flex-1 min-w-0 border border-wilde-border rounded-lg px-3 py-2 text-sm" />
            </div>
            {isBelowMinimum && (
              <p id="svc-price-help" className="text-xs text-red-600 dark:text-red-400 mt-1">
                Minimum is {formatCurrency(minimum, currency)}.
              </p>
            )}
          </div>

          <Button expand="block" isLoading={isSaving} disabled={!canSubmit} onClick={handleSubmit}>
            List Service
          </Button>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default OfferServiceModal;
