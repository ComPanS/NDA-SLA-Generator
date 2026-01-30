import { Card, CardContent, Stack, TextField, Button, Grid, IconButton, Typography } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { ContractSectionInput } from '@/shared/types';

interface Props {
  sections: ContractSectionInput[];
  onChange: (sections: ContractSectionInput[]) => void;
  title?: string;
}

export const ContractSectionsEditor = ({ sections, onChange, title }: Props) => {
  const sorted = sections.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleAdd = () => {
    onChange([
      ...sections,
      { title: `Раздел ${sections.length + 1}`, order: sections.length },
    ]);
  };

  const handleChange = (idx: number, patch: Partial<ContractSectionInput>) => {
    onChange(sorted.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const handleRemove = (idx: number) => {
    const copy = sorted.filter((_, i) => i !== idx);
    onChange(copy.map((s, i) => ({ ...s, order: i })));
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{title || 'Разделы договора'}</Typography>
            <Button startIcon={<Add />} onClick={handleAdd}>
              Добавить раздел
            </Button>
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
                    />
                    <TextField
                      label="Порядок"
                      type="number"
                      value={section.order ?? idx}
                      onChange={(e) => handleChange(idx, { order: Number(e.target.value) })}
                      inputProps={{ min: 0 }}
                    />
                    <Stack direction="row" justifyContent="flex-end">
                      <IconButton onClick={() => handleRemove(idx)}>
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
