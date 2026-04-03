import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  FormControlLabel,
  Checkbox,
  Switch,
  Stack,
  Tooltip,
  Chip,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useLocalizedNavigate } from '@/shared/i18n/useLocalizedPath';
import {
  Layout,
  ProtectedRoute,
  LoadingSpinner,
  ErrorMessage,
  UpgradeModal,
} from '@/shared/components';
import { useTemplate, useTemplates } from '@/features/templates/hooks/useTemplates';
import { useGenerateContract } from '@/features/contracts/hooks/useContracts';
import { ContractFieldsEditor } from '@/features/contracts/components/ContractFieldsEditor';
import { ContractFieldInput, ContractSectionInput, LimitReachedError } from '@/shared/types';
import { ContractSectionsEditor } from '@/features/contracts/components/ContractSectionsEditor';
import { HelpOutline, Lock } from '@mui/icons-material';
import { PageMeta } from '@/shared/components/PageMeta';
import { useUsage, useConfirmPayment } from '@/features/billing/hooks/useBilling';
import { AxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { authStore } from '@/features/auth/store/authStore';
import { useGeoHint } from '@/shared/hooks/useGeoHint';
import { defaultCountryFromAppLocale } from '@/shared/i18n/countryDefaults';
import {
  isValidOutputLanguageTag,
  normalizeOutputLanguageTag,
} from '@/shared/i18n/outputLanguageTag';
import { ContractJurisdictionFormFields } from '@/features/contracts/components/ContractJurisdictionFormFields';

export const NewContract = () => {
  const { t, i18n } = useTranslation('contracts');
  const { t: tc } = useTranslation('common');
  const navigate = useLocalizedNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [riskCheck, setRiskCheck] = useState(false);
  const [fields, setFields] = useState<ContractFieldInput[]>([]);
  const defaultFromI18n = useMemo((): ContractSectionInput[] => {
    const titles = t('sectionsDefault', { returnObjects: true }) as unknown;
    if (!Array.isArray(titles)) return [];
    return titles.map((title, i) => ({
      title: String(title),
      order: i + 1,
      section_uid: `default-section-${i}`,
    }));
  }, [t]);

  const [sections, setSections] = useState<ContractSectionInput[]>(defaultFromI18n);
  const [sectionsEnabled, setSectionsEnabled] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [limitError, setLimitError] = useState<LimitReachedError | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const promptRef = useRef<HTMLInputElement | null>(null);

  const { data: templates, isLoading: templatesLoading, error: templatesError } = useTemplates();
  const { data: selectedTemplate, isLoading: loadingTemplate } = useTemplate(
    templateId || undefined
  );
  const { data: usage, refetch: refetchUsage } = useUsage();
  const { data: geo } = useGeoHint();
  const confirmPaymentMutation = useConfirmPayment();
  const countryUserTouchedRef = useRef(false);
  const outputLanguageUserTouchedRef = useRef(false);
  const [countryCode, setCountryCode] = useState(() => defaultCountryFromAppLocale(i18n.language));
  const [outputLanguage, setOutputLanguage] = useState(() =>
    normalizeOutputLanguageTag(i18n.language),
  );

  // Get hydration state
  const hasHydrated = authStore((state) => state._hasHydrated);
  const isAuthenticated = authStore((state) => state.isAuthenticated);

  // Handle payment success redirect - only after hydration
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');

    if (paymentStatus === 'success' && hasHydrated && isAuthenticated) {
      // Remove the query param first to prevent re-triggering
      setSearchParams({});

      // Confirm payment on backend (applies extra contract if webhook missed it)
      confirmPaymentMutation.mutate(undefined, {
        onSuccess: (result) => {
          if (result.success) {
            setSnackbarMessage(result.message || t('new.paymentSuccess'));
          } else {
            setSnackbarMessage(result.message || t('new.paymentProcessing'));
          }
          setSnackbarOpen(true);
          setLimitError(null);
          // Refresh usage data
          queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
          refetchUsage();
        },
        onError: () => {
          // Fallback - just refresh
          queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
          refetchUsage();
          setSnackbarMessage(t('new.paymentError'));
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
    refetchUsage,
    t,
  ]);
  const {
    mutate: generateContract,
    isPending: isGenerating,
    error: generateError,
  } = useGenerateContract();

  // Feature access based on subscription
  const hasSectionsAccess = usage?.features?.hasSections ?? false;
  const hasRiskCheckAccess = usage?.features?.hasRiskCheck ?? false;

  useEffect(() => {
    if (!templateId) {
      setFields([]);
      setSections(defaultFromI18n);
      setSectionsEnabled(false);
      return;
    }
    if (!selectedTemplate) return;

    const nextFields: ContractFieldInput[] = selectedTemplate.groups.flatMap((group) =>
      group.fields.map((field) => ({
        template_field_id: field.id,
        group_label: group.label,
        group_order: group.order,
        label: field.label,
        key: field.key,
        value: field.default_value || '',
        order: field.order,
      }))
    );
    setFields(nextFields);
    setPrompt((prev) => (prev.trim().length ? prev : selectedTemplate.content));
    const nextSections: ContractSectionInput[] = selectedTemplate.sections.map((s) => ({
      template_section_id: s.id,
      section_uid: s.id,
      title: s.title,
      order: s.order,
    }));
    setSections(nextSections);
    setSectionsEnabled(false);
  }, [templateId, selectedTemplate, defaultFromI18n]);

  useEffect(() => {
    if (selectedTemplate?.default_country_code) {
      setCountryCode(selectedTemplate.default_country_code);
      countryUserTouchedRef.current = false;
      return;
    }
    if (countryUserTouchedRef.current) return;
    if (geo?.countryCode) {
      setCountryCode(geo.countryCode);
    }
  }, [selectedTemplate?.id, selectedTemplate?.default_country_code, geo?.countryCode]);

  useEffect(() => {
    if (selectedTemplate?.default_output_language) {
      setOutputLanguage(normalizeOutputLanguageTag(selectedTemplate.default_output_language));
      outputLanguageUserTouchedRef.current = false;
      return;
    }
    if (outputLanguageUserTouchedRef.current) return;
    setOutputLanguage(normalizeOutputLanguageTag(i18n.language));
  }, [selectedTemplate?.id, selectedTemplate?.default_output_language, i18n.language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLimitError(null);
    const hasTitle = !!title.trim();
    const hasPrompt = !!prompt.trim();

    if (!hasTitle || !hasPrompt) {
      setShowValidation(true);
      setSnackbarMessage(t('new.validationSnackbar'));
      setSnackbarOpen(true);
      if (!hasTitle && titleRef.current) {
        titleRef.current.focus();
      } else if (!hasPrompt && promptRef.current) {
        promptRef.current.focus();
      }
      return;
    }

    if (!isValidOutputLanguageTag(outputLanguage)) {
      setShowValidation(true);
      setSnackbarMessage(t('new.outputLanguageError'));
      setSnackbarOpen(true);
      return;
    }

    generateContract(
      {
        title,
        template_id: templateId || undefined,
        prompt,
        risk_check: hasRiskCheckAccess ? riskCheck : false,
        country_code: countryCode,
        output_language: outputLanguage,
        fields,
        sections: hasSectionsAccess && sectionsEnabled ? sections : [],
      },
      {
        onSuccess: (data) => {
          navigate(`/contract/${data.document.id}`);
        },
        onError: (error) => {
          const axiosError = error as AxiosError<LimitReachedError>;
          if (axiosError.response?.data?.code === 'LIMIT_REACHED') {
            setLimitError(axiosError.response.data);
            setUpgradeModalOpen(true);
          }
        },
      }
    );
  };

  if (templatesLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <PageMeta
            title={t('new.metaTitle')}
            description={t('new.metaDescriptionLoading')}
            siteName={tc('brand.name')}
          />
          <LoadingSpinner message={t('new.loadingTemplates')} />
        </Layout>
      </ProtectedRoute>
    );
  }

  if (templatesError) {
    return (
      <ProtectedRoute>
        <Layout>
          <ErrorMessage message={t('new.loadError')} />
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout maxWidth="md">
        <PageMeta
          title={t('new.metaTitle')}
          description={t('new.metaDescription')}
          siteName={tc('brand.name')}
        />
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('new.pageTitle')}
          </Typography>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              {generateError && !limitError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {t('new.createError')}
                </Alert>
              )}
              {limitError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {limitError.detail}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label={t('new.titleLabel')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  margin="normal"
                  placeholder={t('new.titlePlaceholder')}
                  error={showValidation && !title.trim()}
                  inputRef={titleRef}
                  helperText={
                    showValidation && !title.trim() ? t('new.titleError') : t('new.titleHelper')
                  }
                  disabled={isGenerating}
                />

                <FormControl fullWidth margin="normal" disabled={isGenerating}>
                  <InputLabel>{t('new.templateLabel')}</InputLabel>
                  <Select
                    value={templateId}
                    label={t('new.templateLabel')}
                    onChange={(e) => setTemplateId(e.target.value)}
                    MenuProps={{ disablePortal: true, PaperProps: { sx: { maxHeight: 320 } } }}
                  >
                    <MenuItem value="">
                      <em>{t('new.noTemplate')}</em>
                    </MenuItem>
                    {templates?.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <ContractJurisdictionFormFields
                  countryCode={countryCode}
                  outputLanguage={outputLanguage}
                  onCountryChange={(c) => {
                    countryUserTouchedRef.current = true;
                    setCountryCode(c);
                  }}
                  onOutputLanguageChange={(lang) => {
                    outputLanguageUserTouchedRef.current = true;
                    setOutputLanguage(lang);
                  }}
                  outputLanguageError={showValidation && !isValidOutputLanguageTag(outputLanguage)}
                  disabled={isGenerating}
                />

                <TextField
                  fullWidth
                  label={t('new.promptLabel')}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  margin="normal"
                  multiline
                  rows={6}
                  placeholder={t('new.promptPlaceholder')}
                  error={showValidation && !prompt.trim()}
                  inputRef={promptRef}
                  helperText={
                    showValidation && !prompt.trim() ? t('new.promptError') : t('new.promptHelper')
                  }
                  disabled={isGenerating}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hasRiskCheckAccess ? riskCheck : false}
                      onChange={(e) => setRiskCheck(e.target.checked)}
                      disabled={!hasRiskCheckAccess || isGenerating}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
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
                      <Tooltip title={t('new.riskTooltipNew')}>
                        <HelpOutline fontSize="small" color="action" />
                      </Tooltip>
                    </Stack>
                  }
                  sx={{ mt: 1 }}
                />

                {loadingTemplate && templateId && (
                  <Box sx={{ mt: 2 }}>
                    <LoadingSpinner message={t('new.loadingFields')} />
                  </Box>
                )}

                {!loadingTemplate && (
                  <Box sx={{ mt: 2 }}>
                    <ContractFieldsEditor
                      fields={fields}
                      onChange={setFields}
                      disabled={isGenerating}
                    />
                  </Box>
                )}

                {!loadingTemplate && (
                  <Box sx={{ mt: 2 }}>
                    {hasSectionsAccess && sectionsEnabled ? (
                      <>
                        <ContractSectionsEditor
                          sections={sections}
                          onChange={setSections}
                          disabled={isGenerating}
                          headerAddon={
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={sectionsEnabled}
                                  onChange={(e) => setSectionsEnabled(e.target.checked)}
                                  disabled={isGenerating}
                                />
                              }
                              label={t('new.enable')}
                            />
                          }
                        />
                      </>
                    ) : (
                      <Card>
                        <CardContent>
                          <Stack spacing={1}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="h6">{t('new.sectionsTitle')}</Typography>
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
                                    disabled={!hasSectionsAccess || isGenerating}
                                  />
                                }
                                label={t('new.enable')}
                              />
                            </Stack>
                            {!hasSectionsAccess && (
                              <Typography variant="body2" color="text.secondary">
                                {t('new.sectionsUpsell')}
                              </Typography>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    )}
                  </Box>
                )}

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isGenerating}
                    fullWidth
                    startIcon={
                      isGenerating ? (
                        <CircularProgress color="inherit" size={22} thickness={4} />
                      ) : undefined
                    }
                  >
                    {isGenerating ? t('new.generating') : t('new.generate')}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/dashboard')}
                    disabled={isGenerating}
                  >
                    {t('new.cancel')}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">{t('new.disclaimer')}</Typography>
          </Alert>
        </Box>

        {/* Upgrade Modal for limit reached */}
        {limitError && (
          <UpgradeModal
            open={upgradeModalOpen}
            onClose={() => setUpgradeModalOpen(false)}
            limitType={limitError.limit_type}
            currentUsage={limitError.current_usage}
            limit={limitError.limit}
            upgradeOptions={limitError.upgrade_options}
            showSingleContractOption={
              limitError.limit_type === 'contracts' && !!limitError.single_contract_price
            }
          />
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
