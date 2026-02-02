import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Layout } from '@/shared/components';
import { useAuthStore, useResendVerification, useVerifyEmail } from '@/features/auth/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const RESEND_COOLDOWN_SECONDS = 60;

export const VerifyEmail = () => {
  const { pendingEmail } = useAuthStore();
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const email = useMemo(() => pendingEmail || '', [pendingEmail]);

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    verifyMutation.mutate(
      { email, code },
      {
        onError: () => {
          setError('Неверный или просроченный код. Попробуйте ещё раз.');
        },
      },
    );
  };

  const handleResend = () => {
    setError(null);
    resendMutation.mutate(email, {
      onSuccess: () => setCooldown(RESEND_COOLDOWN_SECONDS),
      onError: () => setError('Не удалось отправить код. Попробуйте позже.'),
    });
  };

  return (
    <Layout maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant="h4" component="h1">
                  Подтверждение email
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Мы отправили код подтверждения на {email}. Введите его ниже, чтобы завершить
                  регистрацию.
                </Typography>
              </Stack>

              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="Код из письма"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    required
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? 'Проверяем...' : 'Подтвердить'}
                  </Button>
                </Stack>
              </form>

              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="text"
                  onClick={handleResend}
                  disabled={resendMutation.isPending || cooldown > 0}
                >
                  {cooldown > 0 ? `Отправить снова через ${cooldown} c` : 'Отправить код ещё раз'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
