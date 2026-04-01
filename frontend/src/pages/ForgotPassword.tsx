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
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';
import { useAuthStore, useRequestPasswordReset } from '@/features/auth/hooks/useAuth';
import { AxiosError } from 'axios';

export const ForgotPassword = () => {
  const { isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const { mutate, isPending, isSuccess, error } = useRequestPasswordReset();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
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
        title="Восстановление пароля | ДоговорAI — AI-конструктор договоров"
        description="Восстановление доступа к аккаунту ДоговорAI по email."
      />
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Восстановление пароля
            </Typography>

            {isSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Если такой аккаунт есть, на почту придёт письмо со ссылкой. Проверьте папку «Спам».
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Укажите email аккаунта. Если для него задан пароль (не только вход через Яндекс), мы
                  отправим ссылку для сброса.
                </Typography>

                {detail && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {detail}
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
                    {isPending ? 'Отправка...' : 'Отправить ссылку'}
                  </Button>
                </form>
              </>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Вход через Яндекс ID?{' '}
              <MuiLink component={Link} to="/login">
                Страница входа
              </MuiLink>
            </Typography>

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
