import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

export const adminStore = create<AdminState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      setToken: (token: string) =>
        set({
          token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'admin-storage',
    },
  ),
);
