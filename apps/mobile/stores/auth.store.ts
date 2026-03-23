import type { User } from '@supfile/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '@/lib/secure-storage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  setSession: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  clear: () => void;

  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setSession: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),

      setAccessToken: (accessToken) => set({ accessToken }),

      clear: () => set({ user: null, accessToken: null, refreshToken: null }),

      isAuthenticated: () => Boolean(get().accessToken && get().user),
    }),
    {
      name: 'supfile-auth',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);
