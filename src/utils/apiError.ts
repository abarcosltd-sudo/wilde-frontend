import { AxiosError } from 'axios';

/**
 * Pulls the message the API sent, which is written for the user
 * ("This work is not for sale", "Hourly AI limit reached"). Falls back only
 * when there is nothing to show.
 */
export const apiErrorMessage = (
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
) => {
  const response = (err as AxiosError<{ message?: string }>).response;
  // No response at all — offline, DNS, CORS, or the request timed out.
  if (!response) return "Couldn't reach the server. Check your connection and try again.";
  return response.data?.message ?? fallback;
};
