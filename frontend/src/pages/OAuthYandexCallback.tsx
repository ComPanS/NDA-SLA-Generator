import { useEffect, useMemo, useRef } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/shared/components';
import { useAuthStore, useYandexCallback } from '@/features/auth';
import { useLocalizedPath } from '@/shared/i18n/useLocalizedPath';

export const OAuthYandexCallback = () => {
  const { t } = useTranslation('oauth');
  const [searchParams] = useSearchParams();
  const localizedPath = useLocalizedPath();
  const { isAuthenticated } = useAuthStore();
  const mutation = useYandexCallback();
  const sentRef = useRef(false);

  const payload = useMemo(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code || !state) return null;
    return { code, state };
  }, [searchParams]);

  useEffect(() => {
    if (!payload || sentRef.current) return;
    sentRef.current = true;
    mutation.mutate(payload);
  }, [mutation, payload]);

  const errorParam = searchParams.get('error');

  if (isAuthenticated) {
    return <Navigate to={localizedPath('/dashboard')} replace />;
  }

  return (
    <Layout maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" component="h1" gutterBottom>
              {t('yandexTitle')}
            </Typography>

            {errorParam && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t('yandexDenied', { error: errorParam })}
              </Alert>
            )}

            {!payload && !errorParam && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t('yandexMissingParams')}
              </Alert>
            )}

            {mutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {(mutation.error as Error)?.message || t('yandexFailed')}
              </Alert>
            )}

            {mutation.isSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {t('yandexSuccess')}
              </Alert>
            )}

            {mutation.isPending && <CircularProgress />}
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
