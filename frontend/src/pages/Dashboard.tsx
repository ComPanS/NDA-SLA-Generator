import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add, Description } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useLocalizedNavigate } from '@/shared/i18n/useLocalizedPath';
import { Layout, ProtectedRoute } from '@/shared/components';
import {
  useContractsList,
  useDeleteContract,
  useRenameContract,
} from '@/features/contracts/hooks/useContracts';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { noticeApi } from '@/shared/api';
import { PageMeta } from '@/shared/components/PageMeta';
import { useConfirmPayment } from '@/features/billing/hooks/useBilling';
import { authStore } from '@/features/auth/store/authStore';
import { icuLocaleFor } from '@/shared/i18n/icuLocale';

export const Dashboard = () => {
  const { t, i18n } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const locale = icuLocaleFor(i18n.language);
  const navigate = useLocalizedNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: documents, isLoading, error } = useContractsList();
  const { mutate: deleteContract, isPending: isDeleting } = useDeleteContract();
  const { mutate: renameContract, isPending: isRenaming } = useRenameContract();
  const confirmPaymentMutation = useConfirmPayment();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'final'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc'>(
    'updated_desc'
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const noticeQuery = useQuery({
    queryKey: ['notice'],
    queryFn: () => noticeApi.getNotice(),
  });

  // Get hydration state
  const hasHydrated = authStore((state) => state._hasHydrated);
  const isAuthenticated = authStore((state) => state.isAuthenticated);

  // Handle payment success redirect - only after hydration
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success' && hasHydrated && isAuthenticated) {
      // Remove the query param first to prevent re-triggering
      setSearchParams({});

      // Confirm payment on backend
      confirmPaymentMutation.mutate(undefined, {
        onSuccess: (result) => {
          setSnackbarMessage(result.message || t('paymentSuccess'));
          setSnackbarOpen(true);
          queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
        },
        onError: () => {
          queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
          setSnackbarMessage(t('paymentPending'));
          setSnackbarOpen(true);
        },
      });
    }
  }, [
    searchParams,
    setSearchParams,
    hasHydrated,
    isAuthenticated,
    confirmPaymentMutation,
    queryClient,
    t,
  ]);

  const hasDocuments = (documents?.length || 0) > 0;

  const filtered = useMemo(() => {
    if (!hasDocuments) return [];
    return (documents || [])
      .filter((doc) => {
        const matchSearch = search.trim()
          ? doc.title.toLowerCase().includes(search.trim().toLowerCase())
          : true;
        const matchStatus = statusFilter === 'all' ? true : doc.status === statusFilter;
        const updated = new Date(doc.updated_at);
        const matchFrom = dateFrom ? updated >= new Date(dateFrom) : true;
        const matchTo = dateTo ? updated <= new Date(`${dateTo}T23:59:59`) : true;
        return matchSearch && matchStatus && matchFrom && matchTo;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'updated_asc':
            return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          case 'title_asc':
            return a.title.localeCompare(b.title, locale);
          case 'title_desc':
            return b.title.localeCompare(a.title, locale);
          case 'updated_desc':
          default:
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
      });
  }, [documents, hasDocuments, search, statusFilter, dateFrom, dateTo, sortBy, locale]);

  return (
    <ProtectedRoute>
      <Layout>
        <PageMeta
          title={t('meta.title')}
          description={t('meta.description')}
          siteName={tc('brand.name')}
        />
        {noticeQuery.data?.enabled && noticeQuery.data.message && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {noticeQuery.data.message}
          </Alert>
        )}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('title')}
          </Typography>
          {hasDocuments && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/new-contract')}
              sx={{ mt: 2 }}
            >
              {t('createNew')}
            </Button>
          )}
        </Box>

        {isLoading && <Typography>{t('loading')}</Typography>}
        {error && <Typography color="error">{t('loadError')}</Typography>}

        {!isLoading && !error && (
          <>
            {hasDocuments ? (
              <Stack spacing={2}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                          label={t('searchLabel')}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          fullWidth
                        />
                        <FormControl sx={{ minWidth: 160 }}>
                          <InputLabel>{t('statusLabel')}</InputLabel>
                          <Select
                            value={statusFilter}
                            label={t('statusLabel')}
                            onChange={(e) =>
                              setStatusFilter(e.target.value as 'all' | 'draft' | 'final')
                            }
                          >
                            <MenuItem value="all">{t('statusAll')}</MenuItem>
                            <MenuItem value="draft">{t('statusDraft')}</MenuItem>
                            <MenuItem value="final">{t('statusFinal')}</MenuItem>
                          </Select>
                        </FormControl>
                        <FormControl sx={{ minWidth: 200 }}>
                          <InputLabel>{t('sortLabel')}</InputLabel>
                          <Select
                            value={sortBy}
                            label={t('sortLabel')}
                            onChange={(e) =>
                              setSortBy(
                                e.target.value as
                                  | 'updated_desc'
                                  | 'updated_asc'
                                  | 'title_asc'
                                  | 'title_desc'
                              )
                            }
                          >
                            <MenuItem value="updated_desc">{t('sortUpdatedDesc')}</MenuItem>
                            <MenuItem value="updated_asc">{t('sortUpdatedAsc')}</MenuItem>
                            <MenuItem value="title_asc">{t('sortTitleAsc')}</MenuItem>
                            <MenuItem value="title_desc">{t('sortTitleDesc')}</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                          label={t('dateFrom')}
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          sx={{ minWidth: 200 }}
                        />
                        <TextField
                          label={t('dateTo')}
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          sx={{ minWidth: 200 }}
                        />
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                {filtered.map((doc) => {
                  const latest = doc.versions?.[doc.versions.length - 1];
                  return (
                    <Card key={doc.id} variant="outlined">
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Description fontSize="small" />
                          <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {doc.title}
                          </Typography>
                          <Chip
                            label={doc.status === 'draft' ? t('statusDraft') : t('statusFinal')}
                            size="small"
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {t('fromTemplate')}{' '}
                          {doc.template_name || (doc.template_id ? doc.template_id : t('noTemplate'))}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('updated')} {new Date(doc.updated_at).toLocaleString(locale)}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1.5}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                        >
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate(`/contract/${doc.id}`)}
                          >
                            {t('open')}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={isRenaming}
                            onClick={() => {
                              const nextTitle = prompt(t('renamePrompt'), doc.title);
                              if (nextTitle && nextTitle.trim()) {
                                renameContract({ documentId: doc.id, title: nextTitle.trim() });
                              }
                            }}
                            sx={{ width: { xs: '100%', sm: 'auto' } }}
                          >
                            {t('rename')}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            disabled={isDeleting}
                            onClick={() => {
                              if (confirm(t('deleteConfirm'))) {
                                deleteContract(doc.id);
                              }
                            }}
                            sx={{ width: { xs: '100%', sm: 'auto' } }}
                          >
                            {t('delete')}
                          </Button>
                          {latest && (
                            <Typography variant="body2" color="text.secondary">
                              {t('currentVersion')} {latest.version}
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}

                {filtered.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {t('emptyFiltered')}
                  </Typography>
                )}
              </Stack>
            ) : (
              <Box
                sx={{
                  mt: 4,
                  minHeight: { xs: '50vh', md: '60vh' },
                  py: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: 2,
                }}
              >
                <Typography variant="h6">{t('emptyStateTitle')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('emptyStateHint')}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  size="large"
                  onClick={() => navigate('/new-contract')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  {t('createNew')}
                </Button>
              </Box>
            )}
          </>
        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Layout>
    </ProtectedRoute>
  );
};
