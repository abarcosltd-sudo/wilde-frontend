import { create } from 'zustand';

export type ToastColor = 'dark' | 'success' | 'danger' | 'warning';

export interface Toast {
  /** Changes on every call so an identical repeat message re-opens the toast. */
  id:      number;
  message: string;
  color:   ToastColor;
}

interface UiState {
  isCreateMenuOpen: boolean;
  activeTab:        string;
  toast:            Toast | null;
  openCreateMenu:   ()                                       => void;
  closeCreateMenu:  ()                                       => void;
  setActiveTab:     (tab: string)                            => void;
  showToast:        (message: string, color?: ToastColor)    => void;
  hideToast:        ()                                       => void;
}

let toastId = 0;

export const useUiStore = create<UiState>(set => ({
  isCreateMenuOpen: false,
  activeTab:        'home',
  toast:            null,
  openCreateMenu:  () => set({ isCreateMenuOpen: true }),
  closeCreateMenu: () => set({ isCreateMenuOpen: false }),
  setActiveTab:    tab => set({ activeTab: tab }),
  showToast: (message, color = 'dark') => set({ toast: { id: ++toastId, message, color } }),
  hideToast: ()  => set({ toast: null }),
}));
