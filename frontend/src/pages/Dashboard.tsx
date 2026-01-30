import { Box, Typography, Button, Card, CardContent, Stack, Chip, Divider } from '@mui/material';
import { Add, Description } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Layout, ProtectedRoute } from '@/shared/components';
import { useContractsList, useDeleteContract, useRenameContract } from '@/features/contracts/hooks/useContracts';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { data: documents, isLoading, error } = useContractsList();
  const { mutate: deleteContract, isPending: isDeleting } = useDeleteContract();
  const { mutate: renameContract, isPending: isRenaming } = useRenameContract();

  return (
    <ProtectedRoute>
      <Layout>
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
            {(documents || []).map((doc) => {
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

            {(documents || []).length === 0 && (
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
