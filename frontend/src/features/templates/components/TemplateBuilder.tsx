import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
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
import { Add, Delete, DragIndicator, HelpOutline } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Template } from '@/shared/types';
import { useCreateTemplate, useUpdateTemplate } from '../hooks/useTemplates';
import { TemplatePayload } from '@/shared/api';
import { ContractJurisdictionFormFields } from '@/features/contracts/components/ContractJurisdictionFormFields';
import { assignUniqueTemplateFieldKeys } from '@/shared/utils/templateFieldKey';
import {
  isValidOutputLanguageTag,
  normalizeOutputLanguageTag,
} from '@/shared/i18n/outputLanguageTag';

type EditableField = {
  id?: string;
  label: string;
  key: string;
  default_value?: string;
};

type EditableSection = {
  id: string;
  title: string;
  order?: number;
};

function SortableTemplateSectionCard({
  section,
  disabled,
  sectionTitleLabel,
  onTitleChange,
  onRemove,
}: {
  section: EditableSection;
  disabled?: boolean;
  sectionTitleLabel: string;
  onTitleChange: (title: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <Card variant="outlined" ref={setNodeRef} sx={{ p: 2, ...style }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <IconButton
          size="small"
          aria-label="Reorder"
          disabled={disabled}
          sx={{ mt: 0.5, cursor: disabled ? 'default' : 'grab' }}
          {...attributes}
          {...listeners}
        >
          <DragIndicator fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={1}
          >
            <TextField
              label={sectionTitleLabel}
              value={section.title}
              onChange={(e) => onTitleChange(e.target.value)}
              sx={{ flexGrow: 1 }}
            />
            <IconButton onClick={onRemove}>
              <Delete />
            </IconButton>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}

function flattenTemplateFields(template: Template): EditableField[] {
  const groups = [...(template.groups || [])].sort((a, b) => a.order - b.order);
  const out: EditableField[] = [];
  for (const g of groups) {
    const fs = [...(g.fields || [])].sort((a, b) => a.order - b.order);
    for (const f of fs) {
      out.push({
        id: f.id,
        label: f.label,
        key: f.key,
        default_value: f.default_value,
      });
    }
  }
  return out;
}

interface TemplateBuilderProps {
  template?: Template;
}

export const TemplateBuilder = ({ template }: TemplateBuilderProps) => {
  const { t, i18n } = useTranslation('templates');

  const defaultSections = useMemo<EditableSection[]>(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: `default-sec-${i}`,
        title: t(`builder.sec${i + 1}`),
        order: i + 1,
      })),
    [t]
  );

  const defaultFields = useMemo<EditableField[]>(
    () => [
      { label: t('builder.partyExecutor'), key: 'executor_name' },
      { label: t('builder.partyCustomer'), key: 'customer_name' },
    ],
    [t]
  );

  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [content, setContent] = useState(template?.content || '');
  const [fields, setFields] = useState<EditableField[]>(() =>
    template?.groups?.length ? flattenTemplateFields(template) : defaultFields
  );
  const [sections, setSections] = useState<EditableSection[]>(() =>
    template?.sections?.length
      ? template.sections.map((s) => ({
          id: s.id,
          title: s.title,
          order: s.order,
        }))
      : defaultSections
  );
  const [sectionsEnabled, setSectionsEnabled] = useState(!!template?.sections?.length);
  const [defaultCountryCode, setDefaultCountryCode] = useState(
    () => template?.default_country_code || 'RU',
  );
  const [defaultOutputLanguage, setDefaultOutputLanguage] = useState(() =>
    normalizeOutputLanguageTag(
      template?.default_output_language || i18n.language || 'ru',
    ),
  );
  const [error, setError] = useState('');

  const isEditing = useMemo(() => !!template?.id, [template]);

  const { mutate: createTemplate, isPending: creating } = useCreateTemplate();
  const { mutate: updateTemplate, isPending: updating } = useUpdateTemplate();

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setContent(template.content);
      setFields(flattenTemplateFields(template));
      setSections(
        template.sections.map((s) => ({
          id: s.id,
          title: s.title,
          order: s.order,
        }))
      );
      setSectionsEnabled(!!template.sections.length);
      setDefaultCountryCode(template.default_country_code || 'RU');
      setDefaultOutputLanguage(
        normalizeOutputLanguageTag(template.default_output_language || i18n.language || 'ru'),
      );
    } else {
      setName('');
      setDescription('');
      setContent('');
      setFields(defaultFields);
      setSections(defaultSections);
      setSectionsEnabled(false);
      setDefaultCountryCode('RU');
      setDefaultOutputLanguage(normalizeOutputLanguageTag(i18n.language || 'ru'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `defaultFields`/`defaultSections` when clearing `template` are read from that commit; language-only updates are handled in the next effect
  }, [template]);

  useEffect(() => {
    if (!template) {
      setFields(defaultFields);
      setSections(defaultSections);
    }
  }, [template, defaultFields, defaultSections]);

  const handleAddField = () => {
    setFields((prev) => [
      ...prev,
      {
        label: t('builder.fieldNamed', { n: prev.length + 1 }),
        key: '',
        default_value: '',
      },
    ]);
  };

  const handleFieldChange = (index: number, key: keyof EditableField, value: string) => {
    setFields((prev) =>
      prev.map((field, i) => (i === index ? { ...field, [key]: value } : field))
    );
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSection = () => {
    if (!sectionsEnabled) return;
    setSections((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: t('builder.sectionNamed', { n: prev.length + 1 }),
        order: prev.length + 1,
      },
    ]);
  };

  const handleSectionChange = (
    sectionId: string,
    key: keyof EditableSection,
    value: string | number
  ) => {
    if (!sectionsEnabled) return;
    setSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, [key]: value } : section))
    );
  };

  const handleRemoveSection = (sectionId: string) => {
    if (!sectionsEnabled) return;
    setSections((prev) =>
      prev
        .filter((s) => s.id !== sectionId)
        .map((s, i) => ({ ...s, order: i + 1 }))
    );
  };

  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onSectionDragEnd = (event: DragEndEvent) => {
    if (!sectionsEnabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sorted = sections.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const oldIndex = sorted.findIndex((s) => s.id === active.id);
    const newIndex = sorted.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const moved = arrayMove(sorted, oldIndex, newIndex);
    setSections(moved.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleSave = () => {
    setError('');
    if (!name.trim() || !content.trim()) {
      setError(t('builder.validationNameContent'));
      return;
    }

    const trimmedFields = fields.map((f) => ({
      id: f.id,
      label: f.label.trim(),
      key: f.key,
      default_value: f.default_value,
    }));

    for (const f of trimmedFields) {
      if (!f.label.length) {
        setError(t('builder.validationFieldLabel'));
        return;
      }
    }

    const keys = assignUniqueTemplateFieldKeys(trimmedFields);

    const payload: TemplatePayload = {
      name: name.trim(),
      description: description || undefined,
      content: content.trim(),
      default_country_code: /^[A-Z]{2}$/i.test(defaultCountryCode)
        ? defaultCountryCode.toUpperCase()
        : null,
      default_output_language: isValidOutputLanguageTag(defaultOutputLanguage)
        ? normalizeOutputLanguageTag(defaultOutputLanguage)
        : null,
      groups: [
        {
          label: t('builder.fieldsGroupLabel'),
          order: 0,
          fields: trimmedFields.map((f, fIdx) => ({
            label: f.label,
            key: keys[fIdx]!,
            default_value: f.default_value,
            order: fIdx,
          })),
        },
      ],
      sections: sectionsEnabled
        ? sections
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((section, sIdx) => ({
              title: section.title.trim(),
              order: sIdx + 1,
            }))
        : [],
    };

    const onError = () => setError(t('builder.saveFailed'));

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
            {isEditing ? t('builder.headingEdit') : t('builder.headingNew')}
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t('builder.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label={t('builder.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
          />
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            {t('builder.templateDefaultsJurisdiction')}
          </Typography>
          <ContractJurisdictionFormFields
            countryCode={defaultCountryCode}
            outputLanguage={defaultOutputLanguage}
            onCountryChange={setDefaultCountryCode}
            onOutputLanguageChange={setDefaultOutputLanguage}
            showOutputLanguage
          />
          <TextField
            label={t('builder.contentLabel')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            minRows={3}
            required
            helperText={t('builder.contentHelper')}
          />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1}
            rowGap={1}
          >
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {t('builder.fieldsTitle')}
            </Typography>
            <Button
              startIcon={<Add />}
              onClick={handleAddField}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              {t('builder.addField')}
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {fields.map((field, fieldIndex) => (
              <Grid item xs={12} md={6} key={field.id || `field-${fieldIndex}`}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <TextField
                      label={t('builder.fieldTitle')}
                      value={field.label}
                      onChange={(e) => handleFieldChange(fieldIndex, 'label', e.target.value)}
                      required
                    />
                    <TextField
                      label={t('builder.fieldDefault')}
                      value={field.default_value || ''}
                      onChange={(e) =>
                        handleFieldChange(fieldIndex, 'default_value', e.target.value)
                      }
                      multiline
                      minRows={2}
                    />
                    <Button
                      variant="text"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleRemoveField(fieldIndex)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {t('builder.removeField')}
                    </Button>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>

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
                  {t('builder.sectionsTitle')}
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
                    label={t('builder.enable')}
                  />
                  <Button
                    startIcon={<Add />}
                    onClick={handleAddSection}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    {t('builder.addSection')}
                  </Button>
                </Stack>
              </Stack>

              <Typography variant="caption" color="text.secondary">
                {t('builder.sectionsDragHint')}
              </Typography>

              <DndContext
                sensors={sectionSensors}
                collisionDetection={closestCenter}
                onDragEnd={onSectionDragEnd}
              >
                <SortableContext
                  items={sections
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Stack spacing={2}>
                    {sections
                      .slice()
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((section) => (
                        <SortableTemplateSectionCard
                          key={section.id}
                          section={section}
                          sectionTitleLabel={t('builder.sectionTitle')}
                          onTitleChange={(v) => handleSectionChange(section.id, 'title', v)}
                          onRemove={() => handleRemoveSection(section.id)}
                        />
                      ))}
                  </Stack>
                </SortableContext>
              </DndContext>
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
                      <Typography variant="h6">{t('builder.sectionsTitle')}</Typography>
                      <Tooltip title={t('builder.sectionsTooltip')}>
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
                      label={t('builder.enable')}
                    />
                  </Stack>
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
              {creating || updating
                ? t('builder.saving')
                : isEditing
                  ? t('builder.save')
                  : t('builder.create')}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
