import {
  Stack,
  TextField,
  Button,
  IconButton,
  Typography,
  Tooltip,
  Card,
  CardContent,
  Box,
} from '@mui/material';
import { Add, Delete, DragIndicator, HelpOutline } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ContractSectionInput } from '@/shared/types';
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

interface Props {
  sections: ContractSectionInput[];
  onChange: (sections: ContractSectionInput[]) => void;
  title?: string;
  disabled?: boolean;
  headerAddon?: React.ReactNode;
}

function dndIdForSection(s: ContractSectionInput): string {
  if (s.id) return s.id;
  if (s.template_section_id) return s.template_section_id;
  if (s.section_uid) return s.section_uid;
  return '';
}

function SortableSectionRow({
  section,
  dndId,
  disabled,
  titleLabel,
  onTitleChange,
  onRemove,
}: {
  section: ContractSectionInput;
  dndId: string;
  disabled: boolean;
  titleLabel: string;
  onTitleChange: (title: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dndId,
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
          <Stack spacing={1}>
            <TextField
              fullWidth
              label={titleLabel}
              value={section.title}
              onChange={(e) => onTitleChange(e.target.value)}
              disabled={disabled}
            />
            <Stack direction="row" justifyContent="flex-end">
              <IconButton onClick={onRemove} disabled={disabled}>
                <Delete />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}

export const ContractSectionsEditor = ({
  sections,
  onChange,
  title,
  disabled = false,
  headerAddon,
}: Props) => {
  const { t } = useTranslation('contracts');
  const sorted = sections.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = sorted.map(dndIdForSection);

  const handleAdd = () => {
    if (disabled) return;
    const n = sections.length + 1;
    onChange([
      ...sections,
      {
        section_uid: crypto.randomUUID(),
        title: t('sectionsEditor.newSectionTitle', { n }),
        order: sections.length + 1,
      },
    ]);
  };

  const handleTitleChange = (dndId: string, newTitle: string) => {
    if (disabled) return;
    onChange(
      sections.map((s) => (dndIdForSection(s) === dndId ? { ...s, title: newTitle } : s))
    );
  };

  const handleRemove = (dndId: string) => {
    if (disabled) return;
    const next = sorted.filter((s) => dndIdForSection(s) !== dndId);
    onChange(next.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((s) => dndIdForSection(s) === String(active.id));
    const newIndex = sorted.findIndex((s) => dndIdForSection(s) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const moved = arrayMove(sorted, oldIndex, newIndex);
    onChange(moved.map((s, i) => ({ ...s, order: i + 1 })));
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            rowGap={1}
          >
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="h6">{title || t('sectionsEditor.title')}</Typography>
              <Tooltip title={t('sectionsEditor.tooltip')}>
                <HelpOutline fontSize="small" color="action" />
              </Tooltip>
            </Stack>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              width={{ xs: '100%', sm: 'auto' }}
            >
              {headerAddon}
              <Button
                startIcon={<Add />}
                onClick={handleAdd}
                disabled={disabled}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                {t('sectionsEditor.addSection')}
              </Button>
            </Stack>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {t('sectionsEditor.dragHint')}
          </Typography>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids.filter(Boolean)} strategy={verticalListSortingStrategy}>
              <Stack spacing={2}>
                {sorted.map((section) => {
                  const did = dndIdForSection(section);
                  if (!did) return null;
                  return (
                    <SortableSectionRow
                      key={did}
                      section={section}
                      dndId={did}
                      disabled={disabled}
                      titleLabel={t('sectionsEditor.labels.title')}
                      onTitleChange={(v) => handleTitleChange(did, v)}
                      onRemove={() => handleRemove(did)}
                    />
                  );
                })}
              </Stack>
            </SortableContext>
          </DndContext>
        </Stack>
      </CardContent>
    </Card>
  );
};
