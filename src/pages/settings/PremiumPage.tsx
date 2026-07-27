import React, { useState } from 'react';
import { PAGE_CLASS } from '@/components/layout/Page';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { chevronBackOutline, checkmarkCircle, starOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPremiumPricing, PaymentProvider } from '@/services/payment.service';
import { usePremium } from '@/features/premium/hooks/usePremium';
import { formatCurrency } from '@/utils';
import { apiErrorMessage } from '@/utils/apiError';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';

const BENEFITS = [
  'Unlimited AI writing prompts',
  'Export your work to PDF, Word and plain text',
  'A Premium badge on your creator profile',
  'Priority placement in Explore',
];

const PROVIDERS: { value: PaymentProvider; label: string }[] = [
  { value: 'paystack',    label: 'Paystack' },
  { value: 'flutterwave', label: 'Flutterwave' },
];

const PremiumPage: React.FC = () => {
  const history = useHistory();
  const { isPremium, upgrade, isPending } = usePremium();
  const [provider, setProvider] = useState<PaymentProvider>('paystack');

  // Quoted by the backend rather than hardcoded here, so the price on this
  // screen is the price that gets charged.
  const { data: pricing, isPending: isLoadingPrice, error } = useQuery({
    queryKey: ['premium-pricing'],
    queryFn: async () => (await getPremiumPricing()).data.data,
    enabled: !isPremium,
  });

  return (
    <IonPage>
      <IonContent>
        <div className={PAGE_CLASS}>
          <div className="flex items-center gap-2 mb-6">
            <IconButton icon={chevronBackOutline} label="Go back" onClick={() => history.goBack()} />
            <h1 className="font-display text-2xl font-bold tracking-tight">Premium</h1>
          </div>

          {isPremium ? (
            <div className="flex flex-col items-center text-center gap-3 py-10">
              <IonIcon icon={checkmarkCircle} aria-hidden="true" className="text-5xl text-green-600 dark:text-green-400" />
              <h2 className="font-bold">You're on Premium</h2>
              <p className="text-sm text-wilde-muted">Thanks for supporting WILDE.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center gap-2 mb-6">
                <IonIcon icon={starOutline} aria-hidden="true" className="text-4xl text-wilde-black" />
                <p className="text-2xl font-black">
                  {isLoadingPrice && '—'}
                  {pricing && formatCurrency(pricing.amount, pricing.currency)}
                </p>
                <p className="text-xs text-wilde-muted">one-off payment</p>
              </div>

              <ul className="flex flex-col gap-3 mb-8">
                {BENEFITS.map(benefit => (
                  <li key={benefit} className="flex items-start gap-2 text-sm">
                    <IonIcon icon={checkmarkCircle} aria-hidden="true"
                      className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <fieldset className="mb-6">
                <legend className="text-xs text-wilde-muted mb-2">Pay with</legend>
                <div className="flex gap-2">
                  {PROVIDERS.map(p => (
                    <button key={p.value} type="button"
                      onClick={() => setProvider(p.value)}
                      aria-pressed={provider === p.value}
                      className={'flex-1 text-sm py-2 rounded-lg border transition-colors ' +
                        (provider === p.value
                          ? 'bg-wilde-black text-wilde-on-ink border-wilde-black'
                          : 'border-wilde-border')}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {error && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-4">{apiErrorMessage(error)}</p>
              )}

              <Button expand="block" isLoading={isPending} disabled={!pricing}
                onClick={() => upgrade(provider)}>
                Upgrade to Premium
              </Button>
              <p className="text-xs text-wilde-muted text-center mt-3">
                You'll be taken to {PROVIDERS.find(p => p.value === provider)?.label} to pay securely.
              </p>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PremiumPage;
