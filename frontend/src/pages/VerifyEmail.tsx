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
import { useTranslation } from 'react-i18next';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';
import { useAuthStore, useResendVerification, useVerifyEmail } from '@/features/auth/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useLocalizedPath } from '@/shared/i18n/useLocalizedPath';

const RESEND_COOLDOWN_SECONDS = 60;

export const VerifyEmail = () => {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const localizedPath = useLocalizedPath();
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
    return <Navigate to={localizedPath('/register')} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    verifyMutation.mutate(
      { email, code },
      {
        onError: () => {
          setError(t('verify.verifyError'));
        },
      },
    );
  };

  const handleResend = () => {
    setError(null);
    resendMutation.mutate(email, {
      onSuccess: () => setCooldown(RESEND_COOLDOWN_SECONDS),
      onError: () => setError(t('verify.resendError')),
    });
  };

  return (
    <Layout maxWidth="sm">
      <PageMeta
        title={t('verify.metaTitle')}
        description={t('verify.metaDescription')}
        siteName={tc('brand.name')}
        robots="noindex,nofollow"
      />
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant="h4" component="h1">
                  {t('verify.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t('verify.sentTo', { email })}
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
                    label={t('verify.codeLabel')}
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
                    {verifyMutation.isPending ? t('verify.submitting') : t('verify.submit')}
                  </Button>
                </Stack>
              </form>

              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="text"
                  onClick={handleResend}
                  disabled={resendMutation.isPending || cooldown > 0}
                >
                  {cooldown > 0
                    ? t('verify.resendWait', { seconds: cooldown })
                    : t('verify.resend')}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};
