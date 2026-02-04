import { useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const defaultSections: ContractSectionInput[] = [
  { title: 'Преамбула', order: 1 },
  { title: 'Предмет договора', order: 2 },
  { title: 'Права и обязанности сторон', order: 3 },
  { title: 'Стоимость и порядок расчетов', order: 4 },
  { title: 'Сроки выполнения и приемка', order: 5 },
  { title: 'Ответственность сторон', order: 6 },
  { title: 'Конфиденциальность', order: 7 },
  { title: 'Форс-мажор', order: 8 },
  { title: 'Порядок разрешения споров', order: 9 },
  { title: 'Срок действия, изменение и расторжение', order: 10 },
  { title: 'Заключительные положения', order: 11 },
  { title: 'Реквизиты и подписи сторон', order: 12 },
];

export const NewContract = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [riskCheck, setRiskCheck] = useState(false);
  const [fields, setFields] = useState<ContractFieldInput[]>([]);
  const [sections, setSections] = useState<ContractSectionInput[]>(defaultSections);
  const [sectionsEnabled, setSectionsEnabled] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [limitError, setLimitError] = useState<LimitReachedError | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { data: templates, isLoading: templatesLoading, error: templatesError } = useTemplates();
  const { data: selectedTemplate, isLoading: loadingTemplate } = useTemplate(
    templateId || undefined
  );
  const { data: usage, refetch: refetchUsage } = useUsage();
  const confirmPaymentMutation = useConfirmPayment();

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
            setSnackbarMessage(
              result.message || 'Оплата прошла успешно! Теперь вы можете создать договор.'
            );
          } else {
            setSnackbarMessage(result.message || 'Платёж обрабатывается...');
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
          setSnackbarMessage('Оплата обрабатывается. Попробуйте обновить страницу.');
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
    if (selectedTemplate) {
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
        title: s.title,
        order: s.order,
      }));
      setSections(nextSections);
      setSectionsEnabled(false);
    } else {
      setFields([]);
      setSections(defaultSections);
      setSectionsEnabled(false);
    }
  }, [selectedTemplate]);

  const canSubmit = useMemo(() => !!title.trim() && !!prompt.trim(), [title, prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLimitError(null);

    generateContract(
      {
        title,
        template_id: templateId || undefined,
        prompt,
        risk_check: hasRiskCheckAccess ? riskCheck : false,
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
            title="Создать договор с AI | ДоговорAI"
            description="Соберите договор (NDA, SLA и любые соглашения): выберите шаблон, заполните поля и сгенерируйте текст."
          />
          <LoadingSpinner message="Загрузка шаблонов..." />
        </Layout>
      </ProtectedRoute>
    );
  }

  if (templatesError) {
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
      <Layout maxWidth="md">
        <PageMeta
          title="Создать договор с AI | ДоговорAI"
          description="Настройте разделы, заполните параметры и получите готовый договор с помощью AI."
        />
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Создать новый договор
          </Typography>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              {generateError && !limitError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Не удалось создать договор. Попробуйте еще раз.
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
                  label="Название договора"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  margin="normal"
                  required
                  placeholder="Например: NDA с ООО Компания"
                />

                <FormControl fullWidth margin="normal">
                  <InputLabel>Шаблон</InputLabel>
                  <Select
                    value={templateId}
                    label="Шаблон"
                    onChange={(e) => setTemplateId(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Без шаблона</em>
                    </MenuItem>
                    {templates?.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Описание / Параметры"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  margin="normal"
                  multiline
                  rows={6}
                  required
                  placeholder="Опишите детали договора: стороны, предмет, сроки, условия..."
                  helperText="Чем подробнее описание, тем точнее будет сгенерирован документ"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hasRiskCheckAccess ? riskCheck : false}
                      onChange={(e) => setRiskCheck(e.target.checked)}
                      disabled={!hasRiskCheckAccess}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
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
                      <Tooltip title="Включите, чтобы AI оценил текст договора и подсветил потенциальные юридические риски.">
                        <HelpOutline fontSize="small" color="action" />
                      </Tooltip>
                    </Stack>
                  }
                  sx={{ mt: 1 }}
                />

                {loadingTemplate && templateId && (
                  <Box sx={{ mt: 2 }}>
                    <LoadingSpinner message="Загрузка полей шаблона..." />
                  </Box>
                )}

                {!loadingTemplate && (
                  <Box sx={{ mt: 2 }}>
                    <ContractFieldsEditor fields={fields} onChange={setFields} />
                  </Box>
                )}

                {!loadingTemplate && (
                  <Box sx={{ mt: 2 }}>
                    {hasSectionsAccess && sectionsEnabled ? (
                      <>
                        <ContractSectionsEditor
                          sections={sections}
                          onChange={setSections}
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
                            {!hasSectionsAccess && (
                              <Typography variant="body2" color="text.secondary">
                                Настройка разделов доступна на платных тарифах.
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
                    disabled={isGenerating || !canSubmit}
                    fullWidth
                  >
                    {isGenerating ? 'Генерация документа...' : 'Сгенерировать договор'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/dashboard')}
                    disabled={isGenerating}
                  >
                    Отмена
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              Документ создается автоматически с помощью AI. Перед применением убедитесь, что он
              подходит под ваши требования. Перед использованием желательно проконсультироваться с
              юристом.
            </Typography>
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
