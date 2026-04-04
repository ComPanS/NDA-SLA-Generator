import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { HelpOutline, Download } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Layout, PageMeta } from '@/shared/components';
import { ContractFieldsEditor } from '@/features/contracts/components/ContractFieldsEditor';
import { ContractSectionsEditor } from '@/features/contracts/components/ContractSectionsEditor';
import { ContractEditor } from '@/features/contracts/components/ContractEditor';
import { ContractFieldInput, ContractSectionInput } from '@/shared/types';
import {
  useGuestExportContract,
  useGuestGenerateContract,
  useGuestClarifyContract,
} from '@/features/contracts/hooks/useContracts';
import { useSystemTemplateCatalog, useTemplate } from '@/features/templates/hooks/useTemplates';
import { AxiosError } from 'axios';
import { useLocation } from 'react-router-dom';
import { useLocalizedNavigate } from '@/shared/i18n/useLocalizedPath';
import { useGeoHint } from '@/shared/hooks/useGeoHint';
import { defaultCountryFromAppLocale } from '@/shared/i18n/countryDefaults';
import {
  isValidOutputLanguageTag,
  normalizeOutputLanguageTag,
} from '@/shared/i18n/outputLanguageTag';
import { ContractJurisdictionFormFields } from '@/features/contracts/components/ContractJurisdictionFormFields';

const storageKey = 'guest-contract-state-v1';

