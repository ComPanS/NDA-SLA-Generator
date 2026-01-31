import { Stack, TextField, Button, Grid, IconButton, Typography, Tooltip, Card, CardContent } from '@mui/material';
import { Add, Delete, HelpOutline } from '@mui/icons-material';
import { ContractSectionInput } from '@/shared/types';

interface Props {
  sections: ContractSectionInput[];
  onChange: (sections: ContractSectionInput[]) => void;
  title?: string;
  disabled?: boolean;
  headerAddon?: React.ReactNode;
}

export const ContractSectionsEditor = ({
  sections,
  onChange,
  title,
  disabled = false,
  headerAddon,
}: Props) => {
  const sorted = sections.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleAdd = () => {
    if (disabled) return;
    onChange([...sections, { title: `Раздел ${sections.length + 1}`, order: sections.length + 1 }]);
  };

  const handleChange = (idx: number, patch: Partial<ContractSectionInput>) => {
    if (disabled) return;
    onChange(sorted.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const handleRemove = (idx: number) => {
    if (disabled) return;
    const copy = sorted.filter((_, i) => i !== idx);
    onChange(copy.map((s, i) => ({ ...s, order: i + 1 })));
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6">{title || 'Разделы договора'}</Typography>
              <Tooltip title="Настройте структуру договора: порядок и названия разделов влияют на генерацию и экспорт. При отключении, ИИ сам подберет нужные разделы.">
                <HelpOutline fontSize="small" color="action" />
              </Tooltip>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              {headerAddon}
              <Button startIcon={<Add />} onClick={handleAdd} disabled={disabled}>
                Добавить раздел
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            {sorted.map((section, idx) => (
              <Grid item xs={12} md={6} key={`section-${idx}`}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <TextField
                      label="Название раздела"
                      value={section.title}
                      onChange={(e) => handleChange(idx, { title: e.target.value })}
                      disabled={disabled}
                    />
                    <TextField
                      label="Порядок"
                      type="number"
                      value={section.order ?? idx + 1}
                      onChange={(e) => handleChange(idx, { order: Number(e.target.value) })}
                      disabled={disabled}
                      inputProps={{ min: 1 }}
                    />
                    <Stack direction="row" justifyContent="flex-end">
                      <IconButton onClick={() => handleRemove(idx)} disabled={disabled}>
                        <Delete />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};
