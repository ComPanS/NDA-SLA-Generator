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
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';
import { useAuthStore, useResetPassword } from '@/features/auth/hooks/useAuth';
import { AxiosError } from 'axios';

export const ResetPassword = () => {
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
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!isPasswordStrong) {
      setPasswordError('Исправьте требования к паролю ниже');
      return;
    }
    if (!passwordsMatch) {
      setPasswordError('Пароли должны совпадать');
      return;
    }
    mutate({ token, password });
  };

  const detail =
    error && typeof (error as AxiosError<{ detail?: string }>).response?.data?.detail === 'string'
      ? (error as AxiosError<{ detail: string }>).response!.data.detail
      : null;

  if (!token) {
    return (
      <Layout maxWidth="sm">
        <PageMeta
          title="Сброс пароля | ДоговорAI — AI-конструктор договоров"
          description="Задать новый пароль для аккаунта ДоговорAI."
        />
        <Box sx={{ mt: 8 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom align="center">
                Ссылка недействительна
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                В адресе нет ключа сброса. Откройте ссылку из письма или запросите новую.
              </Alert>
              <Typography variant="body2" align="center">
                <MuiLink component={Link} to="/forgot-password">
                  Запросить ссылку
                </MuiLink>
                {' · '}
                <MuiLink component={Link} to="/login">
                  Вход
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
        title="Новый пароль | ДоговорAI — AI-конструктор договоров"
        description="Задать новый пароль для аккаунта ДоговорAI."
      />
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Новый пароль
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Придумайте пароль для входа по email.
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
                label="Новый пароль"
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
                disabled={isPending}
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

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                disabled={isPending}
              >
                {isPending ? 'Сохранение...' : 'Сохранить пароль'}
              </Button>
            </form>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              <MuiLink component={Link} to="/login">
                ← Назад ко входу
              </MuiLink>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
