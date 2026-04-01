import { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  Alert,
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle, Cancel } from '@mui/icons-material';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';
import { useLocalizedPath } from '@/shared/i18n/useLocalizedPath';
import { useAuthStore, useResetPassword } from '@/features/auth/hooks/useAuth';
import { AxiosError } from 'axios';

export const ResetPassword = () => {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const localizedPath = useLocalizedPath();
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate, isPending, error } = useResetPassword();

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      digit: /\d/.test(password),
    }),
    [password],
  );
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  if (isAuthenticated) {
    return <Navigate to={localizedPath('/dashboard')} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!isPasswordStrong) {
      setPasswordError(t('reset.passwordRulesHint'));
      return;
    }
    if (!passwordsMatch) {
      setPasswordError(t('reset.passwordsMismatch'));
      return;
    }
    mutate({ token, password });
  };

  const detail =
    error && typeof (error as AxiosError<{ detail?: string }>).response?.data?.detail === 'string'
      ? (error as AxiosError<{ detail: string }>).response!.data.detail
      : null;

  const ruleItems: { key: keyof typeof passwordChecks; textKey: string }[] = [
    { key: 'length', textKey: 'reset.ruleLength' },
    { key: 'lower', textKey: 'reset.ruleLower' },
    { key: 'upper', textKey: 'reset.ruleUpper' },
    { key: 'digit', textKey: 'reset.ruleDigit' },
  ];

  if (!token) {
    return (
      <Layout maxWidth="sm">
        <PageMeta
          title={t('reset.metaInvalidTitle')}
          description={t('reset.metaDescription')}
          siteName={tc('brand.name')}
        />
        <Box sx={{ mt: 8 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom align="center">
                {t('reset.invalidTitle')}
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('reset.invalidWarning')}
              </Alert>
              <Typography variant="body2" align="center">
                <MuiLink component={Link} to={localizedPath('/forgot-password')}>
                  {t('reset.requestLink')}
                </MuiLink>
                {' · '}
                <MuiLink component={Link} to={localizedPath('/login')}>
                  {t('reset.login')}
                </MuiLink>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="sm">
      <PageMeta
        title={t('reset.metaNewTitle')}
        description={t('reset.metaDescription')}
        siteName={tc('brand.name')}
      />
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              {t('reset.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('reset.hint')}
            </Typography>

            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}

            {detail && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {detail}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t('reset.newPassword')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                margin="normal"
                required
                disabled={isPending}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={t('reset.showPassword')}
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Stack spacing={0.5} sx={{ mt: 1, mb: 1 }}>
                {ruleItems.map(({ key, textKey }) => {
                  const passed = passwordChecks[key as keyof typeof passwordChecks];
                  return (
                    <Stack
                      key={key}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      color={passed ? 'success.main' : 'text.secondary'}
                      sx={{ fontSize: 14 }}
                    >
                      {passed ? (
                        <CheckCircle fontSize="small" color="success" />
                      ) : (
                        <Cancel fontSize="small" color="disabled" />
                      )}
                      <span>{t(textKey)}</span>
                    </Stack>
                  );
                })}
              </Stack>

              <TextField
                fullWidth
                label={t('reset.confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                margin="normal"
                required
                disabled={isPending}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={t('reset.showPassword')}
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText={
                  confirmPassword
                    ? passwordsMatch
                      ? t('reset.passwordMatchOk')
                      : t('reset.passwordMatchBad')
                    : ''
                }
                FormHelperTextProps={{
                  sx: { color: passwordsMatch || !confirmPassword ? 'text.secondary' : 'error.main' },
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                disabled={isPending}
              >
                {isPending ? t('reset.submitting') : t('reset.submit')}
              </Button>
            </form>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              <MuiLink component={Link} to={localizedPath('/login')}>
                {t('reset.backToLogin')}
              </MuiLink>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
