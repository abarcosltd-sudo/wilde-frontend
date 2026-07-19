import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { signUp } from '@/firebase/auth.helpers';
import { createDocument } from '@/firebase/firestore.helpers';
import { ROUTES } from '@/constants';
import { Collections } from '@/firebase/firestore.helpers';
import Button from '@/components/ui/Button';
import Swal from 'sweetalert2';

const SignUpPage: React.FC = () => {
  const history = useHistory();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;
    const cred = await signUp(get('email'), get('password'));
    try {
      await createDocument(Collections.USERS, {
      displayName: get('displayName'),
      username: get('username'),
      email: get('email'),
      roles: [], isPremium: false,
      followersCount: 0, followingCount: 0, worksCount: 0, totalSales: 0, streakCount: 0,
    }, cred.user.uid);
      await Swal.fire({
      icon: 'success',
      title: 'Welcome to WILDE!',
      text: 'Your account has been created.',
      timer: 2000,
      showConfirmButton: false,
    });
    history.replace(ROUTES.ONBOARDING);
    } catch (err: any) {
      Swal.fire({
      icon: 'error',
      title: 'Sign up failed',
      text: err?.message || 'Something went wrong. Please try again.',
    });
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col gap-3 max-w-sm mx-auto pt-12">
          <img src="/wilde-logo2.png" alt="WILDE" className="w-20 h-20 mx-auto object-contain" />
          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
            <label htmlFor="displayName" className="text-xs text-wilde-muted">Full name</label>
            <input id="displayName" name="displayName" placeholder="Your full name"
              className="border border-wilde-border rounded-md px-3 py-2 text-sm" />
            <label htmlFor="username" className="text-xs text-wilde-muted">Username</label>
            <input id="username" name="username" placeholder="@yourhandle"
              className="border border-wilde-border rounded-md px-3 py-2 text-sm" />
            <label htmlFor="signup-email" className="text-xs text-wilde-muted">Email</label>
            <input id="signup-email" name="email" type="email" placeholder="you@example.com"
              className="border border-wilde-border rounded-md px-3 py-2 text-sm" />
            <label htmlFor="signup-password" className="text-xs text-wilde-muted">Password</label>
            <input id="signup-password" name="password" type="password" placeholder="••••••••"
              className="border border-wilde-border rounded-md px-3 py-2 text-sm" />
            <Button type="submit" expand="block">Create Account</Button>
          </form>
          <p className="text-center text-sm text-wilde-muted">
            {'Already have an account? '}
            <button className="underline" onClick={() => history.push(ROUTES.SIGN_IN)}>Sign In</button>
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignUpPage;
