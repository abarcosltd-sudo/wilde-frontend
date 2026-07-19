import React, { useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authStore';
import { subscribeToAuth } from '@/firebase/auth.helpers';
import { getDocument } from '@/firebase/firestore.helpers';
import { ROUTES } from '@/constants';
import { Collections } from '@/firebase/firestore.helpers';
import { User } from '@/types';

export const SplashScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-white gap-3">
    <h1 className="text-5xl font-black tracking-wide">WILDE</h1>
    <span className="text-4xl opacity-20">🪶</span>
    <p className="text-sm text-wilde-muted">Where Creatives find their voice</p>
  </div>
);

const SplashPage: React.FC = () => {
  const history = useHistory();
  const { setUser, setFirebaseUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = subscribeToAuth(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const profile = await getDocument<User>(Collections.USERS, fbUser.uid);
        setUser(profile);
        history.replace(ROUTES.HOME);
      } else {
        setUser(null);
        history.replace(ROUTES.SIGN_IN);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <IonPage>
      <IonContent>
        <SplashScreen />
      </IonContent>
    </IonPage>
  );
};

export default SplashPage;
