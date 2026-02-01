import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Stack,
  Snackbar,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { Download, Edit, ArrowBack, HelpOutline } from '@mui/icons-material';
import { Layout, ProtectedRoute, LoadingSpinner, ErrorMessage } from '@/shared/components';
import {
  useContract,
  useRefineContract,
  useExportContract,
  useUpdateContractFields,
  useUpdateContractSections,
  useRenameContract,
  useDeleteContract,
  useUpdateContractStatus,
} from '@/features/contracts/hooks/useContracts';
import { ContractEditor } from '@/features/contracts/components/ContractEditor';
import { ContractFieldsEditor } from '@/features/contracts/components/ContractFieldsEditor';
import { ContractFieldInput, ContractSectionInput, DocumentStatus } from '@/shared/types';
import { ContractSectionsEditor } from '@/features/contracts/components/ContractSectionsEditor';

export const ContractView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentContent, setCurrentContent] = useState('');
  const [refinePrompt, setRefinePrompt] = useState('');
  const [showRefineForm, setShowRefineForm] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const [sectionsEnabled, setSectionsEnabled] = useState(false);
  const [statusDraft, setStatusDraft] = useState<DocumentStatus>('draft');

  // Загружаем документ
  const { data, isLoading, error } = useContract(id || '');
  const document = data?.document;

  const { mutate: refineContract, isPending: isRefining } = useRefineContract(id || '');
  const { mutate: exportContract, isPending: isExporting } = useExportContract();
  const { mutate: updateFields, isPending: isUpdatingFields } = useUpdateContractFields(id || '');
  const { mutate: updateSections, isPending: isUpdatingSections } = useUpdateContractSections(
    id || ''
  );
  const { mutate: renameContract, isPending: isRenaming } = useRenameContract();
  const { mutate: deleteContract, isPending: isDeleting } = useDeleteContract();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateContractStatus();
  const [fields, setFields] = useState<ContractFieldInput[]>([]);
  const [sections, setSections] = useState<ContractSectionInput[]>([]);

  // Обновляем контент когда документ загружен
  useEffect(() => {
    if (document?.versions && document.versions.length > 0) {
      const latestVersion = document.versions[document.versions.length - 1];
      setCurrentContent(latestVersion?.content || '');
    }
    if (document?.title) {
      setTitleDraft(document.title);
    }
    if (document?.status) {
      setStatusDraft(document.status);
    }
    if (document?.fields) {
      setFields(
        document.fields.map((f) => ({
          id: f.id,
          template_field_id: f.template_field_id,
          group_label: f.group_label,
          group_order: f.group_order,
          label: f.label,
          key: f.key,
          value: f.value,
          order: f.order,
        }))
      );
    }
    if (document?.sections) {
      setSections(
        document.sections.map((s) => ({
          id: s.id,
          template_section_id: s.template_section_id,
          title: s.title,
          order: s.order,
        }))
      );
      setSectionsEnabled(document.sections.length > 0);
    }
  }, [document]);

  const handleRefine = () => {
    if (!id || !refinePrompt.trim()) return;

    refineContract(
      { prompt: refinePrompt },
      {
        onSuccess: (data) => {
          const newVersion = data.document.versions[data.document.versions.length - 1];
          if (newVersion) {
            setCurrentContent(newVersion.content);
          }
          setRefinePrompt('');
          setShowRefineForm(false);
          showSnackbar('Документ успешно обновлен через AI');
        },
        onError: () => {
          showSnackbar('Ошибка при обновлении документа');
        },
      }
    );
  };

  const handleRename = () => {
    if (!id || !titleDraft.trim() || titleDraft === document?.title) return;
    renameContract(
      { documentId: id, title: titleDraft.trim() },
      {
        onSuccess: () => showSnackbar('Название договора обновлено'),
        onError: () => showSnackbar('Не удалось обновить название'),
      }
    );
  };

  const handleDelete = () => {
    if (!id) return;
    if (confirm('Удалить договор? Это действие нельзя отменить.')) {
      deleteContract(id, {
        onSuccess: () => navigate('/dashboard'),
        onError: () => showSnackbar('Не удалось удалить договор'),
      });
    }
  };

  const handleStatusChange = (next: DocumentStatus) => {
    if (!id) return;
    setStatusDraft(next);
    updateStatus(
      { documentId: id, status: next },
      {
        onSuccess: () => showSnackbar('Статус обновлен'),
        onError: () => showSnackbar('Не удалось обновить статус'),
      }
    );
  };

  const handleExport = (format: 'docx' | 'pdf') => {
    if (!id || !document) return;

    exportContract(
      { documentId: id, format, title: document.title },
      {
        onSuccess: () => {
          showSnackbar(`Файл ${format.toUpperCase()} успешно загружен`);
        },
        onError: () => {
          showSnackbar(`Ошибка при экспорте в ${format.toUpperCase()}`);
        },
      }
    );
  };

  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSaveFields = () => {
    if (!id) return;
    updateFields(fields, {
      onSuccess: () => showSnackbar('Поля договора сохранены'),
      onError: () => showSnackbar('Не удалось сохранить поля'),
    });
  };

  const handleSaveSections = () => {
    if (!id) return;
    const payload = sectionsEnabled ? sections : [];
    updateSections(payload, {
      onSuccess: () => showSnackbar('Разделы договора сохранены'),
      onError: () => showSnackbar('Не удалось сохранить разделы'),
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Загрузка документа..." />
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error || !document) {
    return (
      <ProtectedRoute>
        <Layout>
          <ErrorMessage
            title="Документ не найден"
            message="Не удалось загрузить документ. Возможно, он был удален или у вас нет доступа."
          />
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Вернуться к списку
          </Button>
        </Layout>
      </ProtectedRoute>
    );
  }

  const currentVersion = document.versions[document.versions.length - 1];

  return (
    <ProtectedRoute>
      <Layout>
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard')}
            >
              Назад
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button color="error" variant="outlined" onClick={handleDelete} disabled={isDeleting}>
              Удалить договор
            </Button>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setShowRefineForm(!showRefineForm)}
              disabled={isRefining}
            >
              Уточнить с AI
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => handleExport('docx')}
              disabled={isExporting}
            >
              Скачать DOCX
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              Скачать PDF
            </Button>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Статус</InputLabel>
              <Select
                value={statusDraft}
                label="Статус"
                onChange={(e) => handleStatusChange(e.target.value as DocumentStatus)}
                disabled={isUpdatingStatus}
              >
                <MenuItem value="draft">Черновик</MenuItem>
                <MenuItem value="final">Финальный</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <TextField
              label="Название договора"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              sx={{ minWidth: 320 }}
              disabled={isRenaming}
            />
            <Button
              variant="contained"
              onClick={handleRename}
              disabled={isRenaming || !titleDraft.trim()}
            >
              {isRenaming ? 'Сохранение...' : 'Сохранить название'}
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Создан: {new Date(document.created_at).toLocaleString('ru-RU')} | Версия:{' '}
            {currentVersion?.version || 1} | Статус:{' '}
            {statusDraft === 'draft' ? 'Черновик' : 'Финальный'} | Шаблон:{' '}
            {document.template_name || (document.template_id ? 'Без названия' : 'Без шаблона')}
          </Typography>

          {showRefineForm && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Уточнить документ с помощью AI
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Опишите, какие изменения нужно внести в договор, и YandexGPT обновит документ
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder="Например: Добавить пункт о штрафных санкциях за разглашение информации в размере 100,000 рублей"
                  sx={{ mb: 2 }}
                  disabled={isRefining}
                />
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={handleRefine}
                    disabled={isRefining || !refinePrompt.trim()}
                  >
                    {isRefining ? 'AI обрабатывает...' : 'Применить изменения'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowRefineForm(false);
                      setRefinePrompt('');
                    }}
                    disabled={isRefining}
                  >
                    Отмена
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Это договор, сгенерированный через YandexGPT.</strong>
              <br />
              Вы можете редактировать его напрямую в редакторе ниже или использовать AI для
              автоматических изменений через кнопку "Уточнить с AI".
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <ContractFieldsEditor fields={fields} onChange={setFields} title="Заполненные поля" />
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }} spacing={2}>
              <Button variant="contained" onClick={handleSaveFields} disabled={isUpdatingFields}>
                {isUpdatingFields ? 'Сохранение...' : 'Сохранить поля'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mb: 3 }}>
            {sectionsEnabled ? (
              <>
                <ContractSectionsEditor
                  sections={sections}
                  onChange={setSections}
                  title="Разделы договора"
                  headerAddon={
                    <FormControlLabel
                      control={
                        <Switch
                          checked={sectionsEnabled}
                          onChange={(e) => setSectionsEnabled(e.target.checked)}
                        />
                      }
                      label="Включить"
                    />
                  }
                />
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }} spacing={2}>
                  <Button
                    variant="contained"
                    onClick={handleSaveSections}
                    disabled={isUpdatingSections}
                  >
                    {isUpdatingSections ? 'Сохранение...' : 'Сохранить разделы'}
                  </Button>
                </Stack>
              </>
            ) : (
              <Card>
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6">Разделы договора</Typography>
                        <Tooltip title="Настройте структуру договора: порядок и названия разделов влияют на генерацию и экспорт. При отключении, ИИ сам подберет нужные разделы.">
                          <HelpOutline fontSize="small" color="action" />
                        </Tooltip>
                      </Stack>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={sectionsEnabled}
                            onChange={(e) => setSectionsEnabled(e.target.checked)}
                          />
                        }
                        label="Включить"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Разделы скрыты и не участвуют в документе.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Box>

          <ContractEditor
            content={currentContent}
            onChange={handleContentChange}
            readOnly={false}
          />

          <Box
            sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Typography variant="body2" color="text.secondary">
              ID документа: {id} | Последнее обновление:{' '}
              {new Date(currentVersion?.updated_at || document.updated_at).toLocaleString('ru-RU')}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => navigate('/dashboard')}>
                Вернуться к списку
              </Button>
              <Button
                variant="contained"
                onClick={() => showSnackbar('Изменения сохранены автоматически')}
              >
                Изменения сохраняются автоматически
              </Button>
            </Stack>
          </Box>
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Layout>
    </ProtectedRoute>
  );
};
