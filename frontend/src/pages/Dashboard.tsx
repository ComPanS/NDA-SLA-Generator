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
} from '@mui/material';
import { Add, Description } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Layout, ProtectedRoute } from '@/shared/components';
import { useContractsList, useDeleteContract, useRenameContract } from '@/features/contracts/hooks/useContracts';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { noticeApi } from '@/shared/api';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { data: documents, isLoading, error } = useContractsList();
  const { mutate: deleteContract, isPending: isDeleting } = useDeleteContract();
  const { mutate: renameContract, isPending: isRenaming } = useRenameContract();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'final'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc'>('updated_desc');
  const noticeQuery = useQuery({
    queryKey: ['notice'],
    queryFn: () => noticeApi.getNotice(),
  });

  const filtered = useMemo(() => {
    const list = documents || [];
    return list
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
            return a.title.localeCompare(b.title, 'ru');
          case 'title_desc':
            return b.title.localeCompare(a.title, 'ru');
          case 'updated_desc':
          default:
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
      });
  }, [documents, search, statusFilter, dateFrom, dateTo, sortBy]);

  return (
    <ProtectedRoute>
      <Layout>
        {noticeQuery.data?.enabled && noticeQuery.data.message && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {noticeQuery.data.message}
          </Alert>
        )}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Мои документы
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/new-contract')}
            sx={{ mt: 2 }}
          >
            Создать новый договор
          </Button>
        </Box>

        {isLoading && <Typography>Загрузка документов...</Typography>}
        {error && <Typography color="error">Не удалось загрузить документы</Typography>}

        {!isLoading && !error && (
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Поиск по названию"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      fullWidth
                    />
                    <FormControl sx={{ minWidth: 160 }}>
                      <InputLabel>Статус</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Статус"
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                      >
                        <MenuItem value="all">Все</MenuItem>
                        <MenuItem value="draft">Черновик</MenuItem>
                        <MenuItem value="final">Финальный</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Сортировка</InputLabel>
                      <Select
                        value={sortBy}
                        label="Сортировка"
                        onChange={(e) => setSortBy(e.target.value as any)}
                      >
                        <MenuItem value="updated_desc">По обновлению (новые)</MenuItem>
                        <MenuItem value="updated_asc">По обновлению (старые)</MenuItem>
                        <MenuItem value="title_asc">Название А→Я</MenuItem>
                        <MenuItem value="title_desc">Название Я→А</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Дата с"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      sx={{ minWidth: 200 }}
                    />
                    <TextField
                      label="Дата по"
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
                      <Chip label={doc.status === 'draft' ? 'Черновик' : 'Финальный'} size="small" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Из шаблона: {doc.template_name || (doc.template_id ? doc.template_id : 'Без шаблона')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Обновлён: {new Date(doc.updated_at).toLocaleString('ru-RU')}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button size="small" variant="contained" onClick={() => navigate(`/contract/${doc.id}`)}>
                        Открыть
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={isRenaming}
                        onClick={() => {
                          const nextTitle = prompt('Новое название договора', doc.title);
                          if (nextTitle && nextTitle.trim()) {
                            renameContract({ documentId: doc.id, title: nextTitle.trim() });
                          }
                        }}
                      >
                        Переименовать
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="text"
                        disabled={isDeleting}
                        onClick={() => {
                          if (confirm('Удалить договор? Это действие необратимо.')) {
                            deleteContract(doc.id);
                          }
                        }}
                      >
                        Удалить
                      </Button>
                      {latest && (
                        <Typography variant="body2" color="text.secondary">
                          Текущая версия: {latest.version}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                У вас пока нет документов. Создайте первый договор.
              </Typography>
            )}
          </Stack>
        )}
      </Layout>
    </ProtectedRoute>
  );
};
