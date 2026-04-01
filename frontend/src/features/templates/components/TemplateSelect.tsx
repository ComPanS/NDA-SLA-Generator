import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTemplates } from '../hooks/useTemplates';

interface TemplateSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const TemplateSelect = ({ value, onChange, error, required }: TemplateSelectProps) => {
  const { t } = useTranslation('templates');
  const { data: templates, isLoading, error: loadError } = useTemplates();

  return (
    <FormControl fullWidth error={!!error} required={required}>
      <InputLabel>{t('selectLabel')}</InputLabel>
      <Select
        value={value}
        label={t('selectLabel')}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        endAdornment={isLoading ? <CircularProgress size={20} /> : null}
      >
        <MenuItem value="">
          <em>{t('noTemplateOption')}</em>
        </MenuItem>
        {templates?.map((template) => (
          <MenuItem key={template.id} value={template.id}>
            {template.name}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
      {loadError && <FormHelperText>{t('loadError')}</FormHelperText>}
    </FormControl>
  );
};
