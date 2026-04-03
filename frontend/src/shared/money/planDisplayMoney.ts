import type { PlanInfo, PlansResponse } from '@/shared/types/billing';
import {
  type BillingDisplayCurrency,
  formatBillingMoney,
  formatRubAmountForUi,
} from './billingCurrency';

function rowForCurrency(plan: PlanInfo, currency: BillingDisplayCurrency) {
  return plan.prices_by_currency?.[currency];
}

type LegacyFxOpts = {
  rates: Partial<Record<BillingDisplayCurrency, number>> | undefined;
  fxFailed: boolean;
  locale: string;
  freeLabel: string;
};

/**
 * Formats a plan amount using backend `prices_by_currency` when present, else legacy RUB+FX.
 */
export function formatPlanDisplayAmount(
  plan: PlanInfo,
  which: 'monthly' | 'first_month',
  currency: BillingDisplayCurrency,
  legacyFx: LegacyFxOpts,
): string {
  const row = rowForCurrency(plan, currency);
  const rubVal = which === 'monthly' ? plan.price : (plan.first_month_price ?? null);

  if (row) {
    const amount = which === 'monthly' ? row.monthly : row.first_month;
    if (amount == null) {
      return formatRubAmountForUi(rubVal ?? 0, {
        currency,
        rates: legacyFx.rates,
        fxFailed: legacyFx.fxFailed,
        locale: legacyFx.locale,
        freeLabel: legacyFx.freeLabel,
      });
    }
    if (amount === 0 && plan.price === 0) return legacyFx.freeLabel;
    if (amount === 0) return legacyFx.freeLabel;
    return formatBillingMoney(amount, currency);
  }

  return formatRubAmountForUi(rubVal ?? 0, {
    currency,
    rates: legacyFx.rates,
    fxFailed: legacyFx.fxFailed,
    locale: legacyFx.locale,
    freeLabel: legacyFx.freeLabel,
  });
}

/** Whether first-month promo applies for the selected display currency. */
export function planHasDisplayDiscount(plan: PlanInfo, currency: BillingDisplayCurrency): boolean {
  if (!plan.first_month_discount_available || plan.price <= 0) return false;
  const row = rowForCurrency(plan, currency);
  if (
    row &&
    row.first_month != null &&
    row.monthly > 0 &&
    row.first_month < row.monthly
  ) {
    return true;
  }
  return (
    plan.first_month_price != null &&
    plan.first_month_price !== undefined &&
    plan.first_month_price < plan.price
  );
}

export function planDisplayDiscountPercent(
  plan: PlanInfo,
  currency: BillingDisplayCurrency,
): number | null {
  if (!planHasDisplayDiscount(plan, currency)) return null;
  const row = rowForCurrency(plan, currency);
  if (row && row.first_month != null && row.monthly > 0) {
    return Math.round((1 - row.first_month / row.monthly) * 100);
  }
  if (plan.first_month_price != null && plan.price > 0) {
    return Math.round((1 - plan.first_month_price / plan.price) * 100);
  }
  return null;
}

export function formatSingleContractDisplay(
  plansData: Pick<PlansResponse, 'single_contract_prices_by_currency' | 'single_contract_price'> | undefined,
  currency: BillingDisplayCurrency,
  legacyFx: LegacyFxOpts,
): string {
  const map = plansData?.single_contract_prices_by_currency;
  const rub = plansData?.single_contract_price ?? 99;
  const raw = map?.[currency];
  if (raw != null && Number.isFinite(raw)) {
    return formatBillingMoney(raw, currency);
  }
  return formatRubAmountForUi(rub, {
    currency,
    rates: legacyFx.rates,
    fxFailed: legacyFx.fxFailed,
    locale: legacyFx.locale,
    freeLabel: '—',
  });
}
