import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Check } from '@mui/icons-material';
import { Layout, ProtectedRoute, LoadingSpinner, ErrorMessage } from '@/shared/components';
import { useBilling } from '@/features/billing/hooks/useBilling';

export const Billing = () => {
  const { data: billing, isLoading, error } = useBilling();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Загрузка информации о подписке..." />
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <ErrorMessage message="Не удалось загрузить информацию о подписке" />
        </Layout>
      </ProtectedRoute>
    );
  }

  const currentPlan = billing?.subscription?.plan || 'free';

  const plans = [
    {
      name: 'Free',
      price: '0 ₽',
      period: 'бесплатно',
      features: ['1 документ в месяц', 'Базовые шаблоны', 'Экспорт в DOCX/PDF'],
      value: 'free',
    },
    {
      name: 'Pro',
      price: '1990 ₽',
      period: 'в месяц',
      features: [
        'Безлимит документов',
        'Все шаблоны',
        'История версий',
        'Проверка рисков',
        'Приоритетная поддержка',
      ],
      value: 'pro',
      popular: true,
    },
    {
      name: 'Pay-per-use',
      price: '99 ₽',
      period: 'за документ',
      features: ['Оплата по факту', 'Все функции Pro', 'Без ежемесячной платы'],
      value: 'pay_per_use',
    },
  ];

  return (
    <ProtectedRoute>
      <Layout>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Подписка и тарифы
          </Typography>

          {billing?.subscription && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Текущая подписка
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={currentPlan.toUpperCase()}
                    color={currentPlan === 'pro' ? 'primary' : 'default'}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Статус: {billing.subscription.status}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          <Grid container spacing={3}>
            {plans.map((plan) => (
              <Grid item xs={12} md={4} key={plan.value}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    border: plan.popular ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                >
                  {plan.popular && (
                    <Chip
                      label="Популярный"
                      color="primary"
                      size="small"
                      sx={{ position: 'absolute', top: 16, right: 16 }}
                    />
                  )}
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                      {plan.name}
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h3" component="span">
                        {plan.price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component="span">
                        {' '}
                        / {plan.period}
                      </Typography>
                    </Box>

                    <List dense>
                      {plan.features.map((feature, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Check color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      fullWidth
                      variant={currentPlan === plan.value ? 'outlined' : 'contained'}
                      disabled={currentPlan === plan.value}
                      sx={{ mt: 2 }}
                    >
                      {currentPlan === plan.value ? 'Текущий тариф' : 'Выбрать тариф'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Layout>
    </ProtectedRoute>
  );
};
