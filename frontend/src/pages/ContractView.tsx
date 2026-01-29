import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';

import { refineContract } from '../services/contracts';
import { ContractRefinePayload } from '../types/contract';
import { FormatMode } from '../types/format';
import ContractViewer from '../components/ContractViewer';

export default function ContractView() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<string>('');
  const [riskReport, setRiskReport] = useState<string[] | undefined>(undefined);
  const [prompt, setPrompt] = useState('');

  const mutation = useMutation({
    mutationFn: (payload: ContractRefinePayload) => refineContract(id || '', payload),
    onSuccess: (res) => {
      setContent(res.document.versions.at(-1)?.content ?? '');
      setRiskReport(res.risk_report);
    },
  });

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Контракт</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="Уточняющий промпт"
            multiline
            minRows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={() =>
              mutation.mutate({ prompt, format_mode: FormatMode.FLEX, risk_check: true })
            }
          >
            Отправить уточнение
          </Button>
        </Stack>
      </Paper>
      <ContractViewer content={content} riskReport={riskReport} />
    </Stack>
  );
}
