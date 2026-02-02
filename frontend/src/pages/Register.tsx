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
} from '@mui/material';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useRegister, useAuthStore } from '@/features/auth/hooks/useAuth';
import { YandexIdButton } from '@/features/auth/components/YandexIdButton';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const Register = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [policyError, setPolicyError] = useState('');
  const { mutate: register, isPending, error } = useRegister();
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPolicyError('');



    if (password !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setPasswordError('Минимум 8 символов, буквы в разном регистре и цифра');
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                helperText="Минимум 8 символов, буквы в разном регистре и цифра"
              />

              <TextField
                fullWidth
                label="Подтвердите пароль"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
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
