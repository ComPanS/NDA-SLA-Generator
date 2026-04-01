import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link as MuiLink,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLogin, useAuthStore } from '@/features/auth/hooks/useAuth';
import { useLocalizedPath } from '@/shared/i18n/useLocalizedPath';
import { YandexIdButton } from '@/features/auth/components/YandexIdButton';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';

function googleOAuthErrorMessage(
  code: string,
  t: (key: string, o?: { code?: string }) => string,
): string {
  switch (code) {
    case 'access_denied':
      return t('login.oauthGoogleDenied');
    case 'google_oauth_invalid':
      return t('login.oauthGoogleInvalid');
    case 'google_invalid_state':
      return t('login.oauthGoogleState');
    case 'google_oauth_failed':
      return t('login.oauthGoogleFailed');
    default:
      return t('login.oauthGoogleGeneric', { code });
  }
}

export const Login = () => {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const localizedPath = useLocalizedPath();
  const [searchParams] = useSearchParams();
  const oauthErrorCode = searchParams.get('error');
  const location = useLocation();
  const fromPasswordReset = Boolean(
    (location.state as { passwordReset?: boolean } | null)?.passwordReset,
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending, error } = useLogin();
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={localizedPath('/dashboard')} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <Layout maxWidth="sm">
      <PageMeta
        title={t('login.metaTitle')}
        description={t('login.metaDescription')}
        siteName={tc('brand.name')}
      />
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              {t('login.title')}
            </Typography>

            {fromPasswordReset && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {t('login.resetSuccess')}
              </Alert>
            )}

            {oauthErrorCode && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {googleOAuthErrorMessage(oauthErrorCode, t)}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t('login.invalidCredentials')}
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
              />

              <TextField
                fullWidth
                label={t('register.password')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={t('register.showPassword')}
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <MuiLink component={Link} to={localizedPath('/forgot-password')} variant="body2">
                  {t('login.forgotPassword')}
                </MuiLink>
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                disabled={isPending}
              >
                {isPending ? t('login.submitting') : t('login.submit')}
              </Button>
            </form>

            <YandexIdButton key={location.key} disabled={isPending} />
            <GoogleSignInButton disabled={isPending} />

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                {t('login.noAccount')}{' '}
                <MuiLink component={Link} to={localizedPath('/register')}>
                  {t('login.registerLink')}
                </MuiLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
