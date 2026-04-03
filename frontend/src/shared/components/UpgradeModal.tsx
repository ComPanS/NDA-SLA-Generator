import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import { Check, Warning, Star } from '@mui/icons-material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useSubscribe,
  usePurchaseSingleContract,
  usePlans,
} from '@/features/billing/hooks/useBilling';
import { UpgradeOption, SubscriptionPlan } from '@/shared/types';
import { icuLocaleFor } from '@/shared/i18n/icuLocale';
import { useBillingDisplayCurrency } from '@/shared/money/useBillingDisplayCurrency';
import { BillingDisplayCurrency } from '@/shared/money/billingCurrency';
import {
  formatPlanDisplayAmount,
  formatSingleContractDisplay,
  planDisplayDiscountPercent,
  planHasDisplayDiscount,
} from '@/shared/money/planDisplayMoney';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  limitType: 'contracts' | 'clarifications' | 'templates';
  currentUsage: number;
  limit: number;
  upgradeOptions: UpgradeOption[];
  showSingleContractOption?: boolean;
}

function planFeaturesTb(
  tb: (key: string, opts?: { returnObjects?: boolean }) => unknown,
  planId: SubscriptionPlan,
) {
  const v = tb(`plans.${planId}.features`, { returnObjects: true });
  return Array.isArray(v) ? (v as string[]) : [];
}

