import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Collapse,
} from '@mui/material';
import { useMemo, useState, useEffect } from 'react';
import { Layout } from '@/shared/components';
import {
  useAdminLogin,
  useAdminLogout,
  useAdminOverview,
  useAdminStore,
  useAdminUsers,
} from '@/features/admin/hooks/useAdmin';
import { adminApi } from '@/shared/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const Admin = () => {
  const { isAuthenticated } = useAdminStore();
  const loginMutation = useAdminLogin();
  const logout = useAdminLogout();
  const overviewQuery = useAdminOverview(isAuthenticated);
  const usersQuery = useAdminUsers(isAuthenticated);
  const queryClient = useQueryClient();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeEnabled, setNoticeEnabled] = useState(false);
  const [showNoticeSettings, setShowNoticeSettings] = useState(false);

  const noticeQuery = useQuery({
    queryKey: ['admin', 'notice'],
    queryFn: () => adminApi.getNotice(),
    enabled: isAuthenticated,
  });

  const updateNoticeMutation = useMutation({
    mutationFn: (payload: { message: string; enabled: boolean }) => adminApi.updateNotice(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'notice'], data);
    },
  });

  useEffect(() => {
    if (noticeQuery.data) {
      setNoticeMessage(noticeQuery.data.message);
      setNoticeEnabled(noticeQuery.data.enabled);
    }
  }, [noticeQuery.data]);
  const loginErrorMessage = useMemo(() => {
    if (!loginMutation.error) return null;
    const err = loginMutation.error as any;
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (err?.message) {
      return err.message;
    }
    return 'Не удалось войти';
  }, [loginMutation.error]);

  const documentStatuses = useMemo(() => {
    const entries = Object.entries(overviewQuery.data?.documents.by_status || {});
    return entries.length
      ? entries
      : [
          ['draft', 0],
          ['final', 0],
        ];
  }, [overviewQuery.data]);

  if (!isAuthenticated) {
    return (
      <Layout maxWidth="sm">
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Вход в админ-панель
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Доступ ограничен. Введите логин и пароль из переменных окружения.
            </Typography>
            {loginErrorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {loginErrorMessage}
              </Alert>
            )}
            <Stack
              component="form"
              spacing={2}
              onSubmit={(e) => {
                e.preventDefault();
                loginMutation.mutate({ login, password });
              }}
            >
              <TextField
                label="Логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoComplete="username"
              />
              <TextField
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Button type="submit" variant="contained" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Вход...' : 'Войти'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Админ-панель</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => overviewQuery.refetch()}>
              Обновить
            </Button>
            <Button variant="text" color="error" onClick={logout}>
              Выйти
            </Button>
          </Stack>
        </Stack>

        {overviewQuery.isError && (
          <Alert severity="error">Не удалось загрузить сводку</Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Пользователи (всего)
                </Typography>
                <Typography variant="h5">
                  {overviewQuery.data?.users.total ?? '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Активные: {overviewQuery.data?.users.active ?? '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Админы: {overviewQuery.data?.users.admin ?? '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Новые 30д: {overviewQuery.data?.users.new_last_30d ?? '—'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Договоры
                </Typography>
                <Typography variant="h5">
                  {overviewQuery.data?.documents.total ?? '—'}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                  {documentStatuses.map(([status, count]) => (
                    <Chip key={status} label={`${status}: ${count}`} size="small" />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Подписки
                </Typography>
                <Typography variant="h5">
                  {overviewQuery.data?.subscriptions.total ?? '—'}
                </Typography>
                <Stack spacing={0.5} mt={1}>
                  {(overviewQuery.data?.subscriptions.by_plan_status || []).map((row) => (
                    <Typography key={`${row.plan}-${row.status}`} variant="body2" color="text.secondary">
                      {row.plan} / {row.status}: {row.count}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Гости
                </Typography>
                <Typography variant="h5">
                  {overviewQuery.data?.guests.total ?? '—'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Пользователи</Typography>
              <Button variant="outlined" size="small" onClick={() => usersQuery.refetch()}>
                Обновить
              </Button>
            </Stack>
            {usersQuery.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Не удалось загрузить пользователей
              </Alert>
            )}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Роли</TableCell>
                  <TableCell>Активен</TableCell>
                  <TableCell>Создан</TableCell>
                  <TableCell align="right">Договоров</TableCell>
                  <TableCell align="right">Подписка</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(usersQuery.data || []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Chip label="user" size="small" color="info" />
                        {user.isAdmin && <Chip label="admin" size="small" color="warning" />}
                      </Stack>
                    </TableCell>
                    <TableCell>{user.isActive ? 'Да' : 'Нет'}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleString('ru-RU')}</TableCell>
                    <TableCell align="right">{user.documentsCount}</TableCell>
                    <TableCell align="right">
                      {user.subscriptionPlan ? `${user.subscriptionPlan} (${user.subscriptionStatus})` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {usersQuery.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography align="center" color="text.secondary">
                        Пользователей нет
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Предупреждение на дашборде</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowNoticeSettings((prev) => !prev)}
              >
                {showNoticeSettings ? 'Скрыть' : 'Показать'}
              </Button>
            </Stack>
            <Collapse in={showNoticeSettings} timeout="auto" unmountOnExit>
              {noticeQuery.isError && <Alert severity="error">Не удалось загрузить предупреждение</Alert>}
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="flex-end">
                  <Button variant="outlined" size="small" onClick={() => noticeQuery.refetch()}>
                    Обновить
                  </Button>
                </Stack>
                <TextField
                  label="Текст предупреждения"
                  multiline
                  minRows={2}
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  placeholder="Краткое сообщение пользователям"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={noticeEnabled}
                      onChange={(e) => setNoticeEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Показывать на дашборде"
                />
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    variant="contained"
                    size="small"
                    disabled={updateNoticeMutation.isPending}
                    onClick={() => {
                      updateNoticeMutation.mutate({
                        message: noticeMessage.trim(),
                        enabled: noticeEnabled && Boolean(noticeMessage.trim()),
                      });
                    }}
                  >
                    {updateNoticeMutation.isPending ? 'Сохраняю...' : 'Сохранить'}
                  </Button>
                </Stack>
                {updateNoticeMutation.isError && (
                  <Alert severity="error">Не удалось сохранить предупреждение</Alert>
                )}
              </Stack>
            </Collapse>
          </CardContent>
        </Card>

      </Stack>
    </Layout>
  );
};
