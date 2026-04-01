import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { authStore } from '@/features/auth/store/authStore';
import { CircularProgress, Box } from '@mui/material';
import { useLocalizedPath } from '@/shared/i18n/useLocalizedPath';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const loginPath = useLocalizedPath()('/login');
  const hasHydrated = authStore((state) => state._hasHydrated);
  const isAuthenticated = authStore((state) => state.isAuthenticated);

  // Wait for hydration before making auth decision
  if (!hasHydrated) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />;
  }

  return <>{children}</>;
};
