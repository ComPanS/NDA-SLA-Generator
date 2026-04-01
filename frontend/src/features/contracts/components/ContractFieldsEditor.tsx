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
import { useTranslation } from 'react-i18next';
import { ContractFieldInput } from '@/shared/types';

interface ContractFieldsEditorProps {
  fields: ContractFieldInput[];
  onChange: (fields: ContractFieldInput[]) => void;
  title?: string;
}

export const ContractFieldsEditor = ({ fields, onChange, title }: ContractFieldsEditorProps) => {
  const { t } = useTranslation('contracts');
  const groupDefault = t('fieldsEditor.groupDefault');
  const newFieldLabel = t('fieldsEditor.newField');

  const grouped = fields
    .reduce<Array<{ label: string; order?: number; fields: ContractFieldInput[] }>>(
      (acc, field) => {
        const label = field.group_label || groupDefault;
        const existing = acc.find((g) => g.label === label);
        if (existing) {
          existing.fields.push(field);
        } else {
          acc.push({ label, order: field.group_order, fields: [field] });
        }
        return acc;
      },
      []
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleFieldChange = (field: ContractFieldInput, patch: Partial<ContractFieldInput>) => {
    onChange(fields.map((f) => (f === field ? { ...f, ...patch } : f)));
  };

  const handleAddField = () => {
    const nextGroupOrder = grouped.length;
    onChange([
      ...fields,
      {
        group_label: groupDefault,
        label: newFieldLabel,
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
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            rowGap={1}
          >
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography variant="h6">{title || t('fieldsEditor.title')}</Typography>
              <Tooltip title={t('fieldsEditor.tooltip')}>
                <HelpOutline fontSize="small" color="action" />
              </Tooltip>
            </Stack>
            <Button
              startIcon={<Add />}
              onClick={handleAddField}
              sx={{ alignSelf: { xs: 'stretch', sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}
            >
              {t('fieldsEditor.addField')}
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
                            label={t('fieldsEditor.labels.group')}
                            value={field.group_label}
                            onChange={(e) =>
                              handleFieldChange(field, { group_label: e.target.value })
                            }
                          />
                          <TextField
                            label={t('fieldsEditor.labels.name')}
                            value={field.label}
                            onChange={(e) => handleFieldChange(field, { label: e.target.value })}
                          />
                          <TextField
                            label={t('fieldsEditor.labels.value')}
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
