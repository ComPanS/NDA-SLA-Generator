import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  Chip,
  Stack,
  Button,
  IconButton,
} from '@mui/material';
import { ProtectedRoute, Layout, LoadingSpinner, ErrorMessage } from '@/shared/components';
import { useTemplate, useTemplates, useDeleteTemplate } from '@/features/templates/hooks/useTemplates';
import { TemplateBuilder } from '@/features/templates/components/TemplateBuilder';
import { Delete } from '@mui/icons-material';

export const Templates = () => {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const { data: templates, isLoading, error } = useTemplates();
  const { data: selectedTemplate, isLoading: loadingTemplate } = useTemplate(selectedId);
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteTemplate();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Загрузка шаблонов..." />
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <ErrorMessage message="Не удалось загрузить шаблоны" />
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { md: '320px 1fr', xs: '1fr' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6">Шаблоны</Typography>
                <Button size="small" onClick={() => setSelectedId(undefined)}>
                  Новый
                </Button>
              </Stack>
              <List dense>
                {templates?.map((tpl) => (
                  <ListItem key={tpl.id} disablePadding>
                    <ListItemButton
                      selected={selectedId === tpl.id}
                      onClick={() => setSelectedId(tpl.id)}
                    >
                      <ListItemText
                        primary={tpl.name}
                        secondary={
                          tpl.groups?.length
                            ? `${tpl.groups.length} групп, ${tpl.groups.reduce(
                                (acc, g) => acc + g.fields.length,
                                0
                              )} полей`
                            : 'Без полей'
                        }
                      />
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        disabled={isDeleting}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Удалить шаблон? Договоры останутся без привязки.')) {
                            deleteTemplate(tpl.id, {
                              onSuccess: () => {
                                if (selectedId === tpl.id) {
                                  setSelectedId(undefined);
                                }
                              },
                            });
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Stack spacing={2}>
            <Typography variant="h5">
              {selectedId ? 'Редактирование шаблона' : 'Создание нового шаблона'}
            </Typography>
            {loadingTemplate && selectedId ? (
              <LoadingSpinner message="Загрузка выбранного шаблона..." />
            ) : (
              <TemplateBuilder template={selectedTemplate} />
            )}

            {selectedTemplate && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Структура выбранного шаблона
                  </Typography>
                  {selectedTemplate.groups.map((group) => (
                    <Box key={group.id} sx={{ mb: 2 }}>
                      <Typography variant="body1" fontWeight={600}>
                        {group.label}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                        {group.fields.map((field) => (
                          <Chip key={field.id} label={`${field.label} (${field.key})`} />
                        ))}
                      </Stack>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}
          </Stack>
        </Box>
      </Layout>
    </ProtectedRoute>
  );
};
