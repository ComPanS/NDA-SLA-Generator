import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { profileApi } from '@/shared/api';
import { resolveLocalizedPath } from '@/shared/i18n/resolveLocalizedPath';
import {
  ConfirmDialog,
  ErrorMessage,
  Layout,
  LoadingSpinner,
  PageMeta,
  ProtectedRoute,
} from '@/shared/components';
import { authStore } from '@/features/auth/store/authStore';
import { useState } from 'react';
import { icuLocaleFor } from '@/shared/i18n/icuLocale';

export const Profile = () => {
  const { t, i18n } = useTranslation('profile');
  const { t: tc } = useTranslation('common');
  const locale = icuLocaleFor(i18n.language);
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
  });

  const { mutate: deleteAccount, isPending: isDeleting } = useMutation({
    mutationFn: () => profileApi.deleteAccount(),
    onSuccess: () => {
      authStore.getState().logout();
      navigate(resolveLocalizedPath('/'), { replace: true });
    },
  });

  const initials = data?.displayName?.[0] || data?.email?.[0] || '?';

  return (
    <ProtectedRoute>
      <Layout>
        <PageMeta title={t('metaTitle')} description={t('metaDesc')} siteName={tc('brand.name')} />

        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('title')}
          </Typography>
          {/* <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Базовая информация об аккаунте и управление безопасностью.
          </Typography> */}

          {isLoading && <LoadingSpinner message={t('loading')} />}
          {isError && <ErrorMessage message={t('loadError')} />}

          {data && (
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                    <Avatar sx={{ width: 72, height: 72, fontSize: 28 }}>{initials}</Avatar>
                    <Stack spacing={1} flex={1} sx={{ width: '100%' }}>
                      {/* <Typography variant="h6">{data.displayName || 'Без имени'}</Typography> */}
                      <Typography color="text.secondary">{data.email}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={data.emailVerified ? t('emailVerified') : t('emailNotVerified')}
                          color={data.emailVerified ? 'success' : 'warning'}
                          size="small"
                        />
                        {data.subscription ? (
                          <Chip
                            label={t('plan', { plan: data.subscription.plan.toUpperCase() })}
                            color="primary"
                            size="small"
                          />
                        ) : (
                          <Chip label={t('noSubscription')} size="small" />
                        )}
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                          {t('created', { date: new Date(data.createdAt).toLocaleString(locale) })}
                        </Typography>
                        {/* <Typography variant="body2" color="text.secondary">
                          Обновлен: {new Date(data.updatedAt).toLocaleString('ru-RU')}
                        </Typography> */}
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="h6">{t('deleteSection')}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('deleteHint')}
                    </Typography>
                    <Divider />
                    <Box>
                      <Button
                        color="error"
                        variant="contained"
                        onClick={() => setConfirmOpen(true)}
                      >
                        {t('deleteBtn')}
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Box>

        <ConfirmDialog
          open={confirmOpen}
          title={t('confirmTitle')}
          message={t('confirmMessage')}
          confirmText={t('confirm')}
          confirmColor="error"
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => deleteAccount()}
          isLoading={isDeleting}
        />
      </Layout>
    </ProtectedRoute>
  );
};
