import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/shared/components';
import { resolveLocalizedPath } from '@/shared/i18n/resolveLocalizedPath';
import {
  authStore,
  buildGuestImportPayload,
  clearGuestDraft,
} from '@/features/auth';
import { useImportGuestContract } from '@/features/contracts/hooks/useContracts';

export const OAuthGoogleCallback = () => {
  const { t } = useTranslation('oauth');
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
          navigate(resolveLocalizedPath('/dashboard'), { replace: true });
          return;
        }
        setLocalError(t('googleNoTokens'));
        setIsWorking(false);
        return;
      }
      const params = new URLSearchParams(hash);
      const access = params.get('access_token');
      const refresh = params.get('refresh_token');
      if (!access || !refresh) {
        setLocalError(t('googleIncomplete'));
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
      navigate(resolveLocalizedPath('/dashboard'), { replace: true });
    };

    void run();
  }, [importGuestMutation, navigate, t]);

  return (
    <Layout maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" component="h1" gutterBottom>
              {t('googleTitle')}
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
