import React from 'react';
import { IonIcon } from '@ionic/react';
import { cloudOfflineOutline, refreshOutline } from 'ionicons/icons';
import { apiErrorMessage } from '@/utils/apiError';

/**
 * Shown when a read fails, in place of the empty state.
 *
 * The distinction matters: every list in this app used to fall through to
 * "Nothing here yet" whether the collection was genuinely empty or the request
 * had failed. That reads as a confident statement about the user's data when
 * it's really a dropped connection, and it offers no way back.
 */

interface Props {
  /** What couldn't be loaded, lowercase — "your feed", "these works". */
  label: string;
  error?: unknown;
  onRetry?: () => void;
  /** Compact form for rails and cards rather than a full page slot. */
  inline?: boolean;
}

const ErrorState: React.FC<Props> = ({ label, error, onRetry, inline }) => {
  // The underlying message is worth showing when it says something specific
  // (offline, permission denied); the generic fallback is not worth the space.
  const detail = error ? apiErrorMessage(error) : null;

  if (inline) {
    return (
      <div role="alert" className="flex items-center gap-2 py-4 text-xs text-wilde-muted">
        <IonIcon icon={cloudOfflineOutline} aria-hidden="true" className="text-base shrink-0" />
        <span className="min-w-0">Couldn&apos;t load {label}.</span>
        {onRetry && (
          <button type="button" onClick={onRetry}
            className="font-semibold underline underline-offset-2 text-wilde-black shrink-0">
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div role="alert" className="text-center py-12 animate-fade-in">
      <IonIcon icon={cloudOfflineOutline} aria-hidden="true"
        className="text-3xl text-wilde-muted" />
      <p className="text-sm font-medium mt-2">Couldn&apos;t load {label}</p>
      {detail && <p className="text-xs text-wilde-muted mt-1 px-6">{detail}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold
            border border-wilde-border rounded-full px-4 py-2 transition-colors
            active:bg-wilde-subtle focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-gold-strong focus-visible:ring-offset-1
            focus-visible:ring-offset-wilde-surface">
          <IonIcon icon={refreshOutline} aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
