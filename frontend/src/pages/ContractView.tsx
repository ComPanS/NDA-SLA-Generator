import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useLocalizedNavigate } from '@/shared/i18n/useLocalizedPath';
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
  CircularProgress,
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
  useUpdateContractContent,
} from '@/features/contracts/hooks/useContracts';
import { ContractEditor } from '@/features/contracts/components/ContractEditor';
import { ContractFieldsEditor } from '@/features/contracts/components/ContractFieldsEditor';
import {
  ContractFieldInput,
  ContractSectionInput,
  DocumentStatus,
  GenerateContractResponse,
  LimitReachedError,
} from '@/shared/types';
import { ContractSectionsEditor } from '@/features/contracts/components/ContractSectionsEditor';
import { useUsage } from '@/features/billing/hooks/useBilling';
import { AxiosError } from 'axios';
import { icuLocaleFor } from '@/shared/i18n/icuLocale';
import {
  isValidOutputLanguageTag,
  normalizeOutputLanguageTag,
} from '@/shared/i18n/outputLanguageTag';
import { ContractJurisdictionFormFields } from '@/features/contracts/components/ContractJurisdictionFormFields';

const normalizeColumnsContent = (html: string) => {
  if (!html) return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blockSelector = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, div';

    doc.querySelectorAll('[data-columns]').forEach((container) => {
      const columns = Array.from(container.children).filter((el) => el.tagName === 'DIV');
      if (columns.length < 2) return;

      // убрать старые вставки
      columns.forEach((col) => {
        col.querySelectorAll('[data-column-filler="true"]').forEach((el) => {
          el.remove();
        });
      });

      const counts = columns.map((col) => {
        const blocks = (col as HTMLElement).querySelectorAll(blockSelector).length;
        const textFallback = (col.textContent || '').trim().length > 0 ? 1 : 0;
        return Math.max(blocks, textFallback);
      });

      const target = Math.max(...counts);
      columns.forEach((col, idx) => {
        const count = counts[idx] ?? 0;
        const missing = target - count;
        if (missing <= 0) return;
        const fragment = doc.createDocumentFragment();
        for (let i = 0; i < missing + 2; i += 1) {
          const p = doc.createElement('p');
          p.setAttribute('data-column-filler', 'true');
          p.innerHTML = '&nbsp;';
          fragment.appendChild(p);
        }
        col.appendChild(fragment);
      });
    });

    return doc.body.innerHTML;
  } catch {
    return html;
  }
};

