import { create } from 'zustand';

export type ToastColor = 'dark' | 'success' | 'danger' | 'warning';

export interface Toast {
  /** Changes on every call so an identical repeat message re-opens the toast. */
  id:      number;
  message: string;
  color:   ToastColor;
}

interface UiState {
  isCreateMenuOpen:      boolean;
  isCommandPaletteOpen:  boolean;
  activeTab:             string;
  toast:                 Toast | null;
  openCreateMenu:        ()                                    => void;
  closeCreateMenu:       ()                                    => void;
  openCommandPalette:    ()                                    => void;
  closeCommandPalette:   ()                                    => void;
  toggleCommandPalette:  ()                                    => void;
  setActiveTab:          (tab: string)                         => void;
  showToast:             (message: string, color?: ToastColor) => void;
  hideToast:             ()                                    => void;
}

let toastId = 0;

export const useUiStore = create<UiState>(set => ({
  isCreateMenuOpen:     false,
  isCommandPaletteOpen: false,
  activeTab:            'home',
  toast:                null,
  openCreateMenu:  () => set({ isCreateMenuOpen: true }),
  closeCreateMenu: () => set({ isCreateMenuOpen: false }),
  // Lives in the store rather than in the palette component because the
  // keyboard shortcut, the header search button and the palette's own dismiss
  // all drive the same piece of state from different parts of the tree.
  openCommandPalette:   () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette:  () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () => set(s => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen })),
  setActiveTab:    tab => set({ activeTab: tab }),
  showToast: (message, color = 'dark') => set({ toast: { id: ++toastId, message, color } }),
  hideToast: ()  => set({ toast: null }),
}));
