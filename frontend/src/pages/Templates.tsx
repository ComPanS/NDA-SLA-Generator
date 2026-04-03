import { useEffect, useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { ProtectedRoute, Layout, LoadingSpinner, ErrorMessage } from '@/shared/components';
import {
  useTemplate,
  useTemplates,
  useDeleteTemplate,
} from '@/features/templates/hooks/useTemplates';
import { TemplateBuilder } from '@/features/templates/components/TemplateBuilder';
import { Delete } from '@mui/icons-material';

export const Templates = () => {
  const { t } = useTranslation('templates');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const { data: templates, isLoading, error } = useTemplates();
  const userTemplates = useMemo(
    () => (templates ?? []).filter((tpl) => !tpl.is_system),
    [templates],
  );
  const { data: selectedTemplate, isLoading: loadingTemplate } = useTemplate(selectedId);
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteTemplate();

  useEffect(() => {
    if (!selectedId || templates === undefined) return;
    const stillUser = templates.some((t) => t.id === selectedId && !t.is_system);
    if (!stillUser) setSelectedId(undefined);
  }, [templates, selectedId]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message={t('loading')} />
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <ErrorMessage message={t('loadError')} />
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
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="h6">{t('listTitle')}</Typography>
                <Button size="small" onClick={() => setSelectedId(undefined)}>
                  {t('newBtn')}
                </Button>
              </Stack>
              <List dense>
                {userTemplates.map((tpl) => (
                  <ListItem key={tpl.id} disablePadding>
                    <ListItemButton
                      selected={selectedId === tpl.id}
                      onClick={() => setSelectedId(tpl.id)}
                    >
                      <ListItemText
                        primary={tpl.name}
                        secondary={
                          tpl.groups?.length
                            ? t('groupsFields', {
                                groups: tpl.groups.length,
                                fields: tpl.groups.reduce((acc, g) => acc + g.fields.length, 0),
                              })
                            : t('noFields')
                        }
                      />
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        disabled={isDeleting}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(t('deleteConfirm'))) {
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
              {selectedId ? t('editTitle') : t('createTitle')}
            </Typography>
            {loadingTemplate && selectedId ? (
              <LoadingSpinner message={t('loadingSelected')} />
            ) : (
              <TemplateBuilder key={selectedId || 'new'} template={selectedTemplate} />
            )}

            {selectedTemplate && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('structureTitle')}
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
