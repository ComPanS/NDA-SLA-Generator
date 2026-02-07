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
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useLogin, useAuthStore } from '@/features/auth/hooks/useAuth';
import { YandexIdButton } from '@/features/auth/components/YandexIdButton';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';

export const Login = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <PageMeta
        title="Вход | ДоговорAI — AI-конструктор договоров"
        description="Войдите в ДоговорAI, чтобы создавать и управлять договорами (NDA, SLA и другие) с помощью AI."
      />
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <YandexIdButton key={location.key} disabled={isPending} />

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
