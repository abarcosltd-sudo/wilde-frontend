import { googleSignInError } from '@/utils/authErrors';

const fbError = (code: string) => Object.assign(new Error(`Firebase: Error (${code}).`), { code });

describe('googleSignInError', () => {
  it('stays silent when the person closes the window or double-taps', () => {
    expect(googleSignInError(fbError('auth/popup-closed-by-user'))).toBeNull();
    expect(googleSignInError(fbError('auth/cancelled-popup-request'))).toBeNull();
  });

  it('explains a blocked popup and how to get past it', () => {
    const m = googleSignInError(fbError('auth/popup-blocked'))!;
    expect(m.title).toMatch(/blocked/i);
    expect(m.text).toMatch(/pop-ups/i);
  });

  it('points an existing email/password user back to their password', () => {
    expect(googleSignInError(fbError('auth/account-exists-with-different-credential'))!.text)
      .toMatch(/email and password/i);
  });

  it('never shows raw Firebase text', () => {
    for (const code of [
      'auth/popup-blocked', 'auth/network-request-failed', 'auth/unauthorized-domain',
      'auth/operation-not-allowed', 'auth/something-new',
    ]) {
      const m = googleSignInError(fbError(code))!;
      expect(`${m.title} ${m.text}`).not.toMatch(/Firebase|auth\//);
    }
  });

  it('falls back to a generic message for codes it does not know', () => {
    expect(googleSignInError(fbError('auth/something-new'))!.title).toBe('Google sign-in failed');
  });

  it('copes with errors that are not Firebase errors at all', () => {
    expect(googleSignInError(new Error('boom'))!.title).toBe('Google sign-in failed');
    expect(googleSignInError(undefined)!.title).toBe('Google sign-in failed');
    expect(googleSignInError('nope')!.title).toBe('Google sign-in failed');
    expect(googleSignInError(null)!.title).toBe('Google sign-in failed');
  });
});
