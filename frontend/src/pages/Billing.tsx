import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import BillingModal from '../components/BillingModal';

export default function Billing() {
  const [open, setOpen] = useState(false);
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Подписка</Typography>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Открыть детали подписки
      </Button>
      <BillingModal open={open} onClose={() => setOpen(false)} />
    </Stack>
  );
}
