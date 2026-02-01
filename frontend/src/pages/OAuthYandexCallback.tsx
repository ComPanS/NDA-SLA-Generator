import { useEffect, useMemo, useRef } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Layout } from '@/shared/components';
import { useAuthStore, useYandexCallback } from '@/features/auth';

export const OAuthYandexCallback = () => {
  const [searchParams] = useSearchParams();
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
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" component="h1" gutterBottom>
              Завершаем вход через Яндекс
            </Typography>

            {errorParam && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Авторизация отклонена: {errorParam}
              </Alert>
            )}

            {!payload && !errorParam && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Не получены параметры code/state
              </Alert>
            )}

            {mutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {(mutation.error as Error)?.message || 'Не удалось войти через Яндекс'}
              </Alert>
            )}

            {mutation.isSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Успешно! Перенаправляем...
              </Alert>
            )}

            {mutation.isPending && <CircularProgress />}
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
