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
} from '@mui/material';
import { Link, Navigate } from 'react-router-dom';
import { useRegister, useAuthStore } from '@/features/auth/hooks/useAuth';
import { Layout } from '@/shared/components';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { mutate: register, isPending, error } = useRegister();
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    register({ email, password });
  };

  return (
    <Layout maxWidth="sm">
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
                helperText="Минимум 6 символов"
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
