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
import { useLogin, useAuthStore } from '@/features/auth/hooks/useAuth';
import { Layout } from '@/shared/components';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending, error } = useLogin();
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <Layout maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Вход
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Неверный email или пароль
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
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                disabled={isPending}
              >
                {isPending ? 'Вход...' : 'Войти'}
              </Button>
            </form>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Нет аккаунта?{' '}
                <MuiLink component={Link} to="/register">
                  Зарегистрироваться
                </MuiLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
