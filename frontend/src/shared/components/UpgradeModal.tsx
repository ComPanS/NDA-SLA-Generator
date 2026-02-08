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
} from '@mui/material';
import { Check, Warning, Star } from '@mui/icons-material';
import { useState } from 'react';
import { useSubscribe, usePurchaseSingleContract, usePlans } from '@/features/billing/hooks/useBilling';
import { UpgradeOption, SubscriptionPlan } from '@/shared/types';
import {
  SUBSCRIPTION_FEATURES,
  SINGLE_CONTRACT_PRICE,
  formatLimit,
} from '@/shared/constants/subscriptions';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  limitType: 'contracts' | 'clarifications' | 'templates';
  currentUsage: number;
  limit: number;
  upgradeOptions: UpgradeOption[];
  showSingleContractOption?: boolean;
}

const LIMIT_TYPE_LABELS = {
  contracts: 'договоров',
  clarifications: 'уточнений на документ',
  templates: 'шаблонов',
};

export const UpgradeModal = ({
  open,
  onClose,
  limitType,
  currentUsage,
  limit,
  upgradeOptions,
  showSingleContractOption = false,
}: UpgradeModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const subscribeMutation = useSubscribe();
  const purchaseSingleMutation = usePurchaseSingleContract();
  const { data: plansData } = usePlans();

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    try {
      // Build return URL with payment success parameter
      const url = new URL(window.location.origin + '/billing');
      url.searchParams.set('payment', 'success');
      const result = await subscribeMutation.mutateAsync({
        plan,
        returnUrl: url.toString(),
      });
      // Redirect to YooKassa payment page
      window.location.href = result.payment_url;
    } catch (error) {
      console.error('Subscribe error:', error);
      setSelectedPlan(null);
    }
  };

  const handlePurchaseSingle = async () => {
    try {
      // Build return URL with payment success parameter
      const url = new URL(window.location.href);
      url.searchParams.set('payment', 'success');
      const result = await purchaseSingleMutation.mutateAsync(url.toString());
      // Redirect to YooKassa payment page
      window.location.href = result.payment_url;
    } catch (error) {
      console.error('Purchase single contract error:', error);
    }
  };

  const isLoading = subscribeMutation.isPending || purchaseSingleMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="warning" />
        Достигнут лимит {LIMIT_TYPE_LABELS[limitType]}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary">
            Вы использовали {currentUsage} из {limit} {LIMIT_TYPE_LABELS[limitType]} в этом месяце.
            Для продолжения работы выберите один из вариантов:
          </Typography>
        </Box>

        {showSingleContractOption && (
          <>
            <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">Купить 1 договор</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Разовая покупка без подписки
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h5" color="primary">
                      {SINGLE_CONTRACT_PRICE} ₽
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handlePurchaseSingle}
                      disabled={isLoading}
                      sx={{ mt: 1 }}
                    >
                      {purchaseSingleMutation.isPending ? (
                        <CircularProgress size={20} />
                      ) : (
                        'Купить'
                      )}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                или улучшите тариф
              </Typography>
            </Divider>
          </>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {upgradeOptions.map((option) => (
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
                  label="Рекомендуем"
                  color="primary"
                  size="small"
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                />
              )}
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {option.name}
                </Typography>
                {(() => {
                  const planFromApi = plansData?.plans?.find((p) => p.id === option.plan);
                  const hasDiscount =
                    !!planFromApi?.first_month_discount_available &&
                    planFromApi.first_month_price !== null &&
                    planFromApi.first_month_price !== undefined &&
                    option.price > 0 &&
                    (planFromApi.first_month_price as number) < option.price;
                  const discountPercent = hasDiscount
                    ? Math.round(
                        (1 - (planFromApi?.first_month_price as number) / option.price) * 100,
                      )
                    : null;
                  const displayPrice =
                    hasDiscount && planFromApi?.first_month_price !== null
                      ? planFromApi.first_month_price
                      : option.price;

                  return (
                    <Typography variant="h4" color="primary" gutterBottom>
                      {displayPrice} ₽
                      <Typography component="span" variant="body2" color="text.secondary">
                        {' '}
                        / месяц
                      </Typography>
                      {hasDiscount && (
                        <Typography variant="body2" color="text.secondary" component="div">
                          <span style={{ textDecoration: 'line-through' }}>{option.price} ₽</span>{' '}
                          {discountPercent !== null ? `-${discountPercent}%` : ''}
                          <Typography variant="caption" color="text.secondary" component="div">
                            Скидка только на первый месяц
                          </Typography>
                        </Typography>
                      )}
                    </Typography>
                  );
                })()}

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {limitType === 'contracts' && (
                    <>Договоров: {formatLimit(option.newLimit)}</>
                  )}
                  {limitType === 'clarifications' && (
                    <>Уточнений: {formatLimit(option.newLimit)}</>
                  )}
                  {limitType === 'templates' && (
                    <>Шаблонов: {formatLimit(option.newLimit)}</>
                  )}
                </Typography>

                <List dense>
                  {SUBSCRIPTION_FEATURES[option.plan].slice(0, 4).map((feature, index) => (
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
                  {SUBSCRIPTION_FEATURES[option.plan].length > 4 && (
                    <ListItem disableGutters sx={{ py: 0.25 }}>
                      <ListItemText
                        primary={`+ ещё ${SUBSCRIPTION_FEATURES[option.plan].length - 4} преимуществ`}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItem>
                  )}
                </List>

                <Button
                  variant={option.plan === 'pro' ? 'contained' : 'outlined'}
                  fullWidth
                  onClick={() => handleSubscribe(option.plan)}
                  disabled={isLoading}
                  sx={{ mt: 2 }}
                >
                  {selectedPlan === option.plan && subscribeMutation.isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    'Выбрать'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Отмена
        </Button>
      </DialogActions>
    </Dialog>
  );
};
