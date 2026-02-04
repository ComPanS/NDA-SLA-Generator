import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
  Alert,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@mui/material';
import { Add, Delete, HelpOutline } from '@mui/icons-material';
import { Template, TemplateGroup } from '@/shared/types';
import { useCreateTemplate, useUpdateTemplate } from '../hooks/useTemplates';
import { TemplatePayload } from '@/shared/api';

type EditableGroup = Omit<
  TemplateGroup,
  'id' | 'created_at' | 'updated_at' | 'fields' | 'template_id'
> & {
  id?: string;
  template_id?: string;
  fields: Array<{
    id?: string;
    label: string;
    key: string;
    default_value?: string;
    order?: number;
  }>;
};

type EditableSection = {
  id?: string;
  title: string;
  order?: number;
};

interface TemplateBuilderProps {
  template?: Template;
}

const defaultSections: EditableSection[] = [
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

export const TemplateBuilder = ({ template }: TemplateBuilderProps) => {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [content, setContent] = useState(template?.content || '');
  const [groups, setGroups] = useState<EditableGroup[]>(
    template?.groups || [
      {
        label: 'Стороны',
        order: 0,
        fields: [
          { label: 'Исполнитель', key: 'executor_name' },
          { label: 'Заказчик', key: 'customer_name' },
        ],
      },
    ]
  );
  const [sections, setSections] = useState<EditableSection[]>(
    template?.sections || defaultSections
  );
  const [sectionsEnabled, setSectionsEnabled] = useState(!!template?.sections?.length);
  const [error, setError] = useState('');

  const isEditing = useMemo(() => !!template?.id, [template]);

  const { mutate: createTemplate, isPending: creating } = useCreateTemplate();
  const { mutate: updateTemplate, isPending: updating } = useUpdateTemplate();

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setContent(template.content);
      setGroups(
        template.groups.map((g) => ({
          id: g.id,
          template_id: g.template_id,
          label: g.label,
          order: g.order,
          fields: g.fields.map((f) => ({
            id: f.id,
            label: f.label,
            key: f.key,
            default_value: f.default_value,
            order: f.order,
          })),
        }))
      );
      setSections(
        template.sections.map((s) => ({
          id: s.id,
          title: s.title,
          order: s.order,
        }))
      );
      setSectionsEnabled(!!template.sections.length);
    } else {
      setName('');
      setDescription('');
      setContent('');
      setGroups([
        {
          label: 'Стороны',
          order: 0,
          fields: [
            { label: 'Исполнитель', key: 'executor_name' },
            { label: 'Заказчик', key: 'customer_name' },
          ],
        },
      ]);
      setSections(defaultSections);
      setSectionsEnabled(false);
    }
  }, [template]);

  const handleAddGroup = () => {
    setGroups((prev) => [
      ...prev,
      {
        label: `Группа ${prev.length + 1}`,
        order: prev.length,
        template_id: template?.id,
        fields: [],
      },
    ]);
  };

  const handleRemoveGroup = (index: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSection = () => {
    if (!sectionsEnabled) return;
    setSections((prev) => [
      ...prev,
      { title: `Раздел ${prev.length + 1}`, order: prev.length + 1 },
    ]);
  };

  const handleSectionChange = (
    index: number,
    key: keyof EditableSection,
    value: string | number
  ) => {
    if (!sectionsEnabled) return;
    setSections((prev) =>
      prev.map((section, i) => (i === index ? { ...section, [key]: value } : section))
    );
  };

  const handleRemoveSection = (index: number) => {
    if (!sectionsEnabled) return;
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGroupChange = (index: number, key: keyof EditableGroup, value: string | number) => {
    setGroups((prev) => prev.map((group, i) => (i === index ? { ...group, [key]: value } : group)));
  };

  const handleAddField = (groupIndex: number) => {
    setGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex
          ? {
              ...group,
              fields: [
                ...group.fields,
                { label: `Поле ${group.fields.length + 1}`, key: `field_${Date.now()}` },
              ],
            }
          : group
      )
    );
  };

  const handleFieldChange = (
    groupIndex: number,
    fieldIndex: number,
    key: 'label' | 'key' | 'default_value',
    value: string
  ) => {
    setGroups((prev) =>
      prev.map((group, i) => {
        if (i !== groupIndex) return group;
        return {
          ...group,
          fields: group.fields.map((field, fi) =>
            fi === fieldIndex ? { ...field, [key]: value } : field
          ),
        };
      })
    );
  };

  const handleRemoveField = (groupIndex: number, fieldIndex: number) => {
    setGroups((prev) =>
      prev.map((group, i) => {
        if (i !== groupIndex) return group;
        return { ...group, fields: group.fields.filter((_, fi) => fi !== fieldIndex) };
      })
    );
  };

  const handleSave = () => {
    setError('');
    if (!name.trim() || !content.trim()) {
      setError('Название и базовый контент обязательны');
      return;
    }

    const payload: TemplatePayload = {
      name: name.trim(),
      description: description || undefined,
      content: content.trim(),
      groups: groups.map((group, gIdx) => ({
        label: group.label.trim(),
        order: group.order ?? gIdx,
        fields: group.fields.map((field, fIdx) => ({
          label: field.label.trim(),
          key: field.key.trim(),
          default_value: field.default_value,
          order: field.order ?? fIdx,
        })),
      })),
      sections: sectionsEnabled
        ? sections.map((section, sIdx) => ({
            title: section.title.trim(),
            order: Math.max(1, section.order ?? sIdx + 1),
          }))
        : [],
    };

    const onError = () =>
      setError('Не удалось сохранить шаблон. Проверьте поля и попробуйте снова.');

    if (isEditing && template?.id) {
      updateTemplate(
        { id: template.id, payload },
        {
          onError,
        }
      );
    } else {
      createTemplate(payload, { onError });
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h5">
            {isEditing ? 'Редактировать шаблон' : 'Новый шаблон'}
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
          />
          <TextField
            label="Базовое описание (prompt)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            minRows={3}
            required
            helperText="Будет отправлено в AI вместе с заполненными полями"
          />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1}
            rowGap={1}
          >
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Группы полей
            </Typography>
            <Button
              startIcon={<Add />}
              onClick={handleAddGroup}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Добавить группу
            </Button>
          </Stack>

          <Stack spacing={2}>
            {groups.map((group, groupIndex) => (
              <Card variant="outlined" key={`${group.label}-${groupIndex}`}>
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    spacing={1}
                    sx={{ mb: 2 }}
                  >
                    <TextField
                      label="Название группы"
                      value={group.label}
                      onChange={(e) => handleGroupChange(groupIndex, 'label', e.target.value)}
                      sx={{ flexGrow: 1 }}
                    />
                    <IconButton onClick={() => handleRemoveGroup(groupIndex)}>
                      <Delete />
                    </IconButton>
                  </Stack>

                  <Grid container spacing={2}>
                    {group.fields.map((field, fieldIndex) => (
                      <Grid item xs={12} md={6} key={`${field.key}-${fieldIndex}`}>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <Stack spacing={1}>
                            <TextField
                              label="Заголовок поля"
                              value={field.label}
                              onChange={(e) =>
                                handleFieldChange(groupIndex, fieldIndex, 'label', e.target.value)
                              }
                              required
                            />
                            <TextField
                              label="Ключ (латиницей)"
                              value={field.key}
                              onChange={(e) =>
                                handleFieldChange(groupIndex, fieldIndex, 'key', e.target.value)
                              }
                              required
                            />
                            <TextField
                              label="Значение по умолчанию"
                              value={field.default_value || ''}
                              onChange={(e) =>
                                handleFieldChange(
                                  groupIndex,
                                  fieldIndex,
                                  'default_value',
                                  e.target.value
                                )
                              }
                              multiline
                              minRows={2}
                            />
                            <Button
                              variant="text"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => handleRemoveField(groupIndex, fieldIndex)}
                              sx={{ alignSelf: 'flex-start' }}
                            >
                              Удалить поле
                            </Button>
                          </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Button
                    startIcon={<Add />}
                    onClick={() => handleAddField(groupIndex)}
                    sx={{ mt: 2 }}
                  >
                    Добавить поле
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>

          {sectionsEnabled ? (
            <>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
                sx={{ mt: 3 }}
                rowGap={1}
              >
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Разделы договора
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  width={{ xs: '100%', sm: 'auto' }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={sectionsEnabled}
                        onChange={(e) => setSectionsEnabled(e.target.checked)}
                      />
                    }
                    label="Включить"
                  />
                  <Button
                    startIcon={<Add />}
                    onClick={handleAddSection}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Добавить раздел
                  </Button>
                </Stack>
              </Stack>

              <Stack spacing={2}>
                {sections
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((section, idx) => (
                    <Card variant="outlined" key={`section-${idx}`}>
                      <CardContent>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          spacing={1}
                        >
                          <TextField
                            label="Название раздела"
                            value={section.title}
                            onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                            sx={{ flexGrow: 1 }}
                          />
                          <TextField
                            label="Порядок"
                            type="number"
                            value={section.order ?? idx + 1}
                            onChange={(e) =>
                              handleSectionChange(idx, 'order', Number(e.target.value))
                            }
                            sx={{ width: { xs: '100%', sm: 140 } }}
                            inputProps={{ min: 1 }}
                          />
                          <IconButton onClick={() => handleRemoveSection(idx)}>
                            <Delete />
                          </IconButton>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
              </Stack>
            </>
          ) : (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Stack spacing={1}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                    rowGap={1}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
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
                  {/* <Typography variant="body2" color="text.secondary">
                    Порядок разделов всегда начинается с 1.
                  </Typography> */}
                </Stack>
              </CardContent>
            </Card>
          )}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="flex-end"
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={creating || updating || !name.trim() || !content.trim()}
            >
              {creating || updating ? 'Сохраняем...' : isEditing ? 'Сохранить' : 'Создать шаблон'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
