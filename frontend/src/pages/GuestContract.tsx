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
} from '@mui/material';
import { HelpOutline, Download } from '@mui/icons-material';
import { Layout } from '@/shared/components';
import { ContractFieldsEditor } from '@/features/contracts/components/ContractFieldsEditor';
import { ContractSectionsEditor } from '@/features/contracts/components/ContractSectionsEditor';
import { ContractEditor } from '@/features/contracts/components/ContractEditor';
import { ContractFieldInput, ContractSectionInput } from '@/shared/types';
import {
  useGuestExportContract,
  useGuestGenerateContract,
} from '@/features/contracts/hooks/useContracts';

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
  const [title, setTitle] = useState('');
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

  const { mutate: guestGenerate, isPending: isGenerating } = useGuestGenerateContract();
  const { mutate: guestExport, isPending: isExporting } = useGuestExportContract();

  const canSubmit = useMemo(() => !!title.trim() && !!prompt.trim(), [title, prompt]);

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setTitle(parsed.title || '');
      setPrompt(parsed.prompt || '');
      setRiskCheck(!!parsed.riskCheck);
      setFields(parsed.fields || []);
      setSections(parsed.sections?.length ? parsed.sections : defaultSections);
      setSectionsEnabled(!!parsed.sectionsEnabled);
      setContent(parsed.content || '');
      setExportTitle(parsed.exportTitle || parsed.title || '');
      setRiskSummary(parsed.riskSummary || null);
    } catch {
      /* ignore corrupted state */
    }
  }, []);

  useEffect(() => {
    const snapshot = {
      title,
      prompt,
      riskCheck,
      fields,
      sections,
      sectionsEnabled,
      content,
      exportTitle,
      riskSummary,
    };
    sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
  }, [
    title,
    prompt,
    riskCheck,
    fields,
    sections,
    sectionsEnabled,
    content,
    exportTitle,
    riskSummary,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setRiskSummary(null);

    guestGenerate(
      {
        title,
        prompt,
        risk_check: riskCheck,
        fields,
        sections: sectionsEnabled ? sections : [],
      },
      {
        onSuccess: (data) => {
          setContent(data.content);
          setExportTitle(data.title || title);
          setRiskSummary(data.risk_assessment || null);
          setSuccessMessage('Документ сгенерирован. Можно отредактировать и экспортировать.');
        },
        onError: (err: any) => {
          const detail =
            err?.response?.data?.detail ||
            err?.message ||
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
      { html: content, title: exportTitle || title || 'document', format },
      {
        onError: (err: any) => {
          const detail =
            err?.response?.data?.detail ||
            err?.message ||
            `Не удалось экспортировать в ${format.toUpperCase()}`;
          setErrorMessage(typeof detail === 'string' ? detail : 'Ошибка экспорта');
        },
      }
    );
  };

  return (
    <Layout maxWidth="md">
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

        <Card>
          <CardContent>
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

              <Tooltip title="Выберите шаблон после регистрации или входа">
                <span>
                  <FormControl fullWidth margin="normal" disabled>
                    <InputLabel>Шаблон</InputLabel>
                    <Select value="" label="Шаблон">
                      <MenuItem value="">Недоступно для гостей</MenuItem>
                    </Select>
                  </FormControl>
                </span>
              </Tooltip>

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
                  disabled={isGenerating || !canSubmit}
                  fullWidth
                >
                  {isGenerating ? 'Генерация...' : 'Сгенерировать договор'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  disabled={isGenerating}
                  onClick={() => {
                    setTitle('');
                    setPrompt('');
                    setFields([]);
                    setSections(defaultSections);
                    setSectionsEnabled(false);
                    setContent('');
                    setExportTitle('');
                    setRiskSummary(null);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                >
                  Очистить
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Договор сохраняется только в этой вкладке браузера. Скачайте файл, чтобы не потерять
            результат.
          </Typography>
        </Alert>

        {content && (
          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
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
            </Stack>

            {riskSummary && (
              <Card sx={{ mb: 2 }} variant="outlined">
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
          </Box>
        )}
      </Box>
    </Layout>
  );
};
