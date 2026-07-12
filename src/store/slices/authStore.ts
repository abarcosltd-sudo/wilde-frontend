import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  firebaseUser: any | null;
  isLoading: boolean;
  error: string | null;
  setUser:         (user: User | null)        => void;
  setFirebaseUser: (fbUser: any | null)       => void;
  setLoading:      (loading: boolean)         => void;
  setError:        (error: string | null)     => void;
  clear:           ()                         => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user:         null,
  firebaseUser: null,
  isLoading:    true,
  error:        null,
  setUser:         user         => set({ user }),
  setFirebaseUser: firebaseUser => set({ firebaseUser }),
  setLoading:      isLoading    => set({ isLoading }),
  setError:        error        => set({ error }),
  clear: () => set({ user: null, firebaseUser: null, error: null }),
}));
