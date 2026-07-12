import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { resetPassword } from '@/firebase/auth.helpers';
import Button from '@/components/ui/Button';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    await resetPassword(email);
    setSent(true);
    setLoading(false);
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="max-w-sm mx-auto pt-20 flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Reset Password</h2>
          {sent ? (
            <p className="text-sm text-green-600">Check your email for a reset link.</p>
          ) : (
            <>
              <label htmlFor="reset-email" className="text-xs text-wilde-muted">Email</label>
              <input id="reset-email" value={email} onChange={e => setEmail(e.target.value)}
                type="email" placeholder="you@example.com"
                className="border border-wilde-border rounded-md px-3 py-2 text-sm" />
              <Button expand="block" isLoading={loading} onClick={handleReset}>
                Send Reset Link
              </Button>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPasswordPage;
