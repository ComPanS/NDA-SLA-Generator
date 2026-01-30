import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { useTemplates } from '../hooks/useTemplates';

interface TemplateSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const TemplateSelect = ({ value, onChange, error, required }: TemplateSelectProps) => {
  const { data: templates, isLoading, error: loadError } = useTemplates();

  return (
    <FormControl fullWidth error={!!error} required={required}>
      <InputLabel>Шаблон</InputLabel>
      <Select
        value={value}
        label="Шаблон"
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        endAdornment={isLoading ? <CircularProgress size={20} /> : null}
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
      {error && <FormHelperText>{error}</FormHelperText>}
      {loadError && <FormHelperText>Не удалось загрузить шаблоны</FormHelperText>}
    </FormControl>
  );
};
