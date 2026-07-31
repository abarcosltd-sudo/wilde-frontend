import { create } from 'zustand';

import type { AdminIdentity } from '../types/admin.types';

export type AdminStatus = 'loading' | 'authorised' | 'forbidden' | 'signed-out';

interface AdminState {
  identity: AdminIdentity | null;
  status: AdminStatus;
  /** Days of history the analytics screens look back over. */
  range: 7 | 30 | 90;
  setIdentity: (identity: AdminIdentity | null) => void;
  setStatus: (status: AdminStatus) => void;
  setRange: (range: 7 | 30 | 90) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  identity: null,
  status: 'loading',
  range: 30,
  setIdentity: (identity) => set({ identity }),
  setStatus: (status) => set({ status }),
  setRange: (range) => set({ range }),
}));
