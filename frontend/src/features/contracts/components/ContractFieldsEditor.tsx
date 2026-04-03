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
  disabled?: boolean;
}

export const ContractFieldsEditor = ({
  fields,
  onChange,
  title,
  disabled = false,
}: ContractFieldsEditorProps) => {
  const { t } = useTranslation('contracts');
  const groupDefault = t('fieldsEditor.groupDefault');
  const newFieldLabel = t('fieldsEditor.newField');

  const sortedFields = fields
    .slice()
    .sort((a, b) => {
      const go = (a.group_order ?? 0) - (b.group_order ?? 0);
      if (go !== 0) return go;
      return (a.order ?? 0) - (b.order ?? 0);
    });

  const handleFieldChange = (field: ContractFieldInput, patch: Partial<ContractFieldInput>) => {
    if (disabled) return;
    onChange(fields.map((f) => (f === field ? { ...f, ...patch } : f)));
  };

  const handleAddField = () => {
    if (disabled) return;
    onChange([
      ...fields,
      {
        group_label: groupDefault,
        label: newFieldLabel,
        key: `field_${Date.now()}`,
        value: '',
        order: fields.length,
        group_order: 0,
      },
    ]);
  };

  const handleRemoveField = (field: ContractFieldInput) => {
    if (disabled) return;
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
              disabled={disabled}
              sx={{ alignSelf: { xs: 'stretch', sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}
            >
              {t('fieldsEditor.addField')}
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {sortedFields.map((field, fieldIdx) => (
              <Grid item xs={12} md={6} key={field.template_field_id || field.key || `f-${fieldIdx}`}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <TextField
                      label={t('fieldsEditor.labels.name')}
                      value={field.label}
                      onChange={(e) => handleFieldChange(field, { label: e.target.value })}
                      disabled={disabled}
                    />
                    <TextField
                      label={t('fieldsEditor.labels.value')}
                      value={field.value || ''}
                      onChange={(e) => handleFieldChange(field, { value: e.target.value })}
                      multiline
                      minRows={2}
                      disabled={disabled}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton onClick={() => handleRemoveField(field)} disabled={disabled}>
                        <Delete />
                      </IconButton>
                    </Box>
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