export const UpgradeModal = ({
  open,
  onClose,
  limitType,
  currentUsage,
  limit,
  upgradeOptions,
  showSingleContractOption = false,
}: UpgradeModalProps) => {
  const { t } = useTranslation('billing');
  const { i18n } = useTranslation();
  const locale = icuLocaleFor(i18n.language);
  const { currency, isPaymentEnabled } = useBillingDisplayCurrency();
  const legacyFx = {
    rates: undefined as Partial<Record<BillingDisplayCurrency, number>> | undefined,
    fxFailed: true,
    locale,
    freeLabel: t('free'),
  };

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const subscribeMutation = useSubscribe();
  const purchaseSingleMutation = usePurchaseSingleContract();
  const { data: plansData } = usePlans();

  const limitUnitKey =
    limitType === 'contracts'
      ? 'upgradeModal.limitContracts'
      : limitType === 'clarifications'
        ? 'upgradeModal.limitClarifications'
        : 'upgradeModal.limitTemplates';

  const limitUnitLabel = t(limitUnitKey);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!isPaymentEnabled) return;
    setSelectedPlan(plan);
    try {
      const url = new URL(window.location.origin + '/billing');
      url.searchParams.set('payment', 'success');
      const result = await subscribeMutation.mutateAsync({
        plan,
        returnUrl: url.toString(),
      });
      window.location.href = result.payment_url;
    } catch (error) {
      console.error('Subscribe error:', error);
      setSelectedPlan(null);
    }
  };

  const handlePurchaseSingle = async () => {
    if (!isPaymentEnabled) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('payment', 'success');
      const result = await purchaseSingleMutation.mutateAsync(url.toString());
      window.location.href = result.payment_url;
    } catch (error) {
      console.error('Purchase single contract error:', error);
    }
  };

  const isLoading = subscribeMutation.isPending || purchaseSingleMutation.isPending;

  const limitLineKey =
    limitType === 'contracts'
      ? 'upgradeModal.limitContractsLine'
      : limitType === 'clarifications'
        ? 'upgradeModal.limitClarificationsLine'
        : 'upgradeModal.limitTemplatesLine';

  const formatLimitDisplay = (n: number) =>
    n === -1 ? t('upgradeModal.unlimited') : String(n);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="warning" />
        {t('upgradeModal.limitReachedTitle')}
      </DialogTitle>

      <DialogContent>
        {!isPaymentEnabled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('paymentNonRub')}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary">
            {t('upgradeModal.body', {
              used: currentUsage,
              limit,
              unit: limitUnitLabel,
            })}
          </Typography>
        </Box>

        {showSingleContractOption && (
          <>
            <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{t('upgradeModal.buyOneTitle')}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('upgradeModal.buyOneSubtitle')}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h5" color="primary">
                      {formatSingleContractDisplay(plansData, currency, legacyFx)}
                    </Typography>
                    <Tooltip title={!isPaymentEnabled ? t('upgradeModal.singleUnavailableNonRub') : ''}>
                      <span>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handlePurchaseSingle}
                          disabled={isLoading || !isPaymentEnabled}
                          sx={{ mt: 1 }}
                        >
                          {purchaseSingleMutation.isPending ? (
                            <CircularProgress size={20} />
                          ) : (
                            t('upgradeModal.buy')
                          )}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('upgradeModal.orUpgrade')}
              </Typography>
            </Divider>
          </>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {upgradeOptions.map((option) => {
            const planFromApi = plansData?.plans?.find((p) => p.id === option.plan);
            const hasDiscount = planFromApi
              ? planHasDisplayDiscount(planFromApi, currency)
              : false;
            const discountPercent = planFromApi
              ? planDisplayDiscountPercent(planFromApi, currency)
              : null;

            const allFeatures = planFeaturesTb(t, option.plan);
            const preview = allFeatures.slice(0, 4);
            const rest = allFeatures.length - 4;

            return (
              <Card
                key={option.plan}
                sx={{
                  flex: '1 1 250px',
                  minWidth: 250,
                  position: 'relative',
                  border: option.plan === 'pro' ? 2 : 1,
                  borderColor: option.plan === 'pro' ? 'primary.main' : 'divider',
                }}
              >
                {option.plan === 'pro' && (
                  <Chip
                    icon={<Star />}
                    label={t('upgradeModal.recommended')}
                    color="primary"
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                )}
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t(`plans.${option.plan}.title`)}
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {planFromApi
                      ? hasDiscount
                        ? formatPlanDisplayAmount(planFromApi, 'first_month', currency, legacyFx)
                        : formatPlanDisplayAmount(planFromApi, 'monthly', currency, legacyFx)
                      : `${option.price} ₽`}
                    <Typography component="span" variant="body2" color="text.secondary">
                      {' '}
                      {t('perMonth')}
                    </Typography>
                    {hasDiscount && planFromApi && (
                      <Typography variant="body2" color="text.secondary" component="div">
                        <span style={{ textDecoration: 'line-through' }}>
                          {formatPlanDisplayAmount(planFromApi, 'monthly', currency, legacyFx)}
                        </span>{' '}
                        {discountPercent !== null ? `-${discountPercent}%` : ''}
                        <Typography variant="caption" color="text.secondary" component="div">
                          {t('upgradeModal.discountFirstMonthOnly')}
                        </Typography>
                      </Typography>
                    )}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t(limitLineKey, { limit: formatLimitDisplay(option.newLimit) })}
                  </Typography>

                  <List dense>
                    {preview.map((feature, index) => (
                      <ListItem key={index} disableGutters sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <Check fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    {rest > 0 && (
                      <ListItem disableGutters sx={{ py: 0.25 }}>
                        <ListItemText
                          primary={t('upgradeModal.moreFeatures', { count: rest })}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                          }}
                        />
                      </ListItem>
                    )}
                  </List>

                  <Tooltip title={!isPaymentEnabled ? t('upgradeModal.subscribeUnavailableNonRub') : ''}>
                    <span>
                      <Button
                        variant={option.plan === 'pro' ? 'contained' : 'outlined'}
                        fullWidth
                        onClick={() => handleSubscribe(option.plan)}
                        disabled={isLoading || !isPaymentEnabled}
                        sx={{ mt: 2 }}
                      >
                        {selectedPlan === option.plan && subscribeMutation.isPending ? (
                          <CircularProgress size={20} />
                        ) : (
                          t('upgradeModal.choose')
                        )}
                      </Button>
                    </span>
                  </Tooltip>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          {t('upgradeModal.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
