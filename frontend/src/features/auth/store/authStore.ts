import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  pendingEmail: string | null;
  _hasHydrated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setPendingEmail: (email: string | null) => void;
  logout: () => void;
}

let markHydrated: (() => void) | null = null;

export const authStore = create<AuthState>()(
  persist(
    (set) => {
      markHydrated = () => set({ _hasHydrated: true });

      return {
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        pendingEmail: null,
        _hasHydrated: false,

        setTokens: (accessToken: string, refreshToken: string) => {
          set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
            pendingEmail: null,
          });
        },

        setPendingEmail: (email: string | null) => {
          set({
            pendingEmail: email,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        },

        logout: () => {
          set({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            pendingEmail: null,
          });
        },
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Don't persist _hasHydrated
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        pendingEmail: state.pendingEmail,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('[AuthStore] Hydration error:', error);
          } else {
          }
          // mark hydration complete even if there was an error to unblock UI
          markHydrated?.();
        };
      },
    }
  )
);

// Helper to wait for hydration
authStore.persist?.onFinishHydration?.(() => {
  markHydrated?.();
});

export const waitForHydration = (): Promise<void> => {
  return new Promise((resolve) => {
    if (authStore.getState()._hasHydrated) {
      resolve();
      return;
    }
    const unsubscribe = authStore.subscribe((state) => {
      if (state._hasHydrated) {
        unsubscribe();
        resolve();
      }
    });
  });
};

// Hook for components to use
export const useAuthHydration = () => {
  return authStore((state) => state._hasHydrated);
};
