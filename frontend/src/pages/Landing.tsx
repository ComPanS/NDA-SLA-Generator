import { useEffect } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Description, Speed, Security, ExpandMore } from '@mui/icons-material';
import { Layout } from '@/shared/components';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { PageMeta } from '@/shared/components/PageMeta';

const faqItems = [
  {
    q: 'Как быстро я получу договор?',
    a: 'Обычно генерация занимает 5–15 минут. Готовый текст можно сразу отредактировать и экспортировать.',
  },
  {
    q: 'Нужна ли регистрация?',
    a: 'Первый тестовый договор можно сделать без регистрации. Для сохранения истории и экспорта лучше войти в аккаунт.',
  },
  {
    q: 'Можно ли менять структуру разделов?',
    a: 'Да, разделы и поля шаблона можно включать/выключать и переупорядочивать перед генерацией.',
  },
  {
    q: 'Что такое шаблон и договор?',
    a: 'Шаблон задаёт поля и разделы. Договор создаётся на основе шаблона и хранится в вашем аккаунте.',
  },
  {
    q: 'Как внести правки после генерации?',
    a: 'Откройте договор в редакторе, отредактируйте текст и сохраните новую версию или экспортируйте файл.',
  },
  {
    q: 'Какой формат экспорта доступен?',
    a: 'Поддерживаются DOCX и PDF. Экспорт доступен из карточки договора.',
  },
  {
    q: 'Работает ли без шаблона?',
    a: 'Да, можно сгенерировать договор без шаблона: укажите заголовок и подсказку, AI предложит структуру.',
  },
  {
    q: 'Можно ли использовать собственные данные сторон?',
    a: 'Да, заполните поля в шаблоне или договоре перед генерацией — они попадут в финальный текст.',
  },
];

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
      <PageMeta
        title="AI-конструктор договоров: NDA, SLA и любые соглашения"
        description="Создавайте договоры с помощью AI за минуты: NDA, SLA, оферты и индивидуальные соглашения с экспортом DOCX/PDF."
      />
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          Создавайте договоры с помощью AI
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4 }}>
          AI-конструктор договоров за минуты: NDA, SLA, оферты и любые индивидуальные соглашения.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" size="large" onClick={() => navigate('/register')}>
            Запустить AI-конструктор
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/login')}>
            Войти
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/guest-contract')}>
            Создать без регистрации
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
                  Черновик за минуты
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Генерация текста и структуры за 5–15 минут вместо недель согласований
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Security sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  NDA и SLA без рутины
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Готовые пресеты для NDA/SLA и гибкая настройка под ваши сценарии
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Description sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Экспорт и контроль
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Экспорт DOCX/PDF, хранение версий и управление договорами в одном месте
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Stack spacing={3}>
          <Typography variant="h4" component="h2">
            Частые вопросы
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Короткие ответы на популярные вопросы о работе сервиса.
          </Typography>
          <Stack spacing={1}>
            {faqItems.map((item, idx) => (
              <Accordion key={idx}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {item.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    {item.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Stack>
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
        <Button
          variant="outlined"
          size="large"
          sx={{ ml: 2 }}
          onClick={() => navigate('/guest-contract')}
        >
          Создать без регистрации
        </Button>
      </Box>
    </Layout>
  );
};
