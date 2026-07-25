import React from 'react';
import { IonToast } from '@ionic/react';
import { useUiStore } from '@/store/slices/uiStore';

/**
 * The single subscriber to `uiStore.toast`. Mounted once at the app root.
 *
 * Used for lightweight, non-blocking confirmations — especially the failure
 * side of an optimistic update, where the UI has already moved on and only
 * needs to say the write didn't stick. Anything that needs a decision from the
 * user still goes through a SweetAlert modal.
 */
const Toast: React.FC = () => {
  const toast = useUiStore(s => s.toast);
  const hideToast = useUiStore(s => s.hideToast);

  return (
    <IonToast
      // Remounting per toast id lets an identical repeat message re-animate
      // instead of being swallowed as "no change".
      key={toast?.id}
      isOpen={!!toast}
      message={toast?.message}
      color={toast?.color}
      duration={toast?.color === 'danger' ? 4000 : 2200}
      position="bottom"
      onDidDismiss={hideToast}
    />
  );
};

export default Toast;
