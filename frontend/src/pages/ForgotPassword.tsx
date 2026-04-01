import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  Alert,
} from '@mui/material';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';
import { useLocalizedPath } from '@/shared/i18n/useLocalizedPath';
import { useAuthStore, useRequestPasswordReset } from '@/features/auth/hooks/useAuth';
import { AxiosError } from 'axios';

export const ForgotPassword = () => {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const localizedPath = useLocalizedPath();
  const { isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const { mutate, isPending, isSuccess, error } = useRequestPasswordReset();

  if (isAuthenticated) {
    return <Navigate to={localizedPath('/dashboard')} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(email.trim());
  };

  const detail =
    error && typeof (error as AxiosError<{ detail?: string }>).response?.data?.detail === 'string'
      ? (error as AxiosError<{ detail: string }>).response!.data.detail
      : null;

  return (
    <Layout maxWidth="sm">
      <PageMeta
        title={t('forgot.metaTitle')}
        description={t('forgot.metaDescription')}
        siteName={tc('brand.name')}
      />
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              {t('forgot.title')}
            </Typography>

            {isSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                {t('forgot.success')}
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('forgot.hint')}
                </Typography>

                {detail && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {detail}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label={t('register.email')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                    required
                    disabled={isPending}
                  />
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    sx={{ mt: 3 }}
                    disabled={isPending}
                  >
                    {isPending ? t('forgot.submitting') : t('forgot.submit')}
                  </Button>
                </form>
              </>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t('forgot.yandexNote')}{' '}
              <MuiLink component={Link} to={localizedPath('/login')}>
                {t('forgot.loginPage')}
              </MuiLink>
            </Typography>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              <MuiLink component={Link} to={localizedPath('/login')}>
                {t('forgot.backToLogin')}
              </MuiLink>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
