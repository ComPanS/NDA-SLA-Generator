import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setTokens: (accessToken: string, refreshToken: string) => {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
