import { useState } from 'react';
import {
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { generateContract } from '../services/contracts';
import { listTemplates } from '../services/templates';
import { ContractGeneratePayload } from '../types/contract';
import { FormatMode } from '../types/format';
import TemplateSelect from '../components/TemplateSelect';
import ContractViewer from '../components/ContractViewer';

export default function NewContract() {
  const { data: templates } = useQuery({ queryKey: ['templates'], queryFn: listTemplates });
  const [content, setContent] = useState<string>('');
  const [riskReport, setRiskReport] = useState<string[] | undefined>(undefined);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContractGeneratePayload>({
    defaultValues: {
      title: '',
      prompt: '',
      format_mode: FormatMode.FLEX,
      risk_check: true,
    },
  });

  const mutation = useMutation({
    mutationFn: generateContract,
    onSuccess: (res) => {
      setContent(res.document.versions.at(-1)?.content ?? '');
      setRiskReport(res.risk_report);
    },
  });

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Новый контракт</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack
          spacing={2}
          component="form"
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
        >
          <TextField
            label="Название"
            {...register('title', { required: 'Укажите название' })}
            error={Boolean(errors.title)}
            helperText={errors.title?.message}
          />
          <TextField
            label="Промпт для генерации"
            multiline
            minRows={3}
            {...register('prompt', { required: 'Опишите пожелания' })}
            error={Boolean(errors.prompt)}
            helperText={errors.prompt?.message}
          />
          <TemplateSelect control={control} name="template_id" templates={templates ?? []} />
          <Controller
            name="format_mode"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Формат"
                SelectProps={{ native: true }}
                {...field}
                value={field.value ?? FormatMode.FLEX}
              >
                <option value={FormatMode.FLEX}>Гибкий</option>
                <option value={FormatMode.SKELETON}>Каркас</option>
              </TextField>
            )}
          />
          <FormControlLabel
            control={
              <Controller
                name="risk_check"
                control={control}
                render={({ field }) => <Switch {...field} checked={field.value} />}
              />
            }
            label="Проверить риски"
          />
          <Button variant="contained" type="submit" disabled={mutation.isPending}>
            Сгенерировать
          </Button>
        </Stack>
      </Paper>

      <ContractViewer content={content} riskReport={riskReport} />
    </Stack>
  );
}
