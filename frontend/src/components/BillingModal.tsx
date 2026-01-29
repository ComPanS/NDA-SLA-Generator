import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import { getBilling } from '../services/billing';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function BillingModal({ open, onClose }: Props) {
  const { data } = useQuery({ queryKey: ['billing'], queryFn: getBilling, enabled: open });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Подписка</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <Typography>Текущий план: {data?.plan ?? '—'}</Typography>
          <Typography>Статус: {data?.status ?? '—'}</Typography>
          <Typography>Действует до: {data?.expires_at ?? '—'}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained">Продлить</Button>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}
