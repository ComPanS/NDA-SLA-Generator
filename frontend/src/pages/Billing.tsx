import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card as MuiCard,
  CardContent as MuiCardContent,
  Typography,
  Button as MuiButton,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  CircularProgress,
  Snackbar,
  Tooltip,
  Stack,
} from '@mui/material';
import { Check, Star, AllInclusive, CancelOutlined, Autorenew, HelpOutline } from '@mui/icons-material';
import {
  Layout,
  ProtectedRoute,
  LoadingSpinner,
  ErrorMessage,
  ConfirmDialog,
} from '@/shared/components';
import {
  useBilling,
  useUsage,
  usePlans,
  useSubscribe,
  useCancelSubscription,
  useReactivateSubscription,
  useConfirmPayment,
} from '@/features/billing/hooks/useBilling';
import { SubscriptionPlan } from '@/shared/types';
import { useQueryClient } from '@tanstack/react-query';
import { authStore } from '@/features/auth/store/authStore';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

const formatPrice = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '—';
  if (value === 0) return 'Бесплатно';
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
};

export const Billing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: subscription, isLoading: subLoading, error: subError } = useBilling();
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const subscribeMutation = useSubscribe();
  const cancelMutation = useCancelSubscription();
  const reactivateMutation = useReactivateSubscription();
  const confirmPaymentMutation = useConfirmPayment();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Get hydration state
  const hasHydrated = authStore((state) => state._hasHydrated);
  const isAuthenticated = authStore((state) => state.isAuthenticated);

  // Handle payment success redirect - only after hydration
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');

    if (paymentStatus === 'success' && hasHydrated && isAuthenticated) {
      // Remove the query param first to prevent re-triggering
      setSearchParams({});

      // Confirm payment on backend (applies changes if webhook missed it)
      confirmPaymentMutation.mutate(undefined, {
        onSuccess: (result) => {
          setSnackbarMessage(result.message || 'Оплата прошла успешно!');
          setSnackbarOpen(true);
          // Refresh billing and usage data
          queryClient.invalidateQueries({ queryKey: ['billing'] });
          queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
        },
        onError: () => {
          // Fallback - just refresh
          queryClient.invalidateQueries({ queryKey: ['billing'] });
          queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
          setSnackbarMessage('Оплата обрабатывается. Попробуйте обновить страницу.');
          setSnackbarOpen(true);
        },
      });
    }
  }, [
    searchParams,
    setSearchParams,
    hasHydrated,
    isAuthenticated,
    confirmPaymentMutation,
    queryClient,
  ]);

  const isLoading = subLoading || usageLoading || plansLoading;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Загрузка информации о подписке..." />
        </Layout>
      </ProtectedRoute>
    );
  }

  if (subError) {
    return (
      <ProtectedRoute>
        <Layout>
          <ErrorMessage message="Не удалось загрузить информацию о подписке" />
        </Layout>
      </ProtectedRoute>
    );
  }

  const currentPlan = subscription?.plan || 'freemium';
  const plans = plansData?.plans || [];

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan === currentPlan) return;
    setSelectedPlan(plan);
    try {
      const result = await subscribeMutation.mutateAsync({
        plan,
        returnUrl: window.location.href,
      });
      window.location.href = result.payment_url;
    } catch (error) {
      console.error('Subscribe error:', error);
      setSelectedPlan(null);
    }
  };

  const handleCancelConfirm = async () => {
    try {
      await cancelMutation.mutateAsync();
      setCancelDialogOpen(false);
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateMutation.mutateAsync();
    } catch (error) {
      console.error('Reactivate error:', error);
    }
  };

  const renderUsageBar = (
    label: string,
    used: number,
    limit: number,
    unlimited: boolean,
    extraPaid?: number,
    hint?: string,
    options?: { displayLimitOnly?: boolean; hideProgress?: boolean }
  ) => {
    const displayLimitOnly = options?.displayLimitOnly;
    const hideProgress = options?.hideProgress;
    const effectiveLimit = extraPaid ? limit + extraPaid : limit;
    const percentage = unlimited ? 0 : Math.min((used / effectiveLimit) * 100, 100);
    const isNearLimit = !unlimited && !hideProgress && percentage >= 80;

    // Format limit display: "3" or "3+1" if extraPaid
    const formatLimitDisplay = () => {
      if (unlimited) {
        return <AllInclusive fontSize="small" sx={{ verticalAlign: 'middle' }} />;
      }
      if (extraPaid && extraPaid > 0) {
        return (
          <span>
            {limit}
            <span style={{ color: '#4caf50' }}>+{extraPaid}</span>
          </span>
        );
      }
      return limit;
    };

    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2">{label}</Typography>
            {hint && (
              <Tooltip title={hint}>
                <HelpOutline fontSize="small" color="action" />
              </Tooltip>
            )}
          </Stack>
          <Typography variant="body2" color={isNearLimit ? 'error' : 'text.secondary'}>
            {displayLimitOnly ? (
              formatLimitDisplay()
            ) : (
              <>
                {used} / {formatLimitDisplay()}
              </>
            )}
          </Typography>
        </Box>
        {!unlimited && !hideProgress && (
          <LinearProgress
            variant="determinate"
            value={percentage}
            color={isNearLimit ? 'error' : 'primary'}
          />
        )}
      </Box>
    );
  };

  return (
    <ProtectedRoute>
      <Layout>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Подписка и тарифы
          </Typography>

          {/* Current subscription info */}
          {subscription && subscription.plan !== 'freemium' && (
            <MuiCard sx={{ mb: 4 }}>
              <MuiCardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Текущая подписка
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Chip
                        label={currentPlan.toUpperCase()}
                        color="primary"
                        icon={currentPlan === 'pro' ? <Star /> : undefined}
                      />
                      <Chip
                        label={subscription.status === 'active' ? 'Активна' : subscription.status}
                        color={subscription.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    {subscription.expires_at && (
                      <Typography variant="body2" color="text.secondary">
                        {subscription.auto_renew ? 'Следующее списание' : 'Действует до'}:{' '}
                        {new Date(subscription.expires_at).toLocaleDateString('ru-RU')}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    {subscription.auto_renew ? (
                      <MuiButton
                        variant="outlined"
                        color="error"
                        startIcon={<CancelOutlined />}
                        onClick={() => setCancelDialogOpen(true)}
                        disabled={cancelMutation.isPending}
                      >
                        Отменить подписку
                      </MuiButton>
                    ) : (
                      <MuiButton
                        variant="outlined"
                        startIcon={<Autorenew />}
                        onClick={handleReactivate}
                        disabled={reactivateMutation.isPending}
                      >
                        {reactivateMutation.isPending ? (
                          <CircularProgress size={20} />
                        ) : (
                          'Возобновить подписку'
                        )}
                      </MuiButton>
                    )}
                  </Box>
                </Box>
              </MuiCardContent>
            </MuiCard>
          )}

          {/* Usage stats */}
          {usage && (
            <MuiCard sx={{ mb: 4 }}>
              <MuiCardContent>
                <Typography variant="h6" gutterBottom>
                  Использование за месяц
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Период: с {new Date(usage.periodStart).toLocaleDateString('ru-RU')}
                </Typography>
                {renderUsageBar(
                  'Договоры',
                  usage.contracts.used,
                  usage.contracts.limit,
                  usage.contracts.isUnlimited,
                  usage.contracts.extraPaid
                )}
                {renderUsageBar(
                  'Шаблоны',
                  usage.templates.used,
                  usage.templates.limit,
                  usage.templates.isUnlimited
                )}
                {renderUsageBar(
                  'Уточнения на документ',
                  usage.clarifications.used,
                  usage.clarifications.limit,
                  usage.clarifications.isUnlimited,
                  undefined,
                  'Считаем уникальные документы, в которых было уточнение; повторные уточнения в одном документе лимит не тратят',
                  { displayLimitOnly: true, hideProgress: true }
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Доступные функции
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip size="small" label="PDF экспорт" color="primary" variant="outlined" />
                  {usage.features.hasDocxExport && (
                    <Chip size="small" label="DOCX экспорт" color="primary" variant="outlined" />
                  )}
                  {usage.features.hasRiskCheck && (
                    <Chip size="small" label="Проверка рисков" color="primary" variant="outlined" />
                  )}
                  {usage.features.hasSections && (
                    <Chip size="small" label="Разделы" color="primary" variant="outlined" />
                  )}
                  {usage.features.hasStatuses && (
                    <Chip size="small" label="Статусы" color="primary" variant="outlined" />
                  )}
                  {usage.features.hasPrioritySupport && (
                    <Chip
                      size="small"
                      label="Приоритетная поддержка"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </MuiCardContent>
            </MuiCard>
          )}

          {/* Plans */}
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Доступные тарифы
          </Typography>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const isHighlighted = plan.id === 'basic';
              const isFreePlan = plan.id === 'freemium';
              const disableFreeWhileActive = isFreePlan && currentPlan !== 'freemium';
              const hasDiscount =
                !!plan.first_month_discount_available &&
                plan.first_month_price !== null &&
                plan.first_month_price !== undefined &&
                plan.price > 0 &&
                plan.first_month_price < plan.price;
              const discountPercent = hasDiscount
                ? Math.round((1 - (plan.first_month_price as number) / plan.price) * 100)
                : null;

              const priceLabel = hasDiscount ? plan.first_month_price : plan.price;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${isHighlighted ? 'border-2 border-blue-500 shadow-xl scale-[1.02]' : 'border border-gray-200'} ${
                    isCurrent ? 'ring-2 ring-green-500/40' : ''
                  }`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-4 py-1.5 text-sm">Самый популярный</Badge>
                    </div>
                  )}
                  {isCurrent && !isFreePlan && (
                    <div className="absolute -top-4 right-4">
                      <Badge variant="secondary" className="px-3 py-1">Текущий тариф</Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                    <div className="mb-2">
                      <span className="text-4xl font-bold">{formatPrice(priceLabel)}</span>
                      {plan.price > 0 && <span className="text-gray-600 ml-2">/ месяц</span>}
                    </div>
                    {hasDiscount && (
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>
                          <span className="line-through text-gray-400">{formatPrice(plan.price)}</span>{' '}
                          <span className="font-semibold text-green-700">
                            {discountPercent !== null ? `-${discountPercent}%` : ''}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">Скидка на первый месяц</div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent>
                    <Button
                      className={`w-full mb-6 ${isHighlighted ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      size="lg"
                      disabled={isCurrent || disableFreeWhileActive || subscribeMutation.isPending}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {selectedPlan === plan.id && subscribeMutation.isPending ? (
                        <CircularProgress size={20} />
                      ) : isCurrent ? (
                        'Текущий тариф'
                      ) : disableFreeWhileActive ? (
                        'Недоступно'
                      ) : plan.price === 0 ? (
                        'Попробовать бесплатно'
                      ) : (
                        'Выбрать тариф'
                      )}
                    </Button>

                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Alert severity="info" sx={{ mt: 4 }}>
            При достижении лимита договоров вы можете приобрести дополнительные договоры по{' '}
            {plansData?.single_contract_price || 99} ₽ за штуку.
          </Alert>
        </Box>

        <ConfirmDialog
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          onConfirm={handleCancelConfirm}
          title="Отменить подписку?"
          content="Подписка будет действовать до конца оплаченного периода. После этого вы перейдёте на бесплатный тариф."
          confirmText="Отменить подписку"
          confirmColor="error"
          isLoading={cancelMutation.isPending}
        />

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Layout>
    </ProtectedRoute>
  );
};
