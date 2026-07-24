import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { logoGoogle } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { signIn, signInWithGoogle } from '@/firebase/auth.helpers';
import { ROUTES } from '@/constants';
import Button from '@/components/ui/Button';
import Swal from '@/utils/swal';

const SignInPage: React.FC = () => {
  const history = useHistory();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    try {
      await signIn(email, password);
      await Swal.fire({
        icon: 'success',
        title: 'Sign in successful',
        text: 'Welcome to Wilde',
        timer: 1500,
        showConfirmButton: false,
      });
      history.replace(ROUTES.HOME);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Sign in failed',
        text: err?.message || 'Invalid email or password.',
      });
    }
    
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col gap-4 max-w-sm mx-auto pt-16">
          <img src="/wilde_logo2.png" alt="WILDE" className="w-20 h-20 mx-auto object-contain" />
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            <label htmlFor="email" className="text-xs text-wilde-muted">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com"
              className="border border-wilde-border rounded-md px-3 py-2 text-sm" />
            <label htmlFor="password" className="text-xs text-wilde-muted">Password</label>
            <input id="password" name="password" type="password" placeholder="••••••••"
              className="border border-wilde-border rounded-md px-3 py-2 text-sm" />
            <button type="button"
              onClick={() => history.push(ROUTES.FORGOT_PASSWORD)}
              className="text-right text-xs text-wilde-muted underline min-h-11">
              Forgot Password?
            </button>
            <Button type="submit" expand="block">Sign In</Button>
          </form>
          <Button variant="outline" expand="block" onClick={signInWithGoogle}>
            <IonIcon icon={logoGoogle} aria-hidden="true" className="mr-2" />
            Continue with Google
          </Button>
          <p className="text-center text-sm text-wilde-muted">
            {'Do not have an account? '}
            <button className="underline text-wilde-black"
              onClick={() => history.push(ROUTES.SIGN_UP)}>Create Account</button>
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignInPage;
