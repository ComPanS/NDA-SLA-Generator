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
} from '@mui/material';
import { Download, Edit, ArrowBack } from '@mui/icons-material';
import { Layout, ProtectedRoute, LoadingSpinner, ErrorMessage } from '@/shared/components';
import { useContract, useRefineContract, useExportContract, useUpdateContractFields, useUpdateContractSections } from '@/features/contracts/hooks/useContracts';
import { ContractEditor } from '@/features/contracts/components/ContractEditor';
import { ContractFieldsEditor } from '@/features/contracts/components/ContractFieldsEditor';
import { ContractFieldInput, ContractSectionInput } from '@/shared/types';
import { ContractSectionsEditor } from '@/features/contracts/components/ContractSectionsEditor';

export const ContractView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentContent, setCurrentContent] = useState('');
  const [refinePrompt, setRefinePrompt] = useState('');
  const [showRefineForm, setShowRefineForm] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Загружаем документ
  const { data, isLoading, error } = useContract(id || '');
  const document = data?.document;

  const { mutate: refineContract, isPending: isRefining } = useRefineContract(id || '');
  const { mutate: exportContract, isPending: isExporting } = useExportContract();
  const { mutate: updateFields, isPending: isUpdatingFields } = useUpdateContractFields(id || '');
  const { mutate: updateSections, isPending: isUpdatingSections } = useUpdateContractSections(id || '');
  const [fields, setFields] = useState<ContractFieldInput[]>([]);
  const [sections, setSections] = useState<ContractSectionInput[]>([]);

  // Обновляем контент когда документ загружен
  useEffect(() => {
    if (document?.versions && document.versions.length > 0) {
      const latestVersion = document.versions[document.versions.length - 1];
      setCurrentContent(latestVersion?.content || '');
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
    updateSections(sections, {
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
          </Stack>

          <Typography variant="h4" gutterBottom>
            {document.title}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Создан: {new Date(document.created_at).toLocaleString('ru-RU')} | 
            Версия: {currentVersion?.version || 1} | 
            Статус: {document.status === 'draft' ? 'Черновик' : 'Финальный'}
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
              <strong>Это реальный документ, сгенерированный через YandexGPT API.</strong>
              <br />
              Вы можете редактировать его напрямую в редакторе ниже или использовать AI для 
              автоматических изменений через кнопку "Уточнить с AI".
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <ContractFieldsEditor
              fields={fields}
              onChange={setFields}
              title="Заполненные поля"
            />
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }} spacing={2}>
              <Button
                variant="contained"
                onClick={handleSaveFields}
                disabled={isUpdatingFields}
              >
                {isUpdatingFields ? 'Сохранение...' : 'Сохранить поля'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mb: 3 }}>
            <ContractSectionsEditor
              sections={sections}
              onChange={setSections}
              title="Разделы договора"
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
          </Box>

          <ContractEditor 
            content={currentContent} 
            onChange={handleContentChange}
            readOnly={false}
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              ID документа: {id} | Последнее обновление: {new Date(currentVersion?.updated_at || document.updated_at).toLocaleString('ru-RU')}
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
