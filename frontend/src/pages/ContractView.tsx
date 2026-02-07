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
  Chip,
} from '@mui/material';
import { Download, Edit, ArrowBack, HelpOutline, Lock } from '@mui/icons-material';
import {
  Layout,
  ProtectedRoute,
  LoadingSpinner,
  ErrorMessage,
  UpgradeModal,
} from '@/shared/components';
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
import {
  ContractFieldInput,
  ContractSectionInput,
  DocumentStatus,
  LimitReachedError,
} from '@/shared/types';
import { ContractSectionsEditor } from '@/features/contracts/components/ContractSectionsEditor';
import { useUsage } from '@/features/billing/hooks/useBilling';
import { AxiosError } from 'axios';

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
  const [riskCheck, setRiskCheck] = useState(false);
  const [statusDraft, setStatusDraft] = useState<DocumentStatus>('draft');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [limitError, setLimitError] = useState<LimitReachedError | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Загружаем документ
  const { data, isLoading, error } = useContract(id || '');
  const document = data?.document;
  const { data: usage } = useUsage();

  // Feature access based on subscription
  const hasSectionsAccess = usage?.features?.hasSections ?? false;
  const hasStatusesAccess = usage?.features?.hasStatuses ?? false;
  const hasDocxExportAccess = usage?.features?.hasDocxExport ?? false;
  const hasRiskCheckAccess = usage?.features?.hasRiskCheck ?? false;

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

  const versions = document?.versions || [];
  const latestVersion = versions[versions.length - 1];
  const selectedVersion =
    (selectedVersionId && versions.find((v) => v.id === selectedVersionId)) || latestVersion;
  const isLatestSelected = selectedVersion?.id === latestVersion?.id;
  const riskAssessment = selectedVersion?.risk_assessment;

  // Обновляем контент когда документ загружен
  useEffect(() => {
    if (document?.versions && document.versions.length > 0) {
      const latestVersion = document.versions[document.versions.length - 1];
      const existingSelection =
        selectedVersionId && document.versions.find((v) => v.id === selectedVersionId);

      if (existingSelection) {
        setCurrentContent(existingSelection.content || '');
      } else if (!selectedVersionId && latestVersion) {
        setSelectedVersionId(latestVersion.id);
        setCurrentContent(latestVersion.content || '');
      }
      // Если selectedVersionId уже установлен, но версия еще не успела попасть в список,
      // ничего не делаем и ждём следующего обновления данных, чтобы не переключать вкладку назад.
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
  }, [document, selectedVersionId]);

  useEffect(() => {
    if (selectedVersion) {
      setCurrentContent(selectedVersion.content || '');
    }
  }, [selectedVersion]);

  const handleRefine = () => {
    if (!id || !refinePrompt.trim()) return;
    setLimitError(null);

    refineContract(
      { prompt: refinePrompt, risk_check: hasRiskCheckAccess ? riskCheck : false },
      {
        onSuccess: (data) => {
          const newVersion = data.document.versions[data.document.versions.length - 1];
          if (newVersion) {
            setSelectedVersionId(newVersion.id);
            setCurrentContent(newVersion.content);
          }
          setRefinePrompt('');
          setShowRefineForm(false);
          showSnackbar('Документ успешно обновлен через AI');
        },
        onError: (error) => {
          const axiosError = error as AxiosError<LimitReachedError>;
          if (axiosError.response?.data?.code === 'LIMIT_REACHED') {
            setLimitError(axiosError.response.data);
            setUpgradeModalOpen(true);
          } else {
            showSnackbar('Ошибка при обновлении документа');
          }
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

  const handleVersionChange = (versionId: string) => {
    if (!document?.versions?.length) return;
    const version = document.versions.find((v) => v.id === versionId);
    const fallback = document.versions[document.versions.length - 1];
    const next = version || fallback;
    setSelectedVersionId(next?.id || null);
    setCurrentContent(next?.content || '');
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

  return (
    <ProtectedRoute>
      <Layout>
        <Box sx={{ mt: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            sx={{ mb: 3 }}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard')}
              sx={{ width: { xs: '100%', md: 'auto' } }}
            >
              Назад
            </Button>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />
            <Button
              color="error"
              variant="outlined"
              onClick={handleDelete}
              disabled={isDeleting}
              sx={{ width: { xs: '100%', md: 'auto' } }}
            >
              Удалить договор
            </Button>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setShowRefineForm(!showRefineForm)}
              disabled={isRefining}
              sx={{ width: { xs: '100%', md: 'auto' } }}
            >
              Уточнить с AI
            </Button>
            <Tooltip title={hasDocxExportAccess ? '' : 'Доступно на тарифах Basic и выше'}>
              <span>
                <Button
                  variant="contained"
                  startIcon={hasDocxExportAccess ? <Download /> : <Lock />}
                  onClick={() => handleExport('docx')}
                  disabled={isExporting || !hasDocxExportAccess}
                  sx={{ width: { xs: '100%', md: 'auto' } }}
                >
                  Скачать DOCX
                  {!hasDocxExportAccess && <Chip label="Basic+" size="small" sx={{ ml: 1 }} />}
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              sx={{ width: { xs: '100%', md: 'auto' } }}
            >
              Скачать PDF
            </Button>
            <Tooltip title={hasStatusesAccess ? '' : 'Доступно на тарифах Basic и выше'}>
              <span>
                <FormControl
                  size="small"
                  sx={{
                    minWidth: { xs: '100%', sm: 200, md: 160 },
                    width: { xs: '100%', md: 'auto' },
                  }}
                >
                  <InputLabel>Статус</InputLabel>
                  <Select
                    value={statusDraft}
                    label="Статус"
                    onChange={(e) => handleStatusChange(e.target.value as DocumentStatus)}
                    disabled={isUpdatingStatus || !hasStatusesAccess}
                  >
                    <MenuItem value="draft">Черновик</MenuItem>
                    <MenuItem value="final">Финальный</MenuItem>
                  </Select>
                </FormControl>
              </span>
            </Tooltip>
          </Stack>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            sx={{ mb: 2 }}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <TextField
              label="Название договора"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              fullWidth
              disabled={isRenaming}
            />
            <Button
              variant="contained"
              onClick={handleRename}
              disabled={isRenaming || !titleDraft.trim()}
              sx={{
                alignSelf: { xs: 'stretch', md: 'center' },
                width: { xs: '100%', md: 'auto' },
              }}
            >
              {isRenaming ? 'Сохранение...' : 'Сохранить название'}
            </Button>
          </Stack>

          {versions.length > 0 && (
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel>Версия</InputLabel>
                <Select
                  value={selectedVersion?.id || ''}
                  label="Версия"
                  onChange={(e) => handleVersionChange(e.target.value as string)}
                >
                  {versions.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      Версия {v.version} — {new Date(v.updated_at).toLocaleString('ru-RU')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!isLatestSelected && (
                <Chip color="warning" label="Историческая версия (только просмотр)" />
              )}
            </Stack>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Создан: {new Date(document.created_at).toLocaleString('ru-RU')} | Просматриваемая
            версия: {selectedVersion?.version || 1} | Статус:{' '}
            {statusDraft === 'draft' ? 'Черновик' : 'Финальный'} | Шаблон:{' '}
            {document.template_name || (document.template_id ? 'Без названия' : 'Без шаблона')}
          </Typography>

          {!isLatestSelected && selectedVersion && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Вы смотрите версию №{selectedVersion.version} от{' '}
              {new Date(selectedVersion.updated_at).toLocaleString('ru-RU')}. Чтобы редактировать,
              вернитесь к последней версии.
            </Alert>
          )}

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6">Юридические риски</Typography>
                  {!hasRiskCheckAccess && (
                    <Chip
                      icon={<Lock fontSize="small" />}
                      label="Standard+"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                  <Tooltip title="Результат анализа договора на юридические риски. Включите опцию при генерации или уточнении, чтобы обновить этот блок.">
                    <HelpOutline fontSize="small" color="action" />
                  </Tooltip>
                </Stack>
                {riskAssessment?.updated_at && (
                  <Typography variant="caption" color="text.secondary">
                    Обновлено: {new Date(riskAssessment.updated_at).toLocaleString('ru-RU')}
                  </Typography>
                )}
              </Stack>
              <Typography
                variant="body2"
                sx={{ mt: 1.5, whiteSpace: 'pre-wrap' }}
                color={riskAssessment ? 'text.primary' : 'text.secondary'}
              >
                {riskAssessment?.summary?.trim() ||
                  'Проверка рисков еще не выполнялась. Отметьте опцию при генерации или уточнении, чтобы получить оценку.'}
              </Typography>
            </CardContent>
          </Card>

          {showRefineForm && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Уточнить документ с помощью AI
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Опишите, какие изменения нужно внести в договор, и AI обновит документ
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
                <FormControlLabel
                  control={
                    <Switch
                      checked={hasRiskCheckAccess ? riskCheck : false}
                      onChange={(e) => setRiskCheck(e.target.checked)}
                      disabled={!hasRiskCheckAccess || isRefining}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>Проверить на юридические риски</span>
                      {!hasRiskCheckAccess && (
                        <Chip
                          icon={<Lock fontSize="small" />}
                          label="Standard+"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      <Tooltip title="Включите, чтобы AI проанализировал обновленный договор и подсветил возможные риски.">
                        <HelpOutline fontSize="small" color="action" />
                      </Tooltip>
                    </Stack>
                  }
                  sx={{ mb: 2 }}
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
              <strong>Это договор, сгенерированный через ИИ.</strong>
              <br />
              Вы можете редактировать его напрямую в редакторе ниже или использовать AI для
              автоматических изменений через кнопку &quot;Уточнить с AI&quot;. Рекомендована
              консультация с юристом.
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
            {hasSectionsAccess && sectionsEnabled ? (
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
                        {!hasSectionsAccess && (
                          <Chip
                            icon={<Lock fontSize="small" />}
                            label="Basic+"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        <Tooltip title="Настройте структуру договора: порядок и названия разделов влияют на генерацию и экспорт. При отключении, ИИ сам подберет нужные разделы.">
                          <HelpOutline fontSize="small" color="action" />
                        </Tooltip>
                      </Stack>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={hasSectionsAccess ? sectionsEnabled : false}
                            onChange={(e) => setSectionsEnabled(e.target.checked)}
                            disabled={!hasSectionsAccess}
                          />
                        }
                        label="Включить"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {hasSectionsAccess
                        ? 'Разделы скрыты и не участвуют в документе.'
                        : 'Настройка разделов доступна на платных тарифах.'}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Box>

          <ContractEditor
            key={selectedVersion?.id || 'latest'}
            content={currentContent}
            onChange={handleContentChange}
            readOnly={!isLatestSelected}
          />

          <Box
            sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Typography variant="body2" color="text.secondary">
              ID документа: {id} | Последнее обновление:{' '}
              {new Date(selectedVersion?.updated_at || document.updated_at).toLocaleString('ru-RU')}
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

        {/* Upgrade Modal for limit reached */}
        {limitError && (
          <UpgradeModal
            open={upgradeModalOpen}
            onClose={() => setUpgradeModalOpen(false)}
            limitType={limitError.limit_type}
            currentUsage={limitError.current_usage}
            limit={limitError.limit}
            upgradeOptions={limitError.upgrade_options}
            showSingleContractOption={false}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
};
