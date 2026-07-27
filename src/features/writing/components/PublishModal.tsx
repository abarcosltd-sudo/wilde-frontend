import React, { useEffect, useState } from 'react';
import { IonModal, IonContent, IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { PublishPricing } from '@/features/writing/hooks/useWorkEditor';
import { CURRENCIES, MIN_PRICE } from '@/constants';
import { formatCurrency } from '@/utils';
import Button from '@/components/ui/Button';

type Currency = keyof typeof CURRENCIES;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Current values, so re-publishing a priced work doesn't reset it to free. */
  currentPrice?: number;
  currentCurrency?: Currency;
  isPublishing?: boolean;
  onConfirm: (pricing: PublishPricing) => void;
}

/**
 * Collects the price at publish time.
 *
 * Pricing lives here rather than in the editor because publishing is the moment
 * the decision takes effect: a work is listed in the marketplace exactly when it
 * is published with a price above zero, and paywalled by the same field. Putting
 * the control on a draft would imply the price does something before then.
 */
const PublishModal: React.FC<Props> = ({
  isOpen, onClose, currentPrice, currentCurrency, isPublishing, onConfirm,
}) => {
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('NGN');

  // Re-seed each time it opens, so it reflects the work as it stands rather
  // than whatever was typed the last time.
  useEffect(() => {
    if (!isOpen) return;
    const existing = currentPrice ?? 0;
    setIsPaid(existing > 0);
    setPrice(existing > 0 ? String(existing) : '');
    setCurrency(currentCurrency ?? 'NGN');
  }, [isOpen, currentPrice, currentCurrency]);

  const amount = Number(price);
  const minimum = MIN_PRICE[currency];
  const isBelowMinimum = isPaid && price !== '' && amount < minimum;
  const canPublish = !isPaid || (amount >= minimum);

  const handleConfirm = () =>
    onConfirm({ price: isPaid ? amount : 0, currency });

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.6} breakpoints={[0, 0.6]}>
      <IonContent className="ion-padding">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose}
            aria-label="Close"
            className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-wilde-subtle">
            <IonIcon icon={closeOutline} aria-hidden="true" />
          </button>
          <h2 className="font-bold">Publish</h2>
          <span className="min-w-11" />
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-wilde-muted">
            This will make your work visible to everyone on WILDE.
          </p>

          <fieldset>
            <legend className="text-xs text-wilde-muted mb-2">Availability</legend>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsPaid(false)}
                aria-pressed={!isPaid}
                className={'flex-1 text-sm py-2 rounded-lg border transition-colors ' +
                  (!isPaid ? 'bg-wilde-black text-wilde-on-ink border-wilde-black' : 'border-wilde-border')}>
                Free to read
              </button>
              <button type="button" onClick={() => setIsPaid(true)}
                aria-pressed={isPaid}
                className={'flex-1 text-sm py-2 rounded-lg border transition-colors ' +
                  (isPaid ? 'bg-wilde-black text-wilde-on-ink border-wilde-black' : 'border-wilde-border')}>
                Sell it
              </button>
            </div>
          </fieldset>

          {isPaid && (
            <div>
              <label htmlFor="work-price" className="text-xs text-wilde-muted mb-1 block">
                Price
              </label>
              <div className="flex gap-2">
                <select
                  aria-label="Currency"
                  value={currency}
                  onChange={e => setCurrency(e.target.value as Currency)}
                  className="border border-wilde-border rounded-lg px-3 py-2 text-sm">
                  {(Object.keys(CURRENCIES) as Currency[]).map(c => (
                    <option key={c} value={c}>{CURRENCIES[c]} {c}</option>
                  ))}
                </select>
                <input
                  id="work-price"
                  type="number"
                  inputMode="decimal"
                  min={minimum}
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder={String(minimum)}
                  aria-describedby="work-price-help"
                  className="flex-1 min-w-0 border border-wilde-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <p id="work-price-help"
                className={'text-xs mt-1 ' + (isBelowMinimum ? 'text-red-600 dark:text-red-400' : 'text-wilde-muted')}>
                {isBelowMinimum
                  ? `Minimum is ${formatCurrency(minimum, currency)} — below that, card payments are declined.`
                  : `Readers see about half the text free, then a prompt to unlock the rest. Minimum ${formatCurrency(minimum, currency)}.`}
              </p>
            </div>
          )}

          <Button expand="block" isLoading={isPublishing} disabled={!canPublish}
            onClick={handleConfirm}>
            {isPaid && amount >= minimum
              ? `Publish for ${formatCurrency(amount, currency)}`
              : 'Publish free'}
          </Button>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PublishModal;
