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
import { useRegister, useAuthStore } from '@/features/auth/hooks/useAuth';
import { YandexIdButton } from '@/features/auth/components/YandexIdButton';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';

export const Register = () => {
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
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPolicyError('');

    if (!isPasswordStrong) {
      setPasswordError('Исправьте требования к паролю ниже');
      return;
    }

    if (!passwordsMatch) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    if (!acceptedPolicies) {
      setPolicyError('Необходимо принять политику и правила использования');
      return;
    }

    register({ email, password });
  };

  return (
    <Layout maxWidth="sm">
      <PageMeta
        title="Регистрация | ДоговорAI — AI-конструктор договоров"
        description="Зарегистрируйтесь в ДоговорAI, чтобы создавать договоры (NDA, SLA и другие) с помощью AI и экспортировать DOCX/PDF."
      />
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Регистрация
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Этот email уже используется
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
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                label="Пароль"
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
                        aria-label="показать пароль"
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
                {[
                  { key: 'length', text: 'Минимум 8 символов' },
                  { key: 'lower', text: 'Строчная буква (a-z)' },
                  { key: 'upper', text: 'Заглавная буква (A-Z)' },
                  { key: 'digit', text: 'Цифра (0-9)' },
                ].map(({ key, text }) => {
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
                      <span>{text}</span>
                    </Stack>
                  );
                })}
              </Stack>

              <TextField
                fullWidth
                label="Подтвердите пароль"
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
                        aria-label="показать пароль"
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
                      ? 'Пароли совпадают'
                      : 'Пароли должны совпадать'
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
                      Я принимаю{' '}
                      <MuiLink component={Link} to="/privacy">
                        политику конфиденциальности
                      </MuiLink>{' '}
                      и{' '}
                      <MuiLink component={Link} to="/terms">
                        правила использования
                      </MuiLink>
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
                {isPending ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </form>

            <YandexIdButton key={location.key} disabled={isPending} />
            <GoogleSignInButton disabled={isPending} />

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Уже есть аккаунт?{' '}
                <MuiLink component={Link} to="/login">
                  Войти
                </MuiLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
