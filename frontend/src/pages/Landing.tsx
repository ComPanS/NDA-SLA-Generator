import { useEffect } from 'react';
import { Box, Button, Container, Typography, Stack, Card, CardContent, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Description, Speed, Security } from '@mui/icons-material';
import { Layout } from '@/shared/components';
import { useAuthStore } from '@/features/auth/hooks/useAuth';

export const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Layout>
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          Генератор NDA и SLA договоров
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Создавайте юридические документы за минуты с помощью AI
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" size="large" onClick={() => navigate('/register')}>
            Начать бесплатно
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/login')}>
            Войти
          </Button>
        </Stack>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Speed sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Быстрая генерация
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Создавайте договоры за 5-15 минут вместо 2-10 дней
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Security sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Юридическая точность
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Все шаблоны проверены юристами и соответствуют ГК РФ
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Description sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  История документов
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Храните и управляйте всеми вашими договорами в одном месте
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'background.paper' }}>
        <Typography variant="h4" gutterBottom>
          Готовы начать?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Первый документ бесплатно, без регистрации
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/register')}>
          Создать договор
        </Button>
      </Box>
    </Layout>
  );
};
