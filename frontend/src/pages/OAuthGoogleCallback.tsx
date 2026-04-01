import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/shared/components';
import {
  authStore,
  buildGuestImportPayload,
  clearGuestDraft,
} from '@/features/auth';
import { useImportGuestContract } from '@/features/contracts/hooks/useContracts';

export const OAuthGoogleCallback = () => {
  const navigate = useNavigate();
  const importGuestMutation = useImportGuestContract();
  const ranRef = useRef(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(true);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) {
        if (authStore.getState().isAuthenticated) {
          navigate('/dashboard', { replace: true });
          return;
        }
        setLocalError('Не получены токены в URL');
        setIsWorking(false);
        return;
      }
      const params = new URLSearchParams(hash);
      const access = params.get('access_token');
      const refresh = params.get('refresh_token');
      if (!access || !refresh) {
        setLocalError('Неполный ответ авторизации');
        setIsWorking(false);
        return;
      }

      authStore.getState().setTokens(access, refresh);
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);

      try {
        const payload = buildGuestImportPayload();
        if (payload) {
          await importGuestMutation.mutateAsync(payload);
          clearGuestDraft();
        }
      } catch (error) {
        console.error('Guest contract import failed after Google login', error);
      }
      navigate('/dashboard', { replace: true });
    };

    void run();
  }, [importGuestMutation, navigate]);

  return (
    <Layout maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" component="h1" gutterBottom>
              Завершаем вход через Google
            </Typography>

            {localError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {localError}
              </Alert>
            )}

            {isWorking && !localError && <CircularProgress />}
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
