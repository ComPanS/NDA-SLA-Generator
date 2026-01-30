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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Layout, ProtectedRoute, LoadingSpinner, ErrorMessage } from '@/shared/components';
import { useTemplate, useTemplates } from '@/features/templates/hooks/useTemplates';
import { useGenerateContract } from '@/features/contracts/hooks/useContracts';
import { ContractFieldsEditor } from '@/features/contracts/components/ContractFieldsEditor';
import { ContractFieldInput, ContractSectionInput } from '@/shared/types';
import { ContractSectionsEditor } from '@/features/contracts/components/ContractSectionsEditor';

export const NewContract = () => {
  const defaultSections: ContractSectionInput[] = [
    { title: 'Преамбула', order: 0 },
    { title: 'Предмет договора', order: 1 },
    { title: 'Права и обязанности сторон', order: 2 },
    { title: 'Стоимость и порядок расчетов', order: 3 },
    { title: 'Сроки выполнения и приемка', order: 4 },
    { title: 'Ответственность сторон', order: 5 },
    { title: 'Конфиденциальность', order: 6 },
    { title: 'Форс-мажор', order: 7 },
    { title: 'Порядок разрешения споров', order: 8 },
    { title: 'Срок действия, изменение и расторжение', order: 9 },
    { title: 'Заключительные положения', order: 10 },
    { title: 'Реквизиты и подписи сторон', order: 11 },
  ];

  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [riskCheck, setRiskCheck] = useState(false);
  const [fields, setFields] = useState<ContractFieldInput[]>([]);
  const [sections, setSections] = useState<ContractSectionInput[]>(defaultSections);

  const { data: templates, isLoading: templatesLoading, error: templatesError } = useTemplates();
  const { data: selectedTemplate, isLoading: loadingTemplate } = useTemplate(
    templateId || undefined
  );
  const {
    mutate: generateContract,
    isPending: isGenerating,
    error: generateError,
  } = useGenerateContract();

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
    } else {
      setFields([]);
      setSections(defaultSections);
    }
  }, [selectedTemplate]);

  const canSubmit = useMemo(() => !!title.trim() && !!prompt.trim(), [title, prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    generateContract(
      {
        title,
        template_id: templateId || undefined,
        prompt,
        risk_check: riskCheck,
        fields,
        sections,
      },
      {
        onSuccess: (data) => {
          navigate(`/contract/${data.document.id}`);
        },
      }
    );
  };

  if (templatesLoading) {
    return (
      <ProtectedRoute>
        <Layout>
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
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Создать новый договор
          </Typography>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              {generateError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Не удалось создать договор. Попробуйте еще раз.
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
                      checked={riskCheck}
                      onChange={(e) => setRiskCheck(e.target.checked)}
                    />
                  }
                  label="Проверить на юридические риски"
                  sx={{ mt: 1 }}
                />

                {(loadingTemplate && templateId) && (
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
                    <ContractSectionsEditor sections={sections} onChange={setSections} />
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
              Документ создается автоматически с помощью AI. Рекомендуется проверка
              квалифицированным юристом перед использованием.
            </Typography>
          </Alert>
        </Box>
      </Layout>
    </ProtectedRoute>
  );
};
