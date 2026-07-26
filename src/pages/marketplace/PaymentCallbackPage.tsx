import React from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/react';
import { checkmarkCircle, alertCircle, timeOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { verifyPayment } from '@/services/payment.service';
import { apiErrorMessage } from '@/utils/apiError';
import { ROUTES } from '@/constants';
import Button from '@/components/ui/Button';

/**
 * Where the payment provider sends the buyer after checkout.
 *
 * Reached by a full page load, so every cache is cold and `useAuth` has already
 * re-read the profile — nothing here needs to invalidate `isPremium` or the
 * work's unlock state by hand.
 *
 * Verification is a convenience, not the source of truth: the webhook settles
 * the order whether or not the buyer ever lands here. Both paths run the same
 * idempotent fulfilment, so arriving here twice changes nothing.
 */
const PaymentCallbackPage: React.FC = () => {
  const history = useHistory();
  const params = new URLSearchParams(useLocation().search);

  // Paystack returns `reference` (and `trxref`); Flutterwave returns `tx_ref`.
  const reference = params.get('reference') ?? params.get('trxref') ?? params.get('tx_ref');

  const { data, isPending, error, refetch, isRefetching } = useQuery({
    queryKey: ['payment-verify', reference],
    queryFn: async () => (await verifyPayment(reference!)).data.data,
    enabled: !!reference,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const goOnward = () => {
    if (data?.kind === 'work' && data.workId) history.replace(`/app/read/${data.workId}`);
    else if (data?.kind === 'premium') history.replace(ROUTES.SETTINGS);
    else history.replace(ROUTES.MARKET);
  };

  const body = () => {
    if (!reference) {
      return (
        <Status icon={alertCircle} tone="text-red-500" title="Missing payment reference"
          detail="This page was opened without a payment to confirm.">
          <Button onClick={() => history.replace(ROUTES.MARKET)}>Back to Marketplace</Button>
        </Status>
      );
    }

    if (isPending || isRefetching) {
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <IonSpinner name="crescent" />
          <p className="text-sm text-wilde-muted">Confirming your payment…</p>
        </div>
      );
    }

    if (error) {
      return (
        <Status icon={alertCircle} tone="text-red-500" title="Couldn't confirm payment"
          detail={apiErrorMessage(error)}>
          <Button onClick={() => refetch()}>Try again</Button>
        </Status>
      );
    }

    if (data?.status === 'completed') {
      return (
        <Status icon={checkmarkCircle} tone="text-green-600" title="Payment complete"
          detail={data.kind === 'premium'
            ? 'Your account is now Premium.'
            : 'You now have full access.'}>
          <Button onClick={goOnward}>Continue</Button>
        </Status>
      );
    }

    if (data?.status === 'pending') {
      return (
        <Status icon={timeOutline} tone="text-amber-500" title="Payment still processing"
          detail="Your bank hasn't confirmed this yet. It will unlock automatically once they do.">
          <Button onClick={() => refetch()}>Check again</Button>
        </Status>
      );
    }

    if (data?.status === 'disputed') {
      return (
        <Status icon={alertCircle} tone="text-red-500" title="Payment needs review"
          detail="The amount received didn't match this order, so it hasn't been applied. Please contact support."
        >
          <Button onClick={() => history.replace(ROUTES.HELP)}>Get help</Button>
        </Status>
      );
    }

    return (
      <Status icon={alertCircle} tone="text-wilde-muted" title="Payment not completed"
        detail="Nothing was charged. You can try again whenever you're ready.">
        <Button onClick={() => history.replace(ROUTES.MARKET)}>Back to Marketplace</Button>
      </Status>
    );
  };

  return (
    <IonPage>
      <IonContent>
        <div className="min-h-full flex items-center justify-center p-6">{body()}</div>
      </IonContent>
    </IonPage>
  );
};

const Status: React.FC<{
  icon: string; tone: string; title: string; detail: string; children: React.ReactNode;
}> = ({ icon, tone, title, detail, children }) => (
  <div role="status" className="flex flex-col items-center gap-3 text-center max-w-xs">
    <IonIcon icon={icon} aria-hidden="true" className={`text-5xl ${tone}`} />
    <h1 className="font-bold text-lg">{title}</h1>
    <p className="text-sm text-wilde-muted">{detail}</p>
    <div className="mt-2 w-full">{children}</div>
  </div>
);

export default PaymentCallbackPage;
