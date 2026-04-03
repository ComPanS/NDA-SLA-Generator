import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card as MuiCard,
  CardContent as MuiCardContent,
  Typography,
  Button as MuiButton,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Snackbar,
  Tooltip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import { icuLocaleFor } from '@/shared/i18n/icuLocale';
import { useBillingDisplayCurrency } from '@/shared/money/useBillingDisplayCurrency';
import { BillingDisplayCurrency } from '@/shared/money/billingCurrency';
import {
  formatPlanDisplayAmount,
  formatSingleContractDisplay,
  planDisplayDiscountPercent,
  planHasDisplayDiscount,
} from '@/shared/money/planDisplayMoney';

function planFeatureList(t: (key: string, opts?: { returnObjects?: boolean }) => unknown, planId: SubscriptionPlan) {
  const v = t(`plans.${planId}.features`, { returnObjects: true });
  return Array.isArray(v) ? (v as string[]) : [];
}

export const Billing = () => {
  const { t, i18n } = useTranslation('billing');
  const locale = icuLocaleFor(i18n.language);
  const { currency, setCurrency, currencies, isPaymentEnabled } = useBillingDisplayCurrency();
  const legacyFx = {
    rates: undefined as Partial<Record<BillingDisplayCurrency, number>> | undefined,
    fxFailed: true,
    locale,
    freeLabel: t('free'),
  };

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

  const hasHydrated = authStore((state) => state._hasHydrated);
  const isAuthenticated = authStore((state) => state.isAuthenticated);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');

    if (paymentStatus === 'success' && hasHydrated && isAuthenticated) {
      setSearchParams({});

      confirmPaymentMutation.mutate(undefined, {
        onSuccess: (result) => {
          setSnackbarMessage(result.message || t('payOk'));
          setSnackbarOpen(true);
          queryClient.invalidateQueries({ queryKey: ['billing'] });
          queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
        },
        onError: () => {
          queryClient.invalidateQueries({ queryKey: ['billing'] });
          queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
          setSnackbarMessage(t('payWait'));
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
    t,
  ]);

  const isLoading = subLoading || usageLoading || plansLoading;

  const currentPlan = subscription?.plan || 'freemium';
  const plans = plansData?.plans || [];

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan === currentPlan) return;
    if (plan !== 'freemium' && !isPaymentEnabled) return;
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
        {isLoading ? (
          <LoadingSpinner message={t('loading')} />
        ) : subError ? (
          <ErrorMessage message={t('loadError')} />
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {t('title')}
            </Typography>

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
                        {t('current')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Chip
                          label={t(`plans.${currentPlan}.title`)}
                          color="primary"
                          icon={currentPlan === 'pro' ? <Star /> : undefined}
                        />
                        <Chip
                          label={(() => {
                            if (subscription.status === 'active') return t('active');
                            return subscription.status;
                          })()}
                          color={subscription.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      {subscription.expires_at && (
                        <Typography variant="body2" color="text.secondary">
                          {subscription.auto_renew ? t('nextCharge') : t('validUntil')}:{' '}
                          {new Date(subscription.expires_at).toLocaleDateString(locale)}
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
                          {t('cancelSub')}
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
                            t('reactivateSub')
                          )}
                        </MuiButton>
                      )}
                    </Box>
                  </Box>
                </MuiCardContent>
              </MuiCard>
            )}

            {usage && (
              <MuiCard sx={{ mb: 4 }}>
                <MuiCardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('usageTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('periodFrom', { date: new Date(usage.periodStart).toLocaleDateString(locale) })}
                  </Typography>
                  {renderUsageBar(
                    t('metricContracts'),
                    usage.contracts.used,
                    usage.contracts.limit,
                    usage.contracts.isUnlimited,
                    usage.contracts.extraPaid,
                  )}
                  {renderUsageBar(
                    t('metricTemplates'),
                    usage.templates.used,
                    usage.templates.limit,
                    usage.templates.isUnlimited,
                  )}
                  {renderUsageBar(
                    t('metricClarifications'),
                    usage.clarifications.used,
                    usage.clarifications.limit,
                    usage.clarifications.isUnlimited,
                    undefined,
                    t('clarificationsHint'),
                    { displayLimitOnly: true, hideProgress: true },
                  )}
                </MuiCardContent>
              </MuiCard>
            )}

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ mt: 4, mb: 2 }}
            >
              <Typography variant="h5">{t('plansTitle')}</Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="billing-currency-label">{t('currency.label')}</InputLabel>
                <Select
                  labelId="billing-currency-label"
                  label={t('currency.label')}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as BillingDisplayCurrency)}
                  MenuProps={{ disablePortal: true }}
                >
                  {currencies.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('currency.helper')}
            </Typography>

            {!isPaymentEnabled && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('paymentNonRub')}
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlan;
                const isHighlighted = plan.id === 'basic';
                const isFreePlan = plan.id === 'freemium';
                const disableFreeWhileActive = isFreePlan && currentPlan !== 'freemium';
                const hasDiscount = planHasDisplayDiscount(plan, currency);
                const discountPercent = planDisplayDiscountPercent(plan, currency);

                const payBlocked = !isPaymentEnabled && plan.price > 0;
                const features = planFeatureList(t, plan.id);

                return (
                  <Card
                    key={plan.id}
                    className={`relative ${isHighlighted ? 'border-2 border-blue-500 shadow-xl scale-[1.02]' : 'border border-gray-200'} ${
                      isCurrent ? 'ring-2 ring-green-500/40' : ''
                    }`}
                  >
                    {isHighlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white px-4 py-1.5 text-sm">{t('popular')}</Badge>
                      </div>
                    )}
                    {isCurrent && !isFreePlan && (
                      <div className="absolute -top-4 right-4">
                        <Badge variant="secondary" className="px-3 py-1">
                          {t('planCurrentBadge')}
                        </Badge>
                      </div>
                    )}

                    <CardHeader>
                      <CardTitle className="text-xl mb-2">{t(`plans.${plan.id}.title`)}</CardTitle>
                      <div className="mb-2">
                        <span className="text-4xl font-bold">
                          {hasDiscount
                            ? formatPlanDisplayAmount(plan, 'first_month', currency, legacyFx)
                            : formatPlanDisplayAmount(plan, 'monthly', currency, legacyFx)}
                        </span>
                        {plan.price > 0 && <span className="text-gray-600 ml-2">{t('perMonth')}</span>}
                      </div>
                      {hasDiscount && (
                        <div className="text-sm text-gray-700 space-y-1">
                          <div>
                            <span className="line-through text-gray-400">
                              {formatPlanDisplayAmount(plan, 'monthly', currency, legacyFx)}
                            </span>{' '}
                            <span className="font-semibold text-green-700">
                              {discountPercent !== null ? `-${discountPercent}%` : ''}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{t('firstMonthOff')}</div>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent>
                      <Button
                        className={`w-full mb-6 ${isHighlighted ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        size="lg"
                        disabled={
                          isCurrent ||
                          disableFreeWhileActive ||
                          subscribeMutation.isPending ||
                          payBlocked
                        }
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {selectedPlan === plan.id && subscribeMutation.isPending ? (
                          <CircularProgress size={20} />
                        ) : isCurrent ? (
                          t('btnCurrent')
                        ) : disableFreeWhileActive ? (
                          t('btnUnavailable')
                        ) : payBlocked ? (
                          t('btnComingSoon')
                        ) : plan.price === 0 ? (
                          t('btnTryFree')
                        ) : (
                          t('btnChoose')
                        )}
                      </Button>

                      <ul className="space-y-3">
                        {features.map((feature) => (
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
              {t('extraInfo', {
                price: formatSingleContractDisplay(plansData, currency, legacyFx),
              })}
            </Alert>
          </Box>
        )}

        <ConfirmDialog
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          onConfirm={handleCancelConfirm}
          title={t('cancelTitle')}
          content={t('cancelBody')}
          confirmText={t('cancelConfirm')}
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