export const GuestContract = () => {
  const { t } = useTranslation('guest');
  const { t: tc, i18n } = useTranslation('contracts');
  const { t: tCommon } = useTranslation('common');
  const location = useLocation();
  const { data: geo } = useGeoHint();
  const countryTouchedRef = useRef(false);
  const outputLanguageTouchedRef = useRef(false);
  const navigate = useLocalizedNavigate();

  const defaultFromI18n = useMemo((): ContractSectionInput[] => {
    const titles = tc('sectionsDefault', { returnObjects: true }) as unknown;
    if (!Array.isArray(titles)) return [];
    return titles.map((title, i) => ({
      title: String(title),
      order: i + 1,
      section_uid: `default-section-${i}`,
    }));
  }, [tc]);

  const [templateId, setTemplateId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [riskCheck, setRiskCheck] = useState(false);
  const [fields, setFields] = useState<ContractFieldInput[]>([]);
  const [sections, setSections] = useState<ContractSectionInput[]>(defaultFromI18n);
  const [sectionsEnabled, setSectionsEnabled] = useState(false);
  const [content, setContent] = useState('');
  const [exportTitle, setExportTitle] = useState('');
  const [riskSummary, setRiskSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [clarifyPrompt, setClarifyPrompt] = useState('');
  const [isClarified, setIsClarified] = useState(false);
  const [countryCode, setCountryCode] = useState(() => defaultCountryFromAppLocale(i18n.language));
  const [outputLanguage, setOutputLanguage] = useState(() =>
    normalizeOutputLanguageTag(i18n.language),
  );

  const { mutate: guestGenerate, isPending: isGenerating } = useGuestGenerateContract();
  const { mutate: guestExport, isPending: isExporting } = useGuestExportContract();
  const { mutate: guestClarify, isPending: isClarifying } = useGuestClarifyContract();
  const {
    data: catalog,
    isLoading: catalogLoading,
    error: catalogError,
  } = useSystemTemplateCatalog();
  const { data: selectedTemplate } = useTemplate(templateId || undefined);

  const derivedTitle = useMemo(
    () => (prompt.trim() ? prompt.trim().slice(0, 80) : t('defaultTitle')),
    [prompt, t]
  );
  const isPromptMissing = showValidation && !prompt.trim();

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setTemplateId(typeof parsed.templateId === 'string' ? parsed.templateId : '');
      setPrompt(parsed.prompt || '');
      setRiskCheck(!!parsed.riskCheck);
      setFields(parsed.fields || []);
      if (parsed.sections?.length) {
        setSections(
          parsed.sections.map((s: ContractSectionInput, i: number) => ({
            ...s,
            section_uid: s.section_uid || s.template_section_id || s.id || `restored-${i}`,
          })),
        );
      } else {
        setSections(defaultFromI18n);
      }
      setSectionsEnabled(!!parsed.sectionsEnabled);
      setContent(parsed.content || '');
      setExportTitle(parsed.exportTitle || parsed.title || '');
      setRiskSummary(parsed.riskSummary || null);
      setIsGenerated(!!parsed.content);
      setIsClarified(!!parsed.isClarified);
      if (typeof parsed.countryCode === 'string' && /^[A-Z]{2}$/i.test(parsed.countryCode)) {
        setCountryCode(parsed.countryCode.toUpperCase());
        countryTouchedRef.current = true;
      } else {
        countryTouchedRef.current = false;
      }
      if (
        typeof parsed.outputLanguage === 'string' &&
        isValidOutputLanguageTag(parsed.outputLanguage)
      ) {
        setOutputLanguage(parsed.outputLanguage.trim().replace(/_/g, '-'));
      }
    } catch {
      /* ignore corrupted state */
    }
  }, [defaultFromI18n]);

  useEffect(() => {
    const snapshot = {
      templateId,
      prompt,
      riskCheck,
      fields,
      sections,
      sectionsEnabled,
      content,
      exportTitle,
      riskSummary,
      isGenerated,
      isClarified,
      clarifyPrompt,
      countryCode,
      outputLanguage,
    };
    sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
  }, [
    templateId,
    prompt,
    riskCheck,
    fields,
    sections,
    sectionsEnabled,
    content,
    exportTitle,
    riskSummary,
    isGenerated,
    isClarified,
    clarifyPrompt,
    countryCode,
    outputLanguage,
  ]);

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
      })),
    );
    setFields(nextFields);
    setPrompt(selectedTemplate.content);
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
      countryTouchedRef.current = false;
      return;
    }
    if (countryTouchedRef.current) return;
    if (geo?.countryCode) {
      setCountryCode(geo.countryCode);
    }
  }, [selectedTemplate?.id, selectedTemplate?.default_country_code, geo?.countryCode]);

  useEffect(() => {
    if (selectedTemplate?.default_output_language) {
      setOutputLanguage(normalizeOutputLanguageTag(selectedTemplate.default_output_language));
      outputLanguageTouchedRef.current = false;
      return;
    }
    if (outputLanguageTouchedRef.current) return;
    setOutputLanguage(normalizeOutputLanguageTag(i18n.language));
  }, [selectedTemplate?.id, selectedTemplate?.default_output_language, i18n.language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setRiskSummary(null);
    setShowValidation(true);

    if (!prompt.trim()) {
      setErrorMessage(t('validationError'));
      return;
    }

    if (!isValidOutputLanguageTag(outputLanguage)) {
      setErrorMessage(tc('new.outputLanguageError'));
      return;
    }

    guestGenerate(
      {
        title: derivedTitle,
        prompt,
        template_id: templateId.startsWith('system-') ? templateId : undefined,
        risk_check: riskCheck,
        country_code: countryCode,
        output_language: outputLanguage,
        fields,
        sections: sectionsEnabled ? sections : [],
      },
      {
        onSuccess: (data) => {
          setContent(data.content);
          setExportTitle(data.title || derivedTitle);
          setRiskSummary(data.risk_assessment || null);
          setSuccessMessage(t('success'));
          setShowValidation(false);
          setIsGenerated(true);
          setIsClarified(false);
        },
        onError: (error) => {
          const err = error as AxiosError<{ detail?: string }>;
          const detail =
            err.response?.data?.detail ||
            err.message ||
            t('generateError');
          setErrorMessage(typeof detail === 'string' ? detail : t('generateError'));
        },
      }
    );
  };

  const handleExport = (format: 'docx' | 'pdf') => {
    if (!content.trim()) return;
    setErrorMessage(null);

    guestExport(
      { html: content, title: exportTitle || derivedTitle || 'document', format },
      {
        onError: (error) => {
          const err = error as AxiosError<{ detail?: string }>;
          const detail =
            err.response?.data?.detail ||
            err.message ||
            `${t('exportError')} ${format.toUpperCase()}`;
          setErrorMessage(typeof detail === 'string' ? detail : t('exportError'));
        },
      }
    );
  };

  return (
    <Layout maxWidth="md">
      <PageMeta
        title={t('metaTitle')}
        description={t('metaDesc')}
        path={location.pathname}
        siteName={tCommon('brand.name')}
      />
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {t('hint')}
        </Typography>

        {catalogError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('templateCatalogError')}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {!isGenerated && (
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
              <FormControl fullWidth margin="normal" disabled={isGenerating || catalogLoading}>
                <InputLabel>{t('templateLabel')}</InputLabel>
                <Select
                  value={templateId}
                  label={t('templateLabel')}
                  onChange={(e) => setTemplateId(e.target.value)}
                  MenuProps={{ disablePortal: true, PaperProps: { sx: { maxHeight: 320 } } }}
                >
                  <MenuItem value="">
                    <em>{tc('new.noTemplate')}</em>
                  </MenuItem>
                  {(catalog ?? []).map((tpl) => (
                    <MenuItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {t('templateNote')}
              </Typography>

              <ContractJurisdictionFormFields
                countryCode={countryCode}
                outputLanguage={outputLanguage}
                onCountryChange={(c) => {
                  countryTouchedRef.current = true;
                  setCountryCode(c);
                }}
                onOutputLanguageChange={(lang) => {
                  outputLanguageTouchedRef.current = true;
                  setOutputLanguage(lang);
                }}
                outputLanguageError={showValidation && !isValidOutputLanguageTag(outputLanguage)}
                disabled={isGenerating}
              />

              <TextField
                fullWidth
                label={tc('new.promptLabel')}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (showValidation) {
                    setShowValidation(false);
                    setErrorMessage(null);
                  }
                }}
                margin="normal"
                multiline
                rows={6}
                placeholder={tc('new.promptPlaceholder')}
                helperText={
                  isPromptMissing ? t('promptRequired') : tc('new.promptHelper')
                }
                error={isPromptMissing}
                disabled={isGenerating}
                sx={
                  isPromptMissing
                    ? {
                        '& .MuiOutlinedInput-root': {
                          borderBottom: (theme) => `2px solid ${theme.palette.error.main}`,
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        },
                      }
                    : undefined
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={riskCheck}
                    onChange={(e) => setRiskCheck(e.target.checked)}
                    disabled={isGenerating}
                  />
                }
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>{tc('new.riskCheck')}</span>
                    <Tooltip title={tc('new.riskTooltipNew')}>
                      <HelpOutline fontSize="small" color="action" />
                    </Tooltip>
                  </Stack>
                }
                sx={{ mt: 1 }}
              />

              {riskSummary && (
                <Card sx={{ mt: 2 }} variant="outlined">
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="h6">{t('risksTitle')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('risksFromGen')}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {riskSummary}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <Box sx={{ mt: 2 }}>
                <ContractFieldsEditor
                  fields={fields}
                  onChange={setFields}
                  disabled={isGenerating}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                {sectionsEnabled ? (
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
                        label={tc('new.enable')}
                      />
                    }
                  />
                ) : (
                  <Card>
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="h6">{tc('new.sectionsTitle')}</Typography>
                            <Tooltip title={tc('new.sectionsTooltip')}>
                              <HelpOutline fontSize="small" color="action" />
                            </Tooltip>
                          </Stack>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={sectionsEnabled}
                                onChange={(e) => setSectionsEnabled(e.target.checked)}
                                disabled={isGenerating}
                              />
                            }
                            label={tc('new.enable')}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {t('sectionsAuto')}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Box>

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
                  {isGenerating ? t('generatingShort') : tc('new.generate')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  disabled={isGenerating}
                  onClick={() => {
                    setTemplateId('');
                    setPrompt('');
                    setFields([]);
                    setSections(defaultFromI18n);
                    setSectionsEnabled(false);
                    setContent('');
                    setExportTitle('');
                    setRiskSummary(null);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setShowValidation(false);
                    setIsGenerated(false);
                    setIsClarified(false);
                    setClarifyPrompt('');
                    countryTouchedRef.current = false;
                    setCountryCode(defaultCountryFromAppLocale(i18n.language));
                    setOutputLanguage(normalizeOutputLanguageTag(i18n.language));
                  }}
                >
                  {t('clear')}
                </Button>
              </Box>
              </form>
            </CardContent>
          </Card>
        )}

        {content && (
          <>
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">{t('browserOnly')}</Typography>
            </Alert>

          <Card sx={{ mt: 3 }} variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {t('generatedTitle')}
                    </Typography>
                    <TextField
                      fullWidth
                      label={t('exportName')}
                      value={exportTitle || derivedTitle}
                      onChange={(e) => setExportTitle(e.target.value)}
                      helperText={t('exportNameHelp')}
                      size="small"
                      sx={{ maxWidth: 420 }}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={t('chipGuest')} size="small" color="default" />
                      <Tooltip title={t('chipNotSavedTip')}>
                        <Chip label={t('chipNotSaved')} size="small" variant="outlined" />
                      </Tooltip>
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/login')}
                      size="small"
                    >
                      {t('ctaLogin')}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/register')}
                      size="small"
                    >
                      {t('ctaRegister')}
                    </Button>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    disabled={isExporting}
                    onClick={() => handleExport('docx')}
                  >
                    {t('downloadDocx')}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    disabled={isExporting}
                    onClick={() => handleExport('pdf')}
                  >
                    {t('downloadPdf')}
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    {t('accountHint')}
                  </Typography>
                </Stack>

                {riskSummary && (
                  <Card sx={{ mb: 1 }} variant="outlined">
                    <CardContent>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="h6">{t('risksTitle')}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('risksFromGen')}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {riskSummary}
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {!isClarified && (
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="subtitle1">{t('clarifyTitle')}</Typography>
                        <TextField
                          fullWidth
                          label={t('clarifyLabel')}
                          value={clarifyPrompt}
                          onChange={(e) => setClarifyPrompt(e.target.value)}
                          multiline
                          rows={3}
                          placeholder={t('clarifyPlaceholder')}
                        />
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            size="small"
                            disabled={isClarifying || !clarifyPrompt.trim()}
                            onClick={() => {
                              if (!clarifyPrompt.trim() || !content) return;
                              setErrorMessage(null);
                              setSuccessMessage(null);
                              guestClarify(
                                {
                                  title: exportTitle || derivedTitle,
                                  content,
                                  prompt: clarifyPrompt,
                                  risk_check: riskCheck,
                                  country_code: countryCode,
                                  output_language: outputLanguage,
                                },
                                {
                                  onSuccess: (data) => {
                                    setContent(data.content);
                                    setRiskSummary(data.risk_assessment || null);
                                    setIsClarified(true);
                                    setClarifyPrompt('');
                                    setSuccessMessage(t('clarifySuccess'));
                                  },
                                  onError: () => {
                                    setErrorMessage(t('clarifyError'));
                                  },
                                }
                              );
                            }}
                          >
                            {isClarifying ? t('clarifyApplying') : t('clarifyApply')}
                          </Button>
                          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                            {t('clarifyOnceHint')}
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                <ContractEditor content={content} onChange={setContent} readOnly={false} />

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setIsGenerated(false);
                      setSuccessMessage(null);
                    }}
                  >
                    {t('createAgain')}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          </>
        )}
      </Box>
    </Layout>
  );
};
