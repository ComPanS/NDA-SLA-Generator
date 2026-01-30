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
  Tooltip,
} from '@mui/material';
import { Add, Delete, HelpOutline } from '@mui/icons-material';
import { ContractFieldInput } from '@/shared/types';

interface ContractFieldsEditorProps {
  fields: ContractFieldInput[];
  onChange: (fields: ContractFieldInput[]) => void;
  title?: string;
}

export const ContractFieldsEditor = ({ fields, onChange, title }: ContractFieldsEditorProps) => {
  const grouped = fields
    .reduce<Array<{ label: string; order?: number; fields: ContractFieldInput[] }>>((acc, field) => {
      const label = field.group_label || 'Дополнительно';
      const existing = acc.find((g) => g.label === label);
      if (existing) {
        existing.fields.push(field);
      } else {
        acc.push({ label, order: field.group_order, fields: [field] });
      }
      return acc;
    }, [])
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleFieldChange = (
    field: ContractFieldInput,
    patch: Partial<ContractFieldInput>
  ) => {
    onChange(
      fields.map((f) => (f === field ? { ...f, ...patch } : f))
    );
  };

  const handleAddField = () => {
    const nextGroupOrder = grouped.length;
    onChange([
      ...fields,
      {
        group_label: 'Дополнительно',
        label: 'Новое поле',
        key: `field_${Date.now()}`,
        value: '',
        order: fields.length,
        group_order: nextGroupOrder,
      },
    ]);
  };

  const handleRemoveField = (field: ContractFieldInput) => {
    onChange(fields.filter((f) => f !== field));
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6">{title || 'Поля договора'}</Typography>
              <Tooltip title="Заполните фактические значения полей — они попадут в итоговый договор и в экспорт.">
                <HelpOutline fontSize="small" color="action" />
              </Tooltip>
            </Stack>
            <Button startIcon={<Add />} onClick={handleAddField}>
              Добавить поле
            </Button>
          </Stack>

          {grouped.map((group, groupIdx) => (
            <Box key={`group-${groupIdx}`}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {group.label}
              </Typography>
              <Grid container spacing={2}>
                {group.fields
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((field, fieldIdx) => (
                  <Grid item xs={12} md={6} key={`field-${groupIdx}-${fieldIdx}`}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <TextField
                          label="Группа"
                          value={field.group_label}
                          onChange={(e) =>
                            handleFieldChange(field, { group_label: e.target.value })
                          }
                        />
                        <TextField
                          label="Название поля"
                          value={field.label}
                          onChange={(e) => handleFieldChange(field, { label: e.target.value })}
                        />
                        <TextField
                          label="Значение"
                          value={field.value || ''}
                          onChange={(e) => handleFieldChange(field, { value: e.target.value })}
                          multiline
                          minRows={2}
                        />
                        <Stack direction="row" justifyContent="flex-end">
                          <IconButton onClick={() => handleRemoveField(field)}>
                            <Delete />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
