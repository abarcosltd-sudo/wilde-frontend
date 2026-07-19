import React, { useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authStore';
import { ROUTES } from '@/constants';

export const SplashScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-white gap-3">
    <img src="/wilde-logo.png" alt="WILDE" className="w-32 h-32 object-contain" />
    <p className="text-sm text-wilde-muted">Where Creatives find their voice</p>
  </div>
);

const SplashPage: React.FC = () => {
  const history = useHistory();
  const { firebaseUser, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    history.replace(firebaseUser ? ROUTES.HOME : ROUTES.SIGN_IN);
  }, [isLoading, firebaseUser, history]);

  return (
    <IonPage>
      <IonContent>
        <SplashScreen />
      </IonContent>
    </IonPage>
  );
};

export default SplashPage;
