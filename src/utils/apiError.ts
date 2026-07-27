import { AxiosError } from 'axios';

/**
 * Firestore and Storage reject with a `code`, not an HTTP response, so they
 * fall straight through the Axios branch below and get reported as "couldn't
 * reach the server" — wrong, and it sends the user to check their wifi over a
 * rules problem or a missing index.
 */
const FIREBASE_MESSAGES: Record<string, string> = {
  'permission-denied':  "You don't have access to this.",
  unauthenticated:      'Your session expired. Sign in again.',
  unavailable:          "Can't reach the server right now. Check your connection.",
  'resource-exhausted': 'The app is over its quota. Try again shortly.',
  // Firestore raises this when a composite index the query needs doesn't exist.
  // Retrying will never fix it, so the copy doesn't promise that it will.
  'failed-precondition': 'This view needs a database index that has not been set up yet.',
  cancelled:            'That request was cancelled.',
  'deadline-exceeded':  'That took too long. Try again.',
};

const firebaseCode = (err: unknown): string | null => {
  const code = (err as { code?: unknown } | null)?.code;
  if (typeof code !== 'string') return null;
  // Firebase namespaces some codes ("storage/unauthorized") and not others.
  return code.includes('/') ? code.slice(code.indexOf('/') + 1) : code;
};

/**
 * Pulls the message the API sent, which is written for the user
 * ("This work is not for sale", "Hourly AI limit reached"). Falls back only
 * when there is nothing to show.
 */
export const apiErrorMessage = (
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
) => {
  const code = firebaseCode(err);
  if (code && FIREBASE_MESSAGES[code]) return FIREBASE_MESSAGES[code];

  const response = (err as AxiosError<{ message?: string }>)?.response;
  // No response at all — offline, DNS, CORS, or the request timed out.
  if (!response) return "Couldn't reach the server. Check your connection and try again.";
  return response.data?.message ?? fallback;
};
