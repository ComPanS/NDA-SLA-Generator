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
  FormControlLabel,
  Checkbox,
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle, Cancel } from '@mui/icons-material';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useRegister, useAuthStore } from '@/features/auth/hooks/useAuth';
import { YandexIdButton } from '@/features/auth/components/YandexIdButton';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';
import { useLocalizedPath } from '@/shared/i18n/useLocalizedPath';

export const Register = () => {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const localizedPath = useLocalizedPath();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [policyError, setPolicyError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutate: register, isPending, error } = useRegister();
  const { isAuthenticated } = useAuthStore();

  const passwordChecks = {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
  };
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  if (isAuthenticated) {
    return <Navigate to={localizedPath('/dashboard')} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPolicyError('');

    if (!isPasswordStrong) {
      setPasswordError(t('register.passwordRulesHint'));
      return;
    }

    if (!passwordsMatch) {
      setPasswordError(t('register.passwordsMismatch'));
      return;
    }

    if (!acceptedPolicies) {
      setPolicyError(t('register.policyRequired'));
      return;
    }

    register({ email, password });
  };

  const ruleItems: { key: keyof typeof passwordChecks; textKey: string }[] = [
    { key: 'length', textKey: 'register.ruleLength' },
    { key: 'lower', textKey: 'register.ruleLower' },
    { key: 'upper', textKey: 'register.ruleUpper' },
    { key: 'digit', textKey: 'register.ruleDigit' },
  ];

  return (
    <Layout maxWidth="sm">
      <PageMeta
        title={t('register.metaTitle')}
        description={t('register.metaDescription')}
        siteName={tc('brand.name')}
        robots="noindex,nofollow"
      />
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              {t('register.title')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t('register.emailInUse')}
              </Alert>
            )}

            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
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

              <Stack spacing={0.5} sx={{ mt: 1, mb: 1 }}>
                {ruleItems.map(({ key, textKey }) => {
                  const passed = passwordChecks[key];
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
                label={t('register.confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={t('register.showPassword')}
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
                      ? t('register.passwordMatchOk')
                      : t('register.passwordMatchBad')
                    : ''
                }
                FormHelperTextProps={{
                  sx: { color: passwordsMatch || !confirmPassword ? 'text.secondary' : 'error.main' },
                }}
              />

              <Stack sx={{ mt: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptedPolicies}
                      onChange={(e) => setAcceptedPolicies(e.target.checked)}
                      disabled={isPending}
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.primary">
                      <Trans
                        i18nKey="register.policyAccept"
                        ns="auth"
                        components={{
                          privacy: <MuiLink component={Link} to={localizedPath('/privacy')} />,
                          terms: <MuiLink component={Link} to={localizedPath('/terms')} />,
                        }}
                      />
                    </Typography>
                  }
                />
                {policyError && (
                  <Typography variant="caption" color="error">
                    {policyError}
                  </Typography>
                )}
              </Stack>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                disabled={isPending}
              >
                {isPending ? t('register.submitting') : t('register.submit')}
              </Button>
            </form>

            <YandexIdButton key={location.key} disabled={isPending} />
            <GoogleSignInButton disabled={isPending} />

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                {t('register.hasAccount')}{' '}
                <MuiLink component={Link} to={localizedPath('/login')}>
                  {t('register.loginLink')}
                </MuiLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
