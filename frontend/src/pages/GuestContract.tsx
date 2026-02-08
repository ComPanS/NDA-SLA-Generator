import { useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';
import { HelpOutline, Download } from '@mui/icons-material';
import { Layout, PageMeta } from '@/shared/components';
import { ContractFieldsEditor } from '@/features/contracts/components/ContractFieldsEditor';
import { ContractSectionsEditor } from '@/features/contracts/components/ContractSectionsEditor';
import { ContractEditor } from '@/features/contracts/components/ContractEditor';
import { ContractFieldInput, ContractSectionInput } from '@/shared/types';
import {
  useGuestExportContract,
  useGuestGenerateContract,
} from '@/features/contracts/hooks/useContracts';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

const storageKey = 'guest-contract-state-v1';

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

export const GuestContract = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [riskCheck, setRiskCheck] = useState(false);
  const [fields, setFields] = useState<ContractFieldInput[]>([]);
  const [sections, setSections] = useState<ContractSectionInput[]>(defaultSections);
  const [sectionsEnabled, setSectionsEnabled] = useState(false);
  const [content, setContent] = useState('');
  const [exportTitle, setExportTitle] = useState('');
  const [riskSummary, setRiskSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const { mutate: guestGenerate, isPending: isGenerating } = useGuestGenerateContract();
  const { mutate: guestExport, isPending: isExporting } = useGuestExportContract();

  const derivedTitle = useMemo(
    () => (prompt.trim() ? prompt.trim().slice(0, 80) : 'Гостевой договор'),
    [prompt]
  );
  const isPromptMissing = showValidation && !prompt.trim();

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setPrompt(parsed.prompt || '');
      setRiskCheck(!!parsed.riskCheck);
      setFields(parsed.fields || []);
      setSections(parsed.sections?.length ? parsed.sections : defaultSections);
      setSectionsEnabled(!!parsed.sectionsEnabled);
      setContent(parsed.content || '');
      setExportTitle(parsed.exportTitle || parsed.title || '');
      setRiskSummary(parsed.riskSummary || null);
      setIsGenerated(!!parsed.content);
    } catch {
      /* ignore corrupted state */
    }
  }, []);

  useEffect(() => {
    const snapshot = {
      prompt,
      riskCheck,
      fields,
      sections,
      sectionsEnabled,
      content,
      exportTitle,
      riskSummary,
      isGenerated,
    };
    sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
  }, [
    prompt,
    riskCheck,
    fields,
    sections,
    sectionsEnabled,
    content,
    exportTitle,
    riskSummary,
    isGenerated,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setRiskSummary(null);
    setShowValidation(true);

    if (!prompt.trim()) {
      setErrorMessage('Заполните обязательные поля.');
      return;
    }

    guestGenerate(
      {
        title: derivedTitle,
        prompt,
        risk_check: riskCheck,
        fields,
        sections: sectionsEnabled ? sections : [],
      },
      {
        onSuccess: (data) => {
          setContent(data.content);
          setExportTitle(data.title || derivedTitle);
          setRiskSummary(data.risk_assessment || null);
          setSuccessMessage('Документ сгенерирован. Можно отредактировать и экспортировать.');
          setShowValidation(false);
          setIsGenerated(true);
        },
        onError: (error) => {
          const err = error as AxiosError<{ detail?: string }>;
          const detail =
            err.response?.data?.detail ||
            err.message ||
            'Не удалось создать договор. Попробуйте позже.';
          setErrorMessage(
            typeof detail === 'string' ? detail : 'Не удалось создать договор. Попробуйте позже.'
          );
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
            `Не удалось экспортировать в ${format.toUpperCase()}`;
          setErrorMessage(typeof detail === 'string' ? detail : 'Ошибка экспорта');
        },
      }
    );
  };

  return (
    <Layout maxWidth="md">
      <PageMeta
        title="Создание договора без регистрации — ДоговорAI"
        description="Сгенерируйте тестовый договор бесплатно и без регистрации: NDA, SLA и другие шаблоны."
        path="/guest-contract"
      />
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Бесплатный договор без регистрации
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Доступ сохраняется в этой вкладке до её закрытия.
        </Typography>

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
              <Tooltip title="Шаблоны доступны после регистрации или входа">
                <span>
                  <FormControl fullWidth margin="normal" disabled>
                    <InputLabel>Шаблон</InputLabel>
                    <Select value="" label="Шаблон">
                      <MenuItem value="">Недоступно для гостей</MenuItem>
                    </Select>
                  </FormControl>
                </span>
              </Tooltip>
              <Typography variant="caption" color="text.secondary">
                Шаблоны станут доступны после регистрации или входа в аккаунт.
              </Typography>

              <TextField
                fullWidth
                label="Описание / Параметры"
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
                placeholder="Опишите детали договора: стороны, предмет, сроки, условия..."
                helperText={
                  isPromptMissing
                    ? 'Заполните обязательное поле'
                    : 'Чем подробнее описание, тем точнее будет сгенерирован документ'
                }
                error={isPromptMissing}
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
                  <Checkbox checked={riskCheck} onChange={(e) => setRiskCheck(e.target.checked)} />
                }
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>Проверить на юридические риски</span>
                    <Tooltip title="Включите, чтобы AI оценил текст договора и подсветил потенциальные юридические риски.">
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
                      <Typography variant="h6">Юридические риски</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Получено при генерации
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {riskSummary}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <Box sx={{ mt: 2 }}>
                <ContractFieldsEditor fields={fields} onChange={setFields} />
              </Box>

              <Box sx={{ mt: 2 }}>
                {sectionsEnabled ? (
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
                          Разделы будут подобраны автоматически.
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
                >
                  {isGenerating ? 'Генерация...' : 'Сгенерировать договор'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  disabled={isGenerating}
                  onClick={() => {
                    setPrompt('');
                    setFields([]);
                    setSections(defaultSections);
                    setSectionsEnabled(false);
                    setContent('');
                    setExportTitle('');
                    setRiskSummary(null);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setShowValidation(false);
                    setIsGenerated(false);
                  }}
                >
                  Очистить
                </Button>
              </Box>
              </form>
            </CardContent>
          </Card>
        )}

        {content && (
          <>
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                Договор сохраняется только в этой вкладке браузера. Скачайте файл, чтобы не потерять
                результат.
              </Typography>
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
                      Сгенерированный договор
                    </Typography>
                    <TextField
                      fullWidth
                      label="Название"
                      value={exportTitle || derivedTitle}
                      onChange={(e) => setExportTitle(e.target.value)}
                      helperText="Название попадёт в экспорт и сохранится в этой сессии"
                      size="small"
                      sx={{ maxWidth: 420 }}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label="Гостевой режим" size="small" color="default" />
                      <Tooltip title="Сохранение, версии и совместная работа доступны после регистрации">
                        <Chip label="Не сохранено" size="small" variant="outlined" />
                      </Tooltip>
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/login')}
                      size="small"
                    >
                      Войти
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/register')}
                      size="small"
                    >
                      Зарегистрироваться
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
                    Скачать DOCX
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    disabled={isExporting}
                    onClick={() => handleExport('pdf')}
                  >
                    Скачать PDF
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    Файл не сохраняется в аккаунте — скачайте, чтобы не потерять его.
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
                        <Typography variant="h6">Юридические риски</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Получено при генерации
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {riskSummary}
                      </Typography>
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
                    Создать заново
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