export const ContractView = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation('contracts');
  const { t: td } = useTranslation('dashboard');
  const locale = icuLocaleFor(i18n.language);
  const navigate = useLocalizedNavigate();
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
  const [refineCountry, setRefineCountry] = useState('RU');
  const [refineOutputLang, setRefineOutputLang] = useState('ru');

  // Загружаем документ
  const { data, isLoading, error } = useContract(id || '');
  const document = data?.document;
  const { data: usage } = useUsage();

  // Feature access based on subscription
  const hasSectionsAccess = usage?.features?.hasSections ?? false;
  const hasStatusesAccess = usage?.features?.hasStatuses ?? false;
  const hasDocxExportAccess = usage?.features?.hasDocxExport ?? false;
  const hasRiskCheckAccess = usage?.features?.hasRiskCheck ?? false;
  const hasVersionsAccess = usage?.features?.hasVersions ?? false;

  const { mutate: refineContract, isPending: isRefining } = useRefineContract(id || '');
  const { mutate: exportContract, isPending: isExporting } = useExportContract();
  const { mutateAsync: saveContent } = useUpdateContractContent(id || '');
  const { mutate: updateFields, isPending: isUpdatingFields } = useUpdateContractFields(id || '');
  const { mutate: updateSections, isPending: isUpdatingSections } = useUpdateContractSections(
    id || ''
  );
  const { mutate: renameContract, isPending: isRenaming } = useRenameContract();
  const { mutate: deleteContract, isPending: isDeleting } = useDeleteContract();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateContractStatus();
  const [fields, setFields] = useState<ContractFieldInput[]>([]);
  const [sections, setSections] = useState<ContractSectionInput[]>([]);
  const [contentReady, setContentReady] = useState(false);

  const versions = hasVersionsAccess
    ? document?.versions || []
    : document?.versions?.slice(-1) || [];
  const latestVersion = versions[versions.length - 1];
  const selectedVersion =
    (selectedVersionId && versions.find((v) => v.id === selectedVersionId)) || latestVersion;
  const isLatestSelected = selectedVersion?.id === latestVersion?.id;
  const riskAssessment = selectedVersion?.risk_assessment;

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightSaveRef = useRef<Promise<GenerateContractResponse> | null>(null);
  const lastSavedRef = useRef<string>('');

  const logColumnsClient = (_label: string, _html?: string) => {};

  const applyContentIfNeeded = (html: string | null | undefined) => {
    const next = normalizeColumnsContent(html || '');
    const hasUnsavedChanges = contentReady && currentContent !== lastSavedRef.current;
    const needContentUpdate = next !== currentContent;

    // Не затираем свежие правки, пока они не сохранены
    if (hasUnsavedChanges && next !== lastSavedRef.current) {
      return;
    }
    const needReady = !contentReady;
    if (needContentUpdate) {
      setCurrentContent(next);
      lastSavedRef.current = next;
    }
    if (needReady) {
      setContentReady(true);
    }
  };

  // Обновляем контент когда документ загружен
  useEffect(() => {
    if (document?.versions && document.versions.length > 0) {
      const latestVersion = document.versions[document.versions.length - 1];
      const existingSelection =
        selectedVersionId && document.versions.find((v) => v.id === selectedVersionId);

      if (existingSelection) {
        applyContentIfNeeded(existingSelection.content);
      } else if (!selectedVersionId && latestVersion) {
        setSelectedVersionId(latestVersion.id);
        applyContentIfNeeded(latestVersion.content);
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
    if (document?.jurisdiction_country) {
      setRefineCountry(document.jurisdiction_country);
    }
    if (document?.output_language) {
      setRefineOutputLang(normalizeOutputLanguageTag(document.output_language));
    }
  }, [document, selectedVersionId]);

  useEffect(() => {
    if (selectedVersion) {
      applyContentIfNeeded(selectedVersion.content);
      logColumnsClient('select-version-effect', selectedVersion.content || '');
    }
  }, [selectedVersion]);

  const handleRefine = () => {
    if (!id || !refinePrompt.trim()) return;
    if (!isValidOutputLanguageTag(refineOutputLang)) {
      showSnackbar(t('new.outputLanguageError'));
      return;
    }
    setLimitError(null);

    refineContract(
      {
        prompt: refinePrompt,
        risk_check: hasRiskCheckAccess ? riskCheck : false,
        country_code: refineCountry,
        output_language: refineOutputLang,
      },
      {
        onSuccess: (data) => {
          const newVersion = data.document.versions[data.document.versions.length - 1];
          if (newVersion) {
            setSelectedVersionId(newVersion.id);
            const normalized = normalizeColumnsContent(newVersion.content || '');
            setCurrentContent(normalized);
            lastSavedRef.current = normalized;
            logColumnsClient('refine-success', normalized);
          }
          if (data.document.jurisdiction_country) {
            setRefineCountry(data.document.jurisdiction_country);
          }
          if (data.document.output_language) {
            setRefineOutputLang(normalizeOutputLanguageTag(data.document.output_language));
          }
          setRefinePrompt('');
          setShowRefineForm(false);
          showSnackbar(t('view.snackUpdatedAi'));
        },
        onError: (error) => {
          const axiosError = error as AxiosError<LimitReachedError>;
          if (axiosError.response?.data?.code === 'LIMIT_REACHED') {
            setLimitError(axiosError.response.data);
            setUpgradeModalOpen(true);
          } else {
            showSnackbar(t('view.snackUpdateError'));
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
        onSuccess: () => showSnackbar(t('view.snackRenamed')),
        onError: () => showSnackbar(t('view.snackRenameError')),
      }
    );
  };

  const handleDelete = () => {
    if (!id) return;
    if (confirm(t('view.deleteConfirm'))) {
      deleteContract(id, {
        onSuccess: () => navigate('/dashboard'),
        onError: () => showSnackbar(t('view.snackDeleteError')),
      });
    }
  };

  const handleStatusChange = (next: DocumentStatus) => {
    if (!id) return;
    setStatusDraft(next);
    updateStatus(
      { documentId: id, status: next },
      {
        onSuccess: () => showSnackbar(t('view.snackStatusOk')),
        onError: () => showSnackbar(t('view.snackStatusErr')),
      }
    );
  };

  const flushPendingSave = async () => {
    if (!isLatestSelected || !id) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      const promise = saveContent(currentContent, {
        onSuccess: () => {
          lastSavedRef.current = currentContent;
        },
        onError: () => {
          showSnackbar(t('view.snackSaveErr'));
        },
      });

      inFlightSaveRef.current = promise.finally(() => {
        inFlightSaveRef.current = null;
      });
    }

    if (inFlightSaveRef.current) {
      await inFlightSaveRef.current;
    }
  };

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!id || !document) return;

    await flushPendingSave();

    exportContract(
      { documentId: id, format, title: document.title },
      {
        onSuccess: () => {
          showSnackbar(t('view.snackExportOk', { fmt: format.toUpperCase() }));
        },
        onError: () => {
          showSnackbar(t('view.snackExportErr', { fmt: format.toUpperCase() }));
        },
      }
    );
  };

  const handleContentChange = (newContent: string) => {
    if (!contentReady) return;
    logColumnsClient('content-change', newContent);
    setCurrentContent(newContent);

    if (!isLatestSelected || !id) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;

      if (newContent === lastSavedRef.current) return;

      const promise = saveContent(newContent, {
        onSuccess: () => {
          lastSavedRef.current = newContent;
        },
        onError: () => {
          showSnackbar(t('view.snackSaveErr'));
        },
      });

      inFlightSaveRef.current = promise.finally(() => {
        inFlightSaveRef.current = null;
      });
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const handleVersionChange = (versionId: string) => {
    if (!document?.versions?.length) return;
    const version = document.versions.find((v) => v.id === versionId);
    const fallback = document.versions[document.versions.length - 1];
    const next = version || fallback;
    setSelectedVersionId(next?.id || null);
    setCurrentContent(next?.content || '');
    logColumnsClient('version-change', next?.content || '');
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSaveFields = () => {
    if (!id) return;
    updateFields(fields, {
      onSuccess: () => showSnackbar(t('view.snackFieldsOk')),
      onError: () => showSnackbar(t('view.snackFieldsErr')),
    });
  };

  const handleSaveSections = () => {
    if (!id) return;
    const payload = sectionsEnabled ? sections : [];
    updateSections(payload, {
      onSuccess: () => showSnackbar(t('view.snackSectionsOk')),
      onError: () => showSnackbar(t('view.snackSectionsErr')),
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message={t('view.loading')} />
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error || !document) {
    return (
      <ProtectedRoute>
        <Layout>
          <ErrorMessage title={t('view.notFoundTitle')} message={t('view.notFoundMessage')} />
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            {t('view.backToList')}
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
              {t('view.back')}
            </Button>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />
            <Button
              color="error"
              variant="outlined"
              onClick={handleDelete}
              disabled={isDeleting}
              sx={{ width: { xs: '100%', md: 'auto' } }}
            >
              {t('view.deleteContract')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setShowRefineForm(!showRefineForm)}
              disabled={isRefining}
              sx={{ width: { xs: '100%', md: 'auto' } }}
            >
              {t('view.refineAi')}
            </Button>
            <Tooltip title={hasDocxExportAccess ? '' : t('view.docxTooltip')}>
              <span>
                <Button
                  variant="contained"
                  startIcon={hasDocxExportAccess ? <Download /> : <Lock />}
                  onClick={() => handleExport('docx')}
                  disabled={isExporting || !hasDocxExportAccess}
                  sx={{ width: { xs: '100%', md: 'auto' } }}
                >
                  {t('view.downloadDocx')}
                  {!hasDocxExportAccess && (
                    <Chip label={t('new.proChip')} size="small" sx={{ ml: 1 }} />
                  )}
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
              {t('view.downloadPdf')}
            </Button>
            <Tooltip title={hasStatusesAccess ? '' : t('view.docxTooltip')}>
              <span>
                <FormControl
                  size="small"
                  sx={{
                    minWidth: { xs: '100%', sm: 200, md: 160 },
                    width: { xs: '100%', md: 'auto' },
                  }}
                >
                  <InputLabel>{t('view.statusLabel')}</InputLabel>
                  <Select
                    value={statusDraft}
                    label={t('view.statusLabel')}
                    onChange={(e) => handleStatusChange(e.target.value as DocumentStatus)}
                    disabled={isUpdatingStatus || !hasStatusesAccess}
                    MenuProps={{ disablePortal: true }}
                  >
                    <MenuItem value="draft">{td('statusDraft')}</MenuItem>
                    <MenuItem value="final">{td('statusFinal')}</MenuItem>
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
              label={t('view.titleLabel')}
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
              {isRenaming ? t('view.saving') : t('view.saveTitle')}
            </Button>
          </Stack>

          {hasVersionsAccess && versions.length > 1 && (
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel>{t('view.versionLabel')}</InputLabel>
                <Select
                  value={selectedVersion?.id || ''}
                  label={t('view.versionLabel')}
                  onChange={(e) => handleVersionChange(e.target.value as string)}
                  MenuProps={{ disablePortal: true, PaperProps: { sx: { maxHeight: 280 } } }}
                >
                  {versions.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {t('view.versionItem', {
                        v: v.version,
                        date: new Date(v.updated_at).toLocaleString(locale),
                      })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!isLatestSelected && (
                <Chip color="warning" label={t('view.historicVersion')} />
              )}
            </Stack>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('view.metaLine', {
              created: new Date(document.created_at).toLocaleString(locale),
              ver: selectedVersion?.version || 1,
              status: statusDraft === 'draft' ? td('statusDraft') : td('statusFinal'),
              tpl:
                document.template_name ||
                (document.template_id ? t('view.noTemplateName') : t('view.noTemplate')),
            })}
          </Typography>

          {!isLatestSelected && selectedVersion && (
            <Alert severity="info" sx={{ mb: 3 }}>
              {t('view.viewingVersionHint', {
                v: selectedVersion.version,
                date: new Date(selectedVersion.updated_at).toLocaleString(locale),
              })}
            </Alert>
          )}

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6">{t('view.risksTitle')}</Typography>
                  {!hasRiskCheckAccess && (
                    <Chip
                      icon={<Lock fontSize="small" />}
                      label={t('new.businessChip')}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                  <Tooltip title={t('view.risksTooltip')}>
                    <HelpOutline fontSize="small" color="action" />
                  </Tooltip>
                </Stack>
                {riskAssessment?.updated_at && (
                  <Typography variant="caption" color="text.secondary">
                    {t('view.risksUpdated', {
                      date: new Date(riskAssessment.updated_at).toLocaleString(locale),
                    })}
                  </Typography>
                )}
              </Stack>
              <Typography
                variant="body2"
                sx={{ mt: 1.5, whiteSpace: 'pre-wrap' }}
                color={riskAssessment ? 'text.primary' : 'text.secondary'}
              >
                {riskAssessment?.summary?.trim() || t('view.risksEmpty')}
              </Typography>
            </CardContent>
          </Card>

          {showRefineForm && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('view.refineTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('view.refineHint')}
                </Typography>
                <ContractJurisdictionFormFields
                  countryCode={refineCountry}
                  outputLanguage={refineOutputLang}
                  onCountryChange={setRefineCountry}
                  onOutputLanguageChange={setRefineOutputLang}
                  outputLanguageError={!isValidOutputLanguageTag(refineOutputLang)}
                  disabled={isRefining}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder={t('view.refinePlaceholder')}
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
                      <span>{t('new.riskCheck')}</span>
                      {!hasRiskCheckAccess && (
                        <Chip
                          icon={<Lock fontSize="small" />}
                          label={t('new.businessChip')}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      <Tooltip title={t('view.riskTooltipRefine')}>
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
                    startIcon={
                      isRefining ? (
                        <CircularProgress color="inherit" size={22} thickness={4} />
                      ) : undefined
                    }
                  >
                    {isRefining ? t('view.aiWorking') : t('view.applyChanges')}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowRefineForm(false);
                      setRefinePrompt('');
                    }}
                    disabled={isRefining}
                  >
                    {t('new.cancel')}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>{t('view.aiDisclaimerBold')}</strong>
              <br />
              {t('view.aiDisclaimerText')}
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <ContractFieldsEditor
              fields={fields}
              onChange={setFields}
              title={t('view.filledFieldsTitle')}
            />
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }} spacing={2}>
              <Button variant="contained" onClick={handleSaveFields} disabled={isUpdatingFields}>
                {isUpdatingFields ? t('view.saving') : t('view.saveFields')}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mb: 3 }}>
            {hasSectionsAccess && sectionsEnabled ? (
              <>
                <ContractSectionsEditor
                  sections={sections}
                  onChange={setSections}
                  title={t('view.sectionsTitle')}
                  headerAddon={
                    <FormControlLabel
                      control={
                        <Switch
                          checked={sectionsEnabled}
                          onChange={(e) => setSectionsEnabled(e.target.checked)}
                        />
                      }
                      label={t('new.enable')}
                    />
                  }
                />
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }} spacing={2}>
                  <Button
                    variant="contained"
                    onClick={handleSaveSections}
                    disabled={isUpdatingSections}
                  >
                    {isUpdatingSections ? t('view.saving') : t('view.saveSections')}
                  </Button>
                </Stack>
              </>
            ) : (
              <Card>
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6">{t('view.sectionsTitle')}</Typography>
                        {!hasSectionsAccess && (
                          <Chip
                            icon={<Lock fontSize="small" />}
                            label={t('new.proChip')}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        <Tooltip title={t('new.sectionsTooltip')}>
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
                        label={t('new.enable')}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {hasSectionsAccess ? t('view.sectionsHidden') : t('view.sectionsUpsell')}
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
              {t('view.docIdLine', {
                id,
                date: new Date(selectedVersion?.updated_at || document.updated_at).toLocaleString(
                  locale,
                ),
              })}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => navigate('/dashboard')}>
                {t('view.backToList')}
              </Button>
              <Button
                variant="contained"
                onClick={() => showSnackbar(t('view.snackSaved'))}
              >
                {t('view.autoSaved')}
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
