import { useEffect, useMemo } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/shared/components';

export const YandexSuggestToken = () => {
  const { t } = useTranslation('oauth');
  const origin = useMemo(() => import.meta.env.VITE_YANDEX_ORIGIN || window.location.origin, []);

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    const closeDelayMs = 800; // чуть больше времени, чтобы postMessage гарантированно доставился

    const targets = new Set<Window>();
    if (window.opener) targets.add(window.opener);
    if (window.opener?.parent) targets.add(window.opener.parent);
    if (window.opener?.top) targets.add(window.opener.top);

    const post = (payload: unknown) => {
      if (!targets.size) return;
      targets.forEach((target) => {
        try {
          target.postMessage(payload, origin);
        } catch {
          /* ignore */
        }
      });
    };

    if (token) {
      post({ type: 'yandex_token', token });
      setTimeout(() => window.close(), closeDelayMs);
    } else if (error) {
      post({ type: 'yandex_token_error', error: errorDescription || error });
      setTimeout(() => window.close(), closeDelayMs);
    }
  }, [origin]);

  return (
    <Layout maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" component="h1" gutterBottom>
              {t('yandexTokenTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('yandexTokenHint')}
            </Typography>
            <CircularProgress />
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('yandexTokenInfo')}
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
