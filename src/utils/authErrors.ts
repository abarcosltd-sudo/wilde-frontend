/**
 * Turns a Firebase Auth error into words a person can act on.
 *
 * Firebase's own messages read "Firebase: Error (auth/popup-blocked).", which
 * says nothing to someone who just tapped a button. The code on the error is the
 * stable part, so the mapping keys off that.
 */
export interface AuthMessage {
  title: string;
  text: string;
}

/** The person changed their mind: closing the window is not an error to report. */
const CANCELLED = new Set([
  'auth/popup-closed-by-user',
  // Fired when a second sign-in starts before the first finishes, e.g. a double tap.
  'auth/cancelled-popup-request',
]);

const GOOGLE_MESSAGES: Record<string, AuthMessage> = {
  'auth/popup-blocked': {
    title: 'Sign-in window was blocked',
    text: 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again. ' +
      'If you opened Wilde from inside another app, open it in your browser instead.',
  },
  'auth/network-request-failed': {
    title: 'No connection',
    text: 'We could not reach Google. Check your internet connection and try again.',
  },
  'auth/account-exists-with-different-credential': {
    title: 'You already have an account',
    text: 'An account with this email already exists. Sign in with your email and password instead.',
  },
  'auth/user-disabled': {
    title: 'Account unavailable',
    text: 'This account has been disabled. Contact support if you think that is a mistake.',
  },
  'auth/too-many-requests': {
    title: 'Too many attempts',
    text: 'Please wait a moment and try again.',
  },
  // These two are configuration problems, not something the person can fix, so
  // they say so plainly rather than inviting a retry that cannot work.
  'auth/unauthorized-domain': {
    title: 'Google sign-in is not available here',
    text: 'Google sign-in has not been enabled for this web address yet. Please use your email and password.',
  },
  'auth/operation-not-allowed': {
    title: 'Google sign-in is not available',
    text: 'Google sign-in is not turned on right now. Please use your email and password.',
  },
};

const GENERIC: AuthMessage = {
  title: 'Google sign-in failed',
  text: 'Something went wrong signing in with Google. Please try again, or use your email and password.',
};

const codeOf = (err: unknown): string =>
  typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';

/** `null` means say nothing: the person cancelled. */
export const googleSignInError = (err: unknown): AuthMessage | null => {
  const code = codeOf(err);
  if (CANCELLED.has(code)) return null;
  return GOOGLE_MESSAGES[code] ?? GENERIC;
};
