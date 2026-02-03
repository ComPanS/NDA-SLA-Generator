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
import { profileApi } from '@/shared/api';
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

export const Profile = () => {
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
      navigate('/');
    },
  });

  const initials = data?.displayName?.[0] || data?.email?.[0] || '?';

  return (
    <ProtectedRoute>
      <Layout>
        <PageMeta title="Профиль | ДоговорAI" description="Ваш профиль и управление аккаунтом" />

        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Профиль
          </Typography>
          {/* <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Базовая информация об аккаунте и управление безопасностью.
          </Typography> */}

          {isLoading && <LoadingSpinner message="Загружаем профиль..." />}
          {isError && <ErrorMessage message="Не удалось загрузить профиль" />}

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
                          label={data.emailVerified ? 'Email подтвержден' : 'Email не подтвержден'}
                          color={data.emailVerified ? 'success' : 'warning'}
                          size="small"
                        />
                        {data.subscription ? (
                          <Chip
                            label={`Тариф: ${data.subscription.plan.toUpperCase()}`}
                            color="primary"
                            size="small"
                          />
                        ) : (
                          <Chip label="Без подписки" size="small" />
                        )}
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                          Аккаунт создан: {new Date(data.createdAt).toLocaleString('ru-RU')}
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
                    <Typography variant="h6">Удаление аккаунта</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Это действие удалит ваш аккаунт, документы, шаблоны, платежи и активные
                      подписки. Операция необратима.
                    </Typography>
                    <Divider />
                    <Box>
                      <Button
                        color="error"
                        variant="contained"
                        onClick={() => setConfirmOpen(true)}
                      >
                        Удалить аккаунт
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
          title="Удалить аккаунт?"
          message="Мы удалим ваш профиль, документы, шаблоны и платежную историю. Действие нельзя отменить."
          confirmText="Удалить"
          confirmColor="error"
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => deleteAccount()}
          isLoading={isDeleting}
        />
      </Layout>
    </ProtectedRoute>
  );
};
