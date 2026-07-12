import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signOut = () => fbSignOut(auth);

export const signInWithGoogle = () =>
  signInWithPopup(auth, new GoogleAuthProvider());

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);

export const subscribeToAuth = (cb: (user: FirebaseUser | null) => void) =>
  onAuthStateChanged(auth, cb);
