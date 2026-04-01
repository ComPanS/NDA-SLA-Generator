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
  TableContainer,
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
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { icuLocaleFor } from '@/shared/i18n/icuLocale';

export const Admin = () => {
  const { t, i18n } = useTranslation('admin');
  const dash = t('dash');
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
    const err = loginMutation.error as AxiosError<{ detail?: string }>;
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (err?.message) {
      return err.message;
    }
    return t('loginFailed');
  }, [loginMutation.error, t]);

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
              {t('loginTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('loginHint')}
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
                label={t('username')}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoComplete="username"
              />
              <TextField
                label={t('password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Button type="submit" variant="contained" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? t('loggingIn') : t('loginSubmit')}
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
          <Typography variant="h4">{t('panelTitle')}</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => overviewQuery.refetch()}>
              {t('refresh')}
            </Button>
            <Button variant="text" color="error" onClick={logout}>
              {t('logout')}
            </Button>
          </Stack>
        </Stack>

        {overviewQuery.isError && <Alert severity="error">{t('overviewLoadError')}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  {t('usersTotal')}
                </Typography>
                <Typography variant="h5">{overviewQuery.data?.users.total ?? dash}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('usersActive', { val: overviewQuery.data?.users.active ?? dash })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('usersAdmins', { val: overviewQuery.data?.users.admin ?? dash })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('usersNew30d', { val: overviewQuery.data?.users.new_last_30d ?? dash })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  {t('contracts')}
                </Typography>
                <Typography variant="h5">{overviewQuery.data?.documents.total ?? dash}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                  {documentStatuses.map(([status, count]) => (
                    <Chip
                      key={status}
                      label={t('statusCount', { status, count })}
                      size="small"
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  {t('subscriptions')}
                </Typography>
                <Typography variant="h5">
                  {overviewQuery.data?.subscriptions.total ?? dash}
                </Typography>
                <Stack spacing={0.5} mt={1}>
                  {(overviewQuery.data?.subscriptions.by_plan_status || []).map((row) => (
                    <Typography
                      key={`${row.plan}-${row.status}`}
                      variant="body2"
                      color="text.secondary"
                    >
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
                  {t('guests')}
                </Typography>
                <Typography variant="h5">{overviewQuery.data?.guests.total ?? dash}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">{t('usersSection')}</Typography>
              <Button variant="outlined" size="small" onClick={() => usersQuery.refetch()}>
                {t('refresh')}
              </Button>
            </Stack>
            {usersQuery.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t('usersLoadError')}
              </Alert>
            )}
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('colEmail')}</TableCell>
                    <TableCell>{t('colRoles')}</TableCell>
                    <TableCell>{t('colActive')}</TableCell>
                    <TableCell>{t('colCreated')}</TableCell>
                    <TableCell align="right">{t('colContracts')}</TableCell>
                    <TableCell align="right">{t('colSubscription')}</TableCell>
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
                      <TableCell>{user.isActive ? t('yes') : t('no')}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleString(icuLocaleFor(i18n.language))}
                      </TableCell>
                      <TableCell align="right">{user.documentsCount}</TableCell>
                      <TableCell align="right">
                        {user.subscriptionPlan
                          ? `${user.subscriptionPlan} (${user.subscriptionStatus})`
                          : dash}
                      </TableCell>
                    </TableRow>
                  ))}
                  {usersQuery.data?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography align="center" color="text.secondary">
                          {t('usersEmpty')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">{t('noticeTitle')}</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowNoticeSettings((prev) => !prev)}
              >
                {showNoticeSettings ? t('noticeHide') : t('noticeShow')}
              </Button>
            </Stack>
            <Collapse in={showNoticeSettings} timeout="auto" unmountOnExit>
              {noticeQuery.isError && (
                <Alert severity="error">{t('noticeLoadError')}</Alert>
              )}
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="flex-end">
                  <Button variant="outlined" size="small" onClick={() => noticeQuery.refetch()}>
                    {t('refresh')}
                  </Button>
                </Stack>
                <TextField
                  label={t('noticeMessageLabel')}
                  multiline
                  minRows={2}
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  placeholder={t('noticePlaceholder')}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={noticeEnabled}
                      onChange={(e) => setNoticeEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={t('noticeEnabledLabel')}
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
                    {updateNoticeMutation.isPending ? t('noticeSaving') : t('noticeSave')}
                  </Button>
                </Stack>
                {updateNoticeMutation.isError && (
                  <Alert severity="error">{t('noticeSaveError')}</Alert>
                )}
              </Stack>
            </Collapse>
          </CardContent>
        </Card>
      </Stack>
    </Layout>
  );
};
