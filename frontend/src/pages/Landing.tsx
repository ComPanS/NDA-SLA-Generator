import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Landing() {
  return (
    <Stack spacing={2}>
      <Typography variant="h4">Генератор NDA / SLA</Typography>
      <Typography variant="body1">
        Создавайте, уточняйте и экспортируйте юридические документы с AI-помощником.
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" component={RouterLink} to="/contracts/new">
          Создать контракт
        </Button>
        <Button variant="outlined" component={RouterLink} to="/dashboard">
          Перейти в дашборд
        </Button>
      </Stack>
    </Stack>
  );
}
