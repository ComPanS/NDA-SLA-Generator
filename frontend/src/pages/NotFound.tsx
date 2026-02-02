import { Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/shared/components';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Layout maxWidth="sm">
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Typography variant="h3" component="h1">
          404
        </Typography>
        <Typography variant="h5">Страница не найдена</Typography>
        <Typography variant="body2" color="text.secondary">
          Такой страницы нет или она была перемещена.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          На главную
        </Button>
      </Stack>
    </Layout>
  );
};
