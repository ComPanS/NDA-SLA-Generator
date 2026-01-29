import { Control, Controller } from 'react-hook-form';
import { TextField } from '@mui/material';
import { Template } from '../types/template';

type Props = {
  control: Control<any>;
  name: string;
  templates: Template[];
};

export default function TemplateSelect({ control, name, templates }: Props) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField select label="Шаблон" SelectProps={{ native: true }} {...field}>
          <option value="">Без шаблона</option>
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name}
            </option>
          ))}
        </TextField>
      )}
    />
  );
}
