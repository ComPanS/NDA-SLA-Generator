import { Paper, Stack, Typography } from '@mui/material';

import DocumentHistory from '../components/DocumentHistory';

export default function Dashboard() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Дашборд</Typography>
      <Paper sx={{ p: 2 }}>
        <DocumentHistory />
      </Paper>
    </Stack>
  );
}
