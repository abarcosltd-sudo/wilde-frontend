import { create } from 'zustand';

interface UiState {
  isCreateMenuOpen: boolean;
  activeTab:        string;
  toast:            { message: string; color: string } | null;
  openCreateMenu:   ()                                    => void;
  closeCreateMenu:  ()                                    => void;
  setActiveTab:     (tab: string)                         => void;
  showToast:        (message: string, color?: string)     => void;
  hideToast:        ()                                    => void;
}

export const useUiStore = create<UiState>(set => ({
  isCreateMenuOpen: false,
  activeTab:        'home',
  toast:            null,
  openCreateMenu:  () => set({ isCreateMenuOpen: true }),
  closeCreateMenu: () => set({ isCreateMenuOpen: false }),
  setActiveTab:    tab => set({ activeTab: tab }),
  showToast: (message, color = 'dark') => set({ toast: { message, color } }),
  hideToast: ()  => set({ toast: null }),
}));
